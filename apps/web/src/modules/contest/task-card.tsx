import { useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { zodResolver } from '@hookform/resolvers/zod'
import MonacoEditor from '@monaco-editor/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import { z } from 'zod'

import { SubmissionSchema } from '@otog/contract'
import { Problem, SubmissionStatus } from '@otog/database'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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

import { submissionKey, submissionQuery } from '../../api/query'
import { FileInput } from '../../components/file-input'
import { InlineComponent } from '../../components/inline-component'
import { SubmissionStatusButton } from '../../components/submission-status'
import { useSubmissionPolling } from '../../components/submission-table'
import { TableComponent } from '../../components/table-component'
import { Language, LanguageName } from '../../enums'
import { useDisclosure } from '../../hooks/use-disclosure'
import { ONE_SECOND } from '../../utils/time'

interface TaskCardProps {
  problem: Problem
  contestId: number
}
export const TaskCard = (props: TaskCardProps) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true })
  const { isOpen: isEditorOpen, onToggle: onEditorToggle } = useDisclosure()
  const latestSubmissionQuery = useQuery(
    submissionKey.getLatestSubmissionByProblemId({
      params: { problemId: props.problem.id.toString() },
    })
  )
  const submission =
    latestSubmissionQuery.data?.status === 200
      ? latestSubmissionQuery.data.body.submission
      : undefined
  console.log(submission)

  return (
    <Collapsible open={isOpen}>
      <section className="rounded-lg border shadow-sm">
        <CollapsibleTrigger asChild>
          <Button
            className={clsx(
              'justify-between p-4 py-6 sm:p-6 w-full',
              isOpen && 'rounded-b-none'
            )}
            variant="ghost"
            onClick={onToggle}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold">{props.problem.name}</h3>
              {submission?.status === 'accept' && (
                <div className="inline-flex rounded bg-green-100 px-1 text-xs font-bold uppercase text-green-800 dark:bg-green-500/15 dark:text-green-200">
                  Solved
                </div>
              )}
            </div>
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <hr />
          <div className="flex flex-col gap-4 p-4 sm:p-6 sm:pt-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Link
                  isExternal
                  href={`/api/problem/${props.problem.id}`}
                  className="text-sm"
                >
                  [ดาวน์โหลด]
                </Link>
                <p className="text-sm">
                  ({props.problem.timeLimit / ONE_SECOND} วินาที{' '}
                  {props.problem.memoryLimit} MB)
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  aria-label="toggle-code-editor"
                  size="icon"
                  variant="ghost"
                  onClick={onEditorToggle}
                >
                  {isEditorOpen ? <XMarkIcon /> : <PencilIcon />}
                </Button>
              </CollapsibleTrigger>
            </div>
            {isEditorOpen ? (
              <ContestEditorForm {...props} />
            ) : (
              <ContestFileForm {...props} />
            )}
            {submission && <TaskSubmissionTable submission={submission} />}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

const SubmitCodeFormSchema = z.object({
  sourceCode: z.instanceof(File),
  language: z.nativeEnum(Language),
})
type SubmitCodeFormSchema = z.infer<typeof SubmitCodeFormSchema>

export const ContestFileForm = (props: TaskCardProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<SubmitCodeFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(SubmitCodeFormSchema),
  })

  const queryClient = useQueryClient()
  const uploadFile = submissionQuery.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problem.name}...`)
    await uploadFile.mutateAsync(
      {
        params: { problemId: props.problem.id.toString() },
        query: { contestId: props.contestId.toString() },
        body: values,
      },
      {
        onError: (result) => {
          console.error(result)
          toast.error('ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', { id: toastId })
        },
        onSuccess: () => {
          toast.success('ส่งสำเร็จแล้ว', { id: toastId })
          queryClient.invalidateQueries({
            queryKey: submissionKey.getLatestSubmissionByProblemId({
              params: { problemId: props.problem.id.toString() },
            }).queryKey,
          })
          form.reset()
        },
      }
    )
  })
  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <FormField
          control={form.control}
          name="sourceCode"
          render={({ field }) => (
            <FormItem className="flex-1">
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
            <FormItem className="flex-1">
              <FormLabel>ภาษา</FormLabel>
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
        <Button type="submit" className="mt-7">
          ส่ง
        </Button>
      </form>
    </Form>
  )
}

const CodeEditorFormSchema = z.object({
  // sourceCode: z.string(),
  language: z.nativeEnum(Language),
})
type CodeEditorFormSchema = z.infer<typeof CodeEditorFormSchema>

export const ContestEditorForm = (props: TaskCardProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<CodeEditorFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(CodeEditorFormSchema),
  })

  const latestSubmissionQuery = useQuery(
    submissionKey.getLatestSubmissionByProblemId({
      params: { problemId: props.problem.id.toString() },
    })
  )
  const submission =
    latestSubmissionQuery.data?.status === 200
      ? latestSubmissionQuery.data.body.submission
      : undefined

  const { resolvedTheme } = useTheme()
  const editorRef = useRef<editor.IStandaloneCodeEditor>()

  const queryClient = useQueryClient()
  const uploadFile = submissionQuery.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    if (!editorRef.current) {
      toast.error(`ไม่พบ VS Code ใน Browser`)
      return
    }
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problem.name}...`)
    const value = editorRef.current.getValue()
    const blob = new Blob([value])
    const file = new File([blob], `${props.problem.id}.${values.language}`)
    await uploadFile.mutateAsync(
      {
        params: { problemId: props.problem.id.toString() },
        body: {
          sourceCode: file,
          language: values.language,
        },
      },
      {
        onError: (result) => {
          console.error(result)
          toast.error('ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', { id: toastId })
        },
        onSuccess: () => {
          toast.success('ส่งสำเร็จแล้ว', { id: toastId })
          queryClient.invalidateQueries({
            queryKey: submissionKey.getLatestSubmissionByProblemId({
              params: { problemId: props.problem.id.toString() },
            }).queryKey,
          })
        },
      }
    )
  }, console.error)

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
        <div role="application" aria-label="Code Editor">
          <MonacoEditor
            className="overflow-hidden rounded-md border"
            height="600px"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
            defaultValue={submission?.sourceCode ?? DEFAULT_SOURCE_CODE}
            language={form.watch('language')}
            onMount={(editor) => (editorRef.current = editor)}
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">ภาษา</FormLabel>
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
          <div className="flex-1" />
          <Button className="flex-1" onClick={onSubmit}>
            ส่ง
          </Button>
        </div>
      </form>
    </Form>
  )
}

