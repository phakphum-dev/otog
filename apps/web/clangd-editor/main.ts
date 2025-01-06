export async function main({ code, theme }: { code: string; theme: string }) {
  // Add this preload script because `monaco-editor-wrapper/vscode/locale`
  // needs to be loaded before **ANY** import of `monaco-editor` stuff.
  // Assure that `main.ts` is imported after locale loader initialized.
  const { initLocalLoader } = await import(
    'monaco-editor-wrapper/vscode/locale'
  )
  await initLocalLoader()

  const { createEditor, createUserConfig } = await import('./editor')
  const { createServer } = await import('./server')

  if (!globalThis.crossOriginIsolated) {
    document.body.innerHTML =
      'This page requires cross-origin isolation to work properly. You may forget to set server\'s COOP/COEP headers. If you are using this page as an <iframe>, you should also pass <code>allow="cross-origin"</code> to the <code>iframe</code> element.'
    throw new Error('Cross-origin isolation is not enabled')
  }

  const serverWorker: Worker = await createServer()

  const userConfig = await createUserConfig(code, serverWorker, theme)

  const wrapperInstance = await createEditor(
    document.getElementById('editor'),
    userConfig
  )
  return wrapperInstance
}
