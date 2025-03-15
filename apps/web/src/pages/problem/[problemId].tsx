import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import {
  CheckIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  Cell,
  Row,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import { File } from '@web-std/file'
import dayjs from 'dayjs'
import { produce } from 'immer'
import { Columns2Icon } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { SubmissionDetailSchema, SubmissionSchema } from '@otog/contract'
import { Problem, SubmissionStatus } from '@otog/database'
import { Button } from '@otog/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
import { Link } from '@otog/ui/link'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@otog/ui/resizable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'
import { Spinner } from '@otog/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'
import { Textarea } from '@otog/ui/textarea'
import { Toggle } from '@otog/ui/toggle'
import { clsx } from '@otog/ui/utils'

import { problemQuery, submissionKey, submissionQuery } from '../../api/query'
import { withQuery } from '../../api/server'
import { InlineComponent } from '../../components/inline-component'
import { MonacoEditor } from '../../components/monaco-editor'
import {
  ClientInPortal,
  ClientOutPortal,
  useHtmlPortalNode,
} from '../../components/portals'
import { SubmissionStatusButton } from '../../components/submission-status'
import { useSubmissionPolling } from '../../components/submission-table'
import { TableComponent } from '../../components/table-component'
import { useUserContext } from '../../context/user-context'
import { Language, LanguageName } from '../../enums'
import { useClipboard } from '../../hooks/use-clipboard'
import { useContainerBreakpoint } from '../../hooks/use-container-breakpoint'
import { SubmitCode } from '../../modules/problem/submit-code'

interface WriteSolutionPageProps {
  submission: SubmissionDetailSchema | null
  problem: Problem
}

export const getServerSideProps = withQuery<WriteSolutionPageProps>(
  async ({ context, query }) => {
    const problemId = Number.parseInt(context.query.problemId as string)
    const submissionId = Number.parseInt(context.params?.submissionId as string)
    if (!Number.isInteger(problemId)) {
      return { notFound: true }
    }
    const problemResult = await query.problem.getProblem.query({
      params: { problemId: problemId.toString() },
    })
    if (problemResult.status === 404) {
      return { notFound: true }
    }
    if (problemResult.status !== 200) {
      throw problemResult
    }
    if (Number.isInteger(submissionId)) {
      const submissionResult =
        await query.submission.getSubmissionWithSourceCode.query({
          params: { submissionId: submissionId.toString() },
        })
      if (submissionResult.status === 404) {
        return { notFound: true }
      }
      if (submissionResult.status !== 200) {
        throw submissionResult
      }
      return {
        props: {
          submission: submissionResult.body,
          problem: problemResult.body,
        },
      }
    }
    const submissionResult =
      await query.submission.getLatestSubmissionByProblemId.query({
        params: { problemId: problemId.toString() },
      })
    if (submissionResult.status === 404) {
      return { notFound: true }
    }
    if (submissionResult.status !== 200) {
      throw submissionResult
    }
    return {
      props: {
        submission: submissionResult.body.submission,
        problem: problemResult.body,
      },
    }
  }
)

export default function WriteSolutionPage(props: WriteSolutionPageProps) {
  const problem = props.problem
  return (
    <main className="flex-1 py-8 w-full mx-auto" id="content">
      <Head>
        <title>{problem.name} | One Tambon One Grader</title>
      </Head>
      <ProblemSection {...props} />
    </main>
  )
}

const ProblemSection = (props: WriteSolutionPageProps) => {
  type Tab = 'problem' | 'editor' | 'submissions'
  const [tab, setTab] = useState<Tab>('problem')
  const queryClient = useQueryClient()
  const { containerRef, isBreakpoint: isLargeScreen } =
    useContainerBreakpoint<HTMLDivElement>({
      breakpoint: 960,
    })

  const codeEditorPortal = useHtmlPortalNode()
  const { user } = useUserContext()

  const [twoColumn, setTwoColumn] = useState(false)
  useEffect(() => {
    if (!isLargeScreen) {
      setTwoColumn(false)
    }
  }, [isLargeScreen])
  return (
    <section ref={containerRef} className="w-full @container">
      <div
        className={clsx(
          'flex-1 flex flex-col gap-4 px-4',
          !twoColumn && 'max-w-4xl mx-auto'
        )}
      >
        <div>
          <h1
            className="text-2xl font-heading tracking-tight font-semibold inline-flex gap-2 items-center mb-2"
            aria-label={`โจทย์ข้อที่ ${props.problem.id}: ${props.problem.name}`}
          >
            <PencilSquareIcon className="size-6" />
            {props.problem.name}
          </h1>
          <div className="flex justify-between gap-1">
            <p className="text-sm text-muted-foreground">
              ({props.problem.timeLimit / 1000} วินาที{' '}
              {props.problem.memoryLimit} MB)
            </p>
            <Link
              className="text-sm"
              isExternal
              href={`/api/problem/${props.problem.id}`}
            >
              [ดาวน์โหลด]
            </Link>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(tab) => setTab(tab as Tab)}>
          <div className="flex justify-between">
            <TabsList className="bg-transparent">
              <TabsTrigger
                value="problem"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
              >
                Problem
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className={clsx(
                  'data-[state=active]:bg-muted data-[state=active]:shadow-none',
                  twoColumn && 'hidden'
                )}
              >
                Editor
              </TabsTrigger>
              <TabsTrigger
                value="submissions"
                className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
              >
                Submissions
              </TabsTrigger>
            </TabsList>
            <Toggle
              className={clsx(!isLargeScreen && 'hidden')}
              pressed={twoColumn}
              onPressedChange={(value) => {
                setTwoColumn(value)
                if (value === true && tab === 'editor') {
                  setTab('problem')
                }
              }}
            >
              <Columns2Icon />
            </Toggle>
          </div>
          <TabsContent
            className="data-[state=inactive]:hidden"
            forceMount
            value="problem"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="w-full flex gap-2"
            >
              <ResizablePanel
                defaultSize={50}
                className={clsx(
                  'flex flex-col gap-2',
                  twoColumn && '!overflow-y-scroll max-h-[800px]'
                )}
              >
                <embed
                  src={`/api/problem/${props.problem.id}`}
                  height="800px"
                  className="w-full rounded-md border min-h-[800px]"
                />
                <ExampleTable problem={props.problem} />
              </ResizablePanel>
              {twoColumn && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={50}>
                    <ClientOutPortal node={codeEditorPortal} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </TabsContent>

          <TabsContent
            className="data-[state=inactive]:hidden"
            forceMount
            value="editor"
          >
            <ClientInPortal node={codeEditorPortal}>
              <CodeEditorForm
                problem={props.problem}
                latestSubmission={props.submission}
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: submissionKey.getSubmissionsByProblemId({
                      params: {
                        problemId: props.problem.id.toString(),
                        userId: user?.id.toString()!,
                      },
                    }).queryKey,
                  })
                  setTab('submissions')
                }}
              />
            </ClientInPortal>
            {!twoColumn && <ClientOutPortal node={codeEditorPortal} />}
          </TabsContent>
          <TabsContent
            className="data-[state=inactive]:hidden"
            forceMount
            value="submissions"
          >
            <SubmissionTable problemId={props.problem.id} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

