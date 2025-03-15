import { createQueryKeys } from '@lukemorales/query-key-factory'
import { AppRouter, isAppRoute } from '@ts-rest/core'
import { initQueryClient } from '@ts-rest/react-query'

import {
  announcementRouter,
  appRouter,
  authRouter,
  bookshelfRouter,
  chatRouter,
  contestRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { getAvatarUrl } from '../firebase/get-avatar-url'
import { clientArgs } from './browser'
import {
  DynamicKey,
  KeyTuple,
  QueryFactorySchema,
  QueryKeyArgs,
  RouteFactoryOutput,
  RouteFactorySchema,
  getQueryFn,
  getQueryKey,
} from './lib'

const createQueryKey = <TName extends string, TAppRouter extends AppRouter>(
  name: TName,
  router: TAppRouter
) => {
  const schema: QueryFactorySchema = Object.fromEntries(
    Object.entries(router)
      .map(([key, subRouter]) => {
        if (!isAppRoute(subRouter)) {
          return null
        }
        if (subRouter.method !== 'GET') {
          return null
        }
        return [
          key,
          (args: QueryKeyArgs<typeof subRouter, typeof clientArgs>) => ({
            queryKey: getQueryKey(subRouter, args) as KeyTuple,
            queryFn: getQueryFn(subRouter, clientArgs, args as any),
          }),
        ] satisfies [string, DynamicKey]
      })
      .filter((entry) => entry !== null)
  )
  const key = createQueryKeys(name, schema) as RouteFactoryOutput<
    TName,
    RouteFactorySchema<TAppRouter, typeof clientArgs>
  >
  return key
}

export const appQuery = initQueryClient(appRouter, clientArgs)
export const authQuery = initQueryClient(authRouter, clientArgs)
export const userQuery = initQueryClient(userRouter, clientArgs)
export const chatQuery = initQueryClient(chatRouter, clientArgs)
export const problemQuery = initQueryClient(problemRouter, clientArgs)
export const contestQuery = initQueryClient(contestRouter, clientArgs)
export const submissionQuery = initQueryClient(submissionRouter, clientArgs)
export const announcementQuery = initQueryClient(announcementRouter, clientArgs)
export const bookshelfQuery = initQueryClient(bookshelfRouter, clientArgs)

export const appKey = createQueryKey('app', appRouter)
export const authKey = createQueryKey('auth', authRouter)
export const userKey = createQueryKey('user', userRouter)
export const chatKey = createQueryKey('chat', chatRouter)
export const problemKey = createQueryKey('problem', problemRouter)
export const contestKey = createQueryKey('contest', contestRouter)
export const submissionKey = createQueryKey('submission', submissionRouter)
export const announcementKey = createQueryKey(
  'announcement',
  announcementRouter
)
export const bookshelfKey = createQueryKey('bookshelf', bookshelfRouter)
export const avatarKey = createQueryKeys('avatar', {
  getUrl: (params: { userId: number; size: 'default' | 'small' }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: params.size }),
  }),
})
