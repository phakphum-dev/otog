import { KeyboardEvent, ReactElement, useMemo } from 'react'
import { toast } from 'react-hot-toast'

import { EyeIcon, EyeSlashIcon, PencilIcon } from '@heroicons/react/16/solid'
import produce from 'immer'
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

import { Button, Link } from '@otog/ui'

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
  announcement: Announcement
  onClose: () => void
}

export const AnnouncementEditor = ({
  announcement,
  onClose,
}: AnnouncementEditorProps) => {
  const { mutate } = useAnnouncements()

  const onChange = (value: Descendant[]) => {
    mutate(
      produce((announcements) => {
        const ann: Announcement = announcements.find(
          (a: Announcement) => a.id === announcement.id
        )
        ann.value = value
      }),
      false
    )
  }
  const updateAnnouncementMutaion = useMutation(updateAnnouncement)
  const onSave = async () => {
    try {
      await updateAnnouncementMutaion(announcement.id, announcement)
      onClose()
      toast.success('อัปเดตประกาศแล้ว')
    } catch (e) {
      onErrorToast(e)
    }
  }

  const deleteAnnouncementMutation = useMutation(deleteAnnouncemet)
  const confirm = useConfirmModal()
  const deleteIndex = async () => {
    confirm({
      title: `ยืนยันลบการประกาศ`,
      subtitle: `คุณต้องการที่จะลบประกาศ #${announcement.id} ใช่หรือไม่ ?`,
      submitText: 'ยืนยัน',
      cancleText: 'ยกเลิก',
      onSubmit: async () => {
        try {
          await deleteAnnouncementMutation(announcement.id)
        } finally {
          await mutate()
        }
      },
    })
  }

  const editor = useMemo(() => withReact(withHistory(createEditor())), [])
  editor.children = announcement.value
  const handleHotkey = (event: KeyboardEvent<HTMLDivElement>) => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey]
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
      <Slate
        editor={editor}
        initialValue={announcement.value}
        onChange={onChange}
      >
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
            <Button
              colorScheme="red"
              variant="ghost"
              size="sm"
              onClick={deleteIndex}
            >
              ลบ
            </Button>
            <Button colorScheme="green" onClick={onSave} size="sm">
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

export const AnnouncementEdit = ({
  announcement,
}: {
  announcement: Announcement
}) => {
  const { isOpen: isEditing, onClose, onOpen: onEdit } = useDisclosure()

  const { mutate } = useAnnouncements()
  const toggleAnnouncementMutation = useMutation(toggleAnnouncement)
  const toggleShow = async () => {
    try {
      mutate(
        produce((announcements) => {
          const ann: Announcement = announcements.find(
            (a: Announcement) => a.id === announcement.id
          )
          ann.show = !announcement.show
        }),
        false
      )
      const { show: newShow } = await toggleAnnouncementMutation(
        announcement.id,
        !announcement.show
      )
      if (newShow) {
        toast.success('ประกาศสำเร็จ')
      } else {
        toast.success('นำประกาศออกแล้ว')
      }
    } catch (e) {
      // onErrorToast(e)
    }
  }

  return isEditing ? (
    <AnnouncementEditor
      announcement={announcement}
      onClose={onClose}
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
        <ReadonlyEditor value={announcement.value} />
      </div>
      <Button className="absolute right-0 top-1" size="sm" onClick={toggleShow}>
        {announcement.show ? <EyeIcon /> : <EyeSlashIcon />}
      </Button>
      <div className="absolute right-10 top-1">
        <Button size="icom" onClick={onEdit}>
          <PencilIcon />
        </Button>
      </div>
    </div>
  )
}
