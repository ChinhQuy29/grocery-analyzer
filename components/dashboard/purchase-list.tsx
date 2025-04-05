"use client"

import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface PurchaseListProps {
  purchases: Purchase[]
}

export default function PurchaseList({ purchases }: PurchaseListProps) {
  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No purchases found. Add your first purchase to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card key={purchase._id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(purchase.date), { addSuffix: true })}
                  </p>
                  <p className="font-medium">
                    {purchase.items.length} {purchase.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <p className="font-bold text-lg">${purchase.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {purchase.items.slice(0, 5).map((item, index) => (
                  <Badge key={index} variant="outline" className="bg-white">
                    {item.name} (${item.price.toFixed(2)})
                  </Badge>
                ))}
                {purchase.items.length > 5 && (
                  <Badge variant="outline" className="bg-white">
                    +{purchase.items.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

