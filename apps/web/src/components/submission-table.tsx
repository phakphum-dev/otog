import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import NextLink from 'next/link'

import { SubmissionSchema } from '@otog/contract'
import { SubmissionStatus } from '@otog/database'
import { Badge } from '@otog/ui/badge'
import { DialogTrigger } from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import { Spinner } from '@otog/ui/spinner'
import { VariantProps } from '@otog/ui/utils'

import { submissionKey } from '../api/query'
import { useUserContext } from '../context/user-context'
import { InfiniteTable, InfiniteTableProps } from './infinite-table'
import { InlineComponent } from './inline-component'
import { SubmissionDialog, SubmissionDialogButton } from './submission-dialog'
import { UserAvatar } from './user-avatar'

interface SubmissionTableProps extends Omit<InfiniteTableProps, 'table'> {
  data: Array<SubmissionSchema>
}

export const SubmissionTable = ({ data, ...props }: SubmissionTableProps) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  })
  return <InfiniteTable table={table} {...props} />
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
    id: 'action',
    header: '',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return <SubmissionDialogButton submission={submission} />
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName: 'text-end',
    },
  }),
]

export function getSubmissionBadgeVariant(
  status: SubmissionStatus,
  score = 0
): VariantProps<typeof Badge>['variant'] {
  switch (status) {
    case 'waiting':
    case 'grading':
      return 'outline'
    case 'accept':
      return 'accept'
    case 'reject':
      if (score > 0) {
        return 'warning'
      }
      return 'reject'
    case 'compileError':
    case 'judgeError':
      return 'error'
    default:
      return 'default'
  }
}

export function SubmissionScoreBadge({
  submission,
}: {
  submission: SubmissionSchema
}) {
  const score = submission.submissionResult?.score ?? 0
  const fullScore = submission.problem.score
  const { user } = useUserContext()
  const disabled =
    !user ||
    !(
      submission.userId === user.id ||
      user.role === 'admin' ||
      submission.public
    )
  const badge = disabled ? (
    <Badge variant={getSubmissionBadgeVariant(submission.status, score)}>
      {score} / {fullScore}
    </Badge>
  ) : (
    <SubmissionDialog submissionId={submission.id}>
      <Badge
        variant={getSubmissionBadgeVariant(submission.status, score)}
        asChild
      >
        <DialogTrigger>
          {score} / {fullScore}
        </DialogTrigger>
      </Badge>
    </SubmissionDialog>
  )
  if (submission.status === 'waiting' || submission.status === 'grading') {
    return (
      <div className="inline-flex items-center gap-2">
        <Spinner size="sm" aria-label="กำลังรอตรวจ" />
        {badge}
      </div>
    )
  }
  return badge
}

export function useSubmissionPolling(
  originalSubmission: SubmissionSchema
): SubmissionSchema {
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
        return 1000 * Math.pow(2, query.state.dataUpdateCount)
      }
      return false
    },
  })
  return result.data?.status === 200 ? result.data.body : originalSubmission
}
