import { useMemo } from 'react'

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
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import NextLink from 'next/link'
import { z } from 'zod'

import { SubmissionDetailSchema } from '@otog/contract'
import { VerdictModel } from '@otog/database'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@otog/ui/accordion'
import { Badge } from '@otog/ui/badge'
import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import { Spinner } from '@otog/ui/spinner'

import { submissionKey } from '../api/query'
import { Language, LanguageName } from '../enums'
import { useClipboard } from '../hooks/use-clipboard'
import { exhaustiveGuard } from '../utils/exhaustive-guard'
import { CodeHighlight } from './code-highlight'
import { TableComponent } from './table-component'
import { UserAvatar } from './user-avatar'

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
    ...submissionKey.getSubmissionWithSourceCode({
      params: { submissionId: submissionId?.toString()! },
    }),
    enabled: !!submissionId && open,
  })
  const submission =
    getSubmission.data?.status === 200 ? getSubmission.data.body : undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl rounded-2xl self-start">
        <NextLink
          title="เปิดแท็บใหม่"
          href={`/submission/${submission?.id}`}
          target="_blank"
          rel="noreferrer"
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
            ผลตรวจข้อ {submission?.problem?.name}
          </Link>
        </DialogTitle>
        {submission ? (
          <SubmissionDetail submission={submission} />
        ) : (
          <div className="w-full h-48 flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const SubmissionDetail = ({
  submission,
}: {
  submission: SubmissionDetailSchema
}) => {
  const { hasCopied, onCopy } = useClipboard()

  return (
    <div className="text-sm min-w-0">
      <div className="flex flex-col gap-2">
        <div>
          {(() => {
            switch (submission.status) {
              case 'waiting':
                return (
                  <div className="inline-flex gap-2 items-center">
                    <Spinner size="sm" />
                    Waiting...
                  </div>
                )
              case 'grading':
                // TODO: change to something else (ask ttamx)
                return (
                  <div className="inline-flex gap-2 items-center">
                    <Spinner size="sm" />
                    Grading...
                  </div>
                )
              case 'compileError':
                return (
                  <Dialog>
                    <DialogTrigger className="rounded-full focus-visible:ring-focus shadow">
                      <Badge variant="error">Compile Error</Badge>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-sm">
                      <DialogTitle>Compile Error</DialogTitle>
                      <CodeHighlight
                        code={submission.submissionResult?.errmsg ?? ''}
                        language="cpp"
                      />
                    </DialogContent>
                  </Dialog>
                )

              case 'judgeError':
                return <Badge variant="error">Judge Error</Badge>
              case 'accept':
              case 'reject':
                return (
                  <Badge variant={submission.status}>
                    {submission.status === 'accept' ? 'Accepted' : 'Rejected'}
                  </Badge>
                )
              default:
                return exhaustiveGuard(submission.status)
            }
          })()}
        </div>
        {/* handle old submission (no memUsed record) */}
        {(submission.status === 'accept' || submission.status === 'reject') &&
          submission.submissionResult?.memUsed === -1 && (
            <code className="font-mono break-all">
              {submission.submissionResult.result}
            </code>
          )}
        <div className="flex justify-between gap-2 items-center">
          {
            <div className="inline-flex gap-2 items-center">
              <p>
                {submission.submissionResult?.score ?? 0} /{' '}
                {submission.problem.score} คะแนน
              </p>
            </div>
          }
          <p className="whitespace-nowrap">
            เวลาที่ใช้ {(submission.submissionResult?.timeUsed ?? 0) / 1000}{' '}
            วินาที
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <p>
            ส่งเมื่อ{' '}
            {dayjs(submission.creationDate!).format('DD/MM/BBBB HH:mm:ss')}
          </p>
          <p className="whitespace-nowrap">
            ความจำที่ใช้{' '}
            {submission.submissionResult
              ? submission.submissionResult.memUsed < 0
                ? '-'
                : submission.submissionResult.memUsed
              : 0}{' '}
            kB
          </p>
        </div>

        <div className="flex justify-between">
          <div className="inline-flex gap-2 items-center">
            <Link
              asChild
              variant="hidden"
              className="inline-flex gap-2 items-center"
            >
              <NextLink href={`/user/${submission.user.id}`}>
                <UserAvatar user={submission.user} />
                {submission.user.showName}
              </NextLink>
            </Link>
          </div>
          <p>ภาษา {LanguageName[submission.language as Language]}</p>
        </div>
      </div>

      {submission.submissionResult &&
        submission.submissionResult.subtaskResults.length > 0 && (
          <Accordion type="multiple" className="mt-2">
            {submission.submissionResult.subtaskResults.map((result, index) => {
              function getBadgeVariant() {
                if (result.score === result.fullScore) return 'accept'
                if (result.score === 0) return 'reject'
                return 'warning'
              }
              return (
                <AccordionItem value={'subtask-' + index.toString()}>
                  <AccordionTrigger>
                    <div className="flex gap-2 justify-between items-center w-full ml-2">
                      <p>ปัญหาย่อยที่ {index + 1}</p>
                      <Badge variant={getBadgeVariant()}>
                        {result.score} / {result.fullScore}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SubtaskTable verdicts={result.verdicts} />
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}

      <div className="relative mt-4">
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
          <Button size="icon" title="เขียนข้อนี้" variant="ghost" asChild>
            <NextLink href={`/problem/${submission.problem.id}`}>
              <PencilSquareIcon />
            </NextLink>
          </Button>
        </div>
      </div>
    </div>
  )
}

type VerdictModel = z.infer<typeof VerdictModel>

const SubtaskTable = ({ verdicts }: { verdicts: Array<VerdictModel> }) => {
  const data = useMemo(() => {
    const compressed: Array<VerdictModel> = []
    for (const verdict of verdicts) {
      compressed.push(verdict)
      if (verdict.status === 'SKIPPED') {
        break
      }
    }
    return compressed
  }, [])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <TableComponent table={table} classNames={{ head: 'whitespace-nowrap' }} />
  )
}

const columnHelper = createColumnHelper<VerdictModel>()
const columns = [
  columnHelper.display({
    header: '#',
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  }),
  columnHelper.accessor('status', {
    header: 'ผลตรวจ',
    cell: ({ getValue }) => {
      const status = getValue()
      switch (status) {
        case 'ACCEPTED':
          return <Badge variant="accept">Accepted</Badge>
        case 'PARTIAL':
          return <Badge variant="warning">Partially Correct</Badge>
        case 'REJECTED':
          return <Badge variant="reject">Wrong Answer</Badge>
        case 'TIME_LIMIT_EXCEEDED':
          return <Badge variant="reject">Time Limit Exceeded</Badge>
        case 'RUNTIME_ERROR':
          return <Badge variant="reject">Runtime Error</Badge>
        case 'SKIPPED':
          return <Badge variant="outline">Skipped</Badge>
        case 'PROBLEM_ERROR':
          return <Badge variant="error">Problem Error</Badge>
        case 'INTERNAL_ERROR':
          return <Badge variant="error">Internal Error</Badge>
        default:
          return exhaustiveGuard(status)
      }
    },
    enableSorting: false,
    meta: {
      headClassName: 'min-w-44',
      cellClassName: 'whitespace-nowrap',
    },
  }),
  columnHelper.accessor('status', {
    id: 'message',
    header: 'รายละเอียด',
    cell: ({ getValue }) => {
      const status = getValue()
      switch (status) {
        case 'ACCEPTED':
          return 'Output is correct'
        case 'PARTIAL':
          return 'Output is partially correct'
        case 'REJECTED':
          return 'Output is incorrect'
        case 'TIME_LIMIT_EXCEEDED':
          return 'Time limit exceeded'
        case 'RUNTIME_ERROR':
          return 'Runtime error'
        case 'SKIPPED':
          return 'Skipped'
        case 'PROBLEM_ERROR':
          return 'Problem error'
        case 'INTERNAL_ERROR':
          return 'Internal error'
        default:
          return exhaustiveGuard(status)
      }
    },
    enableSorting: false,
    meta: {
      headClassName: 'min-w-52 w-full',
    },
  }),
  columnHelper.accessor('timeUsed', {
    header: 'เวลาที่ใช้ (วินาที)',
    cell: ({ getValue }) => getValue().toFixed(3),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
  columnHelper.accessor('memUsed', {
    header: 'ความจำที่ใช้ (kB)',
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
]
