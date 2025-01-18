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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@otog/ui/accordion'
import { Badge } from '@otog/ui/badge'
import { Button } from '@otog/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import { Progress } from '@otog/ui/progress'
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
      <DialogContent className="max-w-3xl rounded-2xl">
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
            ข้อ {submission?.problem?.name}
          </Link>
        </DialogTitle>
        {submission ? (
          <SubmissionDetail submission={submission} />
        ) : (
          <div className="w-full h-48 flex justify-center align-items">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const VerdictSchema = z.object({
  status: z.enum([
    'accept',
    'partial',
    'reject',
    'time limit exceed',
    'runtime error',
    'skip',
    'problem error',
    'internal error',
  ]),
  timeUse: z.number(),
  memUse: z.number(),
})
type VerdictSchema = z.infer<typeof VerdictSchema>

const FullResultSchema = z.array(
  z.object({
    score: z.number(),
    fullScore: z.number(),
    verdicts: z.array(VerdictSchema),
  })
)

export const SubmissionDetail = ({
  submission,
}: {
  submission: SubmissionDetailSchema
}) => {
  const { hasCopied, onCopy } = useClipboard()

  const fullResultResult = FullResultSchema.safeParse(submission.fullResult)
  const fullResult = fullResultResult.success ? fullResultResult.data : []
  return (
    <div className="flex flex-col gap-2 text-sm min-w-0">
      <div className="flex justify-between gap-2 items-center">
        {submission.fullResult ? (
          <div className="inline-flex gap-2 items-center">
            <Progress
              value={((submission.score ?? 0) * 100) / submission.problem.score}
              className="w-28"
            />
            <p>
              {submission.score ?? 0} / {submission.problem.score} คะแนน
            </p>
          </div>
        ) : submission.status === 'accept' || submission.status === 'reject' ? (
          <code className="font-mono text-pretty">{submission.result}</code>
        ) : (
          <p>{submission.result}</p>
        )}
        <p className="whitespace-nowrap">
          เวลาที่ใช้ {(submission.timeUsed ?? 0) / 1000} วินาที
        </p>
      </div>
      <div className="flex justify-between gap-2">
        <p>
          ส่งเมื่อ{' '}
          {dayjs(submission.creationDate!).format('DD/MM/BBBB HH:mm:ss')}
        </p>
        <p className="whitespace-nowrap">
          ความจำที่ใช้ {submission.memUsed ?? '-'} kB
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
      <div className="relative">
        {/* TODO: max height and expand */}
        {/* TODO: max height and expand */}
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
      <div className="relative">
        <Accordion type="multiple">
          {fullResult.map((result, index) => {
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
      </div>
    </div>
  )
}

const SubtaskTable = ({ verdicts }: { verdicts: Array<VerdictSchema> }) => {
  const data = useMemo(() => {
    const compressed: Array<VerdictSchema> = []
    for (const verdict of verdicts) {
      compressed.push(verdict)
      if (verdict.status === 'skip') {
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

const columnHelper = createColumnHelper<VerdictSchema>()
const columns = [
  columnHelper.display({
    header: '#',
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  }),
  columnHelper.accessor('status', {
    header: 'ผลตรวจ',
    cell: ({ row: { original } }) => {
      switch (original.status) {
        case 'accept':
          return <Badge variant="accept">Accepted</Badge>
        case 'partial':
          return <Badge variant="warning">Partially Correct</Badge>
        case 'reject':
          return <Badge variant="reject">Wrong Answer</Badge>
        case 'time limit exceed':
          return <Badge variant="reject">Time Limit Exceeded</Badge>
        case 'runtime error':
          return <Badge variant="reject">Runtime Error</Badge>
        case 'skip':
          return <Badge variant="outline">Skipped</Badge>
        case 'problem error':
          return <Badge variant="error">Problem Error</Badge>
        case 'internal error':
          return <Badge variant="error">Internal Error</Badge>
        default:
          return exhaustiveGuard(original.status)
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
    cell: ({ row: { original } }) => {
      switch (original.status) {
        case 'accept':
          return 'Output is correct'
        case 'partial':
          return 'Output is partially correct'
        case 'reject':
          return 'Output is incorrect'
        case 'time limit exceed':
          return 'Time limit exceeded'
        case 'runtime error':
          return 'Runtime error'
        case 'skip':
          return 'Skipped'
        case 'problem error':
          return 'Problem error'
        case 'internal error':
          return 'Internal error'
        default:
          return exhaustiveGuard(original.status)
      }
    },
    enableSorting: false,
    meta: {
      headClassName: 'min-w-52 w-full',
    },
  }),
  columnHelper.accessor('timeUse', {
    header: 'เวลาที่ใช้ (วินาที)',
    cell: ({ row: { original } }) => original.timeUse.toFixed(3),
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
  columnHelper.accessor('memUse', {
    header: 'ความจำที่ใช้ (kB)',
    enableSorting: false,
    meta: {
      headClassName: 'text-end',
      cellClassName: 'text-end tabular-nums',
    },
  }),
]
