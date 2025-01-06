import { useEffect, useState } from 'react'

import { ONE_SECOND, getRemaining } from './time'

export function useTimer(start: string, end: string) {
  const [remaining, setRemaining] = useState(() => getRemaining(start, end))

  useEffect(() => {
    if (start && end) {
      setRemaining(getRemaining(start, end))
    }
  }, [start, end])

  const shouldInterval = remaining > 0
  useEffect(() => {
    if (shouldInterval) {
      const interval = setInterval(() => {
        setRemaining((current) => current - ONE_SECOND)
      }, ONE_SECOND)
      return () => {
        clearInterval(interval)
      }
    }
  }, [shouldInterval])
  return remaining
}
