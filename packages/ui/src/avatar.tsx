import * as React from 'react'

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { Slot } from '@radix-ui/react-slot'

import { cn } from './utils'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

const AvatarGroup = ({
  children,
  className,
  asChild,
}: {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}) => {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      className={cn(
        'inline-flex items-center [&>:not(:last-child)]:-mr-2 [&>*]:border-background',
        className
      )}
    >
      {children}
    </Comp>
  )
}

const AvatarCount = ({ count }: { count: number }) => {
  return (
    <span
      className={cn(
        'relative h-6 w-6 min-w-6 rounded-full border flex items-center justify-center bg-muted text-[10px] text-muted-foreground font-semibold'
      )}
    >
      {count > 100 ? '99+' : count}
    </span>
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarCount as AvatarMore,
}
