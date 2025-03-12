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
import { Button } from '@otog/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@otog/ui/chart'
import { Dialog, DialogContent, DialogTitle } from '@otog/ui/dialog'
import { Link } from '@otog/ui/link'
import { Spinner } from '@otog/ui/spinner'

import { contestKey } from '../api/query'
import { TableComponent } from './table-component'
import { UserAvatar } from './user-avatar'

const chartConfig = {
  score: {
    label: 'score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

interface ChartData {
  time: number
  score: number
}

export const ScoreHistoryDialog = ({
  contestScoreboard,
  user,
  problemId,
  open,
  setOpen,
}: {
  contestScoreboard: ContestScoreboard
  user: UserDisplaySchema
  problemId: number
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const [selectedProblemId, setSelectedProblemId] = useState(problemId)

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl rounded-2xl self-start">
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
            <ScoreTable
              contestScoreboard={contestScoreboard}
              user={user}
              selectedProblemId={selectedProblemId}
              setSelectedProblemId={setSelectedProblemId}
            />
          </div>
        </div>
        {contestScoreHistory ? (
          <div className="w-full mt-4 flex justify-center">
            <ScoreHistoryDetail
              contestScoreboard={contestScoreboard}
              contestScoreHistory={contestScoreHistory}
              problemId={selectedProblemId}
            />
          </div>
        ) : (
          <div className="w-full h-48 flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  selectedProblemId,
  setSelectedProblemId,
}: {
  contestScoreboard: ContestScoreboard
  user: UserDisplaySchema
  selectedProblemId: number
  setSelectedProblemId: (selectedProblemId: number) => void
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
  const columnHelper = createColumnHelper<ScoreTableItem>()
  const columns = [
    columnHelper.accessor('name', {
      header: 'โจทย์',
      cell: ({ getValue }) => getValue(),
      meta: {
        headClassName: 'text-left',
        cellClassName: 'text-left py-1',
      },
      enableSorting: false,
    }),
    columnHelper.accessor('score', {
      header: 'คะแนน',
      cell: ({ getValue }) => getValue(),
      meta: {
        headClassName: 'text-right',
        cellClassName: 'text-right tabular-nums py-1',
      },
      enableSorting: false,
    }),
    columnHelper.accessor('rank', {
      header: 'อันดับ',
      cell: ({ getValue }) => getValue(),
      meta: {
        headClassName: 'text-right',
        cellClassName: 'text-right tabular-nums py-1',
      },
      enableSorting: false,
    }),
    columnHelper.accessor('problemId', {
      header: '',
      cell: ({ getValue }) => (
        <Button
          size="sm"
          className="text-xs [&>svg]:size-3 -mx-2 px-2"
          onClick={() => setSelectedProblemId(getValue())}
        >
          เลือก
        </Button>
      ),
      meta: {
        cellClassName: 'flex item-center justify-center py-1',
      },
      enableSorting: false,
    }),
  ]
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return <TableComponent table={table} />
}

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
  problemId: number
}) => {
  const startTime = new Date(contestScoreboard.contest.timeStart).getTime()
  const endTime = new Date(contestScoreboard.contest.timeEnd).getTime()
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
  const chartData: ChartData[] =
    problemId === -1
      ? totalScoreChartData
      : (
          contestScoreHistory.find((value) => value.problemId === problemId)
            ?.contestScoreHistory ?? []
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
  const fullScore =
    problemId === -1
      ? contestScoreboard.contest.contestProblem
          .map((problem) => problem.problem.score)
          .reduce((acc, val) => acc + val, 0)
      : contestScoreboard.contest.contestProblem.find(
          (problem) => problem.problemId === problemId
        )!.problem.score
  const contestDuration = Math.floor((endTime - startTime) / 1000)
  console.log(contestDuration)
  console.log(chartData)
  return (
    <>
      <ScoreHistoryChart
        contestDuration={contestDuration}
        chartData={chartData}
        fullScore={fullScore}
      />
    </>
  )
}

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
          tickFormatter={(value) => {
            const hour = Math.floor(value / 3600)
            const minute = Math.floor(value / 60) % 60
            const second = value % 60
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
          }}
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
          content={<ChartTooltipContent hideLabel />}
        />
        <Area
          dataKey="score"
          type="stepAfter"
          fill="var(--color-score)"
          fillOpacity={0.4}
          stroke="var(--color-score)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
