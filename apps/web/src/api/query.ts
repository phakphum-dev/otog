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
