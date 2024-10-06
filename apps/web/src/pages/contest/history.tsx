import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Head from 'next/head'
import NextLink from 'next/link'

import { Contest } from '@otog/database'
import { Link } from '@otog/ui'

import { keyContest } from '../../api/query'
import { TableComponent } from '../../components/table-component'

export default function ContestHistoryPage() {
  return (
    <main
      className="container max-w-4xl flex-1 flex flex-col gap-4"
      id="content"
    >
      <Head>
        <title>Contest History | OTOG</title>
      </Head>
      <h1 className="font-heading text-2xl mt-8 font-semibold">
        ประวัติการแข่งขัน
      </h1>
      <ContestTable />
    </main>
  )
}

const ContestTable = () => {
  const getContests = useQuery(keyContest.getContests())
  const data = useMemo(
    () => (getContests.data?.status === 200 ? getContests.data.body : []),
    [getContests.data]
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  })
  return (
    <TableComponent
      table={table}
      isLoading={getContests.isLoading}
      isError={getContests.isError}
    />
  )
}

const columnHelper = createColumnHelper<Contest>()
const columns = [
  columnHelper.accessor('id', {
    header: '#',
    enableSorting: false,
  }),
  columnHelper.accessor('name', {
    header: 'การแข่งขัน',
    cell: ({ getValue, row }) => (
      <Link asChild className="block">
        <NextLink href={`/contest/${row.original.id}`}>{getValue()}</NextLink>
      </Link>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('mode', {
    header: 'โหมด',
    enableSorting: false,
    meta: {
      cellClassName: 'capitalize',
    },
  }),
  columnHelper.display({
    header: 'ระยะเวลา',
    cell: ({ row }) => {
      function getHMS(ms: number) {
        const s = ~~(ms / 1000)
        const m = ~~(s / 60)
        const h = ~~(m / 60)
        return [h, m % 60, s % 60]
      }

      function toDuration(ms: number) {
        const [h, m, s] = getHMS(ms)
        return [h && `${h} ชั่วโมง`, m && `${m} นาที`, s && `${s} วินาที`]
          .filter((str) => str)
          .join(' ')
      }

      return (
        toDuration(
          new Date(row.original.timeEnd).getTime() -
            new Date(row.original.timeStart).getTime()
        ) || '-'
      )
    },
    enableSorting: false,
  }),
]
