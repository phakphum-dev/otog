import React, { useEffect, useMemo, useState } from 'react'

import { ListBulletIcon } from '@heroicons/react/24/outline'
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
  ContestSchema,
  ContestScoreboard,
  UserContestScoreboard,
} from '@otog/contract'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Link } from '@otog/ui/link'
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'
import { Toggle } from '@otog/ui/toggle'
import { clsx } from '@otog/ui/utils'

import { withQuery } from '../../../api/server'
import { TableComponent } from '../../../components/table-component'
import { UserAvatar } from '../../../components/user-avatar'
import { ContestLayout } from '../../../modules/contest/sidebar'

interface ContestScoreboardPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
  contestScoreboard: ContestScoreboard
  contestPrize: ContestPrize
}

interface ContestScoreboardProps {
  contestScoreboard: ContestScoreboard
  contestPrize: ContestPrize
}

export const getServerSideProps = withQuery<ContestScoreboardPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(parseInt(contestId))) {
      return { notFound: true }
    }
    const [getTime, getContest, getContestScoreboard, getContestPrize] =
      await Promise.all([
        query.app.time.query(),
        query.contest.getContest.query({
          params: { contestId: contestId },
        }),
        query.contest.getContestScoreboard.query({
          params: { contestId: contestId },
        }),
        query.contest.getContestPrize.query({
          params: { contestId: contestId },
        }),
      ])
    if (
      getTime.status !== 200 ||
      getContest.status !== 200 ||
      getContestScoreboard.status !== 200 ||
      getContestPrize.status !== 200
    ) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest: getContest.body,
        serverTime: getTime.body.toString(),
        contestScoreboard: getContestScoreboard.body,
        contestPrize: getContestPrize.body,
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
        <title>Scoreboard | {props.contest.id} | OTOG</title>
      </Head>
      <Scoreboard {...props} />
    </ContestLayout>
  )
}
ContestScoreboardPage.footer = false

export function Scoreboard({
  contestScoreboard,
  contestPrize,
}: ContestScoreboardProps) {
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
      columnHelper.accessor('maxPenalty', {
        header: 'ส่งล่าสุดเมื่อ',
        cell: ({ getValue, row, table }) => {
          const penalty = getValue()
          const hour = Math.floor(penalty / 3600) % 60
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
      ...contestScoreboard.contest.contestProblem.map((contestProblem) =>
        columnHelper.accessor(
          (row) => {
            const problemResult = row.problemResults.find(
              (problemResult) =>
                problemResult.problemId === contestProblem.problemId
            )
            return problemResult?.score
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
    <section id="#content" className="flex flex-1 flex-col gap-4 py-4 w-0 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="font-heading text-lg font-semibold hidden md:block">
                <Breadcrumb>{contestScoreboard.contest.name}</Breadcrumb>
              </BreadcrumbItem>
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
          onPressedChange={() => setExpanded((expanded) => !expanded)}
        >
          <ListBulletIcon aria-label="ซ่อนรายละเอียด" />
        </Toggle>
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
      {/* <Prize
        contest={contest}
        contestScoreboard={contestScoreboard}
        contestPrize={contestPrize}
      /> */}
    </section>
  )
}

const fontSize: Record<number, string> = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
  4: 'text-xl',
  5: 'text-lg',
}

export function Prize(props: ContestScoreboardProps) {
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
      <h2 className="font-heading text-2xl font-semibold mb-4">รางวัล</h2>
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
  oneManSolve: {
    name: 'One Man Solve',
    description: 'The only one user that passed the task.',
    emoji: '🏅',
  },
}
