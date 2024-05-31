import { useEffect } from 'react'

import Script from 'next/script'

export const ClangdEditor = () => {
  useEffect(() => {
    import('./preload')
  }, [])
  return (
    <div>
      <Script src="/coi-sw.js" />
      <div id="editor" className="h-[800px]">
        <div className="loader" />
      </div>
      <div id="status" />
    </div>
  )
}
