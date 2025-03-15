import { useEffect } from 'react'

import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import dayjs from 'dayjs'
import NextLink from 'next/link'

import { SubmissionSchema } from '@otog/contract'
import { SubmissionStatus } from '@otog/database'
import { Link } from '@otog/ui/link'
import { Spinner } from '@otog/ui/spinner'
import { TableCell, TableFooter, TableRow } from '@otog/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@otog/ui/tooltip'

import { submissionKey } from '../api/query'
import { InlineComponent } from './inline-component'
import { SubmissionStatusButton } from './submission-status'
import { TableComponent } from './table-component'
import { UserAvatar } from './user-avatar'

export const SubmissionTable = ({
  data,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
}: {
  data: Array<SubmissionSchema>
  isLoading: boolean
  isError: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
}) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  })
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: '0px',
  })
  const isIntersecting = entry?.isIntersecting
  useEffect(() => {
    if (isIntersecting) {
      fetchNextPage()
    }
  }, [isIntersecting])
  return (
    <TableComponent
      table={table}
      isLoading={isLoading}
      isError={isError}
      footer={
        hasNextPage && (
          <TableFooter className="bg-inherit" ref={ref}>
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="align-middle text-center"
              >
                <Spinner />
              </TableCell>
            </TableRow>
          </TableFooter>
        )
      }
    />
  )
}

const columnHelper = createColumnHelper<SubmissionSchema>()
const columns = [
  columnHelper.accessor('creationDate', {
    header: 'ส่งเมื่อ',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BB HH:mm'),
    enableSorting: false,
    meta: {
      headClassName: '',
      cellClassName: 'text-muted-foreground tabular-nums',
    },
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
          if (
            submission.status == SubmissionStatus.waiting ||
            submission.status == SubmissionStatus.grading
          ) {
            return (
              <div className="inline-flex gap-2 items-center">
                <Spinner size="sm" />
                <div>
                  {submission.submissionResult?.score ?? 0} /{' '}
                  {submission.problem.score}
                </div>
              </div>
            )
          }
          return (
            <div>
              {submission.submissionResult?.score ?? 0} /{' '}
              {submission.problem.score}
            </div>
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName:
        'max-w-[200px] min-w-[100px] whitespace-pre-wrap text-end tabular-nums',
      headClassName: 'text-end',
    },
  }),
  columnHelper.display({
    id: 'timeUsed',
    header: () => (
      <span className="inline-flex gap-2">
        เวลาที่ใช้ (วินาที)
        <Tooltip>
          <TooltipTrigger>
            <InformationCircleIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>เวลารวมถูกปรับเป็นเวลาสูงสุดที่ใช้</TooltipContent>
        </Tooltip>
      </span>
    ),
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
  columnHelper.accessor('status', {
    header: 'สถานะ',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return <SubmissionStatusButton submission={submission} />
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center',
    },
  }),
]

export function useSubmissionPolling(originalSubmission: SubmissionSchema) {
  const result = useQuery({
    ...submissionKey.getSubmission({
      params: { submissionId: originalSubmission.id.toString() },
    }),
    enabled:
      originalSubmission.status === SubmissionStatus.waiting ||
      originalSubmission.status === SubmissionStatus.grading,
    refetchInterval: (query) => {
      const data = query.state.data
      if (
        data?.status === 200 &&
        (data.body.status === SubmissionStatus.waiting ||
          data.body.status === SubmissionStatus.grading)
      ) {
        return 1000
      }
      return false
    },
  })
  return result.data?.status === 200 ? result.data.body : originalSubmission
}
