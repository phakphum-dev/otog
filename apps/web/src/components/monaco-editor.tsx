import { useEffect, useState } from 'react'

import MonacoReactEditor, { loader } from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'

import { Language } from '../enums'
import { environment } from '../env'

if (environment.OFFLINE_MODE) {
  loader.config({
    paths: {
      vs: '/vs',
    },
  })
}

interface MonacoEditorProps {
  language?: keyof typeof Language
  defaultValue?: string | null
  onChange?: (value: string) => void
  height?: string
}
export function MonacoEditor(props: MonacoEditorProps) {
  const { resolvedTheme } = useTheme()
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>()
  useEffect(() => {
    if (!editor) return
    props.onChange?.(editor.getValue())
    editor.onDidChangeModelContent(() => {
      props.onChange?.(editor.getValue())
    })
  }, [editor])
  return (
    <div role="application" aria-label="Code Editor">
      <MonacoReactEditor
        className="overflow-hidden rounded-md border"
        height={props.height ?? '600px'}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
        defaultValue={props.defaultValue ?? DEFAULT_SOURCE_CODE}
        language={props.language ?? 'cpp'}
        onMount={(editor) => {
          setEditor(editor)
        }}
      />
    </div>
  )
}

export const DEFAULT_SOURCE_CODE = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`
