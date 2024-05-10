import {
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
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
      <DialogContent className="max-w-3xl">
        <DialogTitle>
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
              <Link variant="hidden" asChild>
                <NextLink href={`/user/${submission.user!.id}`}>
                  {submission.user!.showName}
                </NextLink>
              </Link>
            </p>
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
                  {hasCopied ? (
                    <DocumentCheckIcon />
                  ) : (
                    <DocumentDuplicateIcon />
                  )}
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
