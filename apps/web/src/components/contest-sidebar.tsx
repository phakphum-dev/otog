import { ReactNode } from 'react'

import { HomeIcon, TrophyIcon } from '@heroicons/react/24/solid'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { CodeLensResolveRequest } from 'vscode-languageclient'

import { ContestDetailSchema, ContestSchema } from '@otog/contract'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@otog/ui/sidebar'
import { clsx } from '@otog/ui/utils'

export const ContestSidebar = ({ contest }: { contest: ContestSchema }) => {
  const time = new Date()
  if (contest.timeStart > time) {
    return <PreContestSidebar contest={contest} />
  } else if (contest.timeEnd < time) {
    // return <MidContestSidebar contest={contest} />
  } else {
    return <PostContestSidebar contest={contest} />
  }
}

const PreContestSidebar = ({ contest }: { contest: ContestSchema }) => {
  return (
    <Sidebar>
      <SidebarHeader>
        <div>{contest.name}</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Home">
                <SideBarButton href={`/contest/${contest.id}`}>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="size-4" />
                    Home
                  </div>
                </SideBarButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

const PostContestSidebar = ({ contest }: { contest: ContestSchema }) => {
  return (
    <Sidebar>
      <SidebarHeader>
        <div>{contest.name}</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Home">
                <SideBarButton href={`/contest/${contest.id}`}>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="size-4" />
                    Home
                  </div>
                </SideBarButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="Scoreboard">
                <SideBarButton href={`/contest/${contest.id}/scoreboard`}>
                  <TrophyIcon className="size-4" />
                  Scoreboard
                </SideBarButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

const MidContestSidebar = ({ contest }: { contest: ContestDetailSchema }) => {

  return (
    <Sidebar>
      <SidebarHeader>
        <div>{contest.name}</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="Home">
                <SideBarButton href={`/contest/${contest.id}`}>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="size-4" />
                    Home
                  </div>
                </SideBarButton>
              </SidebarMenuItem>
              {/* TODO: Hide scoreboard for some contests */}
              <SidebarMenuItem key="Scoreboard">
                <SideBarButton href={`/contest/${contest.id}/scoreboard`}>
                  <TrophyIcon className="size-4" />
                  Scoreboard
                </SideBarButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Problems</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contest.contestProblem.map((problem) => (
                <SidebarMenuItem key={problem.problem.id}>
                  <SideBarButton href={`/contest/${contest.id}/problem/${problem.problem.id}`}>
                    {problem.problem.name}
                  </SideBarButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function usePathActive(props: { href: string }) {
  const router = useRouter()
  const contestId = router.query.contestId
  const pathname = contestId
    ? router.pathname.replace('[contestId]', contestId as string)
    : router.pathname
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
