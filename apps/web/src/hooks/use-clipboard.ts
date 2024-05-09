import { useCallback, useEffect, useState } from 'react'

import copy from 'copy-to-clipboard'

export function useClipboard(timeout = 1500) {
  const [hasCopied, setHasCopied] = useState(false)
  const onCopy = useCallback((value: string) => {
    const didCopy = copy(value)
    setHasCopied(didCopy)
  }, [])
  useEffect(() => {
    if (hasCopied) {
      const timeoutId = setTimeout(() => {
        setHasCopied(false)
      }, timeout)
      return () => {
        window.clearTimeout(timeoutId)
      }
    }
  }, [timeout, hasCopied])

  return { hasCopied, onCopy }
}
