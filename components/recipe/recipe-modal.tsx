"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import ReactMarkdown from "react-markdown"

interface RecipeModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: {
    title: string
    ingredients: string[]
  }
}

export function RecipeModal({ isOpen, onClose, recipe }: RecipeModalProps) {
  const [fullRecipe, setFullRecipe] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      fetchFullRecipe()
    }
  }, [isOpen, recipe])

  const fetchFullRecipe = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/recipes/full-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: recipe.title,
          ingredients: recipe.ingredients
        })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch recipe details")
      }

      const data = await response.json()
      setFullRecipe(data.fullRecipe)
    } catch (err) {
      console.error("Error fetching full recipe:", err)
      setError("Failed to load the full recipe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95%] max-h-[65vh] h-auto overflow-hidden flex flex-col rounded-lg shadow-lg p-0">
        <DialogHeader className="shrink-0 p-3 md:p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg border-b">
          <DialogTitle className="text-lg font-semibold text-green-800">{recipe.title}</DialogTitle>
          <DialogDescription className="text-green-600 text-sm">
            Complete recipe with step-by-step instructions
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 px-4 md:px-5 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <LoadingSpinner size="md" className="text-green-500" />
              <p className="mt-2 text-muted-foreground text-sm">Generating your recipe...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center my-2">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <Button onClick={fetchFullRecipe} variant="outline" size="sm">Try Again</Button>
            </div>
          ) : (
            <div className="prose prose-sm prose-green max-w-none">
              <ReactMarkdown>{fullRecipe}</ReactMarkdown>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t p-2 bg-gray-50 rounded-b-lg flex flex-row gap-2 justify-end items-center">
          {!isLoading && !error && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                // Create a Blob with the markdown content
                const blob = new Blob([fullRecipe], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                
                // Create a link and click it to download
                const a = document.createElement('a');
                a.href = url;
                a.download = `${recipe.title.replace(/\s+/g, '-').toLowerCase()}.md`;
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="h-8 text-xs px-3"
            >
              Download
            </Button>
          )}
          <Button onClick={onClose} size="sm" className="h-8 text-xs px-3">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 