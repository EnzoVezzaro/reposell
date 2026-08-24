import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "signal" | "verified" | "pending" | "invalid"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-signal/35 focus:ring-offset-2",
          {
            "bg-signal-muted text-signal": variant === "default",
            "bg-surface-elevated text-fg-muted hover:bg-bg-alt": variant === "secondary",
            "bg-invalid-muted text-invalid": variant === "destructive",
            "text-fg border border-border hover:bg-bg-alt": variant === "outline",
            "bg-signal-muted text-signal": variant === "signal",
            "bg-verified-muted text-verified": variant === "verified",
            "bg-pending-muted text-pending-fg": variant === "pending",
            "bg-invalid-muted text-invalid": variant === "invalid",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, type BadgeProps }