// const ClangdEditor = dynamic(
//   () =>
//     import('../../components/clangd-editor').then((mod) => mod.ClangdEditor),
//   {
//     ssr: false,
//     loading: () => (
//       <p className="flex items-center justify-center w-full h-[800px]">
//         Loading...
//       </p>
//     ),
//   }
// )

const CodeEditorFormSchema = z.object({
  sourceCode: z.string(),
  language: z.nativeEnum(Language),
})
type CodeEditorFormSchema = z.infer<typeof CodeEditorFormSchema>

interface CodeEditorFormProps {
  latestSubmission: SubmissionDetailSchema | null
  problem: Problem
  onSuccess: () => void
}
function CodeEditorForm(props: CodeEditorFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<CodeEditorFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(CodeEditorFormSchema),
  })

  const router = useRouter()
  const uploadFile = submissionQuery.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problem.name}...`)
    const blob = new Blob([values.sourceCode])
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
          props.onSuccess()
        },
      }
    )
  }, console.error)

  const [preferOldEditor] = useState(true)
  const queryClient = useQueryClient()

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
        {!preferOldEditor && form.watch('language') === 'cpp' ? (
          <div className="overflow-hidden rounded-md border">
            {/* <div role="application" aria-label="Clang Editor">
              <ClangdEditor
                className="h-[800px]"
                defaultValue={
                  props.submission?.sourceCode ?? DEFAULT_SOURCE_CODE
                }
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                onMount={(editor) => (editorRef.current = editor)}
              />
            </div>
            <ClangdEditorFooter setPreferOldEditor={setPreferOldEditor} /> */}
          </div>
        ) : (
          <FormField
            control={form.control}
            name="sourceCode"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="sr-only">โค้ด</FormLabel>
                <MonacoEditor
                  height="744px"
                  language={form.watch('language')}
                  defaultValue={props.latestSubmission?.sourceCode}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-3">
          <FormField
            control={form.control}
            name="language"
            defaultValue={Language.cpp}
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="sr-only">ภาษา</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LanguageName).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-start-3 flex gap-2">
            <Button type="submit" className="flex-1">
              ส่ง
            </Button>
            <SubmitCode
              problem={props.problem}
              onSuccess={() => {
                router.push('/submission?all=false')
                queryClient.invalidateQueries({
                  queryKey: submissionKey.getSubmissions._def,
                })
              }}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}

// const ClangdEditorFooter = ({
//   setPreferOldEditor,
// }: {
//   setPreferOldEditor: (preferOldEditor: boolean) => void
// }) => {
//   return (
//     <div className="flex justify-between items-center px-4 py-1">
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button size="icon" variant="ghost" className="rounded-full size-6">
//               <InformationCircleIcon />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent className="whitespace-pre-line flex flex-col items-start">
//             <span>
//               <Link
//                 href="https://github.com/Guyutongxue/clangd-in-browser"
//                 isExternal
//               >
//                 Clangd Editor
//               </Link>{' '}
//               powered by wasm
//             </span>
//             <span>- Error ที่แสดงอาจจะไม่ตรงกับผลลัพธ์หลังการส่ง</span>
//             <span>
//               - <code>{'#include <bits/stdc++.h>'}</code> สามารถใช้งานได้
//             </span>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//       <div className="flex items-center text-xs gap-2">
//         <p>Editor โหลดช้า ?</p>
//         <Button
//           onClick={() => setPreferOldEditor(true)}
//           variant="link"
//           className="text-xs p-0 h-auto"
//         >
//           สลับไปใช้ Version เดิม
//         </Button>
//       </div>
//     </div>
//   )
// }

interface SubmissionTableProps {
  problemId: number
}
function SubmissionTable(props: SubmissionTableProps) {
  const { user } = useUserContext()
  const getSubmissionsByProblemId = useQuery({
    ...submissionKey.getSubmissionsByProblemId({
      params: {
        problemId: props.problemId.toString(),
        userId: user?.id.toString()!,
      },
    }),
    enabled: !!user,
  })
  const data = useMemo(
    () => getSubmissionsByProblemId.data?.body ?? [],
    [getSubmissionsByProblemId.data]
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <TableComponent
      table={table}
      classNames={{ container: 'border-transparent' }}
    />
  )
}

const columnHelper = createColumnHelper<SubmissionSchema>()
const columns = [
  columnHelper.accessor('creationDate', {
    header: 'ส่งเมื่อ',
    cell: ({ getValue }) => dayjs(getValue()).format('DD/MM/BB HH:mm'),
    meta: { cellClassName: 'text-muted-foreground tabular-nums' },
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'score',
    header: 'คะแนน',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          if (
            submission.status == SubmissionStatus.waiting ||
            submission.status == SubmissionStatus.grading
          ) {
            return (
              <div className="inline-flex gap-2 items-center">
                <Spinner size="sm" />
                <div>
                  {submission.submissionResult?.score ?? 0} /{' '}
                  {submission.problem.score}
                </div>
              </div>
            )
          }
          return (
            <div>
              {submission.submissionResult?.score ?? 0} /{' '}
              {submission.problem.score}
            </div>
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName:
        'max-w-[200px] min-w-[100px] whitespace-pre-wrap text-end tabular-nums',
      headClassName: 'text-end',
    },
  }),

  columnHelper.display({
    id: 'timeUsed',
    header: 'เวลาที่ใช้ (วินาที)',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return ((submission.submissionResult?.timeUsed ?? 0) / 1000).toFixed(
            3
          )
        }}
      />
    ),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
  columnHelper.display({
    id: 'memUsed',
    header: 'ความจำที่ใช้ (kB)',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          return ((submission.submissionResult?.memUsed ?? 0) / 1000).toFixed(3)
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

interface Testcase {
  input: string
  output: string
}

interface ExampleTableProps {
  problem: Problem
}

const ExampleTable = ({ problem }: ExampleTableProps) => {
  const examples: Testcase[] = (problem.examples as unknown as Testcase[]) ?? []
  const { isAdmin } = useUserContext()
  const [isEditing, setEditing] = useState(false)
  const [testcases, setTestcases] = useState(examples)

  const updateProblemExamples = problemQuery.updateProblemExamples.useMutation()

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Testcase>()
    return [
      columnHelper.accessor('input', {
        header: 'Input',
        cell: ({ cell, row }) => <TestcaseCell row={row} cell={cell} />,
        meta: {
          headClassName: 'border-r',
          cellClassName: 'border-r relative align-top group/example',
        },
        enableSorting: false,
      }),
      columnHelper.accessor('output', {
        header: 'Output',
        cell: ({ cell, row }) => (
          <>
            <TestcaseCell row={row} cell={cell} />
            <DeleteTestcase row={row} />
            <InsertTestcase row={row} />
          </>
        ),
        meta: {
          headClassName: '',
          cellClassName: 'relative align-top group/example',
        },
        enableSorting: false,
      }),
    ]
  }, [])

  const table = useReactTable({
    columns,
    data: testcases,
    getCoreRowModel: getCoreRowModel(),
  })

  if (examples.length === 0) {
    return null
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-xl font-bold font-heading">ตัวอย่าง</h3>
        {isAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="แก้ไข"
            onClick={() => {
              setEditing(true)
              if (testcases.length === 0) {
                setTestcases(
                  produce((tests) => {
                    tests.push({ input: '', output: '' })
                  })
                )
              }
            }}
          >
            <PencilIcon />
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(false)
                setTestcases(examples)
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                const toastId = toast.loading('กำลังบันทึก...')
                updateProblemExamples.mutateAsync(
                  {
                    params: { problemId: problem.id.toString() },
                    body: testcases,
                  },
                  {
                    onError: (result) => {
                      console.error(result)
                      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', {
                        id: toastId,
                      })
                    },
                    onSuccess: () => {
                      toast.success('บันทึกสำเร็จแล้ว', { id: toastId })
                      setEditing(false)
                    },
                  }
                )
              }}
            >
              บันทึก
            </Button>
          </div>
        )}
      </div>
      <TestcaseTableContext.Provider
        value={{ isEditing, setEditing, testcases, setTestcases }}
      >
        <TableComponent
          table={table}
          className="table-fixed relative group/table"
          classNames={{
            container: 'overflow-x-visible overflow-y-visible',
            bodyRow: 'group/row',
          }}
        />
      </TestcaseTableContext.Provider>
    </div>
  )
}

interface TestcaseTableContextValue {
  isEditing: boolean
  setEditing: (isEditing: boolean) => void
  testcases: Testcase[]
  setTestcases: Dispatch<SetStateAction<Testcase[]>>
}
const TestcaseTableContext = createContext<TestcaseTableContextValue>(
  {} as TestcaseTableContextValue
)
const useTestcaseTableContext = () => useContext(TestcaseTableContext)

const TestcaseCell = ({
  cell,
  row,
}: {
  row: Row<Testcase>
  cell: Cell<Testcase, string>
}) => {
  const { onCopy, hasCopied } = useClipboard()
  const { isEditing, setTestcases } = useTestcaseTableContext()
  useEffect(() => {
    if (hasCopied) {
      toast.success('คัดลอกไปยังคลิปบอร์ดแล้ว')
    }
  }, [hasCopied])
  if (isEditing) {
    return (
      <Textarea
        className="font-mono"
        value={cell.getValue()}
        onChange={(e) => {
          const value = e.target.value
          setTestcases(
            produce((testcases) => {
              const col = cell.column.id as 'input' | 'output'
              testcases[row.index]![col] = value
            })
          )
        }}
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <code className="whitespace-pre" id="input">
        {cell.getValue()}
      </code>
      <Button
        onClick={() => onCopy(cell.getValue())}
        size="icon"
        variant="ghost"
        className="invisible absolute right-2 top-2 group-hover/example:visible"
      >
        {hasCopied ? <CheckIcon /> : <DocumentDuplicateIcon />}
      </Button>
    </div>
  )
}

const DeleteTestcase = ({ row }: { row: Row<Testcase> }) => {
  const { isEditing, setTestcases } = useTestcaseTableContext()
  if (!isEditing) {
    return null
  }

  const onRemove = () => {
    setTestcases(
      produce((tests) => {
        tests.splice(row.index, 1)
      })
    )
  }
  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 invisible group-hover/row:visible"
      onClick={onRemove}
    >
      <TrashIcon />
    </Button>
  )
}

const InsertTestcase = ({ row }: { row: Row<Testcase> }) => {
  const { isEditing, setTestcases } = useTestcaseTableContext()
  if (!isEditing) {
    return null
  }
  const addEmptyTestcase = () => {
    setTestcases(
      produce((testcases) => {
        testcases.splice(row.index + 1, 0, { input: '', output: '' })
      })
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute -bottom-5 -right-5 invisible group-hover/row:visible"
      onClick={addEmptyTestcase}
    >
      <PlusIcon />
    </Button>
  )
}
