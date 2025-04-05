"use client"

import { PageHeader } from "@/components/ui/page-header"
import PurchaseList from "@/components/dashboard/purchase-list"
import RecommendationCard from "@/components/dashboard/recommendation-card"
import AddPurchaseButton from "@/components/dashboard/add-purchase-button"
import ScraperForm from "@/components/dashboard/scraper-form"
import { Plus, ShoppingBag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

interface PurchaseItem {
  name: string
  category: string
  quantity: number
  price: number
}

interface Purchase {
  _id: string
  date: string
  items: PurchaseItem[]
  totalAmount: number
}

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

interface DashboardContentProps {
  purchases: Purchase[]
  recommendation: Recommendation | null
  userGoal: string
}

export function DashboardContent({ purchases, recommendation, userGoal }: DashboardContentProps) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Track your grocery purchases and get personalized recommendations"
        action={{
          label: "Add Purchase",
          icon: <Plus className="mr-2 h-4 w-4" />,
          onClick: () => {}, // This will be handled by the AddPurchaseButton component
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Purchases</h2>
                <AddPurchaseButton />
              </div>

              {purchases.length === 0 ? (
                <EmptyState
                  title="No purchases yet"
                  description="Add your first purchase to get started tracking your grocery habits."
                  icon={<ShoppingBag className="h-6 w-6 text-gray-400" />}
                  action={{
                    label: "Add Purchase",
                    onClick: () => {}, // This will be handled by the AddPurchaseButton component
                  }}
                />
              ) : (
                <PurchaseList purchases={purchases} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Purchase Analytics</h2>
              <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Purchase analytics will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RecommendationCard recommendation={recommendation} />

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Health Goal</h2>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">
                  Current Goal: {userGoal?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
            </CardContent>
          </Card>

          <ScraperForm />
        </div>
      </div>
    </>
  )
} 