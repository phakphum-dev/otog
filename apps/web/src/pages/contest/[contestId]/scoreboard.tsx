import React, { useEffect, useMemo, useState } from 'react'

import { ListBulletsIcon } from '@phosphor-icons/react'
import { useReactTable } from '@tanstack/react-table'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/table-core'
import Head from 'next/head'
import NextLink from 'next/link'

import {
  ContestSchema,
  ContestScoreboard,
  UserContestScoreboard,
  UserDisplaySchema,
} from '@otog/contract'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Dialog, DialogContent, DialogTrigger } from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'
import { Toggle } from '@otog/ui/toggle'
import { clsx } from '@otog/ui/utils'

import { withQuery } from '../../../api/server'
import { Footer } from '../../../components/footer'
import { ScoreHistoryDialogContent } from '../../../components/score-history-dialog'
import { TableComponent } from '../../../components/table-component'
import { UserAvatar } from '../../../components/user-avatar'
import { ContestLayout } from '../../../modules/contest/sidebar'

interface ContestScoreboardPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
  contestScoreboard: ContestScoreboard
}

interface ContestScoreboardProps {
  contestScoreboard: ContestScoreboard
}

export const getServerSideProps = withQuery<ContestScoreboardPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(parseInt(contestId))) {
      return { notFound: true }
    }
    const [getTime, getContest, getContestScoreboard] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
      query.contest.getContestScoreboard.query({
        params: { contestId: contestId },
      }),
    ])
    if (
      getTime.status !== 200 ||
      getContest.status !== 200 ||
      getContestScoreboard.status !== 200
    ) {
      throw new Error('Failed to fetch data')
    }
    return {
      props: {
        contestId,
        contest: getContest.body,
        serverTime: getTime.body.toString(),
        contestScoreboard: getContestScoreboard.body,
      },
    }
  }
)

export default function ContestScoreboardPage(
  props: ContestScoreboardPageProps
) {
  return (
    <ContestLayout {...props}>
      <Head>
        <title>{props.contest.name} - Scoreboard | OTOG</title>
      </Head>
      <Scoreboard {...props} />
      <Footer className="pt-8 px-4 max-w-full" />
    </ContestLayout>
  )
}
ContestScoreboardPage.footer = false

export function Scoreboard({ contestScoreboard }: ContestScoreboardProps) {
  const columnHelper = createColumnHelper<UserContestScoreboard>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('rank', {
        header: '#',
        cell: ({ getValue, row }) => (
          <span
            className={clsx(
              'transition-[font-size]',
              table.options.meta?.expanded
                ? 'text-base'
                : fontSize[row.original.rank!]
            )}
          >
            {getValue()}
          </span>
        ),
        meta: {
          headClassName: ({ table }) =>
            clsx(table.options.meta?.expanded && 'text-left'),
          cellClassName: ({ table }) =>
            clsx(table.options.meta?.expanded && 'text-left'),
        },
      }),
      columnHelper.accessor('user.showName', {
        header: 'ชื่อ',
        cell: ({ getValue, row }) => {
          return (
            <Link
              variant="hidden"
              className={clsx(
                'transition-[font-size]',
                table.options.meta?.expanded
                  ? 'text-base'
                  : fontSize[row.original.rank!]
              )}
              asChild
            >
              <NextLink
                href={`/user/${row.original.userId}`}
                className="inline-flex gap-2 items-center"
              >
                {table.options.meta?.expanded && (
                  <UserAvatar user={row.original.user} />
                )}
                {getValue()}
              </NextLink>
            </Link>
          )
        },
        meta: {
          headClassName: ({ table }) =>
            clsx(table.options.meta?.expanded && 'text-left'),
          cellClassName: ({ table }) =>
            clsx(table.options.meta?.expanded && 'text-left'),
        },
        enableSorting: false,
      }),
      columnHelper.accessor('totalScore', {
        header: 'คะแนนรวม',
        cell: ({ getValue, row }) => (
          <ScoreDetailButton
            contestScoreboard={contestScoreboard}
            user={row.original.user}
            problemId={null}
          >
            <span
              className={clsx(
                'transition-[font-size]',
                table.options.meta?.expanded
                  ? 'text-base tabular-nums'
                  : ['text-center', fontSize[row.original.rank!]]
              )}
            >
              {getValue()}
            </span>
          </ScoreDetailButton>
        ),
      }),
      columnHelper.accessor('maxPenalty', {
        header: 'ส่งล่าสุดเมื่อ',
        cell: ({ getValue, row, table }) => {
          const penalty = getValue()
          const hour = Math.floor(penalty / 3600)
          const minute = Math.floor(penalty / 60) % 60
          const second = penalty % 60
          return (
            <span
              className={clsx(
                'transition-[font-size]',
                table.options.meta?.expanded
                  ? 'text-base tabular-nums'
                  : fontSize[row.original.rank!]
              )}
            >
              {hour}:{minute.toString().padStart(2, '0')}:
              {second.toString().padStart(2, '0')}
            </span>
          )
        },
        enableSorting: false,
      }),
      ...contestScoreboard.contest.contestProblem
        .sort((a, b) => a.problemId - b.problemId)
        .map((contestProblem) =>
          columnHelper.accessor(
            (row) => {
              const contestScore = row.contestScores.find(
                (contestScore) =>
                  contestScore.problemId === contestProblem.problemId
              )
              return contestScore?.score
            },
            {
              id: `problem-${contestProblem.problemId.toString()}`,
              header: contestProblem.problem.name!,
              cell: ({ getValue, row }) => (
                <ScoreDetailButton
                  contestScoreboard={contestScoreboard}
                  user={row.original.user}
                  problemId={contestProblem.problemId}
                >
                  {getValue() ?? '-'}
                </ScoreDetailButton>
              ),
              meta: {
                headClassName: 'text-pretty truncate',
                cellClassName: 'tabular-nums',
              },
              sortUndefined: -1,
              enableSorting: true,
            }
          )
        ),
    ],
    [contestScoreboard]
  )

  const [expanded, setExpanded] = useState(true)
  const [columnVisibility, setColumnVisibility] = useState({})
  const table = useReactTable({
    data: contestScoreboard.userContest,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.userId.toString(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    meta: { expanded },
  })
  useEffect(() => {
    if (expanded) {
      setColumnVisibility({})
    } else {
      setColumnVisibility(
        contestScoreboard.contest.contestProblem
          .map((contestProblem) => contestProblem.problemId)
          .reduce((obj, id) => ({ ...obj, [`problem-${id}`]: false }), {})
      )
    }
  }, [expanded])
  return (
    <div className="flex-1 flex-col">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbLink
                className="font-heading text-lg font-semibold hidden md:block"
                asChild
              >
                <NextLink href={`/contest/${contestScoreboard.contest.id}`}>
                  {contestScoreboard.contest.name}
                </NextLink>
              </BreadcrumbLink>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-heading text-lg font-semibold">
                  Scoreboard
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Toggle
          pressed={!expanded}
          className="p-1.5 h-7"
          onPressedChange={() => setExpanded((expanded) => !expanded)}
        >
          <ListBulletsIcon aria-label="ซ่อนรายละเอียด" />
        </Toggle>
      </div>

      <TableComponent
        table={table}
        classNames={{
          container: 'border-transparent px-4',
          bodyRow: 'border-transparent',
          headRow: 'border-transparent',
          head: clsx(expanded ? 'text-right' : 'text-center'),
          cell: clsx(expanded ? 'text-right' : 'text-center'),
        }}
      />
      {/* <Prize
        contest={contest}
        contestScoreboard={contestScoreboard}
        contestPrize={contestPrize}
      /> */}
    </div>
  )
}

