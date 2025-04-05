"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    icon?: React.ReactNode
    onClick?: () => void
  }
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h1>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>
      {action && action.onClick && (
        <Button onClick={action.onClick} className="bg-green-600 hover:bg-green-700 self-start">
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  )
}

