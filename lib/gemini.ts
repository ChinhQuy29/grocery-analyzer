import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function analyzeGroceryPurchases(purchases: any[], userGoal: string, userMeasurements?: any) {
  try {
    console.log("Gemini API received measurements:", userMeasurements);
    
    // Create a model instance - use gemini-1.5-pro which is the latest model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Prepare the purchase data for analysis
    const purchaseData = purchases.map((purchase) => {
      return {
        date: purchase.date,
        items: purchase.items.map((item: any) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          nutritionalInfo: item.nutritionalInfo || {},
        })),
      }
    })

    // Format user measurements if available
    let userMeasurementsText = ""
    if (userMeasurements) {
      userMeasurementsText = `
        User Measurements:
        ${userMeasurements.height && userMeasurements.height.value ? `Height: ${userMeasurements.height.value} ${userMeasurements.height.unit}` : ""}
        ${userMeasurements.weight && userMeasurements.weight.value ? `Weight: ${userMeasurements.weight.value} ${userMeasurements.weight.unit}` : ""}
        ${userMeasurements.age ? `Age: ${userMeasurements.age}` : ""}
        ${userMeasurements.gender ? `Gender: ${userMeasurements.gender}` : ""}
        ${userMeasurements.activityLevel ? `Activity Level: ${userMeasurements.activityLevel.replace(/_/g, " ")}` : ""}
      `
      console.log("Formatted measurements for prompt:", userMeasurementsText);
    }

    // Create a prompt for the Gemini model
    const prompt = `
      As a nutrition expert, analyze the following grocery purchase history and provide recommendations based on the user's health goal of "${userGoal}".
      
      ${userMeasurementsText}
      
      Purchase History:
      ${JSON.stringify(purchaseData, null, 2)}
      
      Please provide:
      1. A summary of the user's current purchasing patterns
      2. 5 specific recommendations based on their goal of "${userGoal}" ${userMeasurements ? "and their personal measurements" : ""} in the following format:
         - Type: [increase, decrease, add, remove]
         - Category: [food category]
         - Item: [specific item if applicable]
         - Reason: [brief explanation]
      3. A brief overall summary of your recommendations (max 2 sentences)
      
      Format your response as a JSON object with the following structure:
      {
        "summary": "Analysis of current patterns",
        "recommendations": [
          {
            "type": "increase/decrease/add/remove",
            "category": "category name",
            "item": "specific item (optional)",
            "reason": "brief explanation"
          }
        ],
        "overallSummary": "Brief summary of recommendations"
      }
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the JSON response
    // Note: In a production environment, you'd want to add more robust error handling here
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
    
    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[1].trim()
      return JSON.parse(jsonStr)
    } else {
      throw new Error("Failed to parse response from Gemini")
    }
  } catch (error) {
    console.error("Error analyzing purchases with Gemini:", error)
    throw error
  }
}

export interface WalmartTransaction {
  orderNumber: string;
  orderDate: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
  deliveryStatus: string;
  deliveryCharges: number;
  productLink: string;
  category?: string;
}

export async function categorizeWalmartTransactions(transactions: WalmartTransaction[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Prepare the transactions for categorization
    const transactionData = transactions.map(transaction => ({
      itemName: transaction.itemName,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice
    }));

    const prompt = `
      As a grocery categorization expert, analyze the following Walmart transactions and categorize each item into appropriate grocery categories.
      
      Transaction Items:
      ${JSON.stringify(transactionData, null, 2)}
      
      Please categorize each item into one of these main categories:
      - Produce
      - Meat & Seafood
      - Dairy & Eggs
      - Bakery
      - Pantry
      - Frozen Foods
      - Beverages
      - Snacks
      - Household
      - Personal Care
      - Baby Care
      - Other
      
      Format your response as a JSON object where each item name maps to its category.
      Example:
      {
        "Fresh Spinach": "Produce",
        "Chicken Breasts": "Meat & Seafood",
        "Orange Juice": "Beverages"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
    let categories;

    if (jsonMatch && jsonMatch[1]) {
      categories = JSON.parse(jsonMatch[1]);
    } else {
      categories = JSON.parse(text);
    }

    // Add categories to the transactions
    return transactions.map(transaction => ({
      ...transaction,
      category: categories[transaction.itemName] || "Other"
    }));
  } catch (error) {
    console.error("Error categorizing Walmart transactions:", error);
    throw error;
  }
}

