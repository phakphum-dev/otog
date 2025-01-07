import { KeyboardEvent, ReactNode, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  MdCode,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatUnderlined,
  MdLink,
  MdLooks3,
  MdLooks4,
  MdLooksOne,
  MdLooksTwo,
} from 'react-icons/md'

import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import isHotkey from 'is-hotkey'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, Slate, withReact } from 'slate-react'

import { AnnouncementSchema } from '@otog/contract'
import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'

import { announcementKey, announcementQuery } from '../../api/query'
import { HEIGHT } from './constants'
import {
  BlockButton,
  Element,
  Leaf,
  MarkButton,
  Placeholder,
  toggleMark,
} from './elements'
import { ReadonlyEditor } from './readonly-editor'

interface AnnouncementEditableProps {
  announcement: AnnouncementSchema
}
export const AnnouncementEditable = ({
  announcement,
}: AnnouncementEditableProps) => {
  const [isEditing, setEditing] = useState(false)
  return isEditing ? (
    <AnnouncementEditor
      announcement={announcement}
      onClose={() => setEditing(false)}
      key={announcement.id}
    />
  ) : (
    <div
      className="relative border-b py-4 last:border-b-0"
      key={announcement.id}
    >
      <div
        className="flex w-full flex-col justify-center items-center gap-2 overflow-hidden"
        style={{ height: HEIGHT }}
      >
        <ReadonlyEditor value={JSON.parse(announcement.value)} />
      </div>
      <div className="absolute flex gap-1 right-0 top-1">
        <ToggleAnnouncement announcement={announcement} />
        <DeleteAnnouncement announcementId={announcement.id} />
        <Button
          size="icon"
          variant="outline"
          onClick={() => setEditing(true)}
          title="แก้ไขประกาศ"
        >
          <PencilIcon />
        </Button>
      </div>
    </div>
  )
}

type AnnouncementEditorProps = {
  announcement: AnnouncementSchema
  onClose: () => void
}

export const AnnouncementEditor = ({
  announcement,
  onClose,
}: AnnouncementEditorProps) => {
  const [value, setValue] = useState(() => JSON.parse(announcement.value))

  const queryClient = useQueryClient()
  const onSave = async () => {
    try {
      await announcementQuery.updateAnnouncement.mutation({
        params: { announcementId: announcement.id.toString() },
        body: { ...announcement, value: JSON.stringify(value) },
      })
      queryClient.invalidateQueries({
        queryKey: announcementKey._def,
      })
      onClose()
      toast.success('บันทึกประกาศแล้ว')
    } catch (e) {
      console.error(e)
      toast.error('บันทึกประกาศไม่สำเร็จ')
    }
  }
  const editor = useMemo(() => withReact(withHistory(createEditor())), [])
  // editor.children = value
  const handleHotkey = (event: KeyboardEvent<HTMLDivElement>) => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey]!
        toggleMark(editor, mark)
      }
    }
    if (isHotkey('shift+return', event)) {
      event.preventDefault()
      editor.insertText('\n')
    }
  }
  return (
    <div className="flex flex-col gap-2 border-b py-4 last:border-b-0">
      <Slate editor={editor} initialValue={value} onChange={setValue}>
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <ButtonGroup>
              <MarkButton format="bold" icon={<MdFormatBold />} />
              <MarkButton format="italic" icon={<MdFormatItalic />} />
              <MarkButton format="underline" icon={<MdFormatUnderlined />} />
              <MarkButton format="link" icon={<MdLink />} />
              <MarkButton format="code" icon={<MdCode />} />
            </ButtonGroup>
            <ButtonGroup>
              <BlockButton format="heading-one" icon={<MdLooksOne />} />
              <BlockButton format="heading-two" icon={<MdLooksTwo />} />
              <BlockButton format="heading-three" icon={<MdLooks3 />} />
              <BlockButton format="heading-four" icon={<MdLooks4 />} />
              <BlockButton format="block-quote" icon={<MdFormatQuote />} />
              <BlockButton
                format="numbered-list"
                icon={<MdFormatListNumbered />}
              />
              <BlockButton
                format="bulleted-list"
                icon={<MdFormatListBulleted />}
              />
            </ButtonGroup>
          </div>
          <div className="flex gap-2 max-sm:ml-auto">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button variant="success" onClick={onSave} size="sm">
              บันทึก
            </Button>
          </div>
        </div>
        <Editable
          className="outline-none overflow-hidden text-center flex flex-col justify-center gap-2"
          style={{
            minHeight: HEIGHT,
            maxHeight: HEIGHT,
          }}
          placeholder="Enter announcement…"
          renderElement={Element}
          renderLeaf={Leaf}
          renderPlaceholder={Placeholder}
          onKeyDown={handleHotkey}
          autoFocus
        />
      </Slate>
    </div>
  )
}

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const ButtonGroup = ({ children }: { children: ReactNode }) => {
  return (
    <div className="inline-flex [&>:not(:last-child)]:-mr-px [&>:not(:last-child)]:rounded-r-none [&>:not(:first-child)]:rounded-l-none">
      {children}
    </div>
  )
}

const ToggleAnnouncement = ({
  announcement,
}: {
  announcement: AnnouncementSchema
}) => {
  const queryClient = useQueryClient()
  const onToggle = async () => {
    const toastId = toast.loading('กำลังอัปเดต...')
    try {
      const result = await announcementQuery.showAnnouncement.mutation({
        params: { announcementId: announcement.id.toString() },
        body: { show: !announcement.show },
      })
      if (result.status !== 200) {
        toast.error('อัปเดตประกาศไม่สำเร็จ', { id: toastId })
        return
      }
      queryClient.invalidateQueries({
        queryKey: announcementKey._def,
      })
      if (result.body.show) {
        toast.success('ประกาศสำเร็จ', { id: toastId })
      } else {
        toast.success('นำประกาศออกแล้ว', { id: toastId })
      }
    } catch (e) {
      console.error(e)
      toast.error('อัปเดตประกาศไม่สำเร็จ', { id: toastId })
    }
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={onToggle}
      title="เปิดปิดประกาศ"
    >
      {announcement.show ? <EyeIcon /> : <EyeSlashIcon />}
    </Button>
  )
}

const DeleteAnnouncement = ({ announcementId }: { announcementId: number }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const onSubmit = async () => {
    try {
      const result = await announcementQuery.deleteAnnouncement.mutation({
        params: { announcementId: announcementId.toString() },
      })
      if (result.status !== 200) {
        throw result
      }
      toast.success('ลบประกาศสำเร็จ')
      setOpen(false)
      queryClient.invalidateQueries({
        queryKey: announcementKey._def,
      })
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="ลบประกาศ">
          <TrashIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>ยืนยันลบการประกาศ</DialogTitle>
        <DialogDescription>
          คุณต้องการที่จะลบประกาศใช่หรือไม่ ?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onSubmit} variant="destructive">
            ยืนยัน
          </Button>
          <DialogClose asChild>
            <Button variant="ghost">ยกเลิก</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
