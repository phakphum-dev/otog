import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  ColumnFiltersState,
  Row,
  RowSelectionState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import { ChevronLeft, Plus, Search, Trash } from 'lucide-react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { AdminContestWithProblems } from '@otog/contract'
import { Problem } from '@otog/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@otog/ui/alert-dialog'
import { Button } from '@otog/ui/button'
import { Checkbox } from '@otog/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import { Spinner } from '@otog/ui/spinner'
import { TableCell, TableFooter, TableRow } from '@otog/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'

import {
  contestKey,
  contestQuery,
  problemKey,
  problemQuery,
} from '../../../api/query'
import { withQuery } from '../../../api/server'
import { DebouncedInput } from '../../../components/debounced-input'
import { TableComponent } from '../../../components/table-component'
import { initialDataSuccess } from '../../../utils/initial-data-success'

interface AdminContestPageProps {
  contest: AdminContestWithProblems
}

export const getServerSideProps = withQuery<AdminContestPageProps>(
  async ({ session, query, context }) => {
    if (session?.user.role !== 'admin') {
      return { notFound: true }
    }
    const contestId = z.coerce.number().parse(context.params?.contestId)
    const getContestForAdmin = await query.contest.getContestForAdmin.query({
      params: { contestId: contestId.toString() },
    })
    if (getContestForAdmin.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contest: getContestForAdmin.body,
      },
    }
  }
)

