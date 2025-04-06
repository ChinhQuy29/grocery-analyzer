"use client"

import { PageHeader } from "@/components/ui/page-header"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ShoppingBag, Plus, Pencil, Trash2 } from "lucide-react"
import AddPurchaseButton from "@/components/dashboard/add-purchase-button"
import { EditPurchaseDialog } from "./edit-purchase-dialog"
import { DeletePurchaseDialog } from "./delete-purchase-dialog"
import { Button } from "@/components/ui/button"

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
          onClick: () => document.getElementById("add-purchase-trigger")?.click(),
        }}
      />

      <div className="hidden">
        <AddPurchaseButton />
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Add your first purchase to get started tracking your grocery habits."
          icon={<ShoppingBag className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase._id} className="overflow-hidden group">
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
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xl">${purchase.totalAmount.toFixed(2)}</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <DeletePurchaseDialog
                          purchaseId={purchase._id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <EditPurchaseDialog
                          purchase={purchase}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
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