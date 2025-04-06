"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Lightbulb, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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

interface RecommendationsContentProps {
  recommendations: Recommendation[]
}

export function RecommendationsContent({ recommendations }: RecommendationsContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateRecommendations = async () => {
    if (isLoading) return // Prevent multiple clicks
    
    setIsLoading(true)

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate recommendations")
      }

      toast({
        title: "Success!",
        description: "New recommendations generated based on your purchases",
      })

      // Refresh the page to show new recommendations
      router.refresh()
    } catch (error) {
      console.error("Error generating recommendations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recommendations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  // Handle empty clicks when loading
  const handleClick = () => {
    if (!isLoading) {
      handleGenerateRecommendations();
    }
  };

  const generateButtonContent = isLoading ? (
    <>
      <LoadingSpinner size="sm" className="mr-2" />
      Generating...
    </>
  ) : (
    <>
      <RefreshCw className="mr-2 h-4 w-4" />
      Generate New
    </>
  )

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Get personalized recommendations based on your grocery purchases"
        action={{
          label: isLoading ? "Generating..." : "Generate New",
          icon: isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="mr-2 h-4 w-4" />,
          onClick: handleClick,
        }}
      />

      {recommendations.length === 0 ? (
        <EmptyState
          title="No recommendations yet"
          description="Add more purchases to get personalized recommendations based on your health goals."
          icon={<Lightbulb className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-6">
          {recommendations.map((recommendation) => (
            <Card key={recommendation._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-gray-800">Recommendation</CardTitle>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(recommendation.date), { addSuffix: true })}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-700">{recommendation.summary}</p>

                <div className="space-y-4">
                  {recommendation.recommendations.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
} 