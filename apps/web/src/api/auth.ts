import Cookie from 'js-cookie'
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
    clearAccessToken()
    return
  }
  // console.info('setAccessToken on browser', token)
  Cookie.set(ACCESS_TOKEN, token, { secure, path: '/', sameSite: 'lax' })
}
export const clearAccessToken = () => {
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
