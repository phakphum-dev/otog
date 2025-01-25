import { useMemo, useState } from 'react'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  ColumnFiltersState,
  Row,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import { PencilIcon } from 'lucide-react'
import NextLink from 'next/link'

import { Contest } from '@otog/database'
import { Button } from '@otog/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@otog/ui/dropdown-menu'
import { Link } from '@otog/ui/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'

import { contestKey } from '../../api/query'
import { withSession } from '../../api/server'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../../components/table-component'

interface AdminContestPageProps {}

export const getServerSideProps = withSession<AdminContestPageProps>(
  async ({ session }) => {
    if (session?.user.role !== 'admin') {
      return { notFound: true }
    }
    return { props: {} }
  }
)
export default function AdminContestPage() {
  return (
    <main className="container flex-1 py-8">
      <h1 className="text-xl font-semibold mb-4">ระบบ GOTO</h1>
      <Tabs value="contest">
        <TabsList className="justify-start relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
          <TabsTrigger
            value="problem"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin">โจทย์</NextLink>
          </TabsTrigger>
          <TabsTrigger
            value="contest"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin/contest">แข่งขัน</NextLink>
          </TabsTrigger>
          <TabsTrigger
            value="user"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin/user">ผู้ใช้งาน</NextLink>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contest" className="mt-4">
          <ContestDataTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function ContestDataTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    recentShowTime: false,
    passedCount: false,
  })
  const [search, setSearch] = useState('')

  const adminProblems = useQuery({
    ...contestKey.getAdminContests({
      query: {
        limit: pagination.pageSize,
        skip: pagination.pageIndex * pagination.pageSize,
        search: search.trim(),
      },
    }),
    placeholderData: keepPreviousData,
  })
  const problems = useMemo(
    () =>
      adminProblems.data?.status === 200 ? adminProblems.data.body.data : [],
    [adminProblems.data]
  )
  const rowCount = useMemo(
    () => adminProblems.data?.body.total ?? 0,
    [adminProblems.data]
  )
  const table = useReactTable({
    columns,
    data: problems,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter: search,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,

    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount,
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">ตารางโจทย์</h2>
      <div className="flex justify-between gap-4 flex-col sm:flex-row">
        <TableSearch table={table} />
        <TablePaginationInfo
          table={table}
          isLoading={adminProblems.isFetching}
        />
      </div>
      <TableComponent
        table={table}
        isLoading={adminProblems.isLoading}
        isError={adminProblems.isError}
      />
      <TablePagination table={table} isLoading={adminProblems.isFetching} />
    </div>
  )
}

const columnHelper = createColumnHelper<Contest>()
const columns = [
  columnHelper.accessor('id', {
    header: '#',
    enableSorting: false, // TODO: sort by id
  }),
  columnHelper.accessor('name', {
    header: 'ขื่อ',
    cell: ({ getValue, row }) => (
      <Link
        isExternal
        href={`/api/problem/${row.original.id}`}
        className="text-sm"
      >
        {getValue()}
      </Link>
    ),
    enableSorting: false,
  }),
  // columnHelper.accessor('sname', {
  //   header: 'ขื่อเล่น',
  //   cell: ({ getValue }) => getValue() ?? '-',
  //   enableSorting: false,
  // }),
  // columnHelper.accessor('score', {
  //   header: 'คะแนน',
  //   enableSorting: false,
  //   meta: {
  //     headClassName: 'text-end',
  //     cellClassName: 'text-end',
  //   },
  // }),
  // columnHelper.accessor('timeLimit', {
  //   header: 'เวลา',
  //   cell: ({ getValue }) => getValue() / 1000,
  //   enableSorting: false,
  //   meta: {
  //     headClassName: 'text-end',
  //     cellClassName: 'text-end',
  //   },
  // }),

  // columnHelper.accessor('memoryLimit', {
  //   header: 'หน่วยความจำ',
  //   enableSorting: false,
  //   meta: {
  //     headClassName: 'text-end',
  //     cellClassName: 'text-end',
  //   },
  // }),
  // columnHelper.accessor('case', {
  //   header: 'จำนวนเคส',
  //   enableSorting: false,
  //   meta: {
  //     headClassName: 'text-end',
  //     cellClassName: 'text-end',
  //   },
  // }),
  // columnHelper.display({
  //   id: 'actions',
  //   header: () => <span className="sr-only">เพิ่มเติม</span>,
  //   cell: ({ row }) => {
  //     return (
  //       <div className="inline-flex">
  //         <ToggleShowProblem row={row} />
  //         <ActionMenu row={row} />
  //       </div>
  //     )
  //   },
  //   meta: { headClassName: 'text-end', cellClassName: 'text-end' },
  // }),
]

const ActionMenu = ({ row }: { row: Row<Contest> }) => {
  const [openEditProblem, setOpenEditProblem] = useState(false)
  const [openRejudgeProblem, setOpenRejudgeProblem] = useState(false)
  // const rejudgeProblem = submissionQuery.rejudgeProblem.useMutation()
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" aria-label="เพิ่มเติม" size="icon">
            <EllipsisHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenEditProblem(true)}>
            <PencilIcon />
            แก้ไขคอนเทสต์
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* <EditProblemDialog
        row={row}
        open={openEditProblem}
        setOpen={setOpenEditProblem}
      /> */}
      {/* <AlertDialog
        open={openRejudgeProblem}
        onOpenChange={setOpenRejudgeProblem}
      >
        <AlertDialogContent>
          <AlertDialogTitle>ยืนยันการตรวจข้อนี้ใหม่</AlertDialogTitle>
          <AlertDialogDescription>
            การตรวจข้อนี้ใหม่จะส่งการตรวจทั้งหมด และจะไม่สามารถยกเลิกได้
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const toastId = toast.loading('กำลังส่งการตรวจใหม่...')
                rejudgeProblem.mutateAsync(
                  { params: { problemId: row.original.id.toString() } },
                  {
                    onSuccess: () => {
                      toast.success('ส่งการตรวจใหม่แล้ว', { id: toastId })
                      setOpenRejudgeProblem(false)
                    },
                    onError: () => {
                      toast.error('ไม่สามารถส่งตรวจได้', { id: toastId })
                    },
                  }
                )
              }}
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </>
  )
}
