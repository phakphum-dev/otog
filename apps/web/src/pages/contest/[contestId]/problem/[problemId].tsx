import Head from 'next/head'
import { useRouter } from 'next/router'
import { z } from 'zod'

import { ContestSchema } from '@otog/contract'
import { ProblemModel } from '@otog/database'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Separator } from '@otog/ui/separator'
import { SidebarTrigger } from '@otog/ui/sidebar'

import { withQuery } from '../../../../api/server'
import { AnnouncementCarousel } from '../../../../modules/announcement'
import {
  ContestLayout,
  useContestProps,
} from '../../../../modules/contest/sidebar'
import { TaskCard } from '../../../../modules/contest/task-card'
import { useEffect } from 'react'

type ProblemModel = z.infer<typeof ProblemModel>

interface ContestProblemPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
  problem: ProblemModel
}

export const getServerSideProps = withQuery<ContestProblemPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(Number(contestId))) {
      return { notFound: true }
    }
    const problemId = context.query.problemId as string
    if (Number.isNaN(Number(problemId))) {
      return { notFound: true }
    }
    const [getTime, getContest] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
    ])
    if (getTime.status !== 200 || getContest.status !== 200) {
      return { notFound: true }
    }
    const serverTime = getTime.body
    const contest = getContest.body
    if (contest.timeStart > serverTime) {
      return { notFound: true }
    }
    const getProblem = await query.contest.getContestProblem.query({
      params: { contestId, problemId },
    })
    if (getProblem.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest,
        serverTime: serverTime.toString(),
        problem: getProblem.body,
      },
    }
  }
)

export default function ContestPage(props: ContestProblemPageProps) {
  const router = useRouter()
  const contestProps = useContestProps(props)
  const { contest, contestStatus } = contestProps
  const { problem } = props
  useEffect(() => {
    if (contestStatus !== 'RUNNING') {
      router.push(`/contest/${props.contestId}`)
    }
  },[contestStatus])
  return (
    <ContestLayout {...contestProps}>
      <Head>
        <title>
          {problem.name} | {contest.name} | OTOG
        </title>
      </Head>
      <section
        id="#content"
        className="flex flex-1 flex-col gap-4 py-4 w-0 px-4"
      >
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="font-heading text-lg font-semibold hidden md:block">
                <Breadcrumb>{contest.name}</Breadcrumb>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-heading text-lg font-semibold">
                  {problem.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {/* TODO: Make new layout (maybe CMS-like?) */}
        {/* <AnnouncementCarousel contestId={contest.id} /> */}
        <TaskCard problem={problem} contestId={contest.id} />
      </section>
    </ContestLayout>
  )
}
ContestPage.footer = false
