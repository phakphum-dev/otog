import { ReactNode, createContext, useContext, useEffect } from 'react'

import {
  BookOpenIcon,
  ClockIcon,
  HomeIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, TablePropertiesIcon } from 'lucide-react'
import { Terminal } from 'lucide-react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

import { ContestSchema, ContestStatusEnum } from '@otog/contract'
import { Alert, AlertDescription, AlertTitle } from '@otog/ui/alert'
import { Badge } from '@otog/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarProvider,
  SidebarSeparator,
} from '@otog/ui/sidebar'
import { Spinner } from '@otog/ui/spinner'
import { clsx } from '@otog/ui/utils'

import { appKey, contestKey } from '../../api/query'
import { useUserContext } from '../../context/user-context'
import { environment } from '../../env'
import { initialDataSuccess } from '../../utils/initial-data-success'
import { toTimerFormat } from '../../utils/time'
import { useTimer } from '../../utils/use-timer'

interface ContestServerSideProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
}

interface ContestProps {
  contestId: string
  contest: ContestSchema
  contestStatus: ContestStatusEnum
  serverTime: string
}

const ContestContext = createContext<ContestProps | null>(null)

export function useContest() {
  const context = useContext(ContestContext)
  if (!context) {
    throw new Error('useContest must be used within a ContestProvider.')
  }
  return context
}

export function useContestProps(props: ContestServerSideProps): ContestProps {
  const getServerTime = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(new Date(props.serverTime)),
  })
  const getContest = useQuery({
    ...contestKey.getContest({
      params: { contestId: props.contestId },
    }),
    initialData: initialDataSuccess(ContestSchema.parse(props.contest)),
  })
  // TODO: Handle status !== 200
  const serverTime = getServerTime.data.body
  const contest = getContest.data.body
  const contestStatus: ContestStatusEnum = (() => {
    if (contest.timeStart > serverTime) {
      return 'PENDING'
    } else if (contest.timeEnd > serverTime) {
      return 'RUNNING'
    } else {
      return 'FINISHED'
    }
  })()
  return {
    contestId: props.contestId,
    contest,
    contestStatus,
    serverTime: serverTime.toString(),
  }
}

const ContestProvider = ({
  children,
  value,
}: {
  children: ReactNode
  value: ContestServerSideProps
}) => {
  return (
    <ContestContext.Provider value={useContestProps(value)}>
      {children}
    </ContestContext.Provider>
  )
}

export function ContestLayout(
  props: ContestServerSideProps & { children: ReactNode }
) {
  return (
    <ContestProvider value={props}>
      <SidebarProvider className="max-w-screen-2xl mx-auto">
        <Sidebar>
          <SidebarContent className="pt-2">
            <ContestSidebar />
          </SidebarContent>
          <SidebarFooter>
            <ContestAnnouncementAlert />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset id="content">{props.children}</SidebarInset>
      </SidebarProvider>
    </ContestProvider>
  )
}

function ContestSidebar() {
  const { contestStatus } = useContest()
  if (contestStatus === 'PENDING') {
    return <PreContestSidebar />
  } else if (contestStatus === 'RUNNING') {
    return <MidContestSidebar />
  } else {
    return <PostContestSidebar />
  }
}

function PreContestSidebar() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <HomeMenuItem />
          <CPPRefMenuItem />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function PostContestSidebar() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <HomeMenuItem />
          <ScoreboardMenuItem />
          <SubmissionMenuItem />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function MidContestSidebar() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <HomeMenuItem />
            <ScoreboardMenuItem />
            <SubmissionMenuItem />
            <CPPRefMenuItem />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <NavProblems />
    </>
  )
}

function HomeMenuItem() {
  const { contest } = useContest()
  return (
    <SidebarMenuItem>
      <SideBarButton
        href={`/contest/${contest.id}`}
        className="flex items-center gap-2"
      >
        <HomeIcon className="size-4" />
        Home
      </SideBarButton>
    </SidebarMenuItem>
  )
}

function ScoreboardMenuItem() {
  const { contest, contestStatus } = useContest()
  if (contest.scoreboardPolicy === 'NOT_VISIBLE') {
    return null
  }
  if (
    contest.scoreboardPolicy === 'AFTER_CONTEST' &&
    contestStatus !== 'FINISHED'
  ) {
    return null
  }
  return (
    <SidebarMenuItem>
      <SideBarButton
        href={`/contest/${contest.id}/scoreboard`}
        className="flex items-center gap-2"
      >
        <TrophyIcon className="size-4" />
        Scoreboard
      </SideBarButton>
    </SidebarMenuItem>
  )
}

function SubmissionMenuItem() {
  const { isAdmin } = useUserContext()
  const { contest } = useContest()
  if (!isAdmin) {
    return null
  }
  return (
    <SidebarMenuItem>
      <SideBarButton
        href={`/contest/${contest.id}/submission`}
        className="flex items-center gap-2"
      >
        <TablePropertiesIcon className="size-4" />
        Submission
      </SideBarButton>
    </SidebarMenuItem>
  )
}