const ScoreDetailButton = ({
  contestScoreboard,
  user,
  problemId,
  children,
}: {
  contestScoreboard: ContestScoreboard
  user: UserDisplaySchema
  problemId: number | null
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Link
        aria-label="score details"
        onClick={() => setOpen(true)}
        variant="hidden"
        asChild
      >
        <DialogTrigger>{children}</DialogTrigger>
      </Link>
      <DialogContent className="max-w-2xl rounded-2xl self-start md:max-w-5xl">
        <ScoreHistoryDialogContent
          open={open}
          contestScoreboard={contestScoreboard}
          user={user}
          problemId={problemId}
        />
      </DialogContent>
    </Dialog>
  )
}

const fontSize: Record<number, string> = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
  4: 'text-xl',
  5: 'text-lg',
}

// export function Prize(props: ContestScoreboardProps) {
//   const data = useMemo(
//     () =>
//       Object.entries(props.contestPrize).map(([prizeName, users]) => ({
//         prizeName: prizeName as keyof ContestPrize,
//         users,
//       })),
//     [props.contestPrize]
//   )

//   const columnHelper = createColumnHelper<{
//     prizeName: keyof ContestPrize
//     users: ContestPrize[keyof ContestPrize]
//   }>()
//   const columns = useMemo(
//     () => [
//       columnHelper.accessor('prizeName', {
//         header: 'รางวัล',
//         cell: ({ getValue }) => {
//           const prize = prizeDescription[getValue()]
//           return (
//             <div className="flex flex-col gap-2 items-center text-center text-pretty">
//               <span className="text-3xl">{prize.emoji}</span>
//               <span className="font-semibold">{prize.name}</span>
//               <p className="text-muted-foreground">{prize.description}</p>
//             </div>
//           )
//         },

//         meta: {
//           headClassName: 'text-center',
//         },
//         enableSorting: false,
//       }),
//       ...props.contestScoreboard.contest.contestProblem
//         .map((contestProblem) => contestProblem.problem)
//         .map((problem) =>
//           columnHelper.display({
//             id: `problem-${problem.id}`,
//             header: problem.name!,

//             cell: ({ row }) => {
//               const users = row.original.users.filter(
//                 (user) => user.problem!.id === problem.id
//               )
//               return (
//                 <ul className="list-disc">
//                   {users.length === 0 && '-'}
//                   {users.map(({ user }) => (
//                     <li key={user!.id}>
//                       <Link variant="hidden" asChild>
//                         <NextLink href={`/user/${user!.id}`}>
//                           {user!.showName}
//                         </NextLink>
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               )
//             },
//           })
//         ),
//     ],
//     [props.contestScoreboard]
//   )
//   const table = useReactTable({
//     data: data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   })

//   return (
//     <section>
//       <h2 className="font-heading text-2xl font-semibold mb-4">รางวัล</h2>
//       <TableComponent table={table} />
//     </section>
//   )
// }

// export const prizeDescription: Record<
//   keyof ContestPrize,
//   { name: string; description: string; emoji: string }
// > = {
//   firstBlood: {
//     name: 'First Blood',
//     description: 'The first user that passed the task.',
//     emoji: '💀',
//   },
// fasterThanLight: {
//   name: 'Faster Than Light',
//   description: 'The user that solved the task with fastest algorithm.',
//   emoji: '⚡️',
// },
// passedInOne: {
//   name: 'Passed In One',
//   description: 'The user that passed the task in one submission.',
//   emoji: '🎯',
// },
//   oneManSolve: {
//     name: 'One Man Solve',
//     description: 'The only one user that passed the task.',
//     emoji: '🏅',
//   },
// }
