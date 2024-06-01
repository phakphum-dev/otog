import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { createQueryClient } from '.'
import { getAvatarUrl } from '../firebase/getAvatarUrl'

export const queryAnnouncement = createQueryClient(announcementRouter)
export const keyAnnouncement = createQueryKeys('announcement', {
  all: (contestId?: number) => ({
    queryKey: [contestId],
    queryFn: () =>
      queryAnnouncement.getAnnouncements.query({
        query: { contestId: contestId?.toString() },
      }),
  }),
  shown: (contestId?: number) => ({
    queryKey: [contestId],
    queryFn: () =>
      queryAnnouncement.getAnnouncements.query({
        query: {
          show: true,
          contestId: contestId?.toString(),
        },
      }),
  }),
})

export const queryProblem = createQueryClient(problemRouter)
export const keyProblem = createQueryKeys('problem', {
  table: () => ({
    queryKey: ['table'],
    queryFn: () => queryProblem.getProblemTable.query({}),
  }),
  passedUsers: (params: { problemId: number }) => ({
    queryKey: ['passedUsers', params],
    queryFn: () =>
      queryProblem.getPassedUsers.query({
        params: { problemId: params.problemId.toString() },
      }),
  }),
})

export const querySubmission = createQueryClient(submissionRouter)
export const keySubmission = createQueryKeys('submission', {
  table: () => ({
    queryKey: ['table'],
    queryFn: () => querySubmission.getSubmissions.query(),
  }),
  getOne: (params: { submissionId: number }) => ({
    queryKey: ['getOne', params],
    queryFn: () =>
      querySubmission.getSubmissionWithSourceCode.query({
        params: { submissionId: params.submissionId.toString() },
      }),
  }),
})

export const queryUser = createQueryClient(userRouter)
export const keyUser = createQueryKeys('user', {})

export const keyAvatar = createQueryKeys('avatar', {
  default: (params: { userId: number }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId }),
  }),
  small: (params: { userId: number }) => ({
    queryKey: ['small', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: 'small' }),
  }),
})
