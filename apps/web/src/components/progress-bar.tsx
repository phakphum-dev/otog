import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import NProgress from 'nprogress'

const TIMEOUT_DELAY = 100
const UPDATE_FREQUENCY = 400

const ProgressBar: React.FC = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const setOnLoading = () => {
      setLoading(true)
    }
    const setNotLoading = () => {
      setLoading(false)
    }

    router.events.on('routeChangeStart', setOnLoading)
    router.events.on('routeChangeComplete', setNotLoading)
    router.events.on('routeChangeError', setNotLoading)

    return () => {
      router.events.off('routeChangeStart', setOnLoading)
      router.events.off('routeChangeComplete', setNotLoading)
      router.events.off('routeChangeError', setNotLoading)
    }
  }, [router])

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => NProgress.start(), TIMEOUT_DELAY)
      const interval = setInterval(() => {
        NProgress.inc()
      }, UPDATE_FREQUENCY)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        NProgress.done()
      }
    }
  }, [loading])

  return null
}

export default ProgressBar
