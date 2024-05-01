import { useCallback, useEffect, useMemo, useState } from 'react'
import { createContext, useContext } from 'react'

import { motion } from 'framer-motion'

import { AnnouncementSchema } from '@otog/contract'

import { query } from '../../api'
import { useUserContext } from '../../context/user-context'
import { HEIGHT, INTERVAL } from './constants'
import { ReadonlyEditor } from './editor'
import { AnnouncementModal } from './modal'

export interface AnnouncementCarouselProps {
  contestId?: number
}

export const AnnouncementCarousel = ({
  contestId,
}: AnnouncementCarouselProps) => {
  const { isAdmin, isAuthenticated } = useUserContext()

  const getAnnouncements = query.announcement.getAnnouncements.useQuery(
    [
      'announcement.getAnnouncements',
      { show: true, contestId: contestId?.toString() },
    ],
    { query: { show: true, contestId: contestId?.toString() } }
  )
  const announcements = getAnnouncements.data?.body ?? []
  const count = announcements.length

  const [currentIndex, setIndex] = useState(0)

  const onNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % count
    setIndex(nextIndex)
  }, [count, currentIndex])

  useEffect(() => {
    if (isAuthenticated && count > 1) {
      const interval = setInterval(onNext, INTERVAL)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, currentIndex, announcements, onNext])

  return (
    <AnnouncementContext.Provider
      value={{ contestId, currentIndex, onNext, count: announcements.length }}
    >
      <div className="group relative my-8 flex h-[180px] cursor-pointer select-none w-full rounded-lg shadow-sm">
        {announcements.map((announcement, index) => (
          <AnnouncementCard announcement={announcement} index={index} />
        ))}
        {isAdmin && <AnnouncementModal />}
      </div>
    </AnnouncementContext.Provider>
  )
}

export type AnnouncementContextValue = {
  contestId: number | undefined
  currentIndex: number
  count: number
  onNext: () => void
}
const AnnouncementContext = createContext<AnnouncementContextValue>(
  {} as AnnouncementContextValue
)
export const useAnnouncementContext = () => useContext(AnnouncementContext)

export type AnnouncementCardProps = {
  announcement: AnnouncementSchema
  index: number
}

const AnnouncementCard = ({ announcement, index }: AnnouncementCardProps) => {
  const { count, currentIndex, onNext } = useAnnouncementContext()
  const value = useMemo(
    () => JSON.parse(announcement.value),
    [announcement.value]
  )
  return (
    <motion.div
      key={announcement.id}
      variants={{
        show: { y: 0, transition: { duration: 0.5 } },
        hidden: { y: -HEIGHT * 1.5, transition: { duration: 0.5 } },
      }}
      className="absolute flex h-[180px] max-h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background text-center"
      style={{ zIndex: count - index }}
      animate={index >= currentIndex ? 'show' : 'hidden'}
      onClick={onNext}
    >
      <ReadonlyEditor value={value} />
    </motion.div>
  )
}
