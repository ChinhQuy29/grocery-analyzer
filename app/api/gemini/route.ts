import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase, Recommendation } from "@/lib/models"
import { analyzeGroceryPurchases } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Get user's goal
    const userGoal = session.user.goal || "health_improvement"

    // Fetch user's purchases (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const purchases = await Purchase.find({
      userId: session.user.id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 })

    if (purchases.length === 0) {
      return NextResponse.json({ message: "Not enough purchase data to generate recommendations" }, { status: 400 })
    }

    // Use Gemini API to analyze purchases and generate recommendations
    let analysisResult

    try {
      // Check if GEMINI_API_KEY is available
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured")
      }

      analysisResult = await analyzeGroceryPurchases(JSON.parse(JSON.stringify(purchases)), userGoal)
    } catch (error) {
      console.error("Gemini API error:", error)

      // Fall back to mock recommendations if Gemini API fails
      analysisResult = generateMockRecommendations(purchases, userGoal)
    }

    // Save recommendation to database
    const newRecommendation = new Recommendation({
      userId: session.user.id,
      recommendations: analysisResult.recommendations,
      summary: analysisResult.overallSummary || analysisResult.summary,
      date: new Date(),
    })

    await newRecommendation.save()

    // Return success response
    return NextResponse.json({
      recommendation: {
        id: newRecommendation._id,
        recommendations: newRecommendation.recommendations,
        summary: newRecommendation.summary,
        date: newRecommendation.date,
      },
    })
  } catch (error) {
    console.error("Generate recommendations error:", error)
    return NextResponse.json({ message: "An error occurred while generating recommendations" }, { status: 500 })
  }
}

// Mock recommendation generator as fallback
function generateMockRecommendations(purchases: any[], userGoal: string) {
  // Extract items from purchases
  const allItems = purchases.flatMap((purchase) => purchase.items)

  // Group items by category
  const itemsByCategory: Record<string, any[]> = {}
  allItems.forEach((item) => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = []
    }
    itemsByCategory[item.category].push(item)
  })

  // Calculate category totals
  const categoryTotals = Object.entries(itemsByCategory).map(([category, items]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalSpent = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      category,
      totalQuantity,
      totalSpent,
      itemCount: items.length,
    }
  })

  let recommendations = []
  let summary = ""

  switch (userGoal) {
    case "weight_loss":
      recommendations = [
        {
          type: "increase",
          category: "vegetables",
          reason: "Vegetables are low in calories but high in nutrients and fiber, which helps you feel full longer.",
        },
        {
          type: "decrease",
          category: "processed foods",
          reason:
            "Processed foods often contain hidden calories, sugars, and unhealthy fats that can hinder weight loss.",
        },
        {
          type: "add",
          category: "lean proteins",
          item: "chicken breast or tofu",
          reason: "Protein helps maintain muscle mass during weight loss and increases satiety.",
        },
      ]
      summary =
        "Based on your weight loss goal and recent purchases, we recommend focusing on more vegetables and lean proteins while reducing processed foods and sugary items."
      break

    case "weight_gain":
      recommendations = [
        {
          type: "increase",
          category: "protein sources",
          reason: "Adequate protein is essential for muscle growth and recovery.",
        },
        {
          type: "add",
          category: "healthy fats",
          item: "nuts, avocados, or olive oil",
          reason: "Healthy fats are calorie-dense and help with hormone production.",
        },
        {
          type: "increase",
          category: "complex carbohydrates",
          reason: "Complex carbs provide sustained energy and support muscle glycogen stores.",
        },
      ]
      summary =
        "To support your weight gain goal, we recommend increasing your intake of nutrient-dense foods, healthy fats, and protein sources."
      break

    default: // health_improvement or maintenance
      recommendations = [
        {
          type: "increase",
          category: "vegetables",
          reason: "Vegetables provide essential vitamins, minerals, and antioxidants.",
        },
        {
          type: "increase",
          category: "fruits",
          reason: "Fruits contain important vitamins and beneficial plant compounds.",
        },
        {
          type: "decrease",
          category: "processed foods",
          reason: "Processed foods often contain additives and preservatives that may impact health.",
        },
      ]
      summary =
        "To improve your overall health, we recommend increasing your consumption of whole foods, particularly fruits and vegetables, while reducing processed items."
  }

  return {
    recommendations,
    summary,
    overallSummary: summary,
  }
}

