import { useState } from 'react'

import { PlusIcon } from '@heroicons/react/16/solid'
import { PencilIcon } from '@heroicons/react/24/solid'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@otog/ui'

import { keyAnnouncement, queryAnnouncement } from '../../api/query'
import { useAnnouncementContext } from './carousel'
import { AnnouncementEdit } from './editor'
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
        <Button onClick={onCreate} variant="secondary" className="ml-auto">
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
