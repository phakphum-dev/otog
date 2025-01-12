import { useEffect } from 'react'

import Cookie from 'js-cookie'
import { useSession } from 'next-auth/react'
import { FetchLike } from 'wretch'

import { secure } from '.'
import { isServer } from '../env'

export const ACCESS_TOKEN = 'accessToken'

export const getAccessToken = (): string | null => {
  if (isServer) {
    throw new Error('Cannot get accessToken on server')
  }
  return Cookie.get(ACCESS_TOKEN) || null
}
export const setAccessToken = (token: string | null) => {
  if (isServer) {
    throw new Error('Cannot set accessToken on server')
  }
  if (token === null) {
    removeAccessToken()
    return
  }
  // console.info('setAccessToken on browser', token)
  Cookie.set(ACCESS_TOKEN, token, { secure, path: '/', sameSite: 'lax' })
}
export const removeAccessToken = () => {
  if (isServer) {
    throw new Error('Cannot remove accessToken on server')
  }
  Cookie.remove(ACCESS_TOKEN)
}

export const authMiddleware =
  (next: FetchLike): FetchLike =>
  (url, opts) => {
    const token = getAccessToken()
    if (token) {
      return next(url, {
        ...opts,
        headers: {
          ...(opts.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      })
    }
    return next(url, opts)
  }

export const useSyncAccessToken = () => {
  const { update, data: session } = useSession()
  useEffect(() => {
    if (session === null) return
    let lastCookie = Cookie.get(ACCESS_TOKEN)
    const interval = setInterval(() => {
      let cookie = Cookie.get(ACCESS_TOKEN)
      if (cookie !== lastCookie) {
        update({ accessToken: cookie })
      }
      lastCookie = cookie
    }, 100)
    return () => clearInterval(interval)
  }, [update, session])
}
