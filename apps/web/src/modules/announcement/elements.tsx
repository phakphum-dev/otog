import { ReactElement, ReactNode } from 'react'

import { BaseEditor, Editor, Element as SlateElement, Transforms } from 'slate'
import { HistoryEditor } from 'slate-history'
import {
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  RenderPlaceholderProps,
  useSlate,
} from 'slate-react'

import { Button, Link } from '@otog/ui'

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

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
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
    children = <code className="bg-secondary rounded">{children}</code>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  return <span {...attributes}>{children}</span>
}

export const Element = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  switch (element.type) {
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
    case 'block-quote':
      return (
        <h3 className="border-l-2 border-gray-300 pl-2.5" {...attributes}>
          {children}
        </h3>
      )
    case 'bulleted-list':
      return (
        <ul className="list-disc" {...attributes}>
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol className="list-decimal" {...attributes}>
          {children}
        </ol>
      )
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes}>{children}</p>
  }
}

export const Placeholder = (props: RenderPlaceholderProps) => {
  return (
    <div
      {...props}
      style={{ ...props.attributes.style, top: '50%' }}
      className="-translate-y-1/2"
    />
  )
}

export const toggleMark = (editor: Editor, format: string) => {
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

export const MarkButton = ({ format, icon, className }: MarkButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      className={className}
      variant="outline"
      size="icon"
      data-active={isMarkActive(editor, format)}
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
  icon: ReactNode
  className?: string
}

export const BlockButton = ({ format, icon, className }: BlockButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      className={className}
      variant="outline"
      size="icon"
      data-active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      aria-label={format}
    >
      {icon}
    </Button>
  )
}
