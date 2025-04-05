import { connectToDatabase } from "@/lib/mongodb"
import { Recommendation } from "@/lib/models"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RecommendationsContent } from "@/components/recommendations/recommendations-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Document } from "mongoose"

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

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This will be handled by the DashboardLayout
  }

  await connectToDatabase()

  // Fetch user's recommendations
  const recommendations = await Recommendation.find({
    userId: session.user.id,
  })
    .sort({ date: -1 })
    .lean()

  // Format the data to match the expected types
  const formattedRecommendations = (recommendations as unknown as RecommendationDocument[]).map((recommendation) => ({
    _id: recommendation._id.toString(),
    date: recommendation.date.toISOString(),
    recommendations: recommendation.recommendations,
    summary: recommendation.summary,
  }))

  return (
    <DashboardLayout>
      <RecommendationsContent recommendations={formattedRecommendations} />
    </DashboardLayout>
  )
}

