import { useCallback, useState } from 'react'

export type UseDisclosureProps = {
  defaultIsOpen?: boolean
}

export type UseDisclosureReturn = ReturnType<typeof useDisclosure>

export function useDisclosure(props?: UseDisclosureProps) {
  const { defaultIsOpen = false } = props ?? {}
  const [isOpen, setOpen] = useState<boolean>(defaultIsOpen)
  const onOpen = useCallback(() => {
    setOpen(true)
  }, [])
  const onClose = useCallback(() => {
    setOpen(false)
  }, [])
  const onToggle = useCallback(() => {
    setOpen((open) => !open)
  }, [])
  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  }
}
