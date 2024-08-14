import { useMemo } from 'react'

import { useInfiniteQuery } from '@tanstack/react-query'
import Head from 'next/head'

import { SubmissionSchema } from '@otog/contract'
import { Link } from '@otog/ui'

import { keySubmission, querySubmission } from '../../api/query'
import { withSession } from '../../api/with-session'
import { SubmissionStatusButton } from '../../components/submission-status'
import { SubmissionTable } from '../../components/submission-table'
import { SubmitCode } from '../../modules/problem/submit-code'

interface SubmissionPageProps {
  latestSubmission: SubmissionSchema | null
}

export const getServerSideProps = withSession<SubmissionPageProps>(async () => {
  const getLatestSubmissionByUserId =
    await querySubmission.getLatestSubmissionByUserId.query()
  if (getLatestSubmissionByUserId.status !== 200) {
    return {
      props: {
        latestSubmission: null,
      },
    }
  }
  return {
    props: {
      latestSubmission: getLatestSubmissionByUserId.body.submission,
    },
  }
})

export default function SubmissionPage(props: SubmissionPageProps) {
  return (
    <main id="content" className="container flex-1 flex flex-col gap-4">
      <Head>
        <title>Submission | One Tambon One Grader</title>
      </Head>
      <h1 className="font-heading text-2xl mt-8 font-semibold">ผลตรวจ</h1>
      <LatestSubmissionSecion latestSubmission={props.latestSubmission} />
      <SubmissionSection />
    </main>
  )
}

const LatestSubmissionSecion = ({
  latestSubmission,
}: {
  latestSubmission: SubmissionSchema | null
}) => {
  if (!latestSubmission) {
    return null
  }
  const problem = latestSubmission.problem!
  return (
    <section className="p-4 rounded-lg border flex gap-6 items-center">
      <h2 className="font-semibold">ส่งข้อล่าสุด</h2>
      <Link isExternal href={`/api/problem/${problem.id}`} className="text-sm">
        <span>{problem.name}</span>
        <p>
          {/* TODO: fix nullish */}(
          {problem.timeLimit ? problem.timeLimit / 1000 : '-'} วินาที{' '}
          {problem.memoryLimit} MB)
        </p>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <SubmitCode problem={problem} />
        <SubmissionStatusButton submission={latestSubmission} />
      </div>
    </section>
  )
}

const SubmissionSection = () => {
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: keySubmission.list._def,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        querySubmission.getSubmissions.query({
          query: { offset: pageParam },
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
    <section>
      <h2 className="sr-only">ตารางผลตรวจ</h2>
      <SubmissionTable
        data={submissions}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </section>
  )
}
