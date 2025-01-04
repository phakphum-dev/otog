import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  contestRouter,
  problemRouter,
  submissionRouter,
  userRouter,
} from '@otog/contract'

import { clientArgs, createQueryClient } from '.'
import { getAvatarUrl } from '../firebase/get-avatar-url'
import { createQueryAndKey } from './lib'

const [queryAnnouncement, keyAnnouncement] = createQueryAndKey(
  'announcement',
  announcementRouter
)
export { queryAnnouncement, keyAnnouncement }

export const queryProblem = createQueryClient(problemRouter, clientArgs)
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

export const querySubmission = createQueryClient(submissionRouter, clientArgs)
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

export const queryUser = createQueryClient(userRouter, clientArgs)
export const keyUser = createQueryKeys('user', {})

export const keyAvatar = createQueryKeys('avatar', {
  getUrl: (params: { userId: number; size: 'default' | 'small' }) => ({
    queryKey: ['default', params],
    queryFn: () => getAvatarUrl({ userId: params.userId, size: params.size }),
  }),
})

export const queryContest = createQueryClient(contestRouter, clientArgs)
export const keyContest = createQueryKeys('contest', {
  getCurrent: () => ({
    queryKey: ['getCurrent'],
    queryFn: () => queryContest.getCurrentContest.query(),
  }),
  getContests: () => ({
    queryKey: ['getContests'],
    queryFn: () => queryContest.getContests.query(),
  }),
  getContest: (params: { contestId: string }) => ({
    queryKey: ['getContest', params],
    queryFn: () =>
      queryContest.getContest.query({
        params: { contestId: params.contestId },
      }),
  }),
  getContestScoreboard: (params: { contestId: string }) => ({
    queryKey: ['getContestScoreboard', params],
    queryFn: () =>
      queryContest.getContestScoreboard.query({
        params: { contestId: params.contestId },
      }),
  }),
  getContestPrize: (params: { contestId: string }) => ({
    queryKey: ['getContestPrize', params],
    queryFn: () =>
      queryContest.getContestPrize.query({
        params: { contestId: params.contestId },
      }),
  }),
})
