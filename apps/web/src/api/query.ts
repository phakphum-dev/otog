import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  appRouter,
  authRouter,
  chatRouter,
  contestRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { getAvatarUrl } from '../firebase/get-avatar-url'
import { createQueryAndKey } from './lib'

export const [appQuery, appKey] = createQueryAndKey('app', appRouter)
export const [authQuery, authKey] = createQueryAndKey('auth', authRouter)
export const [userQuery, userKey] = createQueryAndKey('user', userRouter)
export const [chatQuery, chatKey] = createQueryAndKey('chat', chatRouter)
export const [problemQuery, problemKey] = createQueryAndKey(
  'problem',
  problemRouter
)
export const [contestQuery, contestKey] = createQueryAndKey(
  'contest',
  contestRouter
)
export const [submissionQuery, submissionKey] = createQueryAndKey(
  'submission',
  submissionRouter
)
export const [announcementQuery, announcementKey] = createQueryAndKey(
  'announcement',
  announcementRouter
)
export const avatarKey = createQueryKeys('avatar', {
  getUrl: (params: { userId: number; size: 'default' | 'small' }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: params.size }),
  }),
})
