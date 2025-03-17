import { useMemo } from 'react'

import { Descendant, createEditor } from 'slate'
import { Editable, Slate, withReact } from 'slate-react'

import { HEIGHT } from './constants'
import { Element, Leaf } from './elements'

interface ReadonlyEditorProps {
  value: Descendant[]
  height?: 'auto' | number
}
export const ReadonlyEditor = ({
  value,
  height = HEIGHT,
}: ReadonlyEditorProps) => {
  const editor = useMemo(() => withReact(createEditor()), [])
  editor.children = value
  return (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    <Slate editor={editor} initialValue={value} onChange={() => {}}>
      <Editable
        className="outline-none overflow-hidden text-center flex flex-col justify-center gap-2 whitespace-pre-wrap break-words"
        style={{
          minHeight: height,
          maxHeight: height,
        }}
        readOnly
        renderElement={Element}
        renderLeaf={Leaf}
      />
    </Slate>
  )
}
