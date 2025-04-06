import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase, Recipe } from "@/lib/models"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Function to get user's purchase history and extract ingredients
async function getUserIngredients(userId: string) {
  try {
    await connectToDatabase()
    
    // Get the last 60 days of purchases
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    
    const purchases = await Purchase.find({
      userId: userId,
      date: { $gte: sixtyDaysAgo }
    }).sort({ date: -1 }).lean()
    
    if (!purchases || purchases.length === 0) {
      return []
    }
    
    // Extract unique ingredients from purchases
    const ingredients = new Set<string>()
    
    purchases.forEach((purchase: any) => {
      purchase.items.forEach((item: any) => {
        // Filter out non-food items based on category
        const foodCategories = [
          "produce", "fruits", "vegetables", "meat", "seafood", "dairy", 
          "bakery", "grains", "canned goods", "frozen foods", "beverages",
          "snacks", "condiments", "spices", "oils", "baking"
        ]
        
        if (foodCategories.some(category => 
          item.category.toLowerCase().includes(category.toLowerCase())
        )) {
          ingredients.add(item.name.toLowerCase())
        }
      })
    })
    
    return Array.from(ingredients)
  } catch (error) {
    console.error("Error fetching user ingredients:", error)
    return []
  }
}

// Function to fetch recipes from Edamam Meal Planner API
async function fetchEdamamRecipes(ingredients: string[]) {
  try {
    const appId = process.env.EDAMAM_APP_ID
    const appKey = process.env.EDAMAM_APP_KEY
    
    if (!appId || !appKey) {
      console.warn("Edamam API credentials not configured, falling back to AI generation")
      return await generateRecipesWithAI(ingredients)
    }
    
    // Instead of searching by ingredients, we'll use the meal planner API
    // to generate a meal plan and then extract recipes from it
    
    // Create a meal plan request based on available ingredients
    // We can specify diet preferences to narrow down the results
    const url = `https://api.edamam.com/api/meal-planner/v1/3-day?app_id=${appId}&app_key=${appKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        size: 5, // Request 5 meals
        plan: {
          accept: {
            // Use the first 3 ingredients as preference signals
            // This helps bias toward recipes with these ingredients
            ingredients: ingredients.slice(0, 3)
          }
        }
      })
    })
    
    if (!response.ok) {
      // If the meal planner API fails, fall back to a simpler approach
      // by using the recipe search API
      console.warn("Meal planner API failed, falling back to recipe search")
      
      // Join top ingredients for the query (limit to 5 to avoid too specific queries)
      const queryIngredients = ingredients.slice(0, 5).join(",")
      
      const searchUrl = `https://api.edamam.com/search?q=${encodeURIComponent(queryIngredients)}&app_id=${appId}&app_key=${appKey}&to=10`
      
      const searchResponse = await fetch(searchUrl)
      
      if (!searchResponse.ok) {
        console.warn("Recipe search API also failed, falling back to AI generation")
        return await generateRecipesWithAI(ingredients)
      }
      
      const searchData = await searchResponse.json()
      
      if (!searchData.hits || searchData.hits.length === 0) {
        return []
      }
      
      return searchData.hits.map((hit: any) => hit.recipe)
    }
    
    const data = await response.json()
    
    // Extract recipes from the meal plan
    // The structure depends on the Edamam Meal Planner API response format
    // This is a simplified approach - you may need to adjust based on actual response
    const recipes = extractRecipesFromMealPlan(data, ingredients)
    
    if (recipes.length === 0) {
      console.warn("No recipes found in meal plan, falling back to AI generation")
      return await generateRecipesWithAI(ingredients)
    }
    
    return recipes
  } catch (error) {
    console.error("Error fetching from Edamam API:", error)
    console.warn("API error, falling back to AI generation")
    return await generateRecipesWithAI(ingredients)
  }
}

