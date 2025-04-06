import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"
import { compare, hash } from "bcryptjs"
import { getToken } from "next-auth/jwt"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, email, goal, currentPassword, newPassword, measurements } = await request.json()

    // Debug logging
    console.log("Received measurements data:", measurements)

    // Validate required fields
    if (!name || !email || !goal) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Get current user
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
      if (existingUser) {
        return NextResponse.json({ message: "Email is already in use" }, { status: 409 })
      }
    }

    // Update basic info
    user.name = name
    user.email = email
    user.goal = goal
    
    // Update measurements if provided
    if (measurements) {
      console.log("Received measurements:", JSON.stringify(measurements, null, 2));
      console.log("User before update:", JSON.stringify(user.toObject(), null, 2));
      
      try {
        // Direct set approach for mongoose schema
        if (measurements.height) {
          user.measurements.height = measurements.height;
        }
        
        if (measurements.weight) {
          user.measurements.weight = measurements.weight;
        }
        
        if (measurements.age !== undefined && measurements.age !== null) {
          user.measurements.age = measurements.age;
        }
        
        if (measurements.gender) {
          user.measurements.gender = measurements.gender;
        }
        
        if (measurements.activityLevel) {
          user.measurements.activityLevel = measurements.activityLevel;
        }
        
        console.log("User after update (before save):", JSON.stringify(user.toObject(), null, 2));
      } catch (err) {
        console.error("Error updating measurements:", err);
      }
    }

    // Update password if provided
    if (newPassword) {
      // Verify current password
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required" }, { status: 400 })
      }

      const isPasswordValid = await compare(currentPassword, user.password)

      if (!isPasswordValid) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
      }

      // Hash new password
      user.password = await hash(newPassword, 10)
    }

    try {
      await user.save();
      console.log("User saved successfully. User data after save:", JSON.stringify(user.toObject(), null, 2));
    } catch (saveError: any) {
      console.error("Error saving user:", saveError);
      return NextResponse.json({ message: "Error saving user data", error: saveError.message }, { status: 500 });
    }

    // Return success response without sensitive data
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        measurements: user.measurements || undefined,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "An error occurred while updating profile" }, { status: 500 })
  }
}

