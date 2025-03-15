import { ReactNode, forwardRef, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  CheckCircleIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ViewColumnsIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  ColumnFiltersState,
  Row,
  Table,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/table-core'
import dayjs from 'dayjs'
import { produce } from 'immer'
import NextLink from 'next/link'

import {
  ProblemTableRowSchema,
  ProblemWithoutExampleSchema,
} from '@otog/contract'
import { SubmissionStatus, UserRole } from '@otog/database'
import { Button, ButtonProps } from '@otog/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@otog/ui/dropdown-menu'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Link } from '@otog/ui/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPrimitive,
} from '@otog/ui/select'
import { Spinner } from '@otog/ui/spinner'
import { VariantProps, clsx, cva } from '@otog/ui/utils'

import { bookshelfKey, problemKey, problemQuery } from '../../api/query'
import { DebouncedInput } from '../../components/debounced-input'
import { InlineComponent } from '../../components/inline-component'
import { SubmissionDialog } from '../../components/submission-dialog'
import { SubmissionStatusButton } from '../../components/submission-status'
import { TableVirtuosoComponent } from '../../components/table-component'
import { UserAvatar } from '../../components/user-avatar'
import { useUserContext } from '../../context/user-context'
import { SubmitCode } from '../../modules/problem/submit-code'
import { exhaustiveGuard } from '../../utils/exhaustive-guard'

export const ShelfTable = ({ bookshelfId }: { bookshelfId: number }) => {
  // const { data, isLoading, isError } = useQuery(problemKey.getProblemTable())
  const getProblemsOnBookshelf = useQuery(
    bookshelfKey.getProblemsOnBookshelf(bookshelfId)
  )
  const problems = useMemo(
    () =>
      getProblemsOnBookshelf.data?.status === 200
        ? getProblemsOnBookshelf.data.body.map((p) => p.problem)
        : [],
    [getProblemsOnBookshelf.data]
  )
  console.log(problems)
  //.filter((problem) => problem.id)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    recentShowTime: false,
    passedCount: true,
  })
  const table = useReactTable({
    columns,
    data: problems,
    filterFns: {},
    state: {
      columnFilters,
      columnVisibility,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <section className="flex flex-col gap-4" aria-labelledby="problem">
      <section className="flex flex-col gap-4">
        <TableVirtuosoComponent
          classNames={{
            container: 'border-transparent',
            bodyRow: 'border-transparent',
          }}
          table={table}
          isLoading={getProblemsOnBookshelf.isLoading}
          isError={getProblemsOnBookshelf.isError}
        />
      </section>
    </section>
  )
}

const RowStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  NOT_PASSED: 'NOT_PASSED',
  PASSED: 'PASSED',
} as const
type RowStatus = keyof typeof RowStatus
const RowStatusLabel: Record<RowStatus, string> = {
  NOT_SUBMITTED: 'ยังไม่ได้ส่ง',
  NOT_PASSED: 'ยังไม่ผ่าน',
  PASSED: 'ผ่านแล้ว',
}
function getRowStatus(status: SubmissionStatus | undefined | null): RowStatus {
  if (!status) {
    return RowStatus.NOT_SUBMITTED
  }
  if (status !== 'accept') {
    return RowStatus.NOT_PASSED
  }
  return RowStatus.PASSED
}
function getRowStatusIcon(status: RowStatus) {
  switch (status) {
    case RowStatus.PASSED:
      return <CheckCircleIcon className="size-4 text-muted-foreground" />
    case RowStatus.NOT_PASSED:
      return <XCircleIcon className="size-4 text-muted-foreground" />
    case RowStatus.NOT_SUBMITTED:
      return (
        <div className="size-3 m-0.5 border-muted-foreground border rounded-full" />
      )
    default:
      exhaustiveGuard(status)
  }
}

const columnHelper = createColumnHelper<ProblemWithoutExampleSchema>()
const columns = [
  columnHelper.accessor('id', {
    header: () => '#',
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center px-6 tabular-nums',
    },
  }),
  columnHelper.accessor('name', {
    id: 'name',
    header: () => 'ชื่อ',
    cell: ({ row }) => {
      const problem = row.original
      return (
        <Link
          isExternal
          href={`/api/problem/${problem.id}`}
          className={clsx(
            'flex flex-col text-sm',
            !problem.show && 'text-muted-foreground'
          )}
        >
          <span className="text-pretty font-semibold tracking-wide mb-0.5">
            {problem.name}
            {isNewProblem(problem) && (
              <span className="ml-2 inline-flex px-1 text-xs tracking-tight text-accent-foreground font-semibold font-heading bg-accent rounded">
                {' '}
                ใหม่ !
              </span>
            )}
          </span>
          <span>
            ({problem.timeLimit / 1000} วินาที {problem.memoryLimit} MB)
          </span>
        </Link>
      )
    },
    meta: {
      cellClassName: 'lg:w-full min-w-[350px]',
    },
  }),
  columnHelper.accessor('passedCount', {
    header: 'ผ่าน',
    cell: ({ row, getValue }) => (
      <InlineComponent
        render={() => {
          const passedCount = getValue()
          const [open, setOpen] = useState(false)
          return passedCount > 0 ? (
            <PassedUserDialog
              problem={row.original}
              open={open}
              setOpen={setOpen}
            >
              <DialogTrigger className="focus-visible:ring-focus text-muted-foreground">
                {passedCount}
              </DialogTrigger>
            </PassedUserDialog>
          ) : (
            <div className="px-1 text-muted-foreground">-</div>
          )
        }}
      />
    ),
    meta: {
      headClassName: 'text-center whitespace-pre',
      cellClassName: 'text-center',
    },
  }),
  columnHelper.display({
    id: 'status',
    header: () => 'สถานะ',
    cell: ({ row }) => (
      <SubmissionStatusButton submission={row.original.latestSubmission} />
    ),
    meta: {
      cellClassName: 'text-center px-0',
    },
    filterFn: (row, columnId: string, filterValue: RowStatus) => {
      return getRowStatus(row.original.latestSubmission?.status) === filterValue
    },
  }),
  columnHelper.display({
    id: 'submit',
    header: 'ส่ง',
    cell: ({ row }) => <SubmitCode problem={row.original} />,
    meta: {
      cellClassName: 'text-center px-0',
    },
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <ActionMenu row={row} />,
    meta: {
      cellClassName: 'text-center pl-2',
    },
  }),
  columnHelper.accessor('recentShowTime', {
    id: 'recentShowTime',
    filterFn: (
      row,
      columnId: string,
      filterValue: NewProblemValue | undefined
    ) => {
      if (filterValue === NEW_PROBLEM) {
        return isNewProblem(row.original)
      }
      return true
    },
  }),
]

