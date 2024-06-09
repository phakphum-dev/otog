import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { createQueryClient } from '.'
import { getAvatarUrl } from '../firebase/get-avatar-url'

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
  list: () => ({
    queryKey: ['list'],
    queryFn: () => queryProblem.getProblemTable.query(),
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
  list: () => ({
    queryKey: ['list'],
    queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
      querySubmission.getSubmissions.query({
        query: { offset: pageParam },
      }),
  }),
  getOne: (params: { submissionId: number }) => ({
    queryKey: ['getOne', params],
    queryFn: () =>
      querySubmission.getSubmission.query({
        params: { submissionId: params.submissionId.toString() },
      }),
  }),
  getOneWithSourceCode: (params: { submissionId: number }) => ({
    queryKey: ['getOneWithSourceCode', params],
    queryFn: () =>
      querySubmission.getSubmissionWithSourceCode.query({
        params: { submissionId: params.submissionId.toString() },
      }),
  }),
})

export const queryUser = createQueryClient(userRouter)
export const keyUser = createQueryKeys('user', {})

export const keyAvatar = createQueryKeys('avatar', {
  getUrl: (params: { userId: number; size: 'default' | 'small' }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: params.size }),
  }),
})
