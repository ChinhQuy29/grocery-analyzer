"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PurchaseItem {
  name: string
  category: string
  quantity: number
  price: number
}

interface EditPurchaseDialogProps {
  purchase: {
    _id: string
    items: PurchaseItem[]
    totalAmount: number
  }
  trigger: React.ReactNode
}

export function EditPurchaseDialog({ purchase, trigger }: EditPurchaseDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PurchaseItem[]>(purchase.items)

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items]
    if (field === "price") {
      if (value === "") {
        newItems[index] = { ...newItems[index], price: 0 }
      } else {
        const numValue = Number(value)
        newItems[index] = { ...newItems[index], price: isNaN(numValue) ? 0 : numValue }
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/purchases/${purchase._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          totalAmount: calculateTotal(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update purchase")
      }

      toast({
        title: "Success!",
        description: "Purchase updated successfully",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update purchase",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>Update the items in your purchase</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg">
                <div className="col-span-12 sm:col-span-4">
                  <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                  <Input
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="e.g., Apples"
                    required
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <Label htmlFor={`item-category-${index}`}>Category</Label>
                  <Input
                    id={`item-category-${index}`}
                    value={item.category}
                    onChange={(e) => updateItem(index, "category", e.target.value)}
                    placeholder="e.g., Fruits"
                    required
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Label htmlFor={`item-quantity-${index}`}>Qty</Label>
                  <Input
                    id={`item-quantity-${index}`}
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        return // Don't update if empty
                      }
                      const numValue = Number(value)
                      if (numValue < 0) {
                        toast({
                          title: "Error",
                          description: "Quantity cannot be negative",
                          variant: "destructive",
                        })
                        return
                      }
                      updateItem(index, "quantity", numValue)
                    }}
                    required
                    className="text-center"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label htmlFor={`item-price-${index}`}>Price ($)</Label>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price === 0 ? "" : item.price}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length > 1 && value.startsWith("0") && !value.includes(".")) {
                        e.target.value = value.replace(/^0+/, "")
                      }
                      updateItem(index, "price", value)
                    }}
                    required
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <p className="text-lg font-bold">Total: ${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 