import { ReactNode, useEffect, useState } from 'react'

export interface ClientOnlyProps {
  children: ReactNode
  fallback?: React.ReactNode
}

export const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(true)
  }, [])
  return show ? children : fallback
}