const DEFAULT_SOURCE_CODE = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`

const TaskSubmissionTable = ({
  submission,
}: {
  submission: SubmissionSchema
}) => {
  const data = useMemo(() => [submission], [submission])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  })
  return <TableComponent table={table} />
}

const columnHelper = createColumnHelper<SubmissionSchema>()
const columns = [
  columnHelper.accessor('creationDate', {
    header: 'ส่งเมื่อ',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BB HH:mm'),
    enableSorting: false,
    meta: {
      headClassName: '',
      cellClassName: 'text-muted-foreground tabular-nums',
    },
  }),
  columnHelper.accessor('result', {
    header: 'ผลลัพธ์',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          if (
            submission.status === SubmissionStatus.waiting ||
            submission.status === SubmissionStatus.grading
          ) {
            return (
              <div className="inline-flex gap-2 items-center">
                <Spinner size="sm" />
                {submission.result}
              </div>
            )
          }
          return (
            <code className="font-mono line-clamp-3 text-pretty">
              {submission.result}
            </code>
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName: 'max-w-[200px] whitespace-pre-wrap',
    },
  }),
  columnHelper.accessor('timeUsed', {
    header: 'เวลารวม (วินาที)',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return ((submission.timeUsed ?? 0) / 1000).toFixed(3)
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),

  columnHelper.accessor('status', {
    header: 'สถานะ',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return <SubmissionStatusButton submission={submission} />
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-center',
      cellClassName: 'text-center',
    },
  }),
]
