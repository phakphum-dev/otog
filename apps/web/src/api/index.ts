import wretch, { FetchLike } from 'wretch'
import FormDataAddon from 'wretch/addons/formData'
import { createStore } from 'zustand'

import { LoginResponse } from '@otog/contract'

import { environment, isServer } from '../env'

export const secure =
  !environment.OFFLINE_MODE && environment.NODE_ENV === 'production'

export const tokenStore = createStore<{ accessToken: string | null }>(() => ({
  accessToken: null,
}))
const { getState, setState } = tokenStore
export const getAccessToken = () => {
  return getState().accessToken
}
export const setAccessToken = (token: string | null) => {
  setState({ accessToken: token })
}
export const removeAccessToken = () => {
  setState({ accessToken: null })
}

const authMiddleware =
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

export const api = wretch(
  isServer ? environment.API_HOST_SSR : environment.API_HOST,
  {
    secure,
    mode: 'cors',
    credentials: 'include',
  }
)

type Resolve = (value?: unknown) => void
type Reject = (reason?: any) => void
let waiting: null | Array<[Resolve, Reject]> = null

export const client = api
  .middlewares([authMiddleware])
  .addon(FormDataAddon)
  .catcher(401, async (_, req) => {
    if (Array.isArray(waiting)) {
      await new Promise((resolve, reject) => {
        waiting!.push([resolve, reject])
      })
    } else {
      waiting = []
      await api
        .auth(`Bearer ${getAccessToken()}`)
        .get('auth/refresh/token')
        .unauthorized((e) => {
          waiting?.forEach(([, reject]) => reject(e))
          waiting = null
          throw e
        })
        .forbidden((e) => {
          waiting?.forEach(([, reject]) => reject(e))
          waiting = null
          throw e
        })
        .json<LoginResponse>()
        .then((r) => setAccessToken(r.accessToken))
      waiting.forEach(([resolve]) => resolve())
      waiting = null
    }
    return req.fetch().json()
  })