export default function AdminContestPage(props: AdminContestPageProps) {
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
          <ContestDataTable contest={props.contest} />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function ContestDataTable(props: AdminContestPageProps) {
  const router = useRouter()
  const contestId = router.query.contestId as string
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const getContestForAdmin = useQuery({
    ...contestKey.getContestForAdmin({
      params: { contestId },
    }),
    initialData: initialDataSuccess(props.contest),
  })
  const contest = getContestForAdmin.data?.body
  const problems = useMemo(
    () =>
      getContestForAdmin.data?.status === 200
        ? getContestForAdmin.data.body.contestProblem
        : [],
    [getContestForAdmin.data]
  )
  const rowCount = useMemo(
    () => getContestForAdmin.data?.body.contestProblem.length ?? 0,
    [getContestForAdmin.data]
  )
  const table = useReactTable({
    columns,
    data: problems,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount,
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">ตารางโจทย์</h2>
      <div className="flex gap-2 items-center">
        <Button
          size="icon"
          variant="ghost"
          aria-label="กลับ"
          onClick={() => router.back()}
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-lg font-medium mr-auto">{contest.name}</h3>
        <AddContestProblem contest={contest} />
      </div>
      <TableComponent
        table={table}
        isLoading={getContestForAdmin.isLoading}
        isError={getContestForAdmin.isError}
      />
    </div>
  )
}

type ContestProblem = AdminContestWithProblems['contestProblem'][number]
const columnHelper = createColumnHelper<ContestProblem>()
const columns = [
  columnHelper.accessor('problem.id', {
    header: '#',
    enableSorting: false, // TODO: sort by id
  }),
  columnHelper.accessor('problem.name', {
    header: 'ขื่อ',
    cell: ({ getValue, row }) => (
      <Link
        isExternal
        href={`/api/problem/${row.original.problem.id}`}
        className="text-sm"
      >
        {getValue()}
      </Link>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('problem.sname', {
    header: 'ขื่อเล่น',
    cell: ({ getValue }) => getValue() ?? '-',
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">เพิ่มเติม</span>,
    cell: ({ row }) => {
      return <ActionMenu row={row} />
    },
    enableSorting: false,
  }),
]

const ActionMenu = ({ row }: { row: Row<ContestProblem> }) => {
  //   const [openEdit, setOpenEdit] = useState(false)

  const [openDelete, setOpenDelete] = useState(false)
  const toggleProblemToContest =
    contestQuery.toggleProblemToContest.useMutation()
  const queryClient = useQueryClient()
  return (
    <>
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogTrigger asChild>
          <Button aria-label="ลบโจทย์" size="icon" variant="ghost">
            <Trash />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโจทย์ออกจากการแข่งขัน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบโจทย์ {row.original.problem.name}{' '}
              ออกจากการแข่งขันใช่หรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogAction
              onClick={() => {
                const toastId = toast.loading('กำลังลบโจทย์...')
                toggleProblemToContest.mutateAsync(
                  {
                    body: { show: false },
                    params: {
                      contestId: row.original.contestId.toString(),
                      problemId: row.original.problemId.toString(),
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success('ลบโจทย์แล้ว', { id: toastId })
                      queryClient.invalidateQueries({
                        queryKey: contestKey.getContestForAdmin({
                          params: {
                            contestId: row.original.contestId.toString(),
                          },
                        }).queryKey,
                      })
                      setOpenDelete(false)
                    },
                    onError: () => {
                      toast.error('ลบโจทย์ไม่สำเร็จ', { id: toastId })
                    },
                  }
                )
              }}
            >
              ยืนยัน
            </AlertDialogAction>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" aria-label="เพิ่มเติม" size="icon">
            <EllipsisHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <PencilIcon />
            แก้ไขโจทย์แข่งขัน
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
      {/* <EditContestDialog row={row} open={openEdit} setOpen={setOpenEdit} /> */}
    </>
  )
}

const AddContestProblem = (props: AdminContestPageProps) => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const pageSize = 10
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: problemKey.searchProblem({ query: { search: input } }).queryKey,
      // TODO: https://github.com/lukemorales/query-key-factory/issues/89
      queryFn: ({ pageParam }) =>
        problemQuery.searchProblem.query({
          query: { search: input, skip: pageParam, limit: pageSize },
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPage) => {
        if (!lastPage) return allPage.length * pageSize
        return lastPage.status === 200 && lastPage.body.length === 0
          ? undefined
          : allPage.length * pageSize
      },
    })

  const problems = useMemo(
    () =>
      data?.pages.flatMap((page) => (page.status === 200 ? page.body : [])) ??
      [],
    [data]
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() => {
    const obj: Record<number, boolean> = {}
    props.contest.contestProblem.forEach((problem) => {
      obj[problem.problemId] = true
    })
    return obj
  })
  useEffect(() => {
    const obj: Record<number, boolean> = {}
    props.contest.contestProblem.forEach((problem) => {
      obj[problem.problemId] = true
    })
    setRowSelection(obj)
  }, [props.contest])

  const table = useReactTable({
    data: problems,
    columns: addContestColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
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
  const putProblemToContest = contestQuery.putProblemToContest.useMutation()
  const queryClient = useQueryClient()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus />
          เพิ่ม
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>เพิ่มโจทย์เข้าการแข่งขัน</DialogTitle>
          <DialogDescription>
            ค้นหาโจทย์ที่ต้องการเพิ่มเข้าการแข่งขัน
          </DialogDescription>
        </DialogHeader>
        <InputGroup>
          <InputLeftIcon>
            <Search />
          </InputLeftIcon>
          <DebouncedInput placeholder="ค้นหาโจทย์" onDebounce={setInput} />
        </InputGroup>
        <TableComponent
          classNames={{
            container: 'max-h-[400px] h-[400px] overflow-y-auto',
            head: 'sticky top-0 z-10 bg-background',
          }}
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
        <DialogFooter>
          <Button
            onClick={() => {
              const toastId = toast.loading('กำลังเพิ่มโจทย์...')
              const body = Object.keys(rowSelection).map((problemId) => ({
                problemId: parseInt(problemId),
              }))
              putProblemToContest.mutateAsync(
                {
                  body: body,
                  params: { contestId: props.contest.id.toString() },
                },
                {
                  onSuccess: () => {
                    toast.success('เพิ่มโจทย์แล้ว', { id: toastId })
                    setOpen(false)
                    queryClient.invalidateQueries({
                      queryKey: contestKey.getContestForAdmin({
                        params: { contestId: props.contest.id.toString() },
                      }).queryKey,
                    })
                  },
                  onError: () => {
                    toast.error('เพิ่มโจทย์ไม่สำเร็จ', { id: toastId })
                  },
                }
              )
            }}
          >
            เพิ่ม
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">ยกเลิก</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const addContestColumnsHelper =
  createColumnHelper<Pick<Problem, 'id' | 'name' | 'sname'>>()
const addContestColumns = [
  addContestColumnsHelper.display({
    id: 'select',
    header: () => <span className="sr-only">เลือกโจทย์</span>,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  }),
  addContestColumnsHelper.accessor('id', {
    header: '#',
    enableSorting: false,
  }),
  addContestColumnsHelper.accessor('name', {
    header: 'ชื่อ',
    enableSorting: false,
  }),
  addContestColumnsHelper.accessor('sname', {
    header: 'ชื่อเล่น',
    enableSorting: false,
    cell: ({ getValue }) => getValue() ?? '-',
  }),
]
