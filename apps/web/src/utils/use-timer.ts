import { useEffect, useState } from 'react'

import { ONE_SECOND } from './time'

export function useTimer({ start, end }: { start: string; end: string }) {
  const [remaining, setRemaining] = useState(
    () => new Date(end).getTime() - new Date(start).getTime()
  )

  useEffect(() => {
    setRemaining(new Date(end).getTime() - new Date(start).getTime())
  }, [start, end])

  const enabled = remaining > 0
  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => {
      setRemaining((current) => current - ONE_SECOND)
    }, ONE_SECOND)
    return () => {
      clearInterval(interval)
    }
  }, [enabled])
  return remaining
}
