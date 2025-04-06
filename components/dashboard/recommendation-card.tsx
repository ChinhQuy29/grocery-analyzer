"use client"

import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb } from "lucide-react"
import GenerateRecommendationsButton from "./generate-recommendations-button"
import type { ReactNode } from "react"

interface RecommendationItem {
  type: "increase" | "decrease" | "add" | "remove"
  category: string
  item?: string
  reason: string
}

interface Recommendation {
  _id: string
  date: string
  recommendations: RecommendationItem[]
  summary: string
}

interface RecommendationCardProps {
  recommendation: Recommendation | null
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  if (!recommendation) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">
              No recommendations yet. Add more purchases to get personalized recommendations.
            </p>
            <GenerateRecommendationsButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            Recommendations
          </CardTitle>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(recommendation.date), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-gray-700">{recommendation.summary}</p>

        <div className="space-y-3">
          {recommendation.recommendations.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className={`p-1 rounded-full ${getTypeColor(item.type)}`}>{getTypeIcon(item.type)}</div>
                <div>
                  <p className="font-medium">
                    {getTypeText(item.type)} {item.item || item.category}
                  </p>
                  <p className="text-sm text-gray-600">{item.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recommendation.recommendations.length > 3 && (
          <Button variant="link" className="mt-2 text-green-600 p-0 h-auto" asChild>
            <a href="/recommendations">
              View all recommendations <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function getTypeColor(type: string): string {
  switch (type) {
    case "increase":
      return "bg-green-100 text-green-600"
    case "decrease":
      return "bg-amber-100 text-amber-600"
    case "add":
      return "bg-blue-100 text-blue-600"
    case "remove":
      return "bg-red-100 text-red-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

function getTypeIcon(type: string): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "increase" && <path d="M12 19V5M5 12l7-7 7 7" />}
      {type === "decrease" && <path d="M12 5v14M5 12l7 7 7-7" />}
      {type === "add" && <path d="M12 5v14M5 12h14" />}
      {type === "remove" && <path d="M5 12h14" />}
    </svg>
  )
}

function getTypeText(type: string): string {
  switch (type) {
    case "increase":
      return "Increase consumption of"
    case "decrease":
      return "Decrease consumption of"
    case "add":
      return "Add to your diet:"
    case "remove":
      return "Consider removing:"
    default:
      return ""
  }
}