function NavProblems() {
  const { contest } = useContest()
  const getContestDetail = useQuery({
    ...contestKey.getContestDetail({
      params: { contestId: contest.id.toString() },
    }),
  })
  const getUserScores = useQuery({
    ...contestKey.getUserContestScores({
      params: { contestId: contest.id.toString() },
    }),
  })
  if (getContestDetail.isLoading || getUserScores.isLoading) {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel className="text-sm flex items-center gap-2">
              <ClockIcon className="size-4" />
              เหลือเวลาอีก <Timer />
            </SidebarGroupLabel>
            <SidebarGroupLabel className="text-sm flex items-center gap-2">
              คะแนนรวม <Spinner size="sm" />
            </SidebarGroupLabel>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm flex items-center gap-2">
            <BookOpenIcon className="size-4" />
            Problems
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Array.from({ length: 5 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    )
  }
  if (
    getContestDetail.data === undefined ||
    getContestDetail.data.status !== 200
  ) {
    return null
  }
  const contestProblems = getContestDetail.data.body.contestProblem.sort(
    (a, b) => a.problem.id - b.problem.id
  )
  if (getUserScores.data === undefined || getUserScores.data.status !== 200) {
    return null
  }
  const userScores = getUserScores.data.body
  const problemToScore = Object.fromEntries(
    userScores.map((problemReult) => [
      problemReult.problemId,
      problemReult.score,
    ])
  )
  const totalScore = userScores.reduce((acc, score) => acc + score.score, 0)
  const totalFullScore = contestProblems.reduce(
    (acc, { problem }) => acc + problem.score,
    0
  )
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel className="text-sm flex items-center gap-2">
            <ClockIcon className="size-4" />
            เหลือเวลาอีก <Timer />
          </SidebarGroupLabel>
          <SidebarGroupLabel className="text-sm">
            คะแนนรวม {totalScore} / {totalFullScore}
          </SidebarGroupLabel>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel className="text-sm flex items-center gap-2">
          <BookOpenIcon className="size-4" />
          Problems
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              {contestProblems.map(({ problem }) => {
                const score = problemToScore[problem.id] ?? 0
                function getBadgeVariant() {
                  if (score === problem.score) return 'accept'
                  if (score === 0) return 'reject'
                  return 'warning'
                }
                return (
                  <SidebarMenuSub className="mr-0 pr-0" key={problem.id}>
                    <SideBarButton
                      href={`/contest/${contest.id}/problem/${problem.id}`}
                      className="h-10 flex gap-2 justify-between items-center"
                    >
                      {problem.name}
                      <Badge variant={getBadgeVariant()}>{score}</Badge>
                    </SideBarButton>
                  </SidebarMenuSub>
                )
              })}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

function Timer() {
  const { contestId, contest, serverTime } = useContest()
  const remaining = useTimer({
    start: serverTime,
    end: contest.timeEnd.toString(),
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (remaining <= 0) {
      queryClient.invalidateQueries({
        queryKey: appKey.time._def,
      })
      queryClient.invalidateQueries({
        queryKey: contestKey.getContest({
          params: { contestId },
        }),
      })
    }
  }, [remaining])
  return <>{toTimerFormat(remaining)}</>
}

function CPPRefMenuItem() {
  if (!environment.CPP_REF_LINK) {
    return null
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="flex items-center gap-2 text-muted-foreground"
      >
        <a href={environment.CPP_REF_LINK} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          C++ Reference
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function usePathActive(props: { href: string }) {
  const router = useRouter()
  const contestId = router.query.contestId
  const problemId = router.query.problemId
  const pathname = router.pathname
    .replace('[contestId]', contestId as string)
    .replace('[problemId]', problemId as string)
  return props.href === pathname
}

const SideBarButton = (props: {
  href: string
  children: ReactNode
  className?: string
}) => {
  const isActive = usePathActive(props)
  const pathname = useRouter().asPath

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={clsx(
        'aria-[current=true]:text-foreground text-muted-foreground',
        props.className
      )}
    >
      <NextLink
        aria-current={isActive}
        href={props.href}
        scroll={pathname === props.href}
      >
        {props.children}
      </NextLink>
    </SidebarMenuButton>
  )
}

const ContestAnnouncementAlert = () => {
  const { contest } = useContest()

  const getContestDetail = useQuery({
    ...contestKey.getContestDetail({
      params: { contestId: contest.id.toString() },
    }),
  })

  if (!getContestDetail.data?.body._count.announcements) {
    return null
  }

  return (
    <NextLink href={`/contest/${contest.id}/announcement`}>
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>ประกาศ!</AlertTitle>
        <AlertDescription>กดอ่านด้วย</AlertDescription>
      </Alert>
    </NextLink>
  )
}
