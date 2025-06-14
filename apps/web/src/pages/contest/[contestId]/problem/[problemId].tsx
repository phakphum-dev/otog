import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { zodResolver } from '@hookform/resolvers/zod'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Columns2Icon } from 'lucide-react'
import Head from 'next/head'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { z } from 'zod'

import {
  ContestSchema,
  SubmissionDetailSchema,
  SubmissionSchema,
} from '@otog/contract'
import { Problem, ProblemModel } from '@otog/database'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Button } from '@otog/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
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
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'
import { Toggle } from '@otog/ui/toggle'
import { clsx } from '@otog/ui/utils'

import {
  contestKey,
  submissionKey,
  submissionQuery,
} from '../../../../api/query'
import { withQuery } from '../../../../api/server'
import { ExampleTable } from '../../../../components/example-table'
import { Footer } from '../../../../components/footer'
import { InfiniteTable } from '../../../../components/infinite-table'
import { InlineComponent } from '../../../../components/inline-component'
import { MonacoEditor } from '../../../../components/monaco-editor'
import {
  ClientInPortal,
  ClientOutPortal,
  useHtmlPortalNode,
} from '../../../../components/portals'
import { ProblemDetail } from '../../../../components/problem-detail'
import { SubmissionDialogButton } from '../../../../components/submission-dialog'
import {
  SubmissionScoreBadge,
  useSubmissionPolling,
} from '../../../../components/submission-table'
import { useUserContext } from '../../../../context/user-context'
import { Language, LanguageName } from '../../../../enums'
import { useContainerBreakpoint } from '../../../../hooks/use-container-breakpoint'
import {
  ContestLayout,
  useContestProps,
} from '../../../../modules/contest/sidebar'
import { SubmitCode } from '../../../../modules/problem/submit-code'

type ProblemModel = z.infer<typeof ProblemModel>

interface ContestProblemPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
  problem: ProblemModel
  latestSubmission: SubmissionDetailSchema | null
}

export const getServerSideProps = withQuery<ContestProblemPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(Number(contestId))) {
      return { notFound: true }
    }
    const problemId = context.query.problemId as string
    if (Number.isNaN(Number(problemId))) {
      return { notFound: true }
    }
    const [getTime, getContest, getProblem, getLatestSubmission] =
      await Promise.all([
        query.app.time.query(),
        query.contest.getContest.query({
          params: { contestId: contestId },
        }),
        query.contest.getContestProblem.query({
          params: { contestId, problemId },
        }),
        query.submission.getLatestSubmissionByProblemId.query({
          params: { problemId },
        }),
      ])
    if (getTime.status !== 200) {
      throw getTime
    }
    if (getContest.status !== 200) {
      throw getContest
    }
    if (getProblem.status !== 200) {
      throw getProblem
    }
    if (getLatestSubmission.status !== 200) {
      throw getLatestSubmission
    }
    const serverTime = getTime.body
    const contest = getContest.body
    if (contest.timeStart > serverTime) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest,
        serverTime: serverTime.toString(),
        problem: getProblem.body,
        latestSubmission: getLatestSubmission.body.submission,
      },
    }
  }
)

