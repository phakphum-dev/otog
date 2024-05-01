import { useEffect, useMemo } from 'react'

import { initQueryClient } from '@ts-rest/react-query'
import { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import wretch, { FetchLike } from 'wretch'
import FormDataAddon from 'wretch/addons/formData'
import { createStore } from 'zustand'

import { LoginResponse } from '@otog/contract'
import { router } from '@otog/contract'

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
export const useHydrateSession = (serverSession: Session) => {
  const { update, data: session, status } = useSession()
  useMemo(() => {
    if (serverSession !== undefined) {
      const accessToken = serverSession && serverSession.accessToken
      if (session?.accessToken !== accessToken) {
        setAccessToken(accessToken)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSession])
  // this will run after revalidating session
  useMemo(() => {
    if (status === 'authenticated') {
      setAccessToken(session.accessToken)
      // console.log(
      //   'token change from session changed',
      //   session?.accessToken?.at(-1)
      // )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  // call update session to the server when accessToken is updated on the client
  useEffect(() => {
    if (session === null) return
    return tokenStore.subscribe(
      ({ accessToken }, { accessToken: prevAccessToken }) => {
        if (accessToken !== prevAccessToken) {
          update({ accessToken })
          // console.log('update token to', accessToken?.at(-1))
        }
      }
    )
  }, [update, session])
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

export const query = initQueryClient(router, {
  baseUrl: '',
  baseHeaders: { 'Content-Type': 'application/json' },
  api: ({ path, method, headers, body }) => {
    return client
      .headers(headers)
      .auth(`Bearer ${getAccessToken()}`)
      .fetch(method, path, body)
      .res()
      .then(async (response) => {
        return {
          status: response.status,
          body: await response.json(),
          headers: response.headers,
        }
      })
      .catch((error) => {
        return {
          status: error.status,
          body: error.json,
          headers: error.headers,
        }
      })
  },
})
