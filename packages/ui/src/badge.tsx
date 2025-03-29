import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-focus',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        accept:
          'border-transparent bg-accept dark:bg-accept/15 text-accept-foreground hover:bg-accept/80',
        reject:
          'border-transparent bg-reject dark:bg-reject/15 text-reject-foreground hover:bg-reject/80',
        warning:
          'border-transparent bg-warning dark:bg-warning/15 text-warning-foreground hover:bg-warning/80',
        info: 'border-transparent bg-info dark:bg-info/15 text-info-foreground hover:bg-info/80',
        error:
          'border-transparent bg-error dark:bg-error/15 text-error-foreground hover:bg-error/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
