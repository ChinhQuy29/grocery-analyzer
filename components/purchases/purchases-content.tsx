"use client"

import { PageHeader } from "@/components/ui/page-header"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ShoppingBag, Plus } from "lucide-react"

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

interface PurchasesContentProps {
  purchases: Purchase[]
}

export function PurchasesContent({ purchases }: PurchasesContentProps) {
  return (
    <>
      <PageHeader
        title="Purchase History"
        description="View and manage all your grocery purchases"
        action={{
          label: "Add Purchase",
          icon: <Plus className="mr-2 h-4 w-4" />,
          onClick: () => {}, // This will be handled by the AddPurchaseButton component
        }}
      />

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Add your first purchase to get started tracking your grocery habits."
          icon={<ShoppingBag className="h-8 w-8 text-gray-400" />}
          action={{
            label: "Add Purchase",
            onClick: () => {}, // This will be handled by the AddPurchaseButton component
          }}
        />
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(purchase.date), { addSuffix: true })}
                      </p>
                      <p className="font-medium text-lg">
                        {purchase.items.length} {purchase.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <p className="font-bold text-xl">${purchase.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <h3 className="font-medium mb-3">Items</h3>
                  <div className="space-y-3">
                    {purchase.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {item.category}
                          </Badge>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
} 