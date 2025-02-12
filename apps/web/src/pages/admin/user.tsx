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
import { PencilIcon, Plus } from 'lucide-react'
import NextLink from 'next/link'
import { z } from 'zod'

import { UserSchema } from '@otog/contract'
import { UserRole } from '@otog/database'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
import { Input } from '@otog/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'

import { problemKey, userKey, userQuery } from '../../api/query'
import { withSession } from '../../api/server'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../../components/table-component'
import { exhaustiveGuard } from '../../utils/exhaustive-guard'

interface AdminUserPageProps {}

export const getServerSideProps = withSession<AdminUserPageProps>(
  async ({ session }) => {
    if (session?.user.role !== 'admin') {
      return { notFound: true }
    }
    return { props: {} }
  }
)
export default function AdminUserPage() {
  return (
    <main className="container flex-1 py-8">
      <h1 className="text-xl font-semibold mb-4 font-heading">ระบบ GOTO</h1>
      <Tabs value="user">
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
        <TabsContent value="user" className="mt-4">
          <UserDataTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function UserDataTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [search, setSearch] = useState('')

  const getUsersForAdmin = useQuery({
    ...userKey.getUsersForAdmin({
      query: {
        limit: pagination.pageSize,
        skip: pagination.pageIndex * pagination.pageSize,
        search: search.trim(),
      },
    }),
    placeholderData: keepPreviousData,
  })
  const users = useMemo(
    () =>
      getUsersForAdmin.data?.status === 200
        ? getUsersForAdmin.data.body.data
        : [],
    [getUsersForAdmin.data]
  )
  const rowCount = useMemo(
    () => getUsersForAdmin.data?.body.total ?? 0,
    [getUsersForAdmin.data]
  )
  const table = useReactTable({
    columns,
    data: users,
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
            isLoading={getUsersForAdmin.isFetching}
          />
          <AddUser />
        </div>
      </div>
      <TableComponent
        table={table}
        isLoading={getUsersForAdmin.isLoading}
        isError={getUsersForAdmin.isError}
      />
      <TablePagination table={table} isLoading={getUsersForAdmin.isFetching} />
    </div>
  )
}

const columnHelper = createColumnHelper<UserSchema>()
const columns = [
  columnHelper.accessor('id', {
    header: '#',
    enableSorting: false, // TODO: sort by id
  }),
  columnHelper.accessor('username', {
    header: 'ชื่อ',
    enableSorting: false,
  }),
  columnHelper.accessor('showName', {
    header: 'ชื่อแสดง',
    enableSorting: false,
  }),
  columnHelper.accessor('role', {
    header: 'สิทธิ์',
    cell: ({ getValue }) => {
      const role = getValue()
      switch (role) {
        case 'admin':
          return 'Admin'
        case 'user':
          return 'User'
        default:
          exhaustiveGuard(role)
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
    meta: { headClassName: 'text-end', cellClassName: 'text-end' },
  }),
]

const ActionMenu = ({ row }: { row: Row<UserSchema> }) => {
  const [openEdit, setOpenEdit] = useState(false)
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
            <PencilIcon className="size-4" />
            แก้ไขผู้ใช้
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditUserDialog row={row} open={openEdit} setOpen={setOpenEdit} />
    </>
  )
}

const EditUserDialog = ({
  row,
  open,
  setOpen,
}: {
  row: Row<UserSchema>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>แก้ไขผู้ใช้ #{row.original.id}</DialogTitle>
        <EditUserForm user={row.original} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

const EditUserFormSchema = z.object({
  username: z.string().min(1, 'Required'),
  showName: z.string().min(1, 'Required'),
  role: z.nativeEnum(UserRole),
  password: z.union([
    z.literal(''),
    z.string().min(8, 'Password must be at least 8 characters'),
  ]),
})
type EditUserFormInput = z.input<typeof EditUserFormSchema>
type EditUserFormOutput = z.output<typeof EditUserFormSchema>

const EditUserForm = ({
  user,
  onSuccess,
}: {
  user: UserSchema
  onSuccess: () => void
}) => {
  const form = useForm<EditUserFormInput, any, EditUserFormOutput>({
    defaultValues: {
      username: user.username,
      showName: user.showName,
      role: user.role,
      password: '',
    },
    resolver: zodResolver(EditUserFormSchema),
  })
  const queryClient = useQueryClient()
  const updateUser = userQuery.updateUser.useMutation()
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading('กำลังบันทึก...')
    await updateUser.mutateAsync(
      {
        params: { userId: user.id.toString() },
        body: {
          username: values.username,
          showName: values.showName,
          role: values.role,
          password: values.password,
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อผู้ใช้</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อผู้ใช้" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รหัสผ่าน (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="รหัสผ่าน" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>สิทธิ์</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger {...field}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="showName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อที่แสดง</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อที่แสดง" {...field} />
              </FormControl>
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

const AddUser = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled>
          <Plus />
          เพิ่ม
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>เพิ่มผู้ใช้</DialogTitle>
        {/* <AddUserForm /> */}
      </DialogContent>
    </Dialog>
  )
}
