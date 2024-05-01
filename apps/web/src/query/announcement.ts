import { createQueryKeyStore } from '@lukemorales/query-key-factory'

import { query } from '../api'

export const key = createQueryKeyStore({
  announcement: {
    all: (contestId?: number) => ({
      queryKey: [contestId],
      queryFn: () =>
        query.announcement.getAnnouncements.query({
          query: { contestId: contestId?.toString() },
        }),
    }),
    shown: (contestId?: number) => ({
      queryKey: [contestId],
      queryFn: () =>
        query.announcement.getAnnouncements.query({
          query: {
            show: true,
            contestId: contestId?.toString(),
          },
        }),
    }),
  },
})
