import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase } from "@/lib/models"
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

// Function to generate a full recipe using Gemini AI
async function generateFullRecipe(title: string, baseIngredients: string[], userIngredients: string[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
    
    // Create a detailed prompt for Gemini to generate a complete recipe
    const prompt = `
    As a professional chef, create a detailed recipe for "${title}".
    
    The user has these ingredients available from their purchase history:
    ${userIngredients.join(", ")}
    
    I know this recipe includes these ingredients:
    ${baseIngredients.join(", ")}
    
    Please create a complete recipe with the following sections in exactly this format:
    
    # ${title}
    
    ## Description
    [Write a brief description of this dish - 2-3 sentences about flavor profile, origin, or what makes it special]
    
    ## Ingredients
    [Format as a markdown list with each ingredient on its own line, starting with "* " and including precise measurements]
    * Ingredient 1 - measurement
    * Ingredient 2 - measurement
    etc.
    
    ## Instructions
    [Format as a numbered list with each step on its own line, starting with "1. ", "2. ", etc.]
    1. First step...
    2. Second step...
    etc.
    
    ## Cooking Time
    * Prep: [time in minutes]
    * Cook: [time in minutes]
    * Total: [time in minutes]
    
    ## Nutrition (Per Serving)
    * Calories: [amount]
    * Protein: [amount in grams]
    * Carbs: [amount in grams]
    * Fat: [amount in grams]
    
    ## Chef's Tips
    [Format as a markdown list with 2-3 bullet points]
    * Tip 1...
    * Tip 2...
    
    ## Serving Suggestion
    [Brief suggestion on how to serve or pair the dish]
    
    IMPORTANT: Format everything in clean, simple markdown. Use bullet points for ingredients and numbered lists for instructions. Keep it concise and easy to follow. Do not use any formatting that isn't standard markdown.
    `
    
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return text
  } catch (error) {
    console.error("Error generating full recipe:", error)
    return `# ${title}\n\nSorry, I couldn't generate the full recipe details at this time. Please try again later.`
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { title, ingredients } = body

    if (!title) {
      return NextResponse.json({ message: "Recipe title is required" }, { status: 400 })
    }

    await connectToDatabase()
    
    // Get user's ingredients from purchase history
    const userIngredients = await getUserIngredients(session.user.id)
    
    // Generate the full recipe with Gemini
    const fullRecipe = await generateFullRecipe(title, ingredients || [], userIngredients)
    
    return NextResponse.json({
      fullRecipe
    })
  } catch (error) {
    console.error("Error generating full recipe:", error)
    return NextResponse.json(
      { message: "Failed to generate full recipe", error: (error as Error).message },
      { status: 500 }
    )
  }
} 