import { forwardRef, useMemo, useState } from 'react'
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
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/table-core'
import dayjs from 'dayjs'
import { produce } from 'immer'
import NextLink from 'next/link'

import { ProblemTableRowSchema } from '@otog/contract'
import { SubmissionStatus, UserRole } from '@otog/database'
import {
  AvatarGroup,
  AvatarMore,
  Button,
  ButtonProps,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputLeftIcon,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectPrimitive,
  Spinner,
  VariantProps,
  clsx,
  cva,
} from '@otog/ui'

import { keyProblem, queryProblem } from '../../api/query'
import { DebouncedInput } from '../../components/debounced-input'
import { InlineComponent } from '../../components/inline-component'
import { SubmissionDialog } from '../../components/submission-dialog'
import { SubmissionStatusButton } from '../../components/submission-status'
import { TableVirtuosoComponent } from '../../components/table-component'
import { UserAvatar } from '../../components/user-avatar'
import { useUserContext } from '../../context/user-context'
import { exhaustiveGuard } from '../../utils/exhaustive-guard'
import { SubmitCode } from './submit-code'

export const ProblemTable = () => {
  const { data, isLoading, isError } = useQuery(keyProblem.getProblemTable())
  const problems = useMemo(
    () => (data?.status === 200 ? data.body : []),
    [data]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const table = useReactTable({
    columns,
    data: problems,
    filterFns: {},
    state: {
      columnFilters,
      columnVisibility: { recentShowTime: false },
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <main id="content" className="flex flex-col gap-4">
      <h1 className="sr-only">โจทย์</h1>
      <OtogButtons table={table} problems={problems} isLoading={isLoading} />
      <div className="flex flex-col gap-4">
        <TableFilter table={table} />
        <TableVirtuosoComponent
          table={table}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </main>
  )
}

const OtogButtons = ({
  table,
  problems,
  isLoading,
}: {
  table: Table<any>
  problems: ProblemTableRowSchema[]
  isLoading: boolean
}) => {
  const counts = useMemo(() => {
    const counts: Record<RowStatus | NewProblemValue, number> = {
      NOT_PASSED: 0,
      NOT_SUBMITTED: 0,
      PASSED: 0,
      NEW_PROBLEM: 0,
    }
    problems.forEach((problem) => {
      if (isNewProblem(problem)) {
        counts.NEW_PROBLEM += 1
      }
      const status = getRowStatus(problem.latestSubmission?.status)
      counts[status] += 1
    })
    return counts
  }, [problems])

  const statusColumn = table.getColumn('status')!
  const statusFilterValue = statusColumn.getFilterValue() as
    | RowStatus
    | undefined
  const createStatusFilterToggle = (status: RowStatus) => {
    return () =>
      statusColumn.setFilterValue(
        statusFilterValue === status ? undefined : status
      )
  }

  const recentShowTimeColumn = table.getColumn('recentShowTime')!
  const newProblemFilterValue = recentShowTimeColumn.getFilterValue() as
    | NewProblemValue
    | undefined
  const toggleNewProblemFilter = () => {
    recentShowTimeColumn.setFilterValue(
      newProblemFilterValue === NEW_PROBLEM ? undefined : NEW_PROBLEM
    )
  }

  const clearFilter = () => {
    statusColumn.setFilterValue(undefined)
    recentShowTimeColumn.setFilterValue(undefined)
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <OtogButton
        label="ทั้งหมด"
        number={problems.length}
        colorScheme="default"
        isLoading={isLoading}
        onClick={clearFilter}
      />
      <OtogButton
        label="ผ่านแล้ว"
        number={counts.PASSED}
        colorScheme="green"
        isLoading={isLoading}
        onClick={createStatusFilterToggle(RowStatus.PASSED)}
      />
      <OtogButton
        label="ยังไม่ผ่าน"
        number={counts.NOT_PASSED}
        colorScheme="red"
        isLoading={isLoading}
        onClick={createStatusFilterToggle(RowStatus.NOT_PASSED)}
      />
      <OtogButton
        label="ยังไม่ได้ส่ง"
        number={counts.NOT_SUBMITTED}
        colorScheme="yellow"
        isLoading={isLoading}
        onClick={createStatusFilterToggle(RowStatus.NOT_SUBMITTED)}
      />
      <OtogButton
        label="โจทย์วันนี้"
        number={counts.NEW_PROBLEM}
        colorScheme="blue"
        isLoading={isLoading}
        onClick={toggleNewProblemFilter}
      />
    </div>
  )
}

const TableFilter = ({ table }: { table: Table<any> }) => {
  const nameColumn = table.getColumn('name')!
  const statusColumn = table.getColumn('status')!
  const statusFilterValue = statusColumn.getFilterValue() as
    | RowStatus
    | undefined

  const recentShowTimeColumn = table.getColumn('recentShowTime')!
  const newProblemFilterValue = recentShowTimeColumn.getFilterValue() as
    | NewProblemValue
    | undefined

  const toggleNewProblemFilter = () => {
    recentShowTimeColumn.setFilterValue(
      newProblemFilterValue === NEW_PROBLEM ? undefined : NEW_PROBLEM
    )
  }
  return (
    <div className="flex gap-4 sticky py-2 -my-2 top-[calc(var(--navbar))] bg-background z-10">
      <InputGroup>
        <InputLeftIcon>
          <MagnifyingGlassIcon />
        </InputLeftIcon>
        <DebouncedInput
          placeholder="ค้นหา..."
          onDebounce={(value) => nameColumn.setFilterValue(value)}
        />
      </InputGroup>
      <div className="flex gap-2">
        <Select
          value={statusFilterValue ?? ''}
          onValueChange={statusColumn.setFilterValue}
        >
          <SelectPrimitive.Trigger asChild>
            <Button variant="outline" className="font-normal">
              <FunnelIcon />
              สถานะ
              {statusFilterValue && (
                <>
                  <hr className="h-full border-l" />
                  {getRowStatusIcon(statusFilterValue)}
                  <div className="font-normal">
                    {RowStatusLabel[statusFilterValue]}
                  </div>
                </>
              )}
            </Button>
          </SelectPrimitive.Trigger>
          <SelectContent>
            {Object.entries(RowStatusLabel).map(([value, label]) => (
              <SelectItem
                value={value}
                key={value}
                onPointerUp={() => {
                  if (value === statusFilterValue) {
                    statusColumn.setFilterValue('')
                  }
                }}
              >
                <div className="flex gap-2 items-center">
                  {getRowStatusIcon(value as RowStatus)}
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {newProblemFilterValue && (
          <Button
            variant="outline"
            className="font-normal"
            onClick={toggleNewProblemFilter}
          >
            โจทย์วันนี้
            <XMarkIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

const otogButtonVariants = cva(
  'aspect-[5/4] h-auto flex flex-col rounded-lg py-2 max-sm:w-28 sm:h-full sm:flex-1 sm:gap-2',
  {
    variants: {
      colorScheme: {
        default: 'text-foreground bg-accent hover:bg-accent/90',
        green:
          'text-background bg-otog-green hover:bg-otog-green/90 dark:bg-otog-green-200 hover:dark:bg-otog-green-200/90',
        red: 'text-background bg-otog-red hover:bg-otog-red/90 dark:bg-otog-red-200 hover:dark:bg-otog-red-200/90',
        yellow:
          'text-background bg-otog-yellow hover:bg-otog-yellow/90 dark:bg-otog-yellow-200 hover:dark:bg-otog-yellow-200/90',
        blue: 'text-background bg-otog-blue hover:bg-otog-blue/90 dark:bg-otog-blue-200 hover:dark:bg-otog-blue-200/90',
      },
      isLoading: { true: 'animate-pulse' },
    },
  }
)

interface OtogButtonProps
  extends ButtonProps,
    VariantProps<typeof otogButtonVariants> {
  isLoading: boolean
  label: string
  number: number
}

const OtogButton = forwardRef<HTMLButtonElement, OtogButtonProps>(
  ({ label, number, isLoading, colorScheme = 'default', ...props }, ref) => {
    return (
      <Button
        className={clsx(otogButtonVariants({ isLoading, colorScheme }))}
        {...props}
        ref={ref}
      >
        {isLoading ? null : (
          <>
            <h6>{label}</h6>
            <h3 className="text-3xl font-bold md:text-4xl">{number}</h3>
          </>
        )}
      </Button>
    )
  }
)
OtogButton.displayName = 'OtogButton'

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

const columnHelper = createColumnHelper<ProblemTableRowSchema>()
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
            'flex flex-col',
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
          <span className="text-sm">
            {/* TODO: fix nullish */}(
            {problem.timeLimit ? problem.timeLimit / 1000 : '-'} วินาที{' '}
            {problem.memoryLimit} MB)
          </span>
        </Link>
      )
    },
    meta: {
      cellClassName: 'w-full',
    },
  }),
  columnHelper.accessor('passedCount', {
    header: 'ผ่านแล้ว',
    cell: ({ row, getValue }) => (
      <InlineComponent
        render={() => {
          const passedCount = getValue()
          const [open, setOpen] = useState(false)
          return passedCount > 0 ? (
            <>
              <AvatarGroup asChild>
                <Button
                  title={`${passedCount} คน`}
                  aria-label={`${passedCount} คน`}
                  variant="ghost"
                  className="gap-0 px-1"
                  onClick={() => setOpen(true)}
                >
                  {row.original.samplePassedUsers.map((user) => (
                    <UserAvatar key={user.id} user={user} />
                  ))}
                  {passedCount > 3 && (
                    <AvatarMore aria-hidden count={passedCount} />
                  )}
                </Button>
              </AvatarGroup>
              <PassedUserDialog
                problem={row.original}
                open={open}
                setOpen={setOpen}
              />
            </>
          ) : (
            <div className="px-1 text-muted-foreground">-</div>
          )
        }}
      />
    ),
    meta: {
      headClassName: 'text-end px-0 whitespace-pre',
      cellClassName: 'text-end px-0',
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
}: {
  problem: Pick<ProblemTableRowSchema, 'id' | 'name'>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const getPassedUsers = useQuery({
    ...keyProblem.getPassedUsers({
      params: { problemId: problem.id.toString() },
    }),
    enabled: open,
  })

  const users =
    getPassedUsers.data?.status === 200 ? getPassedUsers.data.body : undefined

  const { isAdmin } = useUserContext()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogTitle>ผู้ที่ผ่านข้อ {problem.name}</DialogTitle>
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
  const toggleShowProblem = queryProblem.toggleShowProblem.useMutation()
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
                keyProblem.getProblemTable().queryKey,
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
                queryKey: keyProblem.getProblemTable._def,
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
