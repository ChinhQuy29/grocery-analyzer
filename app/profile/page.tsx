import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfileForm from "@/components/profile/profile-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This will be handled by the DashboardLayout
  }

  await connectToDatabase()

  // Fetch user details
  const user = await User.findById(session.user.id).select("-password")

  if (!user) {
    return null
  }

  // Debug logging
  console.log("User from DB:", JSON.stringify(user.toObject(), null, 2))

  // Format user data for the form - convert Mongoose document to plain object
  const formattedUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    goal: user.goal,
    measurements: user.measurements ? user.toObject().measurements : undefined
  }

  console.log("Formatted user data for form:", JSON.stringify(formattedUser, null, 2))

  return (
    <DashboardLayout>
      <PageHeader
        title="Profile"
        description="Manage your account settings and preferences"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={formattedUser} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

