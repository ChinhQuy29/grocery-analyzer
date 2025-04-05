import { connectToDatabase } from "@/lib/mongodb"
import { Purchase } from "@/lib/models"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PurchasesContent } from "@/components/purchases/purchases-content"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Document } from "mongoose"

interface PurchaseDocument extends Document {
  _id: string
  userId: string
  date: Date
  items: Array<{
    name: string
    category: string
    quantity: number
    price: number
  }>
  totalAmount: number
}

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This will be handled by the DashboardLayout
  }

  await connectToDatabase()

  // Fetch user's purchases
  const purchases = await Purchase.find({
    userId: session.user.id,
  })
    .sort({ date: -1 })
    .lean()

  // Format the data to match the expected types
  const formattedPurchases = (purchases as unknown as PurchaseDocument[]).map((purchase) => ({
    _id: purchase._id.toString(),
    date: purchase.date.toISOString(),
    items: purchase.items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: purchase.totalAmount,
  }))

  return (
    <DashboardLayout>
      <PurchasesContent purchases={formattedPurchases} />
    </DashboardLayout>
  )
}

