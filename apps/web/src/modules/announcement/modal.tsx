import { useState } from 'react'

import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@otog/ui'

import { useAnnouncementContext } from '.'
import { keyAnnouncement, queryAnnouncement } from '../../api/query'
import { AnnouncementEditable } from './editor'
import { createEmptyAnnouncement } from './utils'

export const AnnouncementModal = () => {
  const [open, setOpen] = useState(false)
  const getAnnouncements = useQuery(keyAnnouncement.all())
  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data.body : []

  const queryClient = useQueryClient()
  const { contestId } = useAnnouncementContext()
  const onCreate = async () => {
    try {
      await queryAnnouncement.createAnnouncement.mutation({
        body: { value: JSON.stringify(createEmptyAnnouncement()) },
        query: { contestId: contestId?.toString() },
      })
      queryClient.invalidateQueries({
        queryKey: keyAnnouncement.all._def,
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
          title="Edit announcements"
          size="icon"
          variant="ghost"
        >
          {announcements.length ? <PencilIcon /> : <PlusIcon />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>ประกาศ</DialogHeader>
        <Button onClick={onCreate} variant="secondary" className="ml-auto">
          <PlusIcon />
          เพิ่มประกาศ
        </Button>
        {announcements?.map((announcement) => (
          <AnnouncementEditable
            announcement={announcement}
            key={announcement.id}
          />
        ))}
      </DialogContent>
    </Dialog>
  )
}
