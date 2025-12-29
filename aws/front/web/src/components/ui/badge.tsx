import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const base =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold " +
  "transition-colors select-none"

const byVariant: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
  outline: "bg-transparent text-foreground border-border/70",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(base, byVariant[variant], className)} {...props} />
}
