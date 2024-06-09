import { useMemo } from 'react'

import { useInfiniteQuery } from '@tanstack/react-query'
import Head from 'next/head'

import { keySubmission, querySubmission } from '../../api/query'
import { withSession } from '../../api/with-session'
import { SubmissionTable } from '../../components/submission-table'

export const getServerSideProps = withSession(async () => {
  return { props: {} }
})

export default function SubmissionPage() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: keySubmission.list._def,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        querySubmission.getSubmissions.query({
          query: { offset: pageParam as number },
        }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.status === 200 ? lastPage.body.at(-1)?.id : undefined,
    })
  const submissions = useMemo(
    () =>
      data?.pages.flatMap((page) => (page.status === 200 ? page.body : [])) ??
      [],
    [data]
  )
  return (
    <main className="container flex-1 flex flex-col gap-4">
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <h1 className="font-heading text-2xl mt-8 font-semibold">ผลตรวจ</h1>
      <SubmissionTable
        data={submissions}
        isLoading={isLoading}
        isError={isError}
        loadMore={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
      />
    </main>
  )
}