// Helper function to extract recipes from meal plan response
function extractRecipesFromMealPlan(mealPlanData: any, ingredients: string[]) {
  try {
    // The structure of the meal plan data will depend on Edamam's API
    // This is a sample implementation - adjust based on actual response format
    
    if (!mealPlanData || !mealPlanData.days) {
      return []
    }
    
    const recipes: any[] = []
    
    // Iterate through the days and meals to extract recipes
    mealPlanData.days.forEach((day: any) => {
      if (day.items && Array.isArray(day.items)) {
        day.items.forEach((meal: any) => {
          if (meal.recipe) {
            recipes.push(meal.recipe)
          }
        })
      }
    })
    
    return recipes
  } catch (error) {
    console.error("Error extracting recipes from meal plan:", error)
    return []
  }
}

// Function to generate AI recommendation for a recipe
async function generateAIRecommendation(recipe: any, userIngredients: string[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
    
    // Get ingredient lines in a consistent format
    const ingredientLines = Array.isArray(recipe.ingredientLines) 
      ? recipe.ingredientLines 
      : [];
    
    // Extract nutrition values safely
    const calories = recipe.calories?.toFixed(0) || 'N/A';
    const protein = recipe.totalNutrients?.PROCNT?.quantity?.toFixed(1) || 'N/A';
    const carbs = recipe.totalNutrients?.CHOCDF?.quantity?.toFixed(1) || 'N/A';
    const fat = recipe.totalNutrients?.FAT?.quantity?.toFixed(1) || 'N/A';
    const fiber = recipe.totalNutrients?.FIBTG?.quantity?.toFixed(1) || 'N/A';
    
    // Create a prompt for Gemini about the recipe
    const prompt = `
    As a nutrition-focused AI assistant, please provide a brief, personalized recommendation about the following recipe:
    
    Recipe Title: ${recipe.label}
    
    Recipe Ingredients: 
    ${ingredientLines.join("\n")}
    
    Nutritional Information:
    Calories: ${calories} kcal
    Protein: ${protein} ${recipe.totalNutrients?.PROCNT?.unit || "g"}
    Carbs: ${carbs} ${recipe.totalNutrients?.CHOCDF?.unit || "g"}
    Fat: ${fat} ${recipe.totalNutrients?.FAT?.unit || "g"}
    Fiber: ${fiber} ${recipe.totalNutrients?.FIBTG?.unit || "g"}
    
    User has these ingredients: ${userIngredients.join(", ")}
    
    Provide a concise 2-3 sentence recommendation highlighting:
    1. What's nutritionally good about this recipe
    2. Who might benefit from it (e.g., people wanting to increase protein, people on low-carb diets, etc.)
    3. Any potential substitutions that could improve it further
    
    Keep your response under 200 characters. Don't use bullet points or include a greeting/sign-off.
    `
    
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return text.substring(0, 300) // Limit to 300 chars in case AI generates more
  } catch (error) {
    console.error("Error generating AI recommendation:", error)
    return "A nutritious recipe that could be a great addition to your meal plan. Consider trying it with ingredients you already have."
  }
}

