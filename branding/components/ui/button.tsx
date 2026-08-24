import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "signal" | "verified"
  size?: "default" | "sm" | "lg" | "xl" | "icon"
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-180 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          {
            "bg-signal text-signal-fg hover:bg-signal-hover active:bg-signal-active shadow-signal": variant === "default",
            "bg-invalid text-invalid-fg hover:bg-invalid-hover shadow-[0_8px_30px_-8px_oklch(0.55_0.22_25_/_0.35)]": variant === "destructive",
            "border border-border bg-transparent hover:bg-bg-alt hover:border-border-strong": variant === "outline",
            "bg-surface-elevated text-fg hover:bg-bg-alt border border-border": variant === "secondary",
            "bg-transparent hover:bg-bg-alt": variant === "ghost",
            "text-signal underline-offset-4 hover:underline": variant === "link",
            "bg-signal text-signal-fg hover:bg-signal-hover active:bg-signal-active shadow-signal": variant === "signal",
            "bg-verified text-verified-fg hover:bg-verified-hover shadow-[0_8px_30px_-8px_oklch(0.52_0.18_142_/_0.35)]": variant === "verified",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2": size === "default",
            "h-12 px-6 text-base": size === "lg",
            "h-14 px-8 text-lg": size === "xl",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, type ButtonProps }