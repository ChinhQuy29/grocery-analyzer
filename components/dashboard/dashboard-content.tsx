"use client"

import { PageHeader } from "@/components/ui/page-header"
import PurchaseList from "@/components/dashboard/purchase-list"
import RecommendationCard from "@/components/dashboard/recommendation-card"
import AddPurchaseButton from "@/components/dashboard/add-purchase-button"
import ScraperForm from "@/components/dashboard/scraper-form"
import { WalmartImport } from "@/components/walmart-import"
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
                />
              ) : (
                <PurchaseList purchases={purchases} />
              )}
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

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Import Walmart Data</h2>
              <WalmartImport />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 