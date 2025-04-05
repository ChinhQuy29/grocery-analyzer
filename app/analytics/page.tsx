import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Analytics" description="Visualize your grocery spending and nutrition patterns" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <EmptyState
              title="Coming Soon"
              description="Spending analytics will be available once you have more purchase data."
              icon={<BarChart3 className="h-8 w-8 text-gray-400" />}
              className="h-full border-0 shadow-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutritional Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <EmptyState
              title="Coming Soon"
              description="Nutritional analytics will be available once you have more purchase data."
              icon={<BarChart3 className="h-8 w-8 text-gray-400" />}
              className="h-full border-0 shadow-none"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <EmptyState
            title="Coming Soon"
            description="Purchase trend analytics will be available once you have more purchase data."
            icon={<BarChart3 className="h-8 w-8 text-gray-400" />}
            className="h-full border-0 shadow-none"
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

