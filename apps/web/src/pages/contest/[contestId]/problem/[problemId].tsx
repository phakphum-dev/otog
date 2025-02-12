import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { ContestSchema } from '@otog/contract'
import { Problem, ProblemModel } from '@otog/database'
import {
  Breadcrumb,
  BreadcrumbItem,
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

import { submissionKey, submissionQuery } from '../../../../api/query'
import { withQuery } from '../../../../api/server'
import { Footer } from '../../../../components/footer'
import { MonacoEditor } from '../../../../components/monaco-editor'
import { Language, LanguageName } from '../../../../enums'
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
    const [getTime, getContest] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
    ])
    if (getTime.status !== 200 || getContest.status !== 200) {
      return { notFound: true }
    }
    const serverTime = getTime.body
    const contest = getContest.body
    if (contest.timeStart > serverTime) {
      return { notFound: true }
    }
    const getProblem = await query.contest.getContestProblem.query({
      params: { contestId, problemId },
    })
    if (getProblem.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest,
        serverTime: serverTime.toString(),
        problem: getProblem.body,
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
  // TODO save instance
  return (
    <ContestLayout {...contestProps}>
      <Head>
        <title>
          {problem.name} | {contest.name} | OTOG
        </title>
      </Head>
      <div className="flex items-center gap-2 p-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="font-heading text-lg font-semibold hidden md:block">
              <Breadcrumb>{contest.name}</Breadcrumb>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-heading text-lg font-semibold">
                {problem.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* TODO: Make new layout (maybe CMS-like?) */}
      {/* <AnnouncementCarousel contestId={contest.id} /> */}
      {/* <TaskCard problem={problem} contestId={contest.id} /> */}
      <section className="@container flex-1">
        <Tabs defaultValue="problem">
          <TabsList className="bg-transparent px-4">
            <TabsTrigger
              value="problem"
              className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              Problem
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="data-[state=active]:bg-muted data-[state=active]:shadow-none @[60rem]:hidden"
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
          <div className="px-4">
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
                  className="flex flex-col gap-2"
                >
                  <embed
                    src={`/api/problem/${problem.id}`}
                    height="800px"
                    className="w-full rounded-md border"
                  />
                </ResizablePanel>
                <ResizableHandle className="hidden @[60rem]:block" />
                <ResizablePanel
                  defaultSize={50}
                  className="hidden @[60rem]:block"
                >
                  {/* TODO: share form instance */}
                  <CodeEditorForm contestId={contest.id} problem={problem} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent
              className="data-[state=inactive]:hidden"
              forceMount
              value="editor"
            >
              <CodeEditorForm contestId={contest.id} problem={problem} />
            </TabsContent>
            <TabsContent
              className="data-[state=inactive]:hidden"
              forceMount
              value="submissions"
            >
              <p className="p-4 text-center text-xs text-muted-foreground">
                Submissions
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </section>
      <Footer className="pt-8 px-4 max-w-full" />
    </ContestLayout>
  )
}
ContestPage.footer = false

const CodeEditorFormSchema = z.object({
  sourceCode: z.string(),
  language: z.nativeEnum(Language),
})
type CodeEditorFormSchema = z.infer<typeof CodeEditorFormSchema>

interface CodeEditorForm {
  problem: Problem
  contestId: number
}
function CodeEditorForm(props: CodeEditorForm) {
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

  const queryClient = useQueryClient()
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
                defaultValue={submission?.sourceCode}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 sm:gap-4">
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
          <div className="flex-1" />
          <div className="flex gap-2 flex-1">
            <Button className="flex-1" type="submit">
              ส่ง
            </Button>
            <SubmitCode problem={props.problem} contestId={props.contestId} />
          </div>
        </div>
      </form>
    </Form>
  )
}
