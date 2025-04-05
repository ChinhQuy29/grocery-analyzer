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

export default function AddPurchaseButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PurchaseItem[]>([{ name: "", category: "groceries", quantity: 1, price: 0 }])

  const addItem = () => {
    setItems([...items, { name: "", category: "groceries", quantity: 1, price: 0 }])
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate items
    const validItems = items.filter((item) => item.name.trim() !== "" && item.price > 0)

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: validItems,
          totalAmount: calculateTotal(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to add purchase")
      }

      toast({
        title: "Success!",
        description: "Purchase added successfully",
      })

      setOpen(false)
      setItems([{ name: "", category: "groceries", quantity: 1, price: 0 }]) // Reset form
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add purchase",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // If closing the dialog and not in loading state, reset the form
        if (!newOpen && !isLoading) {
          setItems([{ name: "", category: "groceries", quantity: 1, price: 0 }])
        }
        setOpen(newOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Purchase</DialogTitle>
            <DialogDescription>Add the items from your grocery receipt</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg relative">
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
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                    required
                    className="text-center"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Label htmlFor={`item-price-${index}`}>Price ($)</Label>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-1 sm:col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
            <div className="flex justify-end">
              <p className="text-lg font-bold">Total: ${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                "Add Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

