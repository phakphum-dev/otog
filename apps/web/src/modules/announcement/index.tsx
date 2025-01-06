import { useCallback, useEffect, useMemo, useState } from 'react'
import { createContext, useContext } from 'react'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

import { AnnouncementSchema } from '@otog/contract'

import { announcementKey } from '../../api/query'
import { useUserContext } from '../../context/user-context'
import { HEIGHT, INTERVAL } from './constants'
import { AnnouncementModal } from './modal'
import { ReadonlyEditor } from './readonly-editor'

export interface AnnouncementCarouselProps {
  contestId?: number
}

export const AnnouncementCarousel = ({
  contestId,
}: AnnouncementCarouselProps) => {
  const { isAdmin, isAuthenticated } = useUserContext()

  const getAnnouncements = useQuery(
    announcementKey.getAnnouncements({
      query: { show: true, contestId: contestId?.toString() },
    })
  )
  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data.body : []
  const count = announcements.length

  const [currentIndex, setIndex] = useState(0)

  const onNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % count
    setIndex(nextIndex)
  }, [count, currentIndex])

  useEffect(() => {
    if (isAuthenticated && count > 0) {
      const interval = setInterval(onNext, INTERVAL)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, currentIndex, announcements, onNext])

  return (
    <AnnouncementContext.Provider
      value={{ contestId, currentIndex, onNext, count }}
    >
      {(announcements.length > 0 || isAdmin) && (
        <section
          aria-labelledby="announcement"
          className="group relative flex h-[180px] cursor-pointer select-none w-full rounded-lg shadow-sm"
        >
          <h2 id="announcement" className="sr-only">
            ประกาศ
          </h2>
          {announcements.map((announcement, index) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              index={index}
            />
          ))}
          {isAdmin && <AnnouncementModal />}
        </section>
      )}
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
      className="absolute flex w-full items-center justify-center overflow-hidden rounded-lg border bg-background"
      style={{ zIndex: count - index, minHeight: HEIGHT, maxHeight: HEIGHT }}
      animate={index >= currentIndex ? 'show' : 'hidden'}
      onClick={onNext}
    >
      <ReadonlyEditor value={value} />
    </motion.div>
  )
}
