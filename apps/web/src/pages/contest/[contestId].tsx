import { useEffect, useMemo, useState } from 'react'

import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/24/outline'
import { useReactTable } from '@tanstack/react-table'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/table-core'
import Head from 'next/head'
import NextLink from 'next/link'

import {
  ContestPrize,
  ContestScoreboard,
  UserContestScoreboard,
} from '@otog/contract'
import { Link } from '@otog/ui/link'
import { Toggle } from '@otog/ui/toggle'
import { clsx } from '@otog/ui/utils'

import { contestQuery } from '../../api/query'
import { withSession } from '../../api/with-session'
import { TableComponent } from '../../components/table-component'

interface ContestHistoryProps {
  contestScoreboard: ContestScoreboard
  contestPrize: ContestPrize
}

export const getServerSideProps = withSession<ContestHistoryProps>(
  async (_, context) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(parseInt(contestId))) {
      return { notFound: true }
    }
    const [getContestScoreboard, getContestPrize] = await Promise.all([
      contestQuery.getContestScoreboard.query({
        params: { contestId: contestId },
      }),
      contestQuery.getContestPrize.query({
        params: { contestId: contestId },
      }),
    ])
    if (getContestScoreboard.status !== 200 || getContestPrize.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contestScoreboard: getContestScoreboard.body,
        contestPrize: getContestPrize.body,
      },
    }
  }
)

export default function ContestHistory({
  contestScoreboard,
  contestPrize,
}: ContestHistoryProps) {
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
              <NextLink href={`/user/${row.original.userId}`}>
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
        ),
      }),
      columnHelper.accessor('totalTimeUsed', {
        header: 'เวลาที่ใช้รวม',
        cell: ({ getValue, row, table }) => (
          <span
            className={clsx(
              'transition-[font-size]',
              table.options.meta?.expanded
                ? 'text-base tabular-nums'
                : fontSize[row.original.rank!]
            )}
          >
            {getValue().toFixed(3)}
          </span>
        ),
      }),
      ...contestScoreboard.contest.contestProblem.map((contestProblem) =>
        columnHelper.accessor(
          (row) => {
            const submission = row.submissions.find(
              (submission) => submission.problemId === contestProblem.problemId
            )
            return submission?.score
          },
          {
            id: `problem-${contestProblem.problemId.toString()}`,
            header: contestProblem.problem.name!,
            cell: ({ getValue }) => getValue() ?? '-',
            meta: {
              headClassName: 'text-pretty',
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

  const [expanded, setExpanded] = useState(false)
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
    <main id="#content" className="container flex flex-1 flex-col gap-4">
      <Head>
        <title>Contest History {contestScoreboard.contest.id} | OTOG</title>
      </Head>
      <section>
        <div className="flex justify-between items-center mt-8 mb-4">
          <h1 className="font-heading text-2xl font-semibold">
            {contestScoreboard.contest.name}
          </h1>
          <div>
            <Toggle
              className="rounded-r-none"
              pressed={!expanded}
              onPressedChange={() => setExpanded(false)}
            >
              <Bars3BottomLeftIcon />
            </Toggle>
            <Toggle
              className="rounded-l-none"
              pressed={expanded}
              onPressedChange={() => setExpanded(true)}
            >
              <Bars3BottomRightIcon />
            </Toggle>
          </div>
        </div>
        <TableComponent
          table={table}
          classNames={{
            container: 'border-transparent',
            bodyRow: 'border-transparent',
            headRow: 'border-transparent',
            head: clsx(expanded ? 'text-right' : 'text-center'),
            cell: clsx(expanded ? 'text-right' : 'text-center'),
          }}
        />
      </section>
      <Prize
        contestScoreboard={contestScoreboard}
        contestPrize={contestPrize}
      />
    </main>
  )
}

const fontSize: Record<number, string> = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
  4: 'text-xl',
  5: 'text-lg',
}

export function Prize(props: ContestHistoryProps) {
  const data = useMemo(
    () =>
      Object.entries(props.contestPrize).map(([prizeName, users]) => ({
        prizeName: prizeName as keyof ContestPrize,
        users,
      })),
    [props.contestPrize]
  )

  const columnHelper = createColumnHelper<{
    prizeName: keyof ContestPrize
    users: ContestPrize[keyof ContestPrize]
  }>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('prizeName', {
        header: 'รางวัล',
        cell: ({ getValue }) => {
          const prize = prizeDescription[getValue()]
          return (
            <div className="flex flex-col gap-2 items-center text-center text-pretty">
              <span className="text-3xl">{prize.emoji}</span>
              <span className="font-semibold">{prize.name}</span>
              <p className="text-muted-foreground">{prize.description}</p>
            </div>
          )
        },

        meta: {
          headClassName: 'text-center',
        },
        enableSorting: false,
      }),
      ...props.contestScoreboard.contest.contestProblem
        .map((contestProblem) => contestProblem.problem)
        .map((problem) =>
          columnHelper.display({
            id: `problem-${problem.id}`,
            header: problem.name!,

            cell: ({ row }) => {
              const users = row.original.users.filter(
                (user) => user.problem!.id === problem.id
              )
              return (
                <ul className="list-disc">
                  {users.length === 0 && '-'}
                  {users.map(({ user }) => (
                    <li key={user!.id}>
                      <Link variant="hidden" asChild>
                        <NextLink href={`/user/${user!.id}`}>
                          {user!.showName}
                        </NextLink>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            },
          })
        ),
    ],
    [props.contestScoreboard]
  )
  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold mt-8 mb-4">รางวัล</h2>
      <TableComponent table={table} />
    </section>
  )
}

export const prizeDescription: Record<
  keyof ContestPrize,
  { name: string; description: string; emoji: string }
> = {
  firstBlood: {
    name: 'First Blood',
    description: 'The first user that passed the task.',
    emoji: '💀',
  },
  fasterThanLight: {
    name: 'Faster Than Light',
    description: 'The user that solved the task with fastest algorithm.',
    emoji: '⚡️',
  },
  passedInOne: {
    name: 'Passed In One',
    description: 'The user that passed the task in one submission.',
    emoji: '🎯',
  },
  oneManSolve: {
    name: 'One Man Solve',
    description: 'The only one user that passed the task.',
    emoji: '🏅',
  },
}
