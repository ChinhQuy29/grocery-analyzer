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

    const { name, email, goal, currentPassword, newPassword } = await request.json()

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

    await user.save()

    // Return a response with a special header to trigger the client to call the session endpoint
    // This will force the session to be refreshed on the client side
    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          goal: user.goal,
        },
        sessionExpired: true,  // This flag tells the client to refresh auth state
      }
    )
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "An error occurred while updating profile" }, { status: 500 })
  }
}

