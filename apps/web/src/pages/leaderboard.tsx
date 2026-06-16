import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import Head from 'next/head'
import NextLink from 'next/link'

import { UserLeaderboardSchema } from '@otog/contract'
import { Badge } from '@otog/ui/badge'
import { Link } from '@otog/ui/link'
import { Switch } from '@otog/ui/switch'
import { Label } from '@otog/ui/label'
import { clsx } from '@otog/ui/utils'

import { userKey } from '../api/query'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../components/table-component'
import { UserAvatar } from '../components/user-avatar'
import { useUserContext } from '../context/user-context'

const rankColor: Record<number, string> = {
  1: 'font-bold text-yellow-500 dark:text-yellow-400',
  2: 'font-bold text-slate-400 dark:text-slate-300',
  3: 'font-bold text-amber-600 dark:text-amber-500',
}

export default function LeaderboardPage() {
  const { isAdmin, user: currentUser } = useUserContext()
  const [showHidden, setShowHidden] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')

  const handleShowHiddenChange = (value: boolean) => {
    setShowHidden(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const getLeaderboard = useQuery({
    ...userKey.getLeaderboard({
      query: {
        limit: pagination.pageSize,
        skip: pagination.pageIndex * pagination.pageSize,
        search: search.trim(),
        showAll: isAdmin && showHidden,
      },
    }),
    placeholderData: keepPreviousData,
  })

  const data = useMemo(
    () =>
      getLeaderboard.data?.status === 200
        ? getLeaderboard.data.body.data
        : [],
    [getLeaderboard.data]
  )

  const rowCount = getLeaderboard.data?.body.total ?? 0

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<UserLeaderboardSchema>()
    return [
      columnHelper.display({
        id: 'rank',
        header: '#',
        cell: ({ row }) => {
          const rank = row.original.rank
          return (
            <span className={clsx('font-mono', rankColor[rank] ?? 'text-muted-foreground')}>
              {rank}
            </span>
          )
        },
        meta: {
          headClassName: 'w-[80px]',
          cellClassName: 'w-[80px]',
        },
      }),
      columnHelper.accessor('showName', {
        header: 'ผู้ใช้งาน',
        cell: ({ getValue, row }) => {
          const isSelf = row.original.id === currentUser?.id
          const isHiddenSelf = isSelf && !row.original.showInLeaderboard
          return (
            <div className="inline-flex gap-2 items-center">
              <Link
                asChild
                variant="hidden"
                className={clsx(
                  'inline-flex gap-2 items-center',
                  isHiddenSelf && 'opacity-60 italic'
                )}
              >
                <NextLink href={`/user/${row.original.id}`}>
                  <UserAvatar user={row.original} />
                  <span className="font-medium max-w-60 overflow-hidden text-ellipsis">
                    {getValue()}
                  </span>
                </NextLink>
              </Link>
              {isSelf && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  คุณ
                </Badge>
              )}
              {isAdmin && !row.original.showInLeaderboard && !isSelf && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  ซ่อน
                </Badge>
              )}
              {isAdmin && row.original.role === 'admin' && (
                <Badge variant="error" className="text-[10px] py-0 px-1.5 h-4">
                  Admin
                </Badge>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('rating', {
        header: 'เรตติ้ง',
        cell: ({ getValue }) => {
          const rating = getValue()
          if (rating === null || rating === undefined) {
            return <span className="text-muted-foreground">-</span>
          }
          return (
            <span className="font-semibold text-primary font-mono">
              {rating}
            </span>
          )
        },
        meta: {
          headClassName: 'text-end pr-6',
          cellClassName: 'text-end pr-6',
        },
      }),
      columnHelper.accessor('passedCount', {
        header: 'ข้อที่ผ่าน',
        cell: ({ getValue, row }) => (
          <div className="flex flex-col items-end pr-4">
            <Link asChild variant="hidden">
              <NextLink href={`/user/${row.original.id}?tab=passed`}>
                <Badge
                  variant="accept"
                  className="font-mono text-sm px-3 py-1 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {getValue()}
                </Badge>
              </NextLink>
            </Link>
            {isAdmin && (
              <span
                className="text-[10px] text-muted-foreground font-mono mt-0.5"
                title="จำนวนผ่านทั้งหมด (รวมโจทย์ส่วนตัว)"
              >
                [{row.original.passedCountAll}]
              </span>
            )}
          </div>
        ),
        meta: {
          headClassName: 'text-end pr-4',
          cellClassName: 'text-end pr-4',
        },
      }),
    ]
  }, [isAdmin, currentUser])

  const table = useReactTable({
    columns,
    data,
    state: { globalFilter: search, pagination },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    manualPagination: true,
    manualFiltering: true,
    rowCount,
  })

  return (
    <main id="content" className="container flex-1 py-8">
      <Head>
        <title>Leaderboard | One Tambon One Grader</title>
      </Head>
      <h1 className="text-xl font-semibold mb-4 font-heading">ตารางอันดับ</h1>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-col sm:flex-row justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <TableSearch table={table} />
            {isAdmin && (
              <div className="flex items-center space-x-2 border px-3 py-2 rounded-md bg-muted/30 h-9">
                <Switch
                  id="show-hidden-users"
                  checked={showHidden}
                  onCheckedChange={handleShowHiddenChange}
                />
                <Label htmlFor="show-hidden-users" className="text-xs cursor-pointer">
                  แสดงทั้งหมด
                </Label>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end max-sm:flex-col">
            <TablePaginationInfo
              className="self-end"
              table={table}
              isLoading={getLeaderboard.isFetching}
            />
          </div>
        </div>
        <TableComponent
          table={table}
          isLoading={getLeaderboard.isLoading}
          isError={getLeaderboard.isError}
        />
        <TablePagination table={table} isLoading={getLeaderboard.isFetching} />
      </div>
    </main>
  )
}
