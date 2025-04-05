import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase } from "@/lib/models"

export async function POST(request: Request) {
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

    // Create new purchase
    const newPurchase = new Purchase({
      userId: session.user.id,
      items,
      totalAmount,
      date: new Date(),
    })

    await newPurchase.save()

    // Return success response
    return NextResponse.json(
      {
        message: "Purchase added successfully",
        purchase: {
          id: newPurchase._id,
          date: newPurchase.date,
          items: newPurchase.items,
          totalAmount: newPurchase.totalAmount,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Add purchase error:", error)
    return NextResponse.json({ message: "An error occurred while adding the purchase" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Fetch purchases
    const purchases = await Purchase.find({
      userId: session.user.id,
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Purchase.countDocuments({ userId: session.user.id })

    // Return success response
    return NextResponse.json({
      purchases,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get purchases error:", error)
    return NextResponse.json({ message: "An error occurred while fetching purchases" }, { status: 500 })
  }
}

