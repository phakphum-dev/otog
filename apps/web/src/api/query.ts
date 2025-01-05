import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  contestRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { getAvatarUrl } from '../firebase/get-avatar-url'
import { createQueryAndKey } from './lib'

export const [queryAnnouncement, keyAnnouncement] = createQueryAndKey(
  'announcement',
  announcementRouter
)
export const [queryProblem, keyProblem] = createQueryAndKey(
  'problem',
  problemRouter
)
export const [querySubmission, keySubmission] = createQueryAndKey(
  'submission',
  submissionRouter
)
export const [queryUser, keyUser] = createQueryAndKey('user', userRouter)
export const [queryContest, keyContest] = createQueryAndKey(
  'contest',
  contestRouter
)

export const keyAvatar = createQueryKeys('avatar', {
  getUrl: (params: { userId: number; size: 'default' | 'small' }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: params.size }),
  }),
})
