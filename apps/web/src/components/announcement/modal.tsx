import { useState } from 'react'

import { PlusIcon } from '@heroicons/react/16/solid'
import { PencilIcon } from '@heroicons/react/24/solid'
import { produce } from 'immer'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@otog/ui'

import { query } from '../../api'
import { useAnnouncementContext } from './carousel'
import { AnnouncementEdit } from './editor'
import { createEmptyAnnouncement } from './utils'

export const AnnouncementModal = () => {
  const [open, setOpen] = useState(false)
  const getAnnouncements = query.announcement.getAnnouncements.useQuery(
    ['announcement.getAnnouncements'],
    {}
  )
  const announcements = getAnnouncements?.data?.body ?? []

  const createAnnouncement = query.announcement.createAnnouncement.useMutation()
  const { contestId } = useAnnouncementContext()
  const insert = async () => {
    try {
      const announcementData = await createAnnouncement.mutateAsync({
        body: { value: JSON.stringify(createEmptyAnnouncement()) },
        query: { contestId: contestId?.toString() },
      })

      produce((announcements) => {
        announcements.unshift(announcementData)
      })
    } catch (e) {
      // onErrorToast(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="absolute right-0 top-0 z-10"
          aria-label="edit-announcements"
          size="icon"
          variant="ghost"
        >
          {announcements.length ? (
            <PencilIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>ประกาศ</DialogHeader>
        <Button onClick={insert}>
          <PlusIcon className="size-4" />
          เพิ่มประกาศ
        </Button>
        {announcements?.map((announcement) => (
          <AnnouncementEdit announcement={announcement} key={announcement.id} />
        ))}
      </DialogContent>
    </Dialog>
  )
}
