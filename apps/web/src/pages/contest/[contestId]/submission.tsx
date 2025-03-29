import { useMemo, useState } from 'react'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { BookOpenIcon, UserIcon } from 'lucide-react'
import Head from 'next/head'
import NextLink from 'next/link'

import { ContestSchema, SubmissionSchema } from '@otog/contract'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Button } from '@otog/ui/button'
import { DialogTrigger } from '@otog/ui/dialog'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'

import { submissionKey, submissionQuery } from '../../../api/query'
import { withQuery } from '../../../api/server'
import { DebouncedInput } from '../../../components/debounced-input'
import { Footer } from '../../../components/footer'
import { InfiniteTable } from '../../../components/infinite-table'
import { InlineComponent } from '../../../components/inline-component'
import { SubmissionDialog } from '../../../components/submission-dialog'
import {
  SubmissionScoreBadge,
  useSubmissionPolling,
} from '../../../components/submission-table'
import { UserAvatar } from '../../../components/user-avatar'
import { ContestLayout, useContest } from '../../../modules/contest/sidebar'

interface ContestSubmissionPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
}
export const getServerSideProps = withQuery<ContestSubmissionPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(parseInt(contestId))) {
      return { notFound: true }
    }
    const [getTime, getContest] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
    ])
    if (getTime.status !== 200 || getContest.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest: getContest.body,
        serverTime: getTime.body.toString(),
      },
    }
  }
)
export default function ContestSubmissionPage(
  props: ContestSubmissionPageProps
) {
  return (
    <ContestLayout {...props}>
      <Head>
        <title>{props.contest.name} - Submission | OTOG</title>
      </Head>
      <ContestSubmission />
      <Footer className="pt-8 px-4 max-w-full" />
    </ContestLayout>
  )
}
ContestSubmissionPage.footer = false

function ContestSubmission() {
  const { contest } = useContest()
  return (
    <div className="flex-1">
      <div className="flex gap-2 items-center p-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbLink
              className="font-heading text-lg font-semibold hidden md:block"
              asChild
            >
              <NextLink href={`/contest/${contest.id}`}>
                {contest.name}
              </NextLink>
            </BreadcrumbLink>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-heading text-lg font-semibold">
                Submission (Admin Only)
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <ContestSubmissionTable contestId={contest.id} />
    </div>
  )
}

function ContestSubmissionTable({ contestId }: { contestId: number }) {
  const [problemSearch, setProblemSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const pageSize = 89
  const getSubmissionsByProblemId = useInfiniteQuery({
    queryKey: submissionKey.getContestSubmissionsForAdmin({
      params: { contestId: contestId.toString() },
      query: { problemSearch, userSearch },
    }).queryKey,
    // TODO: https://github.com/lukemorales/query-key-factory/issues/89
    queryFn: ({ pageParam }) =>
      submissionQuery.getContestSubmissionsForAdmin.query({
        params: { contestId: contestId.toString() },
        query: {
          offset: pageParam,
          limit: pageSize,
          problemSearch,
          userSearch,
        },
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.status === 200 ? lastPage.body.at(-1)?.id : undefined,
  })

  const data = useMemo(
    () =>
      getSubmissionsByProblemId.data?.pages.flatMap((page) =>
        page.status === 200 ? page.body : []
      ) ?? [],
    [getSubmissionsByProblemId.data]
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <div className="px-4 flex gap-4 flex-col">
      <div className="flex gap-2">
        <InputGroup className="w-60">
          <InputLeftIcon>
            <BookOpenIcon />
          </InputLeftIcon>
          <DebouncedInput
            placeholder="ค้นหาโจทย์"
            onDebounce={setProblemSearch}
          />
        </InputGroup>
        <InputGroup className="w-60">
          <InputLeftIcon>
            <UserIcon />
          </InputLeftIcon>
          <DebouncedInput
            placeholder="ค้นหาผู้ใช้"
            onDebounce={setUserSearch}
          />
        </InputGroup>
      </div>
      <InfiniteTable
        table={table}
        classNames={{ container: 'border-transparent' }}
        isLoading={getSubmissionsByProblemId.isLoading}
        isError={getSubmissionsByProblemId.isError}
        hasNextPage={getSubmissionsByProblemId.hasNextPage}
        fetchNextPage={getSubmissionsByProblemId.fetchNextPage}
      />
    </div>
  )
}

const columnHelper = createColumnHelper<SubmissionSchema>()
const columns = [
  columnHelper.accessor('creationDate', {
    header: 'ส่งเมื่อ',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BB HH:mm'),
    meta: { cellClassName: 'text-muted-foreground tabular-nums' },
    enableSorting: false,
  }),
  columnHelper.accessor('user.showName', {
    header: 'ชื่อ',
    cell: ({ getValue, row }) => (
      <Link asChild variant="hidden" className="inline-flex gap-2 items-center">
        <NextLink href={`/user/${row.original.user!.id}`}>
          <UserAvatar user={row.original.user!} />
          <span className="max-w-60 overflow-hidden text-ellipsis">
            {getValue()}
          </span>
        </NextLink>
      </Link>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('problem.name', {
    header: 'โจทย์',
    cell: ({ getValue, row }) => (
      <Link href={`/api/problem/${row.original.problem!.id}`} isExternal>
        {getValue()}
      </Link>
    ),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'score',
    header: 'คะแนน',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return <SubmissionScoreBadge submission={submission} />
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName: 'max-w-[200px] min-w-[120px] whitespace-pre-wrap text-end',
      headClassName: 'text-end',
    },
  }),

  columnHelper.display({
    id: 'timeUsed',
    header: 'เวลาที่ใช้ (วินาที)',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return ((submission.submissionResult?.timeUsed ?? 0) / 1000).toFixed(
            3
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
  columnHelper.display({
    id: 'memUsed',
    header: 'ความจำที่ใช้ (kB)',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          const memUsed = submission.submissionResult?.memUsed ?? 0
          if (memUsed === -1) return '-'
          return memUsed
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
  columnHelper.display({
    id: 'action',
    header: '',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return (
            <SubmissionDialog submissionId={submission.id}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="ดูรายละเอียด">
                  <EllipsisHorizontalIcon />
                </Button>
              </DialogTrigger>
            </SubmissionDialog>
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName: 'text-end',
    },
  }),
]
