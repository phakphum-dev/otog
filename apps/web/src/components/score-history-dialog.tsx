import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core'
import NextLink from 'next/link'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ContestScoreboard,
  ScoreHistorySchema,
  UserDisplaySchema,
} from '@otog/contract'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@otog/ui/chart'
import { DialogTitle } from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'
import { Spinner } from '@otog/ui/spinner'

import { contestKey } from '../api/query'
import { TableComponent } from './table-component'
import { UserAvatar } from './user-avatar'

interface ChartData {
  time: number
  score: number
}

export const ScoreHistoryDialogContent = ({
  contestScoreboard,
  user,
  problemId,
  open,
}: {
  contestScoreboard: ContestScoreboard
  user: UserDisplaySchema
  problemId: number | null
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const getUserContestScoreHistory = useQuery({
    ...contestKey.getUserContestScoreHistory({
      params: {
        contestId: contestScoreboard.contest.id.toString(),
        userId: user.id.toString(),
      },
    }),
    enabled: open,
  })
  const contestScoreHistory =
    getUserContestScoreHistory.data?.status === 200
      ? getUserContestScoreHistory.data.body
      : undefined
  return (
    <>
      <DialogTitle className="text-2xl">
        รายละเอียดคะแนนของ{' '}
        <Link variant="hidden">
          <NextLink href={`/user/${user.id}`}>{user.showName}</NextLink>
        </Link>
      </DialogTitle>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-[320px]">
            <div className="relative group size-80 rounded-md overflow-hidden">
              <UserAvatar
                user={user}
                className="size-80 rounded-md"
                size="default"
              />
            </div>
          </div>
          <div className="w-full">
            <ScoreTable contestScoreboard={contestScoreboard} user={user} />
          </div>
        </div>
      </div>
      {contestScoreHistory ? (
        <div className="w-full mt-4 flex-col justify-center overflow-x-auto">
          <ScoreHistoryDetail
            contestScoreboard={contestScoreboard}
            contestScoreHistory={contestScoreHistory}
            problemId={problemId}
          />
        </div>
      ) : (
        <div className="w-full h-48 flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </>
  )
}

interface ScoreTableItem {
  name: string
  score: number
  rank: string
  problemId: number
}

const ScoreTable = ({
  contestScoreboard,
  user,
}: {
  contestScoreboard: ContestScoreboard
  user: UserDisplaySchema
}) => {
  const data = useMemo(() => {
    const data: ScoreTableItem[] = []
    const userData = contestScoreboard.userContest.find(
      (item) => item.userId === user.id
    )
    const contestScores = userData?.contestScores ?? []

    data.push({
      name: 'คะแนนรวม',
      score: contestScores.reduce((acc, val) => acc + val.score, 0),
      rank: userData?.rank?.toString() ?? '-',
      problemId: -1,
    })
    contestScoreboard.contest.contestProblem.forEach((problem) => {
      const contestScore = contestScores.find(
        (contestScore) => contestScore.problemId === problem.problemId
      )
      const score = contestScore?.score ?? 0
      data.push({
        name: problem.problem.name,
        score: score,
        rank: contestScoreboard.userContest
          .reduce(
            (count, item) =>
              item.contestScores.find(
                (other) =>
                  other.problemId === problem.problemId && other.score > score
              )
                ? count + 1
                : count,
            1
          )
          .toString(),
        problemId: problem.problemId,
      })
    })
    return data
  }, [contestScoreboard])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return <TableComponent table={table} />
}
const columnHelper = createColumnHelper<ScoreTableItem>()
const columns = [
  columnHelper.accessor('name', {
    header: 'โจทย์',
    cell: ({ getValue }) => {
      if (getValue() === 'คะแนนรวม') {
        return <span className="font-semibold">{getValue()}</span>
      }
      return <span className="pl-4">{getValue()}</span>
    },
    meta: {
      headClassName: 'text-left',
      cellClassName: 'text-left',
    },
    enableSorting: false,
  }),
  columnHelper.accessor('score', {
    header: 'คะแนน',
    cell: ({ getValue }) => getValue(),
    meta: {
      headClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
    },
    enableSorting: false,
  }),
  columnHelper.accessor('rank', {
    header: 'อันดับ',
    cell: ({ getValue }) => getValue(),
    meta: {
      headClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
    },
    enableSorting: false,
  }),
]

interface HistoryWithoutDetail {
  problemId: number
  time: number
  score: number
}

const ScoreHistoryDetail = ({
  contestScoreboard,
  contestScoreHistory,
  problemId,
}: {
  contestScoreboard: ContestScoreboard
  contestScoreHistory: ScoreHistorySchema[]
  problemId: number | null
}) => {
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(
    problemId ?? null
  )

  const startTime = new Date(contestScoreboard.contest.timeStart).getTime()
  const endTime = new Date(contestScoreboard.contest.timeEnd).getTime()
  const contestDuration = Math.floor((endTime - startTime) / 1000)
  const totalScoreChartData: ChartData[] = useMemo(() => {
    const allHistory: HistoryWithoutDetail[] = []
    contestScoreHistory.forEach((contestScore) =>
      contestScore.contestScoreHistory.forEach((history) =>
        allHistory.push({
          problemId: contestScore.problemId,
          time: Math.floor(
            (history.submission.creationDate.getTime() - startTime) / 1000
          ),
          score: history.score,
        })
      )
    )
    const chartData: ChartData[] = []
    const problemScore = new Map<number, number>()
    var totalScore = 0
    allHistory
      .sort((a, b) => a.time - b.time)
      .forEach((history) => {
        if (problemScore.has(history.problemId)) {
          totalScore -= problemScore.get(history.problemId)!
        }
        problemScore.set(history.problemId, history.score)
        totalScore += history.score
        chartData.push({
          time: history.time,
          score: totalScore,
        })
      })
    return chartData
  }, [contestScoreHistory])
  const chartData: ChartData[] = (
    selectedProblemId === null
      ? totalScoreChartData
      : (
          contestScoreHistory.find(
            (value) => value.problemId === selectedProblemId
          )?.contestScoreHistory ?? []
        )
          .map((history) => {
            return {
              time: Math.floor(
                (history.submission.creationDate.getTime() - startTime) / 1000
              ),
              score: history.score,
            }
          })
          .sort((a, b) => a.time - b.time)
  ).map((item) => ({
    time: Math.min(Math.max(0, item.time), contestDuration),
    score: item.score,
  }))
  const problem =
    contestScoreboard.contest.contestProblem.find(
      (problem) => problem.problemId === selectedProblemId
    )?.problem ?? undefined
  const fullScore =
    selectedProblemId === null
      ? contestScoreboard.contest.contestProblem
          .map((problem) => problem.problem.score)
          .reduce((acc, val) => acc + val, 0)
      : (problem?.score ?? 0)
  const submissions =
    contestScoreHistory
      .find((contestScore) => contestScore.problemId === selectedProblemId)
      ?.contestScoreHistory.map((item) => item.submission) ?? []
  const subtaskFullScores: number[] =
    submissions[0]?.submissionResult?.subtaskResults.map(
      (result) => result.fullScore
    ) ?? []
  const tableData: SubtaskScoreTableItem[] = submissions.map((item) => ({
    time: Math.floor((item.creationDate.getTime() - startTime) / 1000),
    score: item.submissionResult?.score ?? 0,
    subtaskScore:
      item.submissionResult?.subtaskResults
        .sort((a, b) => a.subtaskIndex - b.subtaskIndex)
        .map((result) => result.score) ?? [],
  }))

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-2xl font-semibold font-heading tracking-tight">
          {selectedProblemId === null ? 'คะแนนรวม' : (problem?.name ?? '')}
        </h2>
        <Select
          value={selectedProblemId?.toString() ?? 'Total'}
          onValueChange={(value) => {
            setSelectedProblemId(value === 'Total' ? null : parseInt(value))
          }}
        >
          <SelectTrigger className="w-fit gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="Total">คะแนนรวม</SelectItem>
            {contestScoreboard.contest.contestProblem.map((contestProblem) => (
              <SelectItem
                key={contestProblem.problemId}
                value={contestProblem.problemId.toString()}
              >
                {contestProblem.problem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScoreHistoryChart
        contestDuration={contestDuration}
        chartData={chartData}
        fullScore={fullScore}
      />
      {selectedProblemId && subtaskFullScores.length > 0 ? (
        <SubtaskScoreTable
          data={tableData}
          subtaskFullScores={subtaskFullScores}
        />
      ) : (
        <p className="text-sm italic">ไม่มีการส่งในข้อนี้</p>
      )}
    </div>
  )
}

const chartConfig = {
  score: {
    label: 'score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

const ScoreHistoryChart = ({
  chartData,
  contestDuration,
  fullScore,
}: {
  chartData: ChartData[]
  contestDuration: number
  fullScore: number
}) => {
  chartData.splice(0, 0, { time: 0, score: 0 })
  chartData.push({
    time: contestDuration,
    score: chartData[chartData.length - 1]!.score,
  })
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full mr-10">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
          right: 12,
          left: 12,
          bottom: 10,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          domain={[0, contestDuration]}
          tickLine={false}
          axisLine={true}
          ticks={[
            Math.floor(contestDuration / 4),
            Math.floor(contestDuration / 2),
            Math.floor((contestDuration * 3) / 4),
            contestDuration,
          ]}
          tickFormatter={timeFormatter}
        />
        <YAxis
          dataKey="score"
          type="number"
          domain={[0, fullScore]}
          tickLine={false}
          axisLine={false}
          tickCount={5}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent hideLabel hideIndicator />}
        />
        <Area
          dataKey="score"
          type="stepAfter"
          fill="var(--color-score)"
          fillOpacity={0.4}
          stroke="var(--color-score)"
          strokeWidth={2}
          animationDuration={500}
        />
      </AreaChart>
    </ChartContainer>
  )
}

interface SubtaskScoreTableItem {
  time: number
  score: number
  subtaskScore: number[]
}

const SubtaskScoreTable = ({
  data,
  subtaskFullScores,
}: {
  data: SubtaskScoreTableItem[]
  subtaskFullScores: number[]
}) => {
  // const fullScore = subtaskFullScores.reduce((acc, val) => acc + val, 0)
  const columnHelper = createColumnHelper<SubtaskScoreTableItem>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('time', {
        header: 'ส่งเมื่อ',
        cell: ({ getValue }) => timeFormatter(getValue()),
        meta: {
          headClassName: 'text-left truncate',
          cellClassName: 'text-left tabular-nums py-2',
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'totalScore',
        header: `คะแนน`,
        cell: ({ row }) =>
          row.original.subtaskScore.reduce((acc, val) => acc + val, 0),
        meta: {
          headClassName: 'text-right truncate',
          cellClassName: 'text-right tabular-nums py-2',
        },
        enableSorting: false,
      }),
      ...subtaskFullScores.map((subtaskFullScore, index) =>
        columnHelper.display({
          id: 'subtask-' + index + 1,
          header: `กลุ่มที่ ${index + 1} (${subtaskFullScore})`,
          cell: ({ row }) => row.original.subtaskScore[index],
          meta: {
            headClassName: 'text-right truncate',
            cellClassName: 'text-right tabular-nums py-2',
          },
          enableSorting: false,
        })
      ),
    ],
    [subtaskFullScores]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return <TableComponent table={table} />
}

const timeFormatter = (value: number) => {
  const abs = value < 0 ? -value : value
  const hour = Math.floor(abs / 3600)
  const minute = Math.floor(abs / 60) % 60
  const second = abs % 60
  return `${value < 0 ? '-' : ''}${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}
