import {
  CheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { CodeBracketIcon } from '@heroicons/react/24/solid'
import dayjs from 'dayjs'
import Head from 'next/head'
import NextLink from 'next/link'

import { SubmissionWithSourceCodeSchema } from '@otog/contract'
import { Button, Link } from '@otog/ui'

import { querySubmission } from '../../api/query'
import { withSession } from '../../api/with-session'
import { CodeHighlight } from '../../components/code-highlight'
import { UserAvatar } from '../../components/user-avatar'
import { Language, LanguageName } from '../../enums'
import { useClipboard } from '../../hooks/use-clipboard'

interface SubmissionPageProps {
  submission: SubmissionWithSourceCodeSchema
}

export const getServerSideProps = withSession<SubmissionPageProps>(
  async (_session, context) => {
    const submissionId = Number.parseInt(context.query?.submissionId as string)
    if (!Number.isInteger(submissionId)) {
      return { notFound: true }
    }

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
      },
    }
  }
)

export default function SubmissionPage(props: SubmissionPageProps) {
  const submission = props.submission
  const { hasCopied, onCopy } = useClipboard()

  return (
    <main className="container max-w-3xl flex-1">
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <section className="border rounded-2xl p-6 mt-8">
        <Link
          isExternal
          variant="hidden"
          href={`/api/problem/${submission.problem!.id}`}
          className="text-lg font-heading tracking-tight font-semibold inline-flex gap-2 items-center mb-2"
        >
          <CodeBracketIcon className="size-6" />
          <h1>ข้อ {submission.problem!.name}</h1>
        </Link>
        <div className="flex flex-col gap-2 text-sm min-w-0 text-muted-foreground">
          <div className="flex justify-between gap-2">
            <code className="text-foreground">{submission.result}</code>
            <p>เวลารวม {(submission.timeUsed ?? 0) / 1000} วินาที</p>
          </div>
          <div className="flex justify-between gap-2">
            <p>{submission.score ?? 0} คะแนน</p>
            <p>ภาษา {LanguageName[submission.language as Language]}</p>
          </div>
          <div className="flex justify-between">
            <Link
              variant="hidden"
              asChild
              className="inline-flex gap-2 items-center"
            >
              <NextLink href={`/user/${submission.user!.id}`}>
                <UserAvatar user={submission.user!} />
                {submission.user!.showName}
              </NextLink>
            </Link>
            <p>
              ส่งเมื่อ{' '}
              {dayjs(submission.creationDate!).format('DD/MM/BBBB HH:mm:ss')}
            </p>
          </div>
          <div className="relative">
            <CodeHighlight
              className="relative border"
              code={submission.sourceCode ?? ''}
              language={submission.language ?? 'cpp'}
            />
            <div className="flex gap-1 absolute top-1 right-1">
              <Button
                size="icon"
                title="คัดลอก"
                variant="ghost"
                onClick={() => onCopy(submission.sourceCode ?? '')}
              >
                {hasCopied ? <CheckIcon /> : <DocumentDuplicateIcon />}
              </Button>
              <Button size="icon" title="เขียน" variant="ghost" asChild>
                <NextLink href={`/problem/${submission.problem!.id}`}>
                  <PencilSquareIcon />
                </NextLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
