import { ComponentProps, ForwardedRef, forwardRef } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'

import { cn } from '.'

const linkStyles = cva(
  'rounded cursor-pointer hover:underline focus-visible:underline ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ',
  {
    variants: {
      variant: {
        default: 'text-primary',
        hidden: 'hover:text-primary focus-visible:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type LinkProps = ComponentProps<'a'> &
  VariantProps<typeof linkStyles> & {
    isExternal?: boolean
    isActive?: boolean
    asChild?: boolean
  }

export const Link = forwardRef(
  (
    {
      className,
      children,
      href,
      variant,
      asChild = false,
      isActive = false,
      isExternal = false,
      ...props
    }: LinkProps,
    ref: ForwardedRef<HTMLAnchorElement>
  ) => {
    const Comp = asChild ? Slot : 'a'
    return (
      <Comp
        className={cn(linkStyles({ variant, className }))}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'norefe' : undefined}
        data-active={isActive}
        ref={ref as any}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
