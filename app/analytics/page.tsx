import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { connectToDatabase } from "@/lib/mongodb"
import { Purchase } from "@/lib/models"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AreaChart, BarChart, DonutChart, Title, Text } from "@tremor/react"
import { format, subMonths } from "date-fns"
import { ArrowDown, ArrowUp, DollarSign, ShoppingBag, TrendingUp } from "lucide-react"

interface PurchaseData {
  date: string
  totalAmount: number
  items: Array<{
    name: string
    category: string
    quantity: number
    price: number
    nutritionalInfo?: {
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      sugar?: number
      fiber?: number
    }
  }>
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  await connectToDatabase()

  // Get purchases from the last 6 months
  const sixMonthsAgo = subMonths(new Date(), 6)
  const purchases = await Purchase.find({
    userId: session.user.id,
    date: { $gte: sixMonthsAgo },
  })
    .sort({ date: 1 })
    .lean()

  // Process data for visualizations
  const monthlySpending = purchases.reduce((acc: any, purchase: any) => {
    const month = format(new Date(purchase.date), "MMM yyyy")
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += purchase.totalAmount
    return acc
  }, {})

  const categorySpending = purchases.reduce((acc: any, purchase: any) => {
    purchase.items.forEach((item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = 0
      }
      acc[item.category] += item.price * item.quantity
    })
    return acc
  }, {})

  const nutritionalData = purchases.reduce((acc: any, purchase: any) => {
    purchase.items.forEach((item: any) => {
      if (item.nutritionalInfo) {
        Object.entries(item.nutritionalInfo).forEach(([key, value]) => {
          if (!acc[key]) {
            acc[key] = 0
          }
          acc[key] += (value as number) * item.quantity
        })
      }
    })
    return acc
  }, {})

  // Calculate spending trends
  const monthlySpendingArray = Object.entries(monthlySpending).map(([month, amount]) => ({
    month,
    amount: amount as number,
  }))

  const totalSpent = monthlySpendingArray.reduce((sum, { amount }) => sum + amount, 0)
  const averageMonthlySpent = totalSpent / monthlySpendingArray.length
  const lastMonthSpent = monthlySpendingArray[monthlySpendingArray.length - 1]?.amount || 0
  const previousMonthSpent = monthlySpendingArray[monthlySpendingArray.length - 2]?.amount || 0
  const spendingChange = ((lastMonthSpent - previousMonthSpent) / previousMonthSpent) * 100

  // Format data for charts
  const categoryData = Object.entries(categorySpending).map(([name, value]) => ({
    name,
    value: value as number,
  }))

  const nutritionalDataArray = Object.entries(nutritionalData).map(([name, value]) => ({
    name,
    value: value as number,
  }))

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="Visualize your grocery spending and nutrition patterns"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Last 6 months</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Monthly</p>
                <p className="text-2xl font-bold">${averageMonthlySpent.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Per month</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Spending Change</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{Math.abs(spendingChange).toFixed(1)}%</p>
                  {spendingChange >= 0 ? (
                    <ArrowUp className="h-5 w-5 text-green-500 ml-2" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500 ml-2" />
                  )}
                </div>
                <p className="text-sm text-gray-500">vs last month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              className="h-80"
              data={monthlySpendingArray}
              index="month"
              categories={["amount"]}
              colors={["blue"]}
              valueFormatter={(value) => `$${value.toFixed(2)}`}
              showLegend={false}
              showGridLines={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              className="h-80"
              data={categoryData}
              category="value"
              index="name"
              valueFormatter={(value) => `$${value.toFixed(2)}`}
              colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nutritional Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            className="h-80"
            data={nutritionalDataArray}
            index="name"
            categories={["value"]}
            colors={["green"]}
            showLegend={false}
            showGridLines={false}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

