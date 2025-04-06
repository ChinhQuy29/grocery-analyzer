import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Recipe } from "@/lib/models"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Fetch user's recipes from the database
    const recipes = await Recipe.find({
      userId: session.user.id,
    }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      { message: "Failed to fetch recipes", error: (error as Error).message },
      { status: 500 }
    )
  }
} 