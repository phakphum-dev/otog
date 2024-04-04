import { useCallback, useEffect, useMemo, useState } from 'react'

import { PencilIcon, PlusIcon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'

import { Button } from '@otog/ui'

import { query } from '../../api'
import { useUserContext } from '../../context/user-context'
import { useDisclosure } from '../../hooks/use-disclosure'
import { HEIGHT, INTERVAL } from './constants'
import { ReadonlyEditor } from './editor'
import { AnnouncementModal } from './modal'
import { AnnouncementProvider } from './provier'
import { Announcement } from './types'

export interface AnnouncementCarouselProps {
  defaultShow?: boolean
  contestId?: number
}

export const AnnouncementComponent = (props: AnnouncementCarouselProps) => {
  const { defaultShow, contestId } = props
  return (
    <AnnouncementProvider value={{ contestId }}>
      <AnnouncementCarousel defaultShow={defaultShow} />
    </AnnouncementProvider>
  )
}

export const AnnouncementCarousel = ({
  defaultShow = false,
}: AnnouncementCarouselProps) => {
  const [show, setShow] = useState(defaultShow)
  const { isAdmin } = useUserContext()

  const getAnnouncements = query.announcement.getAnnouncements.useQuery([
    'announcement.getAnnouncements',
  ])

  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data?.body : []
  const shownAnnouncements = useMemo(
    () => announcements.filter((announcements) => announcements.show),
    [announcements]
  )

  const hasAnnouncement = shownAnnouncements.length > 0 || isAdmin
  useEffect(() => {
    setShow(hasAnnouncement)
  }, [hasAnnouncement])

  return hasAnnouncement ? (
    <AnnouncementCards shownAnnouncements={shownAnnouncements} />
  ) : (
    <div className="mt-12" />
  )
}

export type AnnouncementCardsProps = {
  shownAnnouncements: Announcement[]
}

const AnnouncementCards = ({ shownAnnouncements }: AnnouncementCardsProps) => {
  const { isAuthenticated, isAdmin } = useUserContext()

  const getAnnouncements = query.announcement.getAnnouncements.useQuery([
    'announcement.getAnnouncements',
  ])
  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data?.body : []

  const [showIndex, setIndex] = useState(0)

  const nextShowIndex = useCallback(() => {
    const newIndex = (showIndex + 1) % shownAnnouncements.length
    setIndex(newIndex)
  }, [shownAnnouncements, showIndex])

  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    if (!isOpen && isAuthenticated && shownAnnouncements.length > 1) {
      const interval = setInterval(() => nextShowIndex(), INTERVAL)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, showIndex, shownAnnouncements, nextShowIndex, isOpen])
  const hasAnnouncements = announcements.length > 0

  return (
    <div className="group relative my-8 flex h-[180px] cursor-pointer select-none w-full rounded-lg shadow-sm">
      {shownAnnouncements.map((announcement, index, all) => (
        <motion.div
          key={announcement.id}
          variants={{
            show: { y: 0, transition: { duration: 0.5 } },
            hidden: { y: -HEIGHT * 1.5, transition: { duration: 0.5 } },
          }}
          className="absolute flex h-[180px] max-h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background text-center"
          style={{ zIndex: all.length - index }}
          animate={index >= showIndex ? 'show' : 'hidden'}
          onClick={nextShowIndex}
        >
          <ReadonlyEditor value={announcement.value} />
        </motion.div>
      ))}
      {isAdmin && (
        <>
          <Button
            className="absolute right-0 top-0 z-10"
            aria-label="edit-announcements"
            size="icon"
            onClick={onOpen}
            variant="ghost"
          >
            {hasAnnouncements ? (
              <PencilIcon className="size-4" />
            ) : (
              <PlusIcon className="size-4" />
            )}
          </Button>
          {isOpen && <AnnouncementModal onClose={onClose} open={isOpen} />}
        </>
      )}
    </div>
  )
}
