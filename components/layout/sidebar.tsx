"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { BarChart3, Home, LogOut, ShoppingBag, User2, Lightbulb, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { User } from "next-auth"

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Purchases",
      icon: ShoppingBag,
      href: "/purchases",
      active: pathname === "/purchases",
    },
    {
      label: "Recommendations",
      icon: Lightbulb,
      href: "/recommendations",
      active: pathname === "/recommendations",
    },
    {
      label: "Profile",
      icon: User2,
      href: "/profile",
      active: pathname === "/profile",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      active: pathname === "/analytics",
    },
  ]

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 w-full z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-green-600 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          <span>Grocery Analyzer</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <Link href="/dashboard" className="text-xl font-bold text-green-600 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  <span>Grocery Analyzer</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2">
                <nav className="grid gap-1 px-2">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                        route.active
                          ? "bg-green-50 text-green-700"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                      )}
                    >
                      <route.icon className="h-5 w-5" />
                      {route.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 z-50 border-r bg-white">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="text-xl font-bold text-green-600 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span>Grocery Analyzer</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  route.active ? "bg-green-50 text-green-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}

