import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { toast } from 'react-hot-toast'
import { FaLightbulb, FaPencilAlt, FaPlus, FaTrash } from 'react-icons/fa'

import { PencilSquareIcon } from '@heroicons/react/24/solid'
import Editor from '@monaco-editor/react'
import produce from 'immer'
import { useTheme } from 'next-themes'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { SubmissionWithSourceCodeSchema } from '@otog/contract'
import { Problem } from '@otog/database'
import { Link } from '@otog/ui'

import { api, client, query } from '../../api'
import { queryProblem, querySubmission } from '../../api/query'
import { withSession } from '../../api/withSession'

const defaultSourceCode = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`

const extension: Record<string, string> = {
  cpp: '.cpp',
  c: '.c',
  python: '.py',
}

export interface WriteSolutionPageProps {
  submission: SubmissionWithSourceCodeSchema | null
  problem: Problem
}

export default function WriteSolutionPage(props: WriteSolutionPageProps) {
  const { resolvedTheme } = useTheme()
  const problem = props.problem
  console.log(props)
  return (
    <main className="container max-w-4xl ">
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <section className="flex flex-col flex-1 gap-4 mt-8 py-6 px-6 border rounded-2xl">
        <div>
          <h1 className="text-2xl font-semibold inline-flex gap-2 items-center mb-2">
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

        <Editor
          height="90vh"
          className="overflow-hidden rounded-md border"
          theme={resolvedTheme === 'light' ? 'vs-light' : 'vs-dark'}
          defaultLanguage={props.submission?.language ?? 'cpp'}
          defaultValue={props.submission?.sourceCode ?? defaultSourceCode}
        />
      </section>
    </main>
  )
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

// function EditorForm(props: {
//   problem: Problem
//   submission?: getLatestSubmissionByUserId | null
// }) {
//   const { problem, submission } = props
//   const router = useRouter()
//   const [language, setLanguage] = useState<string>(
//     submission?.language ?? 'cpp'
//   )
//   const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
//     setLanguage(event.target.value)
//   }

//   const [value, setValue] = useState<string | undefined>(
//     submission?.sourceCode ?? defaultValue
//   )
//   const onEditorChange = (value: string | undefined) => {
//     setValue(value)
//   }
//   const submitProblemMutation = useMutation(submitProblem)
//   const onSubmit = async () => {
//     if (!value) return
//     const blob = new Blob([value])
//     const file = new File([blob], `${problem.id}${extension[language]}`)
//     try {
//       await submitProblemMutation(problem.id, file, language)
//       router.push('/submission')
//     } catch (e) {
//       onErrorToast(e)
//     }
//   }

//   return (
//     <>
//       <Editor
//         className="overflow-hidden rounded-md"
//         height="75vh"
//         language={language}
//         theme="vs-dark"
//         value={value}
//         onChange={onEditorChange}
//       />

//       <div className="mt-2 grid grid-cols-3">
//         <Select onChange={onChange} value={language}>
//           <option value="cpp">C++</option>
//           <option value="c">C</option>
//           <option value="python">Python</option>
//         </Select>
//         <div className="flex-1" />
//         <Button onClick={onSubmit}>ส่ง</Button>
//       </div>
//     </>
//   )
// }
