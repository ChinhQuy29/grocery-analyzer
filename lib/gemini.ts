import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function analyzeGroceryPurchases(purchases: any[], userGoal: string) {
  try {
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

    // Create a prompt for the Gemini model
    const prompt = `
      As a nutrition expert, analyze the following grocery purchase history and provide recommendations based on the user's health goal of "${userGoal}".
      
      Purchase History:
      ${JSON.stringify(purchaseData, null, 2)}
      
      Please provide:
      1. A summary of the user's current purchasing patterns
      2. 5 specific recommendations based on their goal of "${userGoal}" in the following format:
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
      try {
        return JSON.parse(jsonMatch[1])
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e)
        throw new Error("Invalid response format from Gemini API")
      }
    } else {
      try {
        return JSON.parse(text)
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e)
        throw new Error("Invalid response format from Gemini API")
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

