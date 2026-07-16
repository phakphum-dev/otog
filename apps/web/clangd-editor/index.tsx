import { ReactNode, forwardRef, useEffect, useState } from 'react'

import { editor } from 'monaco-editor'
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import Script from 'next/script'

export interface ClangdEditorProps {
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
  action?: ReactNode
  className?: string
  defaultValue: string
  theme?: 'light' | 'dark'
}
export const ClangdEditor = forwardRef<HTMLDivElement, ClangdEditorProps>(
  (props, ref) => {
    const [wrapperInstance, setWrapperInstance] =
      useState<MonacoEditorLanguageClientWrapper | null>(null)

    useEffect(() => {
      async function loadScript() {
        const { main } = await import('./main')
        const wrapperInstance = await main({
          code: props.defaultValue,
          theme: getTheme(props),
        })
        if (wrapperInstance) setWrapperInstance(wrapperInstance)
      }
      loadScript()
    }, [])

    useEffect(() => {
      if (!wrapperInstance) return
      props.onMount?.(wrapperInstance.getEditor()!)
      return () => {
        wrapperInstance.dispose()
      }
    }, [wrapperInstance])

    useEffect(() => {
      async function updateTheme() {
        if (!wrapperInstance) return
        const editor = wrapperInstance.getMonacoEditorApp()
        if (!editor) return
        const userConfig = JSON.parse(await editor.getUserConfiguration())
        userConfig['workbench.colorTheme'] =
          props.theme === 'dark'
            ? 'Default Dark Modern'
            : 'Default Light Modern'
        editor.updateUserConfiguration(JSON.stringify(userConfig))
      }
      updateTheme()
    }, [wrapperInstance, props.theme])

    return (
      <>
        <Script src="/coi-sw.js" />
        <div id="editor" ref={ref} className={props.className}>
          <div className="loader flex flex-col gap-2 items-center justify-center w-full h-full">
            Loading...
            <div className="rounded-full h-2 bg-muted w-40 overflow-hidden animate-pulse">
              <div
                id="status"
                className="bg-muted-foreground h-2 w-[calc(var(--progress)*100%)] [--progress:0]"
              />
            </div>
          </div>
        </div>
      </>
    )
  }
)

function getTheme({ theme }: { theme?: 'light' | 'dark' }) {
  return theme === 'light' ? 'Default Light Modern' : 'Default Dark Modern'
}

ClangdEditor.displayName = 'ClangdEditor'
