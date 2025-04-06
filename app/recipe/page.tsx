import { connectToDatabase } from "@/lib/mongodb"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/ui/page-header"
import { RecipeList } from "@/components/recipe/recipe-list"

export default async function RecipePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This will be handled by the DashboardLayout
  }

  await connectToDatabase()

  return (
    <DashboardLayout>
      <PageHeader
        title="Recipe Suggestions"
        description="Personalized recipes based on your shopping history"
      />
      <RecipeList userId={session.user.id} />
    </DashboardLayout>
  )
} 