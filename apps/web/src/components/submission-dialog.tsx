import {
  CheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/solid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import NextLink from 'next/link'

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Spinner,
} from '@otog/ui'

import { keySubmission } from '../api/query'
import { Language, LanguageName } from '../enums'
import { useClipboard } from '../hooks/use-clipboard'
import { CodeHighlight } from './code-highlight'

export const SubmissionDialog = ({
  submissionId,
  open,
  setOpen,
}: {
  submissionId?: number
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const getSubmission = useQuery({
    ...keySubmission.getOne({
      submissionId: submissionId!,
    }),
    enabled: !!submissionId && open,
  })
  const submission =
    getSubmission.data?.status === 200 ? getSubmission.data.body : undefined

  const { hasCopied, onCopy } = useClipboard()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl rounded-2xl">
        <NextLink
          title="Open in full page"
          href={`/submission/${submission?.id}`}
          className="absolute right-12 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <ArrowTopRightOnSquareIcon className="size-4" />
        </NextLink>
        <DialogTitle className="flex items-center gap-2">
          <CodeBracketIcon className="size-6" />
          <Link
            isExternal
            variant="hidden"
            href={`/api/problem/${submission?.problem?.id}`}
          >
            ข้อ {submission?.problem?.name}
          </Link>
        </DialogTitle>
        {submission ? (
          <div className="flex flex-col gap-2 text-sm min-w-0">
            <div className="flex justify-between gap-2">
              <code className="bg-muted rounded self-start px-0.5">
                {submission.result}
              </code>
              <p>เวลารวม {(submission.timeUsed ?? 0) / 1000} วินาที</p>
            </div>
            <div className="flex justify-between gap-2">
              <p>{submission.score ?? 0} คะแนน</p>
              <p>ภาษา {LanguageName[submission.language as Language]}</p>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <Link
                asChild
                variant="hidden"
                className="inline-flex gap-2 items-center"
              >
                <NextLink href={`/user/${submission.user!.id}`}>
                  <div className="border rounded-full size-6"></div>
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
                  title="Copy Code"
                  variant="ghost"
                  onClick={() => onCopy(submission.sourceCode ?? '')}
                >
                  {hasCopied ? <CheckIcon /> : <DocumentDuplicateIcon />}
                </Button>
                <Button size="icon" title="Edit Code" variant="ghost" asChild>
                  <NextLink href={`/problem/${submission.problem!.id}`}>
                    <PencilSquareIcon />
                  </NextLink>
                </Button>
              </div>
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