// Function to format Edamam recipes to our app's format
async function formatRecipes(edamamRecipes: any[], userIngredients: string[]) {
  // Convert user ingredients to lowercase for case-insensitive matching
  const lowerUserIngredients = userIngredients.map(item => item.toLowerCase())
  
  const formattedRecipes = await Promise.all(edamamRecipes.map(async (recipe) => {
    // Handle different API response formats
    // Check if this is a meal planner recipe or search API recipe
    const isMealPlannerRecipe = recipe.uri && !recipe.uri.includes('http://www.edamam.com/ontologies/edamam.owl#recipe_');
    
    // Extract relevant fields based on the response format
    const recipeId = isMealPlannerRecipe 
      ? recipe.id || `mp_${Math.random().toString(36).substring(2, 15)}` 
      : recipe.uri.split("#recipe_")[1];
      
    const title = isMealPlannerRecipe ? recipe.title || recipe.label : recipe.label;
    // No longer using image URLs
    const image = "";
    const readyInMinutes = recipe.totalTime > 0 
      ? Math.round(recipe.totalTime) 
      : Math.round(Math.random() * 30 + 20);
    const servings = recipe.yield || recipe.servings || 2;
    const sourceUrl = recipe.url || recipe.sourceUrl || '#';
    const summary = recipe.source || recipe.summary || 'Recipe details';
    
    // Get ingredient lines from the appropriate field
    const ingredientLines = isMealPlannerRecipe 
      ? (recipe.ingredients || []).map((ing: any) => ing.text || ing.food || ing)
      : recipe.ingredientLines || [];
    
    // Extract ingredient names from recipe
    const recipeIngredients = ingredientLines.map((line: string) => {
      // Basic extraction of the main ingredient from each line
      // This is a simplified approach - in production, you'd want more robust parsing
      if (typeof line !== 'string') {
        return '';
      }
      const mainIngredient = line.split(",")[0].split(" ").slice(1).join(" ").toLowerCase();
      return mainIngredient || line.toLowerCase();
    }).filter(Boolean);
    
    // Determine which ingredients the user has and which are missing
    const matchingIngredients: string[] = [];
    const missingIngredients: string[] = [];
    
    recipeIngredients.forEach((ingredient: string) => {
      // Check if user has this ingredient or something similar
      const hasIngredient = lowerUserIngredients.some(userIngredient => 
        ingredient.includes(userIngredient) || userIngredient.includes(ingredient)
      );
      
      if (hasIngredient) {
        matchingIngredients.push(ingredient);
      } else {
        missingIngredients.push(ingredient);
      }
    });
    
    // Get nutritional information for AI recommendations
    const nutritionalInfo = {
      calories: isMealPlannerRecipe 
        ? (recipe.nutrition?.calories || 0) 
        : (recipe.calories || 0),
      protein: isMealPlannerRecipe
        ? (recipe.nutrition?.protein || 0)
        : (recipe.totalNutrients?.PROCNT?.quantity || 0),
      carbs: isMealPlannerRecipe
        ? (recipe.nutrition?.carbs || 0)
        : (recipe.totalNutrients?.CHOCDF?.quantity || 0),
      fat: isMealPlannerRecipe
        ? (recipe.nutrition?.fat || 0)
        : (recipe.totalNutrients?.FAT?.quantity || 0),
      fiber: isMealPlannerRecipe
        ? (recipe.nutrition?.fiber || 0)
        : (recipe.totalNutrients?.FIBTG?.quantity || 0)
    };
    
    // Generate AI recommendation with whichever data we have
    let aiRecommendation = "A nutritious recipe that matches ingredients you already have.";
    try {
      aiRecommendation = await generateAIRecommendation({
        label: title,
        ingredientLines: ingredientLines,
        calories: nutritionalInfo.calories,
        totalNutrients: {
          PROCNT: { quantity: nutritionalInfo.protein, unit: 'g' },
          CHOCDF: { quantity: nutritionalInfo.carbs, unit: 'g' },
          FAT: { quantity: nutritionalInfo.fat, unit: 'g' },
          FIBTG: { quantity: nutritionalInfo.fiber, unit: 'g' }
        }
      }, userIngredients);
    } catch (err) {
      console.error('Error generating AI recommendation:', err);
    }
    
    return {
      recipeId,
      title,
      image, // Empty string, will be handled on the client with colored backgrounds
      readyInMinutes,
      servings,
      sourceUrl,
      summary,
      ingredients: ingredientLines,
      instructions: recipe.instructions || [],
      matchingIngredients: Array.from(new Set(matchingIngredients)),
      missingIngredients: Array.from(new Set(missingIngredients)),
      aiRecommendation
    };
  }));
  
  return formattedRecipes;
}

