import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import Head from 'next/head'
import NextLink from 'next/link'

import { SubmissionSchema } from '@otog/contract'
import { SubmissionStatus } from '@otog/database'
import { Link, Spinner } from '@otog/ui'

import { keySubmission } from '../../api/query'
import { withSession } from '../../api/with-session'
import { SubmissionStatusButton } from '../../components/submission-status'
import { TableComponent } from '../../components/table-component'
import { UserAvatar } from '../../components/user-avatar'

export const getServerSideProps = withSession(async () => {
  return { props: {} }
})

export default function SubmissionPage() {
  const { data, isLoading, isError } = useQuery(keySubmission.list())
  const submissions = useMemo(
    () => (data?.status === 200 ? data?.body ?? [] : [] ?? []),
    [data]
  )
  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <main className="container flex-1 flex flex-col gap-4">
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <h1 className="font-heading text-2xl mt-8 font-semibold">ผลตรวจ</h1>
      <TableComponent table={table} isLoading={isLoading} isError={isError} />
    </main>
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
          {getValue()}
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
  columnHelper.accessor('result', {
    header: 'ผลลัพธ์',
    cell: ({ getValue, row }) => {
      if (
        row.original.status === SubmissionStatus.waiting ||
        row.original.status === SubmissionStatus.grading
      ) {
        return (
          <div className="inline-flex gap-2 items-center">
            <Spinner size="sm" />
            {getValue()}
          </div>
        )
      }
      return <code className="font-mono">{getValue()}</code>
    },
    enableSorting: false,
  }),
  columnHelper.accessor('timeUsed', {
    header: 'เวลารวม (s)',
    cell: ({ getValue }) => {
      return ((getValue() ?? 0) / 1000).toFixed(3)
    },
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),

  columnHelper.accessor('status', {
    header: 'สถานะ',
    cell: ({ row }) => {
      return <SubmissionStatusButton submission={row.original} />
    },
    enableSorting: false,
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center',
    },
  }),
]