export default function ContestPage(props: ContestProblemPageProps) {
  const router = useRouter()
  const contestProps = useContestProps(props)
  const { contest, contestStatus } = contestProps
  const { problem } = props

  useEffect(() => {
    if (contestStatus !== 'RUNNING') {
      router.push(`/contest/${props.contestId}`)
    }
  }, [contestStatus])

  return (
    <ContestLayout {...contestProps}>
      <Head>
        <title>
          {problem.name} - {contest.name} | OTOG
        </title>
      </Head>
      <div className="flex items-center gap-2 p-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbLink
              className="font-heading text-lg font-semibold hidden md:block"
              asChild
            >
              <NextLink href={`/contest/${props.contestId}`}>
                {contest.name}
              </NextLink>
            </BreadcrumbLink>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-heading text-lg font-semibold">
                {problem.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ContestProblemSection {...props} key={problem.id} />
      <Footer className="pt-8 px-4 max-w-full" />
    </ContestLayout>
  )
}
ContestPage.footer = false

const ContestProblemSection = (props: ContestProblemPageProps) => {
  type Tab = 'problem' | 'editor' | 'submissions'
  const [tab, setTab] = useState<Tab>('problem')
  const queryClient = useQueryClient()
  const { containerRef, isBreakpoint: isLargeScreen } =
    useContainerBreakpoint<HTMLDivElement>({
      breakpoint: 960,
    })

  const codeEditorPortal = useHtmlPortalNode()
  const [twoColumn, setTwoColumn] = useState(false)
  useEffect(() => {
    if (!isLargeScreen) {
      setTwoColumn(false)
    }
  }, [isLargeScreen])
  return (
    <section className="flex-1 @container" ref={containerRef}>
      <div
        className={clsx(
          'flex-1 flex flex-col gap-4 px-4',
          !twoColumn && 'max-w-4xl mx-auto'
        )}
      >
        <Tabs value={tab} onValueChange={(tab) => setTab(tab as Tab)}>
          <div className="flex justify-between">
            <TabsList className="bg-transparent p-0">
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
                  twoColumn && '!overflow-y-auto max-h-[800px]'
                )}
              >
                <embed
                  src={`/api/problem/${props.problem.id}`}
                  height="800px"
                  className="w-full rounded-md border min-h-[800px]"
                />
                <ProblemDetail problem={props.problem} />
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
                contestId={props.contest.id}
                problem={props.problem}
                latestSubmission={props.latestSubmission}
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: submissionKey.getContestSubmissions({
                      params: { contestId: props.contestId.toString() },
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
            <ContestSubmissionTable
              contestId={props.contest.id}
              problemId={props.problem.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

const CodeEditorFormSchema = z.object({
  sourceCode: z.string(),
  language: z.nativeEnum(Language),
})
type CodeEditorFormSchema = z.infer<typeof CodeEditorFormSchema>

interface CodeEditorForm {
  problem: Problem
  contestId: number
  latestSubmission: SubmissionDetailSchema | null
  onSuccess: () => void
}
function CodeEditorForm(props: CodeEditorForm) {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<CodeEditorFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(CodeEditorFormSchema),
  })

  const uploadFile = submissionQuery.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problem.name}...`)
    const blob = new Blob([values.sourceCode])
    const file = new File([blob], `${props.problem.id}.${values.language}`)
    await uploadFile.mutateAsync(
      {
        params: { problemId: props.problem.id.toString() },
        query: { contestId: props.contestId.toString() },
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
          props.onSuccess?.()
        },
      }
    )
  }, console.error)

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 h-[800px]"
      >
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
        <div className="grid grid-cols-3">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
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
          <div className="col-start-3 flex gap-2">
            <Button className="flex-1" type="submit">
              ส่ง
            </Button>
            <SubmitCode
              problem={props.problem}
              contestId={props.contestId}
              onSuccess={props.onSuccess}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}

interface ContestSubmissionTableProps {
  contestId: number
  problemId: number
}
function ContestSubmissionTable(props: ContestSubmissionTableProps) {
  const { user } = useUserContext()
  const pageSize = 89
  const getContestSubmissions = useInfiniteQuery({
    queryKey: submissionKey.getContestSubmissions({
      params: { contestId: props.contestId.toString() },
      query: {
        problemId: props.problemId,
        userId: user?.id!,
      },
    }).queryKey,
    // TODO: https://github.com/lukemorales/query-key-factory/issues/89
    queryFn: ({ pageParam }) =>
      submissionQuery.getContestSubmissions.query({
        params: { contestId: props.contestId.toString() },
        query: {
          problemId: props.problemId,
          userId: user?.id!,
          offset: pageParam,
          limit: pageSize,
        },
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.status === 200 ? lastPage.body.at(-1)?.id : undefined,
    enabled: !!user,
  })
  const data = useMemo(
    () =>
      getContestSubmissions.data?.pages.flatMap((page) =>
        page.status === 200 ? page.body : []
      ) ?? [],
    [getContestSubmissions.data]
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <InfiniteTable
      table={table}
      classNames={{ container: 'border-transparent' }}
      isLoading={getContestSubmissions.isLoading}
      isError={getContestSubmissions.isError}
      hasNextPage={getContestSubmissions.hasNextPage}
      fetchNextPage={getContestSubmissions.fetchNextPage}
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
          return <SubmissionScoreBadge submission={submission} />
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
          const memUsed = submission.submissionResult?.memUsed ?? 0
          if (memUsed === -1) return '-'
          return memUsed
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
    id: 'action',
    header: '',
    cell: ({ row: { original } }) => (
      <InlineComponent
        render={() => {
          const submission = useSubmissionPolling(original)
          const queryClient = useQueryClient()
          useEffect(() => {
            if (
              original.submissionResult?.score !==
              submission.submissionResult?.score
            ) {
              queryClient.invalidateQueries({
                queryKey: contestKey.getUserContestScores({
                  params: { contestId: submission.contestId?.toString()! },
                }).queryKey,
              })
            }
          }, [submission])
          return <SubmissionDialogButton submission={submission} />
        }}
      />
    ),
    enableSorting: false,
    meta: {
      cellClassName: 'text-end',
    },
  }),
]
