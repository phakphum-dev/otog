import { useEffect, useState } from 'react'

import { ONE_SECOND } from './time'

export function useTimer({ start, end }: { start: Date; end: Date }) {
  const [remaining, setRemaining] = useState(
    () => start.getTime() - end.getTime()
  )

  useEffect(() => {
    setRemaining(start.getTime() - end.getTime())
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
