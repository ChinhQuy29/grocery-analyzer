"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow", className)}
    >
      {icon && <div className="mb-4 p-3 bg-gray-100 rounded-full">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-4 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-green-600 hover:bg-green-700">
          {action.label}
        </Button>
      )}
    </div>
  )
}

