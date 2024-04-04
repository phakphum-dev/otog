import { PlusIcon } from '@heroicons/react/16/solid'
import { produce } from 'immer'

import { Button, Dialog, DialogContent, DialogHeader } from '@otog/ui'

import { query } from '../../api'
import { AnnouncementEdit } from './editor'
import { useAnnouncementContext } from './provier'
import { createEmptyAnnouncement } from './utils'

interface AnnouncementModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}
export const AnnouncementModal = (props: AnnouncementModalProps) => {
  const { open, setOpen } = props
  const getAnnouncements = query.announcement.getAnnouncements.useQuery(
    ['announcement.getAnnouncements'],
    {},
    { suspense: true }
  )
  const announcements =
    getAnnouncements.data?.status === 200 ? getAnnouncements.data.body : []

  const createAnnouncement = query.announcement.createAnnouncement.useMutation()
  const { contestId } = useAnnouncementContext()
  const insert = async () => {
    try {
      const announcementData = await createAnnouncement.mutateAsync({
        body: { value: createEmptyAnnouncement() },
      })

      produce((announcements) => {
        announcements.unshift(announcementData)
      })
    } catch (e) {
      // onErrorToast(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} size="3xl">
      <DialogContent>
        <DialogHeader>ประกาศ</DialogHeader>
        <Button onClick={insert}>
          <PlusIcon />
          เพิ่มประกาศ
        </Button>
        {announcements?.map((announcement) => (
          <AnnouncementEdit announcement={announcement} key={announcement.id} />
        ))}
      </DialogContent>
    </Dialog>
  )
}
