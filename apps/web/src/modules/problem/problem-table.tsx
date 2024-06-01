import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MdUploadFile } from 'react-icons/md'

import {
  CheckCircleIcon,
  ClockIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  ListBulletIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { Row, createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import { File } from '@web-std/file'
import { produce } from 'immer'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { ProblemTableRowSchema } from '@otog/contract'
import { SubmissionStatus, UserRole } from '@otog/database'
import {
  AvatarGroup,
  AvatarMore,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  clsx,
} from '@otog/ui'

import { keyProblem, queryProblem, querySubmission } from '../../api/query'
import { InlineComponent } from '../../components/InlineComponent'
import { FileInput } from '../../components/file-input'
import { SubmissionDialog } from '../../components/submission-dialog'
import { TableComponent } from '../../components/table-component'
import { UserAvatar } from '../../components/user-avatar'
import { useUserContext } from '../../context/user-context'
import { Language, LanguageName } from '../../enums'

export const ProblemTable = () => {
  const { data, isLoading, isError } = useQuery(keyProblem.table())
  const table = useReactTable({
    columns,
    data: data?.status === 200 ? data.body : [],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <TableComponent
      classNames={{
        tableContainer: 'border rounded-lg',
      }}
      table={table}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

const columnHelper = createColumnHelper<ProblemTableRowSchema>()
const columns = [
  columnHelper.accessor('id', {
    header: () => '#',
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center px-6',
    },
  }),
  columnHelper.accessor('name', {
    header: () => 'ชื่อ',
    cell: ({ row }) => {
      const problem = row.original
      return (
        <Link
          isExternal
          href={`/api/problem/${problem.id}`}
          className={clsx(!problem.show && 'text-muted-foreground')}
        >
          <p className="text-pretty font-semibold tracking-wide mb-0.5">
            {problem.name}
          </p>
          <p className="text-sm">
            {/* TODO: fix nullish */}(
            {problem.timeLimit ? problem.timeLimit / 1000 : '-'} วินาที{' '}
            {problem.memoryLimit} MB)
          </p>
        </Link>
      )
    },
    meta: {
      cellClassName: 'w-full',
    },
    enableSorting: false,
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
                  title="ผู้ที่ผ่าน"
                  variant="ghost"
                  className="gap-0 px-2"
                  onClick={() => setOpen(true)}
                >
                  {row.original.samplePassedUsers.map((user) => (
                    <UserAvatar key={user.id} user={user} />
                  ))}
                  {passedCount > 3 && <AvatarMore count={passedCount} />}
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
      headClassName: 'text-end px-0',
      cellClassName: 'text-end px-0',
    },
  }),
  columnHelper.accessor('latestSubmission.status', {
    header: () => 'สถานะ',
    cell: ({ getValue, row }) => (
      <InlineComponent
        render={() => {
          const [open, setOpen] = useState(false)

          const status = getValue() as SubmissionStatus | null
          const display = (() => {
            switch (status) {
              case 'accept':
                return <CheckCircleIcon className="text-green-500" />
              case 'grading':
              case 'waiting':
                return <ClockIcon className="text-muted-foreground" />
              case 'reject':
                return <XCircleIcon className="text-destructive" />
              default:
                return (
                  <div className="size-[15px] border-muted-foreground border rounded-full" />
                )
            }
          })()

          if (!status) {
            return (
              <div
                className="flex justify-center w-full gap-2"
                title="not submitted"
              >
                {display}
              </div>
            )
          }
          return (
            <>
              <Button
                title={status}
                variant="ghost"
                className="[&>svg]:size-5"
                size="icon"
                onClick={() => setOpen(true)}
              >
                {display}
              </Button>
              <SubmissionDialog
                open={open}
                setOpen={setOpen}
                submissionId={row.original.latestSubmission!.id}
              />
            </>
          )
        }}
      />
    ),
    meta: {
      cellClassName: 'text-center px-0',
    },
  }),
  columnHelper.display({
    id: 'submit',
    header: 'ส่ง',
    cell: ({ row }) => (
      <SubmitCode
        problemId={row.original.id}
        // TODO: fix nullish
        problemName={row.original.name ?? '-'}
      />
    ),
    meta: {
      cellClassName: 'text-center px-0',
    },
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <ActionMenu row={row} />,
    meta: {
      cellClassName: 'text-center',
    },
  }),
]

const SubmitCodeFormSchema = z.object({
  sourceCode: z.instanceof(File),
  language: z.nativeEnum(Language),
})
type SubmitCodeFormSchema = z.infer<typeof SubmitCodeFormSchema>

const SubmitCode = (props: { problemId: number; problemName: string }) => {
  const [open, setOpen] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<SubmitCodeFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(SubmitCodeFormSchema),
  })

  const router = useRouter()
  const uploadFile = querySubmission.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problemName}...`)
    await uploadFile.mutateAsync(
      {
        params: { problemId: props.problemId.toString() },
        body: values,
      },
      {
        onError: (result) => {
          console.error(result)
          toast.error('ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', { id: toastId })
        },
        onSuccess: () => {
          toast.success('ส่งสำเร็จแล้ว', { id: toastId })
          setOpen(false)
          router.push('/submission')
        },
      }
    )
  })
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button title="Submit code" size="icon" variant="outline">
          <MdUploadFile />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>ส่งข้อ {props.problemName}</DialogTitle>
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="sourceCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อัปโหลด</FormLabel>
                  <FormControl>
                    <FileInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อัปโหลด</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger {...field}>
                        <SelectValue placeholder="เลือกภาษา" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(LanguageName).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={uploadFile.isPending}
          >
            ส่ง
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">ยกเลิก</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ActionMenu = ({ row }: { row: Row<ProblemTableRowSchema> }) => {
  const [openLatestSubmission, setOpenLatestSubmission] = useState(false)
  const [openPassedUser, setOpenPassedUser] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" title="More options" size="icon">
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
    ...keyProblem.passedUsers({ problemId: problem.id }),
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
                    title="Passed Submission"
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
                keyProblem.table().queryKey,
                produce(
                  (draftResult: { body: Array<ProblemTableRowSchema> }) => {
                    const draftProblem = draftResult.body.find(
                      (p) => p.id === problem.id
                    )!
                    draftProblem.show = !problem.show
                  }
                )
              )
              queryClient.invalidateQueries({ queryKey: keyProblem.table._def })
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
