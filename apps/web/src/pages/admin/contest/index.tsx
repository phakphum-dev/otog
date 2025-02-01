import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  ColumnFiltersState,
  Row,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import dayjs from 'dayjs'
import { PencilIcon } from 'lucide-react'
import NextLink from 'next/link'
import { z } from 'zod'

import { Contest, ContestGradingMode, ContestMode } from '@otog/database'
import { Button } from '@otog/ui/button'
import { DateTimePicker } from '@otog/ui/date-picker'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@otog/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@otog/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
import { Input } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'

import { contestKey, contestQuery } from '../../../api/query'
import { withSession } from '../../../api/server'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../../../components/table-component'
import { exhaustiveGuard } from '../../../utils/exhaustive-guard'

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
        href={`/admin/contest/${row.original.id}`}
        className="text-sm"
      >
        {getValue()}
      </Link>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor('timeStart', {
    header: 'เวลาเริ่ม',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BBBB HH:mm'),
    enableSorting: false,
  }),
  columnHelper.accessor('timeEnd', {
    header: 'เวลาจบ',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BBBB HH:mm'),
    enableSorting: false,
  }),
  columnHelper.accessor('gradingMode', {
    header: 'โหมด',
    cell: ({ getValue }) => {
      const gradingMode = getValue()
      switch (gradingMode) {
        case 'acm':
          return 'ACM'
        case 'classic':
          return 'Classic'
        default:
          exhaustiveGuard(gradingMode)
      }
    },
    enableSorting: false,
  }),
  columnHelper.accessor('mode', {
    header: 'เรท',
    cell: ({ getValue }) => {
      const mode = getValue()
      switch (mode) {
        case 'rated':
          return 'Rated'
        case 'unrated':
          return 'Unrated'
        default:
          exhaustiveGuard(mode)
      }
    },
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

const ActionMenu = ({ row }: { row: Row<Contest> }) => {
  const [openEdit, setOpenEdit] = useState(false)
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
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <PencilIcon />
            แก้ไขการแข่งขัน
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditContestDialog row={row} open={openEdit} setOpen={setOpenEdit} />
    </>
  )
}

const EditContestDialog = ({
  row,
  open,
  setOpen,
}: {
  row: Row<Contest>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>แก้ไขการแข่งขัน #{row.original.id}</DialogTitle>
        <EditContestForm
          contest={row.original}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

const EditContestFormSchema = z
  .object({
    name: z.string(),
    gradingMode: z.nativeEnum(ContestGradingMode),
    mode: z.nativeEnum(ContestMode),
    timeStart: z.string().datetime(),
    timeEnd: z.string().datetime(),
  })
  .refine(
    (data) => {
      return new Date(data.timeEnd) > new Date(data.timeStart)
    },
    {
      message: 'เวลาจบต้องมาหลังจากเวลาเริ่ม',
      path: ['timeEnd'],
    }
  )
type EditContestFormInput = z.input<typeof EditContestFormSchema>
type EditContestFormOutput = z.output<typeof EditContestFormSchema>

const EditContestForm = ({
  contest,
  onSuccess,
}: {
  contest: Contest
  onSuccess: () => void
}) => {
  const form = useForm<EditContestFormInput, any, EditContestFormOutput>({
    defaultValues: {
      name: contest.name,
      gradingMode: contest.gradingMode,
      mode: contest.mode,
      timeStart: contest.timeStart.toISOString(),
      timeEnd: contest.timeEnd.toISOString(),
    },
    resolver: zodResolver(EditContestFormSchema),
  })
  const queryClient = useQueryClient()
  const updateContest = contestQuery.updateContest.useMutation()
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading('กำลังบันทึก...')
    await updateContest.mutateAsync(
      {
        params: { contestId: contest.id.toString() },
        body: {
          name: values.name,
          announce: contest.announce,
          gradingMode: values.gradingMode,
          mode: values.mode,
          timeStart: new Date(values.timeStart),
          timeEnd: new Date(values.timeEnd),
        },
      },
      {
        onSuccess: () => {
          toast.success('บันทึกสำเร็จ', { id: toastId })
          queryClient.invalidateQueries({
            queryKey: contestKey.getAdminContests._def,
          })
          onSuccess()
        },
        onError: () => {
          toast.error('ไม่สามารถบันทึกได้', { id: toastId })
        },
      }
    )
  })
  return (
    <Form {...form}>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>ชื่อการแข่งขัน</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อการแข่งขัน" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เวลาเริ่ม</FormLabel>
              <FormControl>
                <DateTimePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เวลาจบ</FormLabel>
              <FormControl>
                <DateTimePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gradingMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>โหมด</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger {...field}>
                    <SelectValue placeholder="เลือกโหมด" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ContestGradingMode.classic}>
                    Classic
                  </SelectItem>
                  <SelectItem value={ContestGradingMode.acm}>ACM</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เรท</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger {...field}>
                    <SelectValue placeholder="เลือกเรท" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ContestMode.rated}>Rated</SelectItem>
                  <SelectItem value={ContestMode.unrated}>Unrated</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 justify-end col-span-full">
          <DialogClose asChild>
            <Button variant="secondary">ยกเลิก</Button>
          </DialogClose>
          <Button type="submit">บันทึก</Button>
        </div>
      </form>
    </Form>
  )
}
