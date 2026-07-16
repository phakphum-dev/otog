import { Component, ComponentProps, ReactNode, useMemo } from 'react'
import {
  HtmlPortalNode,
  InPortal,
  OutPortal,
  createHtmlPortalNode,
} from 'react-reverse-portal'

import { ClientOnly } from './client-only'

function createIsomorphicHtmlPortalNode<T>(): HtmlPortalNode<Component<T>> {
  if (typeof window === 'undefined') {
    return {
      element: null as unknown as HTMLElement,
      elementType: 'html',
      setPortalProps: () => {},
      getInitialPortalProps: () => ({}) as any,
      mount: () => {},
      unmount: () => {},
    }
  }
  return createHtmlPortalNode()
}

export function useHtmlPortalNode<T = {}>() {
  return useMemo(() => createIsomorphicHtmlPortalNode<T>(), [])
}

export function ClientOutPortal<T>(
  props: ComponentProps<typeof OutPortal<Component<T>>> & {
    fallback?: ReactNode
  }
) {
  const { fallback, ...rest } = props
  return (
    <ClientOnly fallback={fallback}>
      <OutPortal {...(rest as any)} />
    </ClientOnly>
  )
}

export function ClientInPortal(props: ComponentProps<typeof InPortal>) {
  return (
    <ClientOnly>
      <InPortal {...props} />
    </ClientOnly>
  )
}
