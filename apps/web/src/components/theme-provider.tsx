'use client'

import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

import { Button } from '@otog/ui/button'

import { ClientOnly } from './client-only'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  return (
    <Button
      onClick={toggleColorMode}
      aria-label="Toggle color mode"
      size="icon"
      className="rounded-full text-muted-foreground"
      variant="ghost"
    >
      <ClientOnly>
        {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </ClientOnly>
    </Button>
  )
}