// Fallback function to generate recipes using Gemini AI when APIs aren't working
async function generateRecipesWithAI(ingredients: string[]) {
  try {
    console.log("Generating recipes with AI using ingredients:", ingredients)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
    
    // Generate 3 recipes based on available ingredients
    const prompt = `
    As a culinary AI assistant, create 3 unique recipe ideas using some or all of these ingredients:
    ${ingredients.join(", ")}
    
    For each recipe, include:
    1. Title
    2. List of ingredients with approximate measurements
    3. Brief cooking instructions
    4. Estimated preparation time
    5. Serving size
    6. Brief nutritional highlights (calories, protein, etc.)
    
    Format the response as a valid JSON array containing objects with these fields:
    - label (string): Recipe title
    - ingredientLines (array of strings): List of ingredients with measurements
    - instructions (array of strings): Preparation steps
    - totalTime (number): Preparation time in minutes
    - yield (number): Number of servings
    - calories (number): Estimated calories per serving
    - totalNutrients (object): Containing PROCNT, CHOCDF, FAT, FIBTG objects, each with quantity (number) and unit (string) properties
    - uri (string): A unique identifier (can be "ai-generated-recipe-X")
    - url (string): Can be "#"
    - source (string): "AI Generated"
    
    The response should be valid JSON only, no explanations.
    `
    
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Try to parse the AI response as JSON
    try {
      // Clean up the response to ensure it's valid JSON
      const jsonText = text.replace(/```json|```/g, '').trim()
      const recipes = JSON.parse(jsonText)
      return recipes
    } catch (parseError) {
      console.error("Failed to parse AI generated recipes:", parseError)
      
      // If JSON parsing fails, create a simple fallback recipe
      return [
        {
          label: "AI Generated Recipe",
          ingredientLines: ingredients.map(ing => `1 portion ${ing}`),
          instructions: ["Combine all ingredients", "Cook until done", "Serve and enjoy"],
          totalTime: 30,
          yield: 2,
          calories: 400,
          totalNutrients: {
            PROCNT: { quantity: 15, unit: "g" },
            CHOCDF: { quantity: 30, unit: "g" },
            FAT: { quantity: 10, unit: "g" },
            FIBTG: { quantity: 5, unit: "g" }
          },
          uri: "ai-generated-recipe-fallback",
          url: "#",
          source: "AI Generated"
        }
      ]
    }
  } catch (error) {
    console.error("Error generating recipes with AI:", error)
    
    // Ultimate fallback: create a very simple recipe
    return [
      {
        label: "Simple Recipe with Your Ingredients",
        ingredientLines: ingredients.map(ing => `1 portion ${ing}`),
        instructions: ["Combine all ingredients", "Cook until done", "Serve and enjoy"],
        totalTime: 30,
        yield: 2,
        calories: 400,
        totalNutrients: {
          PROCNT: { quantity: 15, unit: "g" },
          CHOCDF: { quantity: 30, unit: "g" },
          FAT: { quantity: 10, unit: "g" },
          FIBTG: { quantity: 5, unit: "g" }
        },
        uri: "ai-generated-recipe-fallback",
        url: "#",
        source: "AI Generated"
      }
    ]
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    
    // Get user's ingredients from purchase history
    const userIngredients = await getUserIngredients(session.user.id)
    
    if (userIngredients.length === 0) {
      return NextResponse.json(
        { message: "No ingredient data available from purchase history" },
        { status: 400 }
      )
    }
    
    // Fetch recipes from Edamam API
    const edamamRecipes = await fetchEdamamRecipes(userIngredients)
    
    if (edamamRecipes.length === 0) {
      return NextResponse.json(
        { message: "No recipes found for your ingredients" },
        { status: 404 }
      )
    }
    
    // Format recipes to our app's format
    const formattedRecipes = await formatRecipes(edamamRecipes, userIngredients)
    
    // Store recipes in database
    await Recipe.deleteMany({ userId: session.user.id }) // Remove old recipes
    
    const recipesToSave = formattedRecipes.map(recipe => ({
      ...recipe,
      userId: session.user.id
    }))
    
    await Recipe.insertMany(recipesToSave)
    
    return NextResponse.json({ 
      message: "Recipes generated successfully",
      count: formattedRecipes.length
    })
  } catch (error) {
    console.error("Error generating recipes:", error)
    return NextResponse.json(
      { message: "Failed to generate recipes", error: (error as Error).message },
      { status: 500 }
    )
  }
} 