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

  return (
    <DashboardLayout>
      <PageHeader title="Profile Settings" description="Manage your account information and preferences" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={JSON.parse(JSON.stringify(user))} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Health Goal</p>
                  <p className="font-medium capitalize">{user.goal?.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

