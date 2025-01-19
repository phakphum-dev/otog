import { ClientArgs, isZodType } from '@ts-rest/core'
import FormDataAddon from 'wretch/addons/formData'
import { create } from 'zustand'

import { LoginResponse } from '@otog/contract'

import { api } from '.'
import { authMiddleware, getAccessToken, setAccessToken } from './auth'

type Resolve = (value?: unknown) => void
type Reject = (reason?: any) => void
interface RequestStore {
  queue: Array<[Resolve, Reject]>
  isRefreshing: boolean
}
const requestStore = create<RequestStore>(() => ({
  queue: [],
  isRefreshing: false,
}))
const { getState, setState } = requestStore
const isTokenRefreshing = () => {
  return getState().isRefreshing
}
const getRequestQueue = () => {
  return getState().queue
}
const queueRequest = (resolve: Resolve, reject: Reject) => {
  setState({ queue: [...getRequestQueue(), [resolve, reject]] })
}
const startRequestQueue = () => {
  setState({ isRefreshing: true })
}
const clearRequestQueue = () => {
  setState({ queue: [], isRefreshing: false })
}

const client = api
  .middlewares([authMiddleware])
  .addon(FormDataAddon)
  .catcher(401, async (_, req) => {
    if (isTokenRefreshing()) {
      // wait for token to be refreshed
      await new Promise((resolve, reject) => {
        queueRequest(resolve, reject)
      })
      return req.fetch().res()
    }
    startRequestQueue()
    await api
      .auth(`Bearer ${getAccessToken()}`)
      .get('/auth/refresh/token')
      .unauthorized((e) => {
        getRequestQueue().forEach(([, reject]) => reject(e))
        clearRequestQueue()
        throw e
      })
      .forbidden((e) => {
        getRequestQueue().forEach(([, reject]) => reject(e))
        clearRequestQueue()
        throw e
      })
      .json<LoginResponse>()
      .then((r) => setAccessToken(r.accessToken))
    getRequestQueue().forEach(([resolve]) => resolve())
    clearRequestQueue()
    return req.fetch().res()
  })

export const clientArgs: ClientArgs = {
  baseUrl: '',
  jsonQuery: true,
  validateResponse: true,
  api: async ({
    path,
    method,
    headers,
    body,
    contentType,
    rawBody,
    route,
    validateResponse,
  }) => {
    const fetcher =
      contentType === 'multipart/form-data'
        ? client.formData(rawBody as any)
        : client.body(body)
    return fetcher
      .headers(headers)
      .fetch(method, path)
      .res()
      .then(async (response) => {
        const json = await response.json()
        if (!validateResponse) {
          return {
            status: response.status,
            body: json,
            headers: response.headers,
          }
        }
        const schema = route.responses[response.status]
        if (!schema || !isZodType(schema)) {
          throw new TypeError("The route doesn't have zod parser")
        }
        const body = schema.parse(json)
        return {
          status: response.status,
          body: body,
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
}
