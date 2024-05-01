import { KeyboardEvent, ReactElement, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
import { useQueryClient } from '@tanstack/react-query'
import isHotkey from 'is-hotkey'
import {
  BaseEditor,
  Descendant,
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
} from 'slate'
import { HistoryEditor, withHistory } from 'slate-history'
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from 'slate-react'

import { AnnouncementSchema } from '@otog/contract'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Link,
} from '@otog/ui'

import { query } from '../../api'
import { key } from '../../query/announcement'
import { HEIGHT } from './constants'

type CustomText = {
  text: string
  link?: boolean
  bold?: boolean
  code?: boolean
  italic?: boolean
  underline?: boolean
}
type CustomElement = {
  type:
    | 'paragraph'
    | 'block-quote'
    | 'bulleted-list'
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'heading-four'
    | 'list-item'
    | 'numbered-list'
  children: CustomText[]
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.link) {
    children = (
      <Link href={leaf.text} isExternal>
        {children}
      </Link>
    )
  }
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.code) {
    children = (
      <code className="bg-transparent text-inherit dark:bg-alpha-black-300">
        {children}
      </code>
    )
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  return <span {...attributes}>{children}</span>
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'block-quote':
      return (
        <h3 className="border-l-2 border-gray-300 pl-2.5" {...attributes}>
          {children}
        </h3>
      )
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return (
        <h3 className="font-heading text-2xl md:text-4xl" {...attributes}>
          {children}
        </h3>
      )
    case 'heading-two':
      return (
        <h3 className="font-heading text-xl md:text-3xl" {...attributes}>
          {children}
        </h3>
      )
    case 'heading-three':
      return (
        <h3 className="font-heading text-lg md:text-2xl" {...attributes}>
          {children}
        </h3>
      )
    case 'heading-four':
      return (
        <h3 className="font-heading text-base md:text-xl" {...attributes}>
          {children}
        </h3>
      )
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    default:
      return <p {...attributes}>{children}</p>
  }
}

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const toggleMark = (editor: Editor, format: string) => {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as Record<string, boolean>
  return marks ? marks[format] === true : false
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: (n) => SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    split: true,
  })
  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  })
  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) => SlateElement.isElement(n) && n.type === format,
    })
  )
  return !!match
}

interface MarkButtonProps {
  format: string
  icon: ReactElement
  className?: string
}

const MarkButton = ({ format, icon, className }: MarkButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      className={className}
      variant="outline"
      size="icon"
      isActive={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
      aria-label={format}
    >
      {icon}
    </Button>
  )
}

interface BlockButtonProps {
  format: CustomElement['type']
  icon: ReactElement
  className?: string
}

const BlockButton = ({ format, icon, className }: BlockButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      className={className}
      variant="outline"
      size="icon"
      isActive={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      icon={icon}
      aria-label={format}
    />
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
      await query.announcement.updateAnnouncement.mutation({
        params: { announcementId: announcement.id.toString() },
        body: { ...announcement, value: JSON.stringify(value) },
      })
      queryClient.invalidateQueries({ queryKey: key.announcement._def })
      onClose()
      toast.success('บันทึกประกาศแล้ว')
    } catch (e) {
      console.error(e)
      toast.error('บันทึกประกาศไม่สำเร็จ')
    }
  }
  const editor = useMemo(() => withReact(withHistory(createEditor())), [])
  editor.children = value
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
            {/* <ButtonGroup isAttached>
              <MarkButton format="bold" icon={<FaBold />} />
              <MarkButton format="italic" icon={<FaItalic />} />
              <MarkButton format="underline" icon={<FaUnderline />} />
              <MarkButton format="link" icon={<FaLink />} />
              <MarkButton format="code" icon={<FaCode />} />
            </ButtonGroup>
            <ButtonGroup isAttached>
              <BlockButton format="heading-one" icon={<MdLooksOne />} />
              <BlockButton format="heading-two" icon={<MdLooksTwo />} />
              <BlockButton format="heading-three" icon={<MdLooks3 />} />
              <BlockButton format="heading-four" icon={<MdLooks4 />} />
              <BlockButton format="block-quote" icon={<FaQuoteLeft />} />
            <BlockButton format="numbered-list" icon={<FaListOl />} />
          <BlockButton format="bulleted-list" icon={<FaListUl />} />
            </ButtonGroup> */}
          </div>
          <div className="flex gap-2 max-sm:ml-auto">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button onClick={onSave} size="sm">
              บันทึก
            </Button>
          </div>
        </div>
        <div
          className="flex w-full flex-col justify-center gap-2 overflow-hidden text-center"
          style={{ height: HEIGHT }}
        >
          <Editable
            className="outline-none"
            placeholder="Enter announcement…"
            renderElement={Element}
            renderLeaf={Leaf}
            onKeyDown={handleHotkey}
            autoFocus
          />
        </div>
      </Slate>
    </div>
  )
}

interface ReadonlyEditorProps {
  value: Descendant[]
}
export const ReadonlyEditor = ({ value }: ReadonlyEditorProps) => {
  const editor = useMemo(() => withReact(createEditor()), [])
  editor.children = value
  return (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    <Slate editor={editor} initialValue={value} onChange={() => {}}>
      <Editable readOnly renderElement={Element} renderLeaf={Leaf} />
    </Slate>
  )
}

interface AnnouncementEditProps {
  announcement: AnnouncementSchema
}
export const AnnouncementEdit = ({ announcement }: AnnouncementEditProps) => {
  const [isEditing, setEditing] = useState(false)
  console.log(isEditing)
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
        className="flex w-full flex-col justify-center gap-2 overflow-hidden text-center"
        style={{ height: HEIGHT }}
      >
        <ReadonlyEditor value={JSON.parse(announcement.value)} />
      </div>
      <div className="absolute flex gap-1 right-0 top-1">
        <ToggleAnnouncement announcement={announcement} />
        <DeleteAnnouncement announcementId={announcement.id} />
        <Button size="icon" variant="outline" onClick={() => setEditing(true)}>
          <PencilIcon className="size-4" />
        </Button>
      </div>
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
      const result = await query.announcement.showAnnouncement.mutation({
        params: { announcementId: announcement.id.toString() },
        body: { show: !announcement.show },
      })
      if (result.status !== 200) {
        toast.error('อัปเดตประกาศไม่สำเร็จ', { id: toastId })
        return
      }
      queryClient.invalidateQueries({
        queryKey: key.announcement._def,
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
    <Button size="icon" variant="outline" onClick={onToggle}>
      {announcement.show ? (
        <EyeIcon className="size-4" />
      ) : (
        <EyeSlashIcon className="size-4" />
      )}
    </Button>
  )
}

const DeleteAnnouncement = ({ announcementId }: { announcementId: number }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const onSubmit = async () => {
    try {
      const result = await query.announcement.deleteAnnouncement.mutation({
        params: { announcementId: announcementId.toString() },
      })
      if (result.status !== 200) {
        throw result
      }
      toast.success('ลบประกาศสำเร็จ')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: key.announcement._def })
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <TrashIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>ยืนยันลบการประกาศ</DialogTitle>
        <DialogDescription>
          คุณต้องการที่จะลบประกาศใช่หรือไม่ ?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onSubmit}>ยืนยัน</Button>
          <DialogClose asChild>
            <Button variant="ghost">ยกเลิก</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
