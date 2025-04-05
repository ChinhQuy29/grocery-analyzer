import { connectToDatabase } from "@/lib/mongodb"
import { Purchase, Recommendation } from "@/lib/models"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Document } from "mongoose"

interface PurchaseDocument extends Document {
  _id: string
  userId: string
  date: Date
  items: Array<{
    name: string
    category: string
    quantity: number
    price: number
  }>
  totalAmount: number
}

interface RecommendationDocument extends Document {
  _id: string
  userId: string
  date: Date
  recommendations: Array<{
    type: "increase" | "decrease" | "add" | "remove"
    category: string
    item?: string
    reason: string
  }>
  summary: string
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This will be handled by the DashboardLayout
  }

  await connectToDatabase()

  // Fetch user's purchases
  const purchases = await Purchase.find({
    userId: session.user.id,
  })
    .sort({ date: -1 })
    .limit(5)
    .lean()

  // Fetch latest recommendation
  const recommendation = await Recommendation.findOne({
    userId: session.user.id,
  })
    .sort({ date: -1 })
    .lean()

  // Format the data to match the expected types
  const formattedPurchases = (purchases as unknown as PurchaseDocument[]).map((purchase) => ({
    _id: purchase._id.toString(),
    date: purchase.date.toISOString(),
    items: purchase.items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: purchase.totalAmount,
  }))

  const formattedRecommendation = recommendation
    ? {
        _id: (recommendation as unknown as RecommendationDocument)._id.toString(),
        date: (recommendation as unknown as RecommendationDocument).date.toISOString(),
        recommendations: (recommendation as unknown as RecommendationDocument).recommendations,
        summary: (recommendation as unknown as RecommendationDocument).summary,
      }
    : null

  return (
    <DashboardLayout>
      <DashboardContent
        purchases={formattedPurchases}
        recommendation={formattedRecommendation}
        userGoal={session.user.goal || ""}
      />
    </DashboardLayout>
  )
}

