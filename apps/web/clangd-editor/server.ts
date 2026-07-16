import { setClangdStatus } from './ui'

export async function createServer() {
  let clangdResolve = () => {}
  const clangdReady = new Promise<void>((r) => (clangdResolve = r))
  const worker = new Worker(new URL('./main.worker.ts', import.meta.url), {
    type: 'module',
    name: 'Server Worker',
  })
  const readyListener = (e: MessageEvent) => {
    switch (e.data?.type) {
      case 'ready': {
        console.log('ready')
        clangdResolve()
        worker.removeEventListener('message', readyListener)
        setClangdStatus('indeterminate')
        break
      }
      case 'progress': {
        setClangdStatus(e.data.value, e.data.max)
        break
      }
      default:
        console.log(e.data)
        break
    }
  }
  worker.onmessage = readyListener
  await clangdReady
  return worker
}
