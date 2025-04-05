"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RefreshCw } from "lucide-react"

export default function GenerateRecommendationsButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateRecommendations = async () => {
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

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recommendations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleGenerateRecommendations} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Generating...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Recommendations
        </>
      )}
    </Button>
  )
}

