import { useCallback, useRef, useState } from 'react'

export function useContainerBreakpoint<T extends Element>(options: {
  breakpoint: number
  defaultValue?: boolean
}) {
  const [isBreakpoint, setIsBreakpoint] = useState(
    options.defaultValue ?? false
  )
  const previousObserver = useRef<ResizeObserver | null>(null)
  const containerRef = useCallback((node: T) => {
    if (previousObserver.current) {
      previousObserver.current.disconnect()
      previousObserver.current = null
    }

    if (node?.nodeType === Node.ELEMENT_NODE) {
      const observer = new ResizeObserver(([entry]) => {
        if (entry && entry.borderBoxSize) {
          const {
            inlineSize: width,
            //  blockSize: height
          } = entry.borderBoxSize[0]!
          setIsBreakpoint(options.breakpoint <= width)
        }
      })

      observer.observe(node)
      previousObserver.current = observer
    }
  }, [])

  return { containerRef, isBreakpoint }
}
