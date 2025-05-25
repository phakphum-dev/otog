import { useEffect, useMemo, useState } from 'react'

import { FunnelIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import Head from 'next/head'
import { parseAsBoolean, useQueryState } from 'nuqs'

import { SubmissionSchema } from '@otog/contract'
import { Input, InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import { Toggle } from '@otog/ui/toggle'

import { submissionKey, submissionQuery } from '../../api/query'
import { withQuery } from '../../api/server'
import { SubmissionStatusButton } from '../../components/submission-status'
import { SubmissionTable } from '../../components/submission-table'
import { useUserContext } from '../../context/user-context'
import { SubmitCode } from '../../modules/problem/submit-code'

interface SubmissionPageProps {
  latestSubmission: SubmissionSchema | null
}

export const getServerSideProps = withQuery<SubmissionPageProps>(
  async ({ query }) => {
    const getLatestSubmissionByUserId =
      await query.submission.getLatestSubmissionByUserId.query()
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
  }
)

export default function SubmissionPage(props: SubmissionPageProps) {
  return (
    <main id="content" className="container flex-1 flex flex-col gap-6 py-8">
      <Head>
        <title>Submission | One Tambon One Grader</title>
      </Head>
      <h1 className="font-heading text-2xl font-semibold">ผลตรวจ</h1>
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
  const queryClient = useQueryClient()
  const problem = latestSubmission.problem!
  return (
    <section
      className="p-4 rounded-lg border flex gap-6 flex-col items-start sm:flex-row sm:items-center"
      aria-labelledby="latest-submission"
    >
      <h2 id="latest-submission" className="font-semibold">
        ส่งข้อล่าสุด
      </h2>
      <div className="flex gap-6 items-center max-sm:w-full sm:flex-1">
        <Link
          isExternal
          href={`/api/problem/${problem.id}`}
          className="text-sm flex flex-col"
        >
          <span className="text-pretty font-semibold tracking-wide mb-0.5">
            {problem.name}
          </span>
          <span>
            ({problem.timeLimit / 1000} วินาที {problem.memoryLimit} MB)
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <SubmitCode
            problem={problem}
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: submissionKey.getSubmissions._def,
              })
            }
          />
          <SubmissionStatusButton submission={latestSubmission} />
        </div>
      </div>
    </section>
  )
}

const SubmissionSection = () => {
  const { user, isAdmin, isAuthenticated } = useUserContext()

  const [all, setAll] = useQueryState(
    'all',
    parseAsBoolean.withDefault(isAdmin)
  )

  const [problemSearch, setProblemSearch] = useState<string>('')
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: submissionKey.getSubmissions({
        query: {
          userId: all ? undefined : user?.id,
          problemSearch,
        },
      }).queryKey,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        submissionQuery.getSubmissions.query({
          query: {
            offset: pageParam,
            userId: all ? undefined : user?.id,
            problemSearch,
          },
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
    <section aria-labelledby="submission" className="flex flex-col gap-4">
      <h2 id="submission" className="sr-only">
        ตารางผลตรวจ
      </h2>
      <div className="flex gap-2 justify-between">
        <DebounceInput onChange={setProblemSearch} />
        {isAuthenticated && (
          <Toggle
            onPressedChange={(pressed) => setAll(!pressed)}
            pressed={!all}
          >
            <FunnelIcon className="me-2" /> เฉพาะคุณ
          </Toggle>
        )}
      </div>
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

interface DebounceInputProps {
  onChange: (value: string) => void
}
function DebounceInput(props: DebounceInputProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  useEffect(() => {
    props.onChange(debouncedSearch)
  }, [debouncedSearch])
  return (
    <InputGroup className="max-w-[240px]">
      <InputLeftIcon>
        <MagnifyingGlassIcon />
      </InputLeftIcon>
      <Input
        placeholder="ค้นหาโจทย์"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </InputGroup>
  )
}
