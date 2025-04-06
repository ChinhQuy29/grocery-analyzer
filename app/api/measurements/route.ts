import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Measurement } from "@/lib/models"

// GET endpoint to fetch user's measurements
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Find the user's measurements
    let measurements = await Measurement.findOne({ userId: session.user.id })

    // If no measurements exist, return an empty object
    if (!measurements) {
      return NextResponse.json({ measurements: {} })
    }

    // Return the measurements data
    return NextResponse.json({
      measurements: {
        height: measurements.height || null,
        weight: measurements.weight || null,
        age: measurements.age || null,
        gender: measurements.gender || null,
        activityLevel: measurements.activityLevel || "moderately_active",
      }
    })
  } catch (error) {
    console.error("Fetch measurements error:", error)
    return NextResponse.json({ message: "An error occurred while fetching measurements" }, { status: 500 })
  }
}

// PUT endpoint to update user's measurements
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get measurements data from request
    const { height, weight, age, gender, activityLevel } = await request.json()
    
    console.log("Received measurements data:", { height, weight, age, gender, activityLevel })

    // Connect to database
    await connectToDatabase()

    // Find or create the user's measurements
    let measurements = await Measurement.findOne({ userId: session.user.id })

    if (!measurements) {
      // Create new measurements document
      measurements = new Measurement({
        userId: session.user.id,
        height,
        weight,
        age,
        gender,
        activityLevel
      })
    } else {
      // Update existing measurements
      if (height !== undefined) measurements.height = height
      if (weight !== undefined) measurements.weight = weight
      if (age !== undefined) measurements.age = age
      if (gender !== undefined) measurements.gender = gender
      if (activityLevel !== undefined) measurements.activityLevel = activityLevel
    }

    console.log("Before save:", measurements)
    
    // Save the measurements
    await measurements.save()
    
    console.log("After save:", measurements)

    // Return the updated measurements
    return NextResponse.json({
      message: "Measurements updated successfully",
      measurements: {
        height: measurements.height || null,
        weight: measurements.weight || null,
        age: measurements.age || null,
        gender: measurements.gender || null,
        activityLevel: measurements.activityLevel || "moderately_active",
      }
    })
  } catch (error: any) {
    console.error("Update measurements error:", error)
    return NextResponse.json(
      { message: "An error occurred while updating measurements", error: error.message },
      { status: 500 }
    )
  }
} 