import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import {
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
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
import { File } from '@web-std/file'
import { PencilIcon, Plus } from 'lucide-react'
import NextLink from 'next/link'
import { z } from 'zod'

import { AdminProblemSchema } from '@otog/contract'
import { UserRole } from '@otog/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@otog/ui/alert-dialog'
import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
import { Input } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'

import { problemKey, problemQuery, submissionQuery } from '../../api/query'
import { withSession } from '../../api/server'
import { FileInput } from '../../components/file-input'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../../components/table-component'
import { useUserContext } from '../../context/user-context'

interface AdminProblemPageProps {}

export const getServerSideProps = withSession<AdminProblemPageProps>(
  async ({ session }) => {
    if (session?.user.role !== 'admin') {
      return { notFound: true }
    }
    return { props: {} }
  }
)
export default function AdminProblemPage() {
  return (
    <main className="container flex-1 py-8">
      <h1 className="text-xl font-semibold mb-4 font-heading">ระบบ GOTO</h1>
      <Tabs value="problem">
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
        <TabsContent value="problem" className="mt-4 flex flex-col gap-4">
          <ProblemDataTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function ProblemDataTable() {
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

  const getProblemsForAdmin = useQuery({
    ...problemKey.getProblemsForAdmin({
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
      getProblemsForAdmin.data?.status === 200
        ? getProblemsForAdmin.data.body.data
        : [],
    [getProblemsForAdmin.data]
  )
  const rowCount = useMemo(
    () => getProblemsForAdmin.data?.body.total ?? 0,
    [getProblemsForAdmin.data]
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
      <div className="flex gap-2 flex-col sm:flex-row justify-between">
        <TableSearch table={table} />
        <div className="flex gap-2 justify-end max-sm:flex-col">
          <TablePaginationInfo
            className="self-end"
            table={table}
            isLoading={getProblemsForAdmin.isFetching}
          />
          <AddProblem />
        </div>
      </div>
      <TableComponent
        table={table}
        isLoading={getProblemsForAdmin.isLoading}
        isError={getProblemsForAdmin.isError}
      />
      <TablePagination
        table={table}
        isLoading={getProblemsForAdmin.isFetching}
      />
    </div>
  )
}

const columnHelper = createColumnHelper<AdminProblemSchema>()
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
  columnHelper.accessor('sname', {
    header: 'ขื่อเล่น',
    cell: ({ getValue }) => getValue() ?? '-',
    enableSorting: false,
  }),
  columnHelper.accessor('score', {
    header: 'คะแนน',
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end',
    },
  }),
  columnHelper.accessor('timeLimit', {
    header: 'เวลา',
    cell: ({ getValue }) => getValue() / 1000,
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end',
    },
  }),

  columnHelper.accessor('memoryLimit', {
    header: 'หน่วยความจำ',
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end',
    },
  }),
  columnHelper.accessor('case', {
    header: 'จำนวนเคส',
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end',
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">เพิ่มเติม</span>,
    cell: ({ row }) => {
      return (
        <div className="inline-flex">
          <ToggleShowProblem row={row} />
          <ActionMenu row={row} />
        </div>
      )
    },
    meta: { headClassName: 'text-end', cellClassName: 'text-end' },
  }),
]

const ActionMenu = ({ row }: { row: Row<AdminProblemSchema> }) => {
  const [openEditProblem, setOpenEditProblem] = useState(false)
  const [openRejudgeProblem, setOpenRejudgeProblem] = useState(false)
  const rejudgeProblem = submissionQuery.rejudgeProblem.useMutation()
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
            แก้ไขโจทย์
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenRejudgeProblem(true)}>
            <ArrowPathIcon className="size-4" />
            ตรวจข้อนี้ใหม่
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProblemDialog
        row={row}
        open={openEditProblem}
        setOpen={setOpenEditProblem}
      />
      <AlertDialog
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
      </AlertDialog>
    </>
  )
}

const ToggleShowProblem = ({
  row,
}: {
  row: Row<Pick<AdminProblemSchema, 'id' | 'show'>>
}) => {
  const { user } = useUserContext()
  const problem = row.original
  const toggleShowProblem = problemQuery.toggleShowProblem.useMutation()
  const queryClient = useQueryClient()
  if (user?.role !== UserRole.admin) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={row.original.show ? 'ปิดโจทย์' : 'เปิดโจทย์'}
      onClick={() => {
        const showLabel = problem.show ? 'ปิด' : 'เปิด'
        const toastId = toast.loading(`กำลัง${showLabel}โจทย์...`)
        toggleShowProblem.mutateAsync(
          {
            params: { problemId: problem.id.toString() },
            body: { show: !problem.show },
          },
          {
            onSuccess: () => {
              toast.success(`${showLabel}โจทย์สำเร็จ`, { id: toastId })
              queryClient.invalidateQueries({
                queryKey: problemKey.getProblemsForAdmin._def,
              })
            },
            onError: () => {
              toast.error(`ไม่สามารถ${showLabel}โจทย์ได้`, { id: toastId })
            },
          }
        )
      }}
    >
      {row.original.show ? <EyeIcon /> : <EyeSlashIcon />}
    </Button>
  )
}

const EditProblemDialog = ({
  row,
  open,
  setOpen,
}: {
  row: Row<AdminProblemSchema>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>แก้ไขโจทย์ #{row.original.id}</DialogTitle>
        <EditProblemForm
          problem={row.original}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

const EditProblemFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  sname: z.string().min(1, 'Required'),
  score: z.string().min(1, 'Required'),
  timeLimit: z.string().min(1, 'Required'),
  memoryLimit: z.string().min(1, 'Required'),
  case: z.string(),
  pdf: z.instanceof(File).optional(),
  zip: z.instanceof(File).optional(),
})
type EditProblemFormInput = z.input<typeof EditProblemFormSchema>
type EditProblemFormOutput = z.output<typeof EditProblemFormSchema>

const EditProblemForm = ({
  problem,
  onSuccess,
}: {
  problem: AdminProblemSchema
  onSuccess: () => void
}) => {
  const form = useForm<EditProblemFormInput, any, EditProblemFormOutput>({
    defaultValues: {
      name: problem.name,
      sname: problem.sname ?? '',
      score: problem.score.toString(),
      timeLimit: (problem.timeLimit / 1000).toString(),
      memoryLimit: problem.memoryLimit.toString(),
      case: problem.case?.toString() ?? '',
    },
    resolver: zodResolver(EditProblemFormSchema),
  })
  const queryClient = useQueryClient()
  const updateProblem = problemQuery.updateProblem.useMutation()
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading('กำลังบันทึก...')
    await updateProblem.mutateAsync(
      {
        params: { problemId: problem.id.toString() },
        body: {
          name: values.name,
          sname: values.sname,
          score: values.score,
          timeLimit: values.timeLimit,
          memoryLimit: values.memoryLimit,
          case: values.case,
          pdf: values.pdf,
          zip: values.zip,
        },
      },
      {
        onSuccess: () => {
          toast.success('บันทึกสำเร็จ', { id: toastId })
          queryClient.invalidateQueries({
            queryKey: problemKey.getProblemsForAdmin._def,
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
            <FormItem>
              <FormLabel>ชื่อโจทย์</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อโจทย์" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อเล่น</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อเล่น" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>คะแนน</FormLabel>
              <FormControl>
                <Input placeholder="คะแนน" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เวลา (s)</FormLabel>
              <FormControl>
                <Input placeholder="เวลา" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memoryLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>หน่วยความจำ (MB)</FormLabel>
              <FormControl>
                <Input placeholder="หน่วยความจำ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="case"
          render={({ field }) => (
            <FormItem>
              <FormLabel>จำนวนเคส</FormLabel>
              <FormControl>
                <Input placeholder="จำนวนเคส" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pdf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>โจทย์ (PDF)</FormLabel>
              <FormControl>
                <FileInput {...field} accept=".pdf" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เทสต์เคส (ZIP)</FormLabel>
              <FormControl>
                <FileInput {...field} accept=".zip,.zpi" />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Testcase Files อยู่ในรูปแบบ 1.in, 1.sol, ...
              </FormDescription>
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

const AddProblem = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus />
          เพิ่ม
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>เพิ่มโจทย์</DialogTitle>
        <AddProblemForm />
      </DialogContent>
    </Dialog>
  )
}

const AddProblemFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  sname: z.string().min(1, 'Required'),
  score: z.string().min(1, 'Required'),
  timeLimit: z.string().min(1, 'Required'),
  memoryLimit: z.string().min(1, 'Required'),
  case: z.string(),
  pdf: z.instanceof(File).optional(),
  zip: z.instanceof(File).optional(),
})
type AddProblemFormInput = z.input<typeof AddProblemFormSchema>
type AddProblemFormOutput = z.output<typeof AddProblemFormSchema>

const AddProblemForm = () => {
  const form = useForm<AddProblemFormInput, any, AddProblemFormOutput>({
    defaultValues: {
      name: '',
      sname: '',
      score: '',
      timeLimit: '',
      memoryLimit: '',
      case: '',
    },
    resolver: zodResolver(AddProblemFormSchema),
  })
  const queryClient = useQueryClient()
  const createProblem = problemQuery.createProblem.useMutation()
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading('กำลังบันทึก...')
    await createProblem.mutateAsync(
      {
        body: {
          name: values.name,
          sname: values.sname,
          score: values.score,
          timeLimit: values.timeLimit,
          memoryLimit: values.memoryLimit,
          case: values.case,
          pdf: values.pdf,
          zip: values.zip,
        },
      },
      {
        onSuccess: () => {
          toast.success('บันทึกสำเร็จ', { id: toastId })
          queryClient.invalidateQueries({
            queryKey: problemKey.getProblemsForAdmin._def,
          })
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
            <FormItem>
              <FormLabel>ชื่อโจทย์</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อโจทย์" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อเล่น</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อเล่น" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>คะแนน</FormLabel>
              <FormControl>
                <Input placeholder="คะแนน" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เวลา (s)</FormLabel>
              <FormControl>
                <Input placeholder="เวลา" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memoryLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>หน่วยความจำ (MB)</FormLabel>
              <FormControl>
                <Input placeholder="หน่วยความจำ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="case"
          render={({ field }) => (
            <FormItem>
              <FormLabel>จำนวนเคส</FormLabel>
              <FormControl>
                <Input placeholder="จำนวนเคส" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pdf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>โจทย์ (PDF)</FormLabel>
              <FormControl>
                <FileInput {...field} accept=".pdf" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เทสต์เคส (ZIP)</FormLabel>
              <FormControl>
                <FileInput {...field} accept=".zip,.zpi" />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Testcase Files อยู่ในรูปแบบ 1.in, 1.sol, ...
              </FormDescription>
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
