"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, ChefHat, RefreshCcw, ThumbsUp, ThumbsDown } from "lucide-react"
import { RecipeModal } from "@/components/recipe/recipe-modal"

interface Recipe {
  id?: string
  recipeId: string
  title: string
  image: string
  readyInMinutes: number
  servings: number
  sourceUrl: string
  summary: string
  ingredients: string[]
  instructions: string[]
  matchingIngredients: string[]
  missingIngredients: string[]
  aiRecommendation: string
}

interface RecipeListProps {
  userId: string
}

export function RecipeList({ userId }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/recipes/user-recipes`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch recipes")
      }
      
      const data = await response.json()
      
      // Normalize the recipes to ensure they match our interface
      const normalizedRecipes = (data.recipes || []).map((recipe: any) => ({
        id: recipe._id || recipe.id || recipe.recipeId,
        recipeId: recipe.recipeId || recipe._id || recipe.id,
        title: recipe.title,
        image: recipe.image || '',
        readyInMinutes: recipe.readyInMinutes || 30,
        servings: recipe.servings || 2,
        sourceUrl: recipe.sourceUrl || '#',
        summary: recipe.summary || '',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        matchingIngredients: recipe.matchingIngredients || [],
        missingIngredients: recipe.missingIngredients || [],
        aiRecommendation: recipe.aiRecommendation || 'A nutritious recipe to try with your available ingredients.'
      }))
      
      setRecipes(normalizedRecipes)
    } catch (err) {
      console.error("Error fetching recipes:", err)
      setError("Failed to load recipes. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRecipes = async () => {
    try {
      setRefreshing(true)
      setError(null)
      
      const response = await fetch(`/api/recipes/generate`, {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error("Failed to refresh recipes")
      }
      
      await fetchRecipes()
    } catch (err) {
      console.error("Error refreshing recipes:", err)
      setError("Failed to generate new recipes. Please try again later.")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

  // Function to open modal with selected recipe
  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading your personalized recipes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchRecipes} variant="outline">Try Again</Button>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Recipes Yet</h3>
            <p className="text-muted-foreground mb-6">
              We'll generate personalized recipes based on your purchase history.
            </p>
            <Button onClick={refreshRecipes} disabled={refreshing}>
              {refreshing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating Recipes...
                </>
              ) : (
                <>
                  Generate Recipes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter recipes based on active tab
  const filteredRecipes = activeTab === "all" 
    ? recipes 
    : activeTab === "easy" 
      ? recipes.filter(recipe => recipe.matchingIngredients.length >= recipe.missingIngredients.length)
      : recipes.filter(recipe => recipe.matchingIngredients.length < recipe.missingIngredients.length)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Recipes</TabsTrigger>
            <TabsTrigger value="easy">Easy to Make</TabsTrigger>
            <TabsTrigger value="shopping">Needs Shopping</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          className="flex gap-2 items-center"
          onClick={refreshRecipes}
          disabled={refreshing}
        >
          {refreshing ? <LoadingSpinner size="sm" /> : <RefreshCcw className="h-4 w-4" />}
          <span>{refreshing ? 'Refreshing...' : 'Refresh Recipes'}</span>
        </Button>
      </div>
      
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No recipes match the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id || recipe.recipeId} className="overflow-hidden flex flex-col h-full">
              <div className="relative h-48 w-full">
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ 
                    backgroundColor: `hsl(${recipe.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 85%)`,
                  }}
                >
                  <div className="text-center px-4">
                    <ChefHat className="h-12 w-12 mx-auto mb-2 text-white drop-shadow-md" />
                    <h3 className="text-xl font-bold text-white drop-shadow-md">{recipe.title}</h3>
                  </div>
                </div>
                
                {recipe.summary.includes('AI Generated') && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-purple-500 hover:bg-purple-600">AI Generated</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{recipe.title}</CardTitle>
                </div>
                <CardDescription>
                  {recipe.readyInMinutes} minutes • {recipe.servings} servings
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <h4 className="font-medium mb-2">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {recipe.aiRecommendation}
                </p>
                
                <Separator className="my-3" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <ThumbsUp className="h-4 w-4 text-green-500 mr-2" />
                      <span>Available</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {recipe.matchingIngredients.map((ingredient, i) => (
                        <Badge key={i} variant="outline" className="bg-green-50">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <ThumbsDown className="h-4 w-4 text-amber-500 mr-2" />
                      <span>Need to Buy</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {recipe.missingIngredients.length > 0 ? (
                        recipe.missingIngredients.map((ingredient, i) => (
                          <Badge key={i} variant="outline" className="bg-amber-50">
                            {ingredient}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          You have all ingredients!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full"
                  onClick={() => handleViewRecipe(recipe)}
                >
                  View Full Recipe
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {selectedRecipe && (
        <RecipeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          recipe={selectedRecipe}
        />
      )}
    </div>
  )
} 