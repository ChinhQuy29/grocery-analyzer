import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase } from "@/lib/models"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { items, totalAmount } = await request.json()

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Invalid items data" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Update purchase
    const updatedPurchase = await Purchase.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id,
      },
      {
        items,
        totalAmount,
        date: new Date(),
      },
      { new: true }
    )

    if (!updatedPurchase) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Purchase updated successfully",
        purchase: {
          id: updatedPurchase._id,
          date: updatedPurchase.date,
          items: updatedPurchase.items,
          totalAmount: updatedPurchase.totalAmount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update purchase error:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the purchase" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Delete purchase
    const deletedPurchase = await Purchase.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    })

    if (!deletedPurchase) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Purchase deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete purchase error:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the purchase" },
      { status: 500 }
    )
  }
} 