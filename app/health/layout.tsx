import { DashboardLayout } from "@/components/layout/dashboard-layout"
import type { ReactNode } from "react"

export default function HealthLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
} 