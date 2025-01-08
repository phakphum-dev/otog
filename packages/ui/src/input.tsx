import * as React from 'react'

import { cva } from 'class-variance-authority'

import { cn } from './utils'

export const inputStyles = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
  {
    variants: {
      focus: {
        visible:
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        within:
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      },
    },
    defaultVariants: {
      focus: 'visible',
    },
  }
)
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const inputGroup = useInputGroupContext()
    const {
      hasLeftIcon = false,
      hasRightIcon = false,
      hasLeftAddon = false,
      hasRightAddon = false,
    } = inputGroup ?? {}
    return (
      <input
        type={type}
        className={cn(
          inputStyles({ className }),
          hasLeftIcon && 'pl-10',
          hasRightIcon && 'pr-10',
          hasLeftAddon && 'rounded-s-none',
          hasRightAddon && 'rounded-e-none'
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

interface InputGroupContextValue {
  hasLeftIcon: boolean
  hasRightIcon: boolean
  hasLeftAddon: boolean
  hasRightAddon: boolean
}

const InputGroupContext = React.createContext({} as InputGroupContextValue)
const useInputGroupContext = () => React.useContext(InputGroupContext)

export function getValidChildren(children: React.ReactNode) {
  return React.Children.toArray(children).filter((child) =>
    React.isValidElement(child)
  ) as React.ReactElement[]
}

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, children, ...props }, ref) => {
  function isChildrenInputAddons() {
    const validChildren = getValidChildren(children)
    let hasLeftIcon = false
    let hasRightIcon = false
    let hasLeftAddon = false
    let hasRightAddon = false
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    validChildren.forEach((child: any) => {
      if (child.type.displayName === 'InputLeftIcon') {
        hasLeftIcon = true
      } else if (child.type.displayName === 'InputRightIcon') {
        hasRightIcon = true
      } else if (child.type.displayName === 'InputLeftAddon') {
        hasLeftAddon = true
      } else if (child.type.displayName === 'InputRightAddon') {
        hasRightAddon = true
      } else if (child.type.displayName === 'InputLeftAddonSelect') {
        hasLeftAddon = true
      }
    })
    return { hasLeftIcon, hasRightIcon, hasLeftAddon, hasRightAddon }
  }
  const hasAddons = isChildrenInputAddons()

  return (
    <InputGroupContext.Provider value={hasAddons}>
      <div
        ref={ref}
        className={cn('group relative w-full flex', className)}
        {...props}
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  )
})
InputGroup.displayName = 'InputGroup'

const InputLeftIcon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'absolute [&>svg]:size-4 text-muted-foreground ml-3.5 mr-2 left-0 inset-y-0 flex justify-center items-center group-has-[:disabled]:text-muted pointer-events-none',
        className
      )}
    >
      {props.children}
    </div>
  )
})
InputLeftIcon.displayName = 'InputLeftIcon'

const InputRightIcon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'absolute [&>svg]:size-4 text-muted-foreground mr-3.5 ml-2 right-0 inset-y-0 flex justify-center items-center group-has-[:disabled]:text-muted pointer-events-none',
        className
      )}
    >
      {props.children}
    </div>
  )
})
InputRightIcon.displayName = 'InputRightIcon'

const InputLeftAddon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'px-2 rounded-s-lg flex shrink-0 justify-center items-center bg-accent text-accent-foreground pointer-events-none',
        className
      )}
    >
      {props.children}
    </div>
  )
})
InputLeftAddon.displayName = 'InputLeftAddon'

const InputRightAddon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'px-2 rounded-e-lg flex shrink-0 justify-center items-center bg-accent text-accent-foreground pointer-events-none',
        className
      )}
    >
      {props.children}
    </div>
  )
})
InputRightAddon.displayName = 'InputRightAddon'

export { Input, InputGroup, InputLeftIcon, InputRightIcon }
