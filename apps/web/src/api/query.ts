import { createQueryKeys } from '@lukemorales/query-key-factory'

import {
  announcementRouter,
  problemRouter,
  submissionRouter,
} from '@otog/contract'

import { createQueryClient } from '.'

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
