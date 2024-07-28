import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { PencilSquareIcon } from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import MonacoEditor from '@monaco-editor/react'
import { File } from '@web-std/file'
import { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { SubmissionWithSourceCodeSchema } from '@otog/contract'
import { Problem } from '@otog/database'
import {
  Button,
  Form,
  FormField,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@otog/ui'

import { queryProblem, querySubmission } from '../../api/query'
import { withSession } from '../../api/with-session'
import { Language, LanguageName } from '../../enums'
import { SubmitCode } from '../../modules/problem/submit-code'

interface WriteSolutionPageProps {
  submission: SubmissionWithSourceCodeSchema | null
  problem: Problem
}

export const getServerSideProps = withSession<WriteSolutionPageProps>(
  async (_session, context) => {
    const problemId = Number.parseInt(context.query.problemId as string)
    const submissionId = Number.parseInt(context.params?.submissionId as string)
    if (!Number.isInteger(problemId)) {
      return { notFound: true }
    }
    const problemResult = await queryProblem.getProblem.query({
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
        await querySubmission.getSubmissionWithSourceCode.query({
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
      await querySubmission.getLatestSubmissionByProblemId.query({
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

const DEFAULT_SOURCE_CODE = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`

export default function WriteSolutionPage(props: WriteSolutionPageProps) {
  const problem = props.problem
  return (
    <main className="container max-w-4xl flex-1">
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <section className="flex flex-col flex-1 gap-4 mt-8 p-6 border rounded-2xl">
        <div>
          <h1 className="text-2xl font-heading tracking-tight font-semibold inline-flex gap-2 items-center mb-2">
            <PencilSquareIcon className="size-6" />
            {problem.name}
          </h1>
          <div className="flex justify-between gap-1">
            <p className="text-sm text-muted-foreground">
              {/* TODO: fix nullish */}(
              {problem.timeLimit ? problem.timeLimit / 1000 : '-'} วินาที{' '}
              {problem.memoryLimit} MB)
            </p>
            <Link
              className="text-sm"
              isExternal
              href={`/api/problem/${problem.id}`}
            >
              [ดาวน์โหลด]
            </Link>
          </div>
        </div>
        <CodeEditorForm {...props} />
      </section>
    </main>
  )
}

const ClangdEditor = dynamic(
  () =>
    import('../../components/clangd-editor').then((mod) => mod.ClangdEditor),
  {
    ssr: false,
    loading: () => (
      <p className="flex items-center justify-center w-full h-[800px]">
        Loading...
      </p>
    ),
  }
)

const CodeEditorFormSchema = z.object({
  // sourceCode: z.string(),
  language: z.nativeEnum(Language),
})
type CodeEditorFormSchema = z.infer<typeof CodeEditorFormSchema>

function CodeEditorForm(props: WriteSolutionPageProps) {
  const { resolvedTheme } = useTheme()

  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<CodeEditorFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(CodeEditorFormSchema),
  })

  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const router = useRouter()
  const uploadFile = querySubmission.uploadFile.useMutation({})
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
          router.push('/submission')
        },
      }
    )
  }, console.error)

  const [preferOldEditor, setPreferOldEditor] = useState(false)

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col">
        {!preferOldEditor && form.watch('language') === 'cpp' ? (
          <div className="overflow-hidden rounded-md border">
            <ClangdEditor
              className="h-[800px]"
              defaultValue={props.submission?.sourceCode ?? DEFAULT_SOURCE_CODE}
              theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              onMount={(editor) => (editorRef.current = editor)}
            />
            <ClangdEditorFooter setPreferOldEditor={setPreferOldEditor} />
          </div>
        ) : (
          <MonacoEditor
            className="overflow-hidden rounded-md border"
            height="800px"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
            defaultValue={props.submission?.sourceCode ?? DEFAULT_SOURCE_CODE}
            language={form.watch('language')}
            onMount={(editor) => (editorRef.current = editor)}
          />
        )}

        <div className="grid grid-cols-3 mt-4">
          <FormField
            control={form.control}
            name="language"
            defaultValue={Language.cpp}
            render={({ field }) => (
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
            )}
          />
          <div className="col-start-3 flex gap-2">
            <Button type="submit" className="flex-1">
              ส่ง
            </Button>
            <SubmitCode problem={props.problem} />
          </div>
        </div>
      </form>
    </Form>
  )
}

const ClangdEditorFooter = ({
  setPreferOldEditor,
}: {
  setPreferOldEditor: (preferOldEditor: boolean) => void
}) => {
  return (
    <div className="flex justify-between items-center px-4 py-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="rounded-full size-6">
              <InformationCircleIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="whitespace-pre-line flex flex-col items-start">
            <span>
              <Link
                href="https://github.com/Guyutongxue/clangd-in-browser"
                isExternal
              >
                Clangd Editor
              </Link>{' '}
              powered by wasm
            </span>
            <span>- Error ที่แสดงอาจจะไม่ตรงกับผลลัพธ์หลังการส่ง</span>
            <span>
              - <code>{'#include <bits/stdc++.h>'}</code> สามารถใช้งานได้
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex items-center text-xs gap-2">
        <p>Editor โหลดช้า ?</p>
        <Button
          onClick={() => setPreferOldEditor(true)}
          variant="link"
          className="text-xs p-0 h-auto"
        >
          สลับไปใช้ Version เดิม
        </Button>
      </div>
    </div>
  )
}
