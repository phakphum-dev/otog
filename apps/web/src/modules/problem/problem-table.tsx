import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MdUploadFile } from 'react-icons/md'

import {
  CodeBracketIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  ListBulletIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { Row, createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import dayjs from 'dayjs'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { ProblemTableRowSchema } from '@otog/contract'
import { SubmissionStatus, UserRole } from '@otog/database'
import {
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

import { keyProblem, keySubmission, querySubmission } from '../../api/query'
import { CodeHighlight } from '../../components/code'
import { FileInput } from '../../components/file-input'
import { TableComponent } from '../../components/table-component'
import { useUserContext } from '../../context/user-context'
import { Language, LanguageName } from '../../enums'
import { environment } from '../../env'
import { useClipboard } from '../../hooks/use-clipboard'

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
          href={`${environment.API_HOST}/problem/doc/${problem.id}`}
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
    header: () => 'ผ่าน',
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center',
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <div className="w-10 text-center">ส่ง</div>,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <SubmitCode
          problemId={row.original.id}
          // TODO: fix nullish
          problemName={row.original.name ?? '-'}
        />
        <ActionMenu row={row} />
      </div>
    ),
    meta: {
      cellClassName: 'text-center',
    },
  }),
]

const SubmitCodeFormSchema = z.object({
  sourceCode: z.instanceof(File),
  language: z.enum(['cpp', 'c', 'python']),
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
    try {
      await uploadFile.mutateAsync(
        {
          params: { problemId: props.problemId.toString() },
          body: values,
        },
        {
          onError: (result) => {
            console.error(result)
            toast.error('ส่งไม่สำเร็จ', { id: toastId })
          },
          onSuccess: () => {
            toast.success('ส่งสำเร็จแล้ว', { id: toastId })
            setOpen(false)
            router.push('/submission')
          },
        }
      )
    } catch (e) {
      console.error(e)
      toast.error('ส่งโค้ดไม่สำเร็จ', { id: toastId })
    }
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
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
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
            ดูการส่งล่าสุด
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={
              row.original.latestSubmission?.status !== SubmissionStatus.accept
            }
            onClick={() => setOpenPassedUser(true)}
          >
            <ListBulletIcon />
            ดูคนผ่าน
          </DropdownMenuItem>
          <ToggleShowProblem row={row} />
        </DropdownMenuContent>
      </DropdownMenu>
      <LatestSubmissionDialog
        row={row}
        open={openLatestSubmission}
        setOpen={setOpenLatestSubmission}
      />
      <PassedUserDialog
        row={row}
        open={openPassedUser}
        setOpen={setOpenPassedUser}
      />
    </>
  )
}

const PassedUserDialog = ({
  // row,
  open,
  setOpen,
}: {
  row: Row<ProblemTableRowSchema>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  // TODO: fetch data
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>คนผ่าน</DialogTitle>
        <div></div>
      </DialogContent>
    </Dialog>
  )
}

const LatestSubmissionDialog = ({
  row,
  open,
  setOpen,
}: {
  row: Row<ProblemTableRowSchema>
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const getSubmission = useQuery({
    ...keySubmission.getOne({
      submissionId: row.original.latestSubmission?.id!,
    }),
    enabled: !!row.original.latestSubmission && open,
  })
  const submission =
    getSubmission.data?.status === 200 ? getSubmission.data.body : undefined

  const { hasCopied, onCopy } = useClipboard()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>
          <NextLink href={`/problem/${submission?.problem?.id}`}>
            <Link variant="hidden">ข้อ {row.original.name}</Link>
          </NextLink>
        </DialogTitle>
        {submission ? (
          <div className="flex flex-col gap-2 text-sm min-w-0">
            <code className="bg-muted rounded self-start px-0.5">
              {submission.result}
            </code>
            <p>{submission.score ?? 0} คะแนน</p>
            <p>ภาษา {LanguageName[submission.language as Language]}</p>
            <p>เวลารวม {(submission.timeUsed ?? 0) / 1000} วินาที</p>
            <p>
              ส่งเมื่อ{' '}
              {submission.creationDate &&
                dayjs(submission.creationDate).format('DD/MM/BBBB HH:mm:ss')}
            </p>
            <p>
              ส่งโดย{' '}
              <NextLink href={`/user/${submission.user!.id}`}>
                <Link variant="hidden">{submission.user!.showName}</Link>
              </NextLink>
            </p>
            <div className="relative">
              <CodeHighlight
                className="relative"
                code={submission.sourceCode ?? ''}
                language={submission.language ?? 'cpp'}
              />
              <Button
                size="icon"
                title="Copy Code"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => onCopy(submission.sourceCode ?? '')}
              >
                {hasCopied ? <DocumentCheckIcon /> : <DocumentDuplicateIcon />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 flex justify-center align-items">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ToggleShowProblem = ({ row }: { row: Row<ProblemTableRowSchema> }) => {
  const { user } = useUserContext()
  if (user?.role !== UserRole.admin) {
    return null
  }
  return (
    <DropdownMenuItem>
      {row.original.show ? <EyeSlashIcon /> : <EyeIcon />}
      {row.original.show ? 'ปิดโจทย์' : 'เปิดโจทย์'}
    </DropdownMenuItem>
  )
}
