import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-px font-mono text-[10.5px] font-medium leading-[1.4] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-border-soft bg-surface-2 text-text-muted",
        secondary: "border-border-soft bg-surface-2 text-text-muted",
        accent: "border-ember-border bg-ember-bg text-ember-strong",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border-soft text-text-mid",
      },
      dot: {
        true: "before:h-[5px] before:w-[5px] before:rounded-full before:bg-current before:content-['']",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, dot, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, dot }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
