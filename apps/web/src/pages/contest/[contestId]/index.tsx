import Head from 'next/head'

import { withQuery } from '../../../api/server'

export const getServerSideProps = withQuery(async ({ context, query }) => {
  const contestId = context.query.contestId as string
  if (Number.isNaN(Number(contestId))) {
    return { notFound: true }
  }
  const getContest = await query.contest.getContest.query({
    params: { contestId },
  })
  return {
    props: {},
  }
})
