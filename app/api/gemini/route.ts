import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase, Recommendation, Measurement, User } from "@/lib/models"
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

    // Fetch user measurements from the new Measurement model
    const measurementDoc = await Measurement.findOne({ userId: session.user.id })
    
    // Format measurements properly for the Gemini API
    const userMeasurements = measurementDoc ? {
      height: measurementDoc.height,
      weight: measurementDoc.weight,
      age: measurementDoc.age,
      gender: measurementDoc.gender,
      activityLevel: measurementDoc.activityLevel
    } : undefined
    
    console.log("User measurements for Gemini:", userMeasurements)

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

      // Try to use Gemini API
      analysisResult = await analyzeGroceryPurchases(JSON.parse(JSON.stringify(purchases)), userGoal, userMeasurements)
      
      // Verify that the analysis result has the expected format
      if (!analysisResult || !analysisResult.recommendations || !Array.isArray(analysisResult.recommendations)) {
        console.warn("Gemini API returned invalid format, using fallback mock data")
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Gemini API error:", error)
      console.log("Using fallback mock recommendations")
      
      // Always use mock recommendations if there's any error with the Gemini API
      analysisResult = generateMockRecommendations(purchases, userGoal, userMeasurements)
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
function generateMockRecommendations(purchases: any[], userGoal: string, userMeasurements?: any) {
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

  // Additional context based on measurements if available
  let measurementContext = ""
  if (userMeasurements?.weight && userMeasurements?.height) {
    measurementContext = `based on your measurements (${userMeasurements.height.value} ${userMeasurements.height.unit}, ${userMeasurements.weight.value} ${userMeasurements.weight.unit})`;
    
    if (userMeasurements.age) {
      measurementContext += ` and age (${userMeasurements.age})`;
    }
  }

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
        {
          type: "decrease",
          category: "sugary drinks",
          reason: "Liquid calories can add up quickly without providing satiety, making weight loss more difficult.",
        },
        {
          type: "add",
          category: "whole grains",
          item: "brown rice or quinoa",
          reason: "Whole grains provide fiber and nutrients while keeping you fuller longer than refined grains.",
        },
      ]
      summary =
        `Based on your weight loss goal ${measurementContext}, we recommend focusing on more vegetables and lean proteins while reducing processed foods and sugary items.`
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
        {
          type: "add",
          category: "calorie-dense foods",
          item: "nut butters or granola",
          reason: "These foods provide concentrated calories to help you meet your energy needs.",
        },
        {
          type: "increase",
          category: "dairy products",
          item: "whole milk or Greek yogurt",
          reason: "Dairy provides protein, calories, and calcium for muscle and bone health.",
        },
      ]
      summary =
        `To support your weight gain goal ${measurementContext}, we recommend increasing your intake of nutrient-dense foods, healthy fats, and protein sources.`
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
        {
          type: "add",
          category: "whole grains",
          reason: "Whole grains provide fiber and essential nutrients for overall health.",
        },
        {
          type: "increase",
          category: "lean proteins",
          reason: "Adequate protein supports muscle maintenance and overall health.",
        },
      ]
      summary =
        `To improve your overall health ${measurementContext}, we recommend increasing your consumption of whole foods, particularly fruits and vegetables, while reducing processed items.`
  }

  return {
    recommendations,
    summary,
    overallSummary: summary,
  }
}

