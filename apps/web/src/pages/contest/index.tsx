import { useEffect, useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import Head from 'next/head'
import NextLink from 'next/link'

import { ContestSchema } from '@otog/contract'
import { Button } from '@otog/ui/button'
import { Link } from '@otog/ui/link'

import { appKey, contestKey } from '../../api/query'
import { withQuery } from '../../api/server'
import { TableComponent } from '../../components/table-component'
import { initialDataSuccess } from '../../utils/initial-data-success'
import { toThDate, toThaiDuration, toTimerFormat } from '../../utils/time'
import { useTimer } from '../../utils/use-timer'

interface ContestPageProps {
  currentContests: ContestSchema[]
  serverTime: string
}

export const getServerSideProps = withQuery<ContestPageProps>(
  async ({ query }) => {
    const getCurrentContest = await query.contest.getCurrentContests.query()
    const getTime = await query.app.time.query()
    if (getCurrentContest.status !== 200) {
      throw getCurrentContest
    }
    if (getTime.status !== 200) {
      throw getTime
    }
    if (getCurrentContest.body.length === 1) {
      return {
        redirect: {
          destination: `/contest/${getCurrentContest.body[0]!.id}`,
          permanent: false,
        },
      }
    }
    return {
      props: {
        currentContests: getCurrentContest.body,
        serverTime: getTime.body.toString(),
      },
    }
  }
)

export default function ContestPage(props: ContestPageProps) {
  const getCurrentContests = useQuery({
    ...contestKey.getCurrentContests(),
    initialData: initialDataSuccess(props.currentContests),
  })
  const getServerTime = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(new Date(props.serverTime)),
  })
  const currentContests =
    getCurrentContests.data.status === 200 ? getCurrentContests.data.body : []
  return (
    <>
      <Head>
        <title>Contest | OTOG</title>
      </Head>
      <ContestDisplay
        currentContests={currentContests}
        serverTime={getServerTime.data.body.toString()}
      />
    </>
  )
}

interface ContestProps {
  currentContests: ContestSchema[]
  serverTime: string
}

const ContestDisplay = (props: ContestPageProps) => {
  if (props.currentContests.length === 0) {
    return <NoContest />
  }
  return (
    <main
      className="container max-w-4xl flex-1 flex flex-col gap-4 py-8"
      id="content"
    >
      <div className="flex flex-row justify-between items-center w-full gap-2">
        <h1 className="font-heading text-2xl font-semibold">
          การแข่งขันปัจจุบัน
        </h1>
        <Button asChild>
          <NextLink href="/contest/history">ประวัติการแข่งขัน</NextLink>
        </Button>
      </div>
      <ContestTable {...props} />
    </main>
  )
}

const NoContest = () => {
  return (
    <main
      className="flex flex-1 items-center justify-center flex-col gap-4"
      id="content"
    >
      <h1 className="font-heading text-4xl font-semibold">
        ยังไม่มีการแข่งขัน
      </h1>
      <Button asChild>
        <NextLink href="/contest/history">ประวัติการแข่งขัน</NextLink>
      </Button>
    </main>
  )
}

const ContestTable = (props: ContestProps) => {
  const { currentContests } = props

  const columnHelper = createColumnHelper<ContestSchema>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: '#',
        enableSorting: false,
      }),
      columnHelper.accessor('name', {
        header: 'การแข่งขัน',
        cell: ({ getValue, row }) => (
          <Link asChild className="block">
            <NextLink href={`/contest/${row.original.id}`}>
              {getValue()}
            </NextLink>
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
        header: 'เวลาเริ่ม',
        cell: ({ row }) => {
          return toThDate(row.original.timeStart.toString())
        },
        enableSorting: false,
      }),
      columnHelper.display({
        header: 'ระยะเวลา',
        cell: ({ row }) => {
          return (
            toThaiDuration(
              new Date(row.original.timeEnd).getTime() -
                new Date(row.original.timeStart).getTime()
            ) || '-'
          )
        },
        enableSorting: false,
      }),
      columnHelper.display({
        header: 'นับถอยหลัง',
        cell: ({ row }) => {
          if (row.original.timeStart > new Date(props.serverTime)) {
            return (
              <CountDown contest={row.original} serverTime={props.serverTime} />
            )
          } else {
            return (
              <Timer contest={row.original} serverTime={props.serverTime} />
            )
          }
        },
        enableSorting: false,
        meta: {
          cellClassName: 'max-w-[200px] whitespace-pre-wrap tabular-nums',
        },
      }),
    ],
    [props.serverTime]
  )
  const table = useReactTable({
    data: currentContests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  })
  return <TableComponent table={table} />
}

const CountDown = ({
  contest,
  serverTime,
}: {
  contest: ContestSchema
  serverTime: string
}) => {
  const serverTimeQuery = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(new Date(serverTime)),
  })
  const remaining = useTimer({
    start: serverTimeQuery.data.body.toString(),
    end: contest.timeStart.toString(),
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (remaining <= 0) {
      queryClient.invalidateQueries({
        queryKey: contestKey.getCurrentContests._def,
      })
    }
  }, [remaining])
  return <>{toTimerFormat(remaining)}</>
}

function Timer({
  contest,
  serverTime,
}: {
  contest: ContestSchema
  serverTime: string
}) {
  const serverTimeQuery = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(new Date(serverTime)),
  })
  const remaining = useTimer({
    start: serverTimeQuery.data.body.toString(),
    end: contest.timeEnd.toString(),
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (remaining <= 0) {
      queryClient.invalidateQueries({
        queryKey: contestKey.getCurrentContests._def,
      })
    }
  }, [remaining])
  return <>{toTimerFormat(remaining)}</>
}
