'use client'

import { PropsWithChildren, useEffect, useState } from 'react'

import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

import { Button } from '@otog/ui'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export type ClientOnlyProps = PropsWithChildren<{
  fallback?: React.ReactNode
}>

export const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(true)
  }, [])
  return show ? children : fallback
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }
  return (
    <ClientOnly
      fallback={
        <Button
          title="Toggle color mode"
          onClick={toggleColorMode}
          size="icon"
          className="rounded-full"
          variant="outline"
        >
          <div className="bg-current rounded-full size-4" />
        </Button>
      }
    >
      <Button
        title="Toggle color mode"
        onClick={toggleColorMode}
        size="icon"
        className="rounded-full"
        variant="outline"
      >
        {resolvedTheme === 'light' ? <MoonIcon /> : <SunIcon />}
      </Button>
    </ClientOnly>
  )
}