const NEW_PROBLEM = 'NEW_PROBLEM'
type NewProblemValue = typeof NEW_PROBLEM
function isNewProblem(problem: { recentShowTime: Date | null; show: boolean }) {
  return (
    problem.show && dayjs(problem.recentShowTime).add(1, 'day').isAfter(dayjs())
  )
}

const ActionMenu = ({ row }: { row: Row<ProblemTableRowSchema> }) => {
  const [openLatestSubmission, setOpenLatestSubmission] = useState(false)
  const [openPassedUser, setOpenPassedUser] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" title="เพิ่มเติม" size="icon">
            <EllipsisHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <NextLink href={`/problem/${row.original.id}`}>
              <PencilSquareIcon />
              {row.original.latestSubmission ? 'แก้ไขการส่งล่าสุด' : 'เขียนส่ง'}
            </NextLink>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenLatestSubmission(true)}
            disabled={!row.original.latestSubmission}
          >
            <CodeBracketIcon />
            การส่งล่าสุด
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenPassedUser(true)}
            disabled={row.original.passedCount === 0}
          >
            <ListBulletIcon />
            ผู้ที่ผ่าน
          </DropdownMenuItem>
          <ToggleShowProblem row={row} />
        </DropdownMenuContent>
      </DropdownMenu>
      <SubmissionDialog
        submissionId={row.original.latestSubmission?.id}
        open={openLatestSubmission}
        setOpen={setOpenLatestSubmission}
      />
      <PassedUserDialog
        problem={row.original}
        open={openPassedUser}
        setOpen={setOpenPassedUser}
      />
    </>
  )
}

const PassedUserDialog = ({
  problem,
  open,
  setOpen,
  children,
}: {
  problem: Pick<ProblemTableRowSchema, 'id' | 'name' | 'passedCount'>
  open: boolean
  setOpen: (open: boolean) => void
  children?: ReactNode
}) => {
  const getPassedUsers = useQuery({
    ...problemKey.getPassedUsers({
      params: { problemId: problem.id.toString() },
    }),
    enabled: open,
  })

  const users =
    getPassedUsers.data?.status === 200 ? getPassedUsers.data.body : undefined

  const { isAdmin } = useUserContext()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="max-w-sm self-start">
        <DialogTitle>ผู้ที่ผ่านข้อ {problem.name}</DialogTitle>
        <DialogDescription>ผ่านแล้ว {problem.passedCount} คน</DialogDescription>
        {!users ? (
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          '-'
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-2">
                <UserAvatar user={user} />
                <Link asChild variant="hidden">
                  <NextLink href={`/user/${user.id}`}>{user.showName}</NextLink>
                </Link>
                {isAdmin && (
                  <Link
                    asChild
                    variant="hidden"
                    title="การส่งที่ผ่าน"
                    isExternal
                  >
                    <NextLink href={`/submission/${user.passedSubmission.id}`}>
                      <ArrowTopRightOnSquareIcon className="size-4" />
                    </NextLink>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ToggleShowProblem = ({ row }: { row: Row<ProblemTableRowSchema> }) => {
  const { user } = useUserContext()
  const problem = row.original
  const toggleShowProblem = problemQuery.toggleShowProblem.useMutation()
  const queryClient = useQueryClient()
  if (user?.role !== UserRole.admin) {
    return null
  }

  return (
    <DropdownMenuItem
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
              queryClient.setQueryData(
                problemKey.getProblemTable().queryKey,
                produce(
                  (draftResult: { body: Array<ProblemTableRowSchema> }) => {
                    const draftProblem = draftResult.body.find(
                      (p) => p.id === problem.id
                    )!
                    draftProblem.show = !problem.show
                  }
                )
              )
              queryClient.invalidateQueries({
                queryKey: problemKey.getProblemTable._def,
              })
            },
            onError: () => {
              toast.error(`ไม่สามารถ${showLabel}โจทย์ได้`, { id: toastId })
            },
          }
        )
      }}
    >
      {row.original.show ? <EyeSlashIcon /> : <EyeIcon />}
      {row.original.show ? 'ปิดโจทย์' : 'เปิดโจทย์'}
    </DropdownMenuItem>
  )
}
