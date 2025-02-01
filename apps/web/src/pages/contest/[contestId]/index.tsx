import { useEffect, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import Head from 'next/head'
import NextLink from 'next/link'

import { ContestSchema } from '@otog/contract'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@otog/ui/breadcrumb'
import { Button } from '@otog/ui/button'
import { Separator } from '@otog/ui/separator'

import { SidebarTrigger } from '../../../../../../packages/ui/src/sidebar'
import { appKey, contestKey } from '../../../api/query'
import { withQuery } from '../../../api/server'
import { environment } from '../../../env'
import { ContestLayout, useContest } from '../../../modules/contest/sidebar'
import { toThaiDuration } from '../../../utils/time'
import { useTimer } from '../../../utils/use-timer'

interface ContestPageProps {
  contestId: string
  contest: ContestSchema
  serverTime: string
}

export const getServerSideProps = withQuery<ContestPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(Number(contestId))) {
      return { notFound: true }
    }
    const [getServerTime, getContest] = await Promise.all([
      query.app.time.query(),
      query.contest.getContest.query({
        params: { contestId: contestId },
      }),
    ])
    if (getServerTime.status !== 200 || getContest.status !== 200) {
      return { notFound: true }
    }
    return {
      props: {
        contestId,
        contest: getContest.body,
        serverTime: getServerTime.body.toString(),
      },
    }
  }
)

export default function ContestPage(props: ContestPageProps) {
  return (
    <ContestLayout {...props}>
      <Head>
        <title>{props.contest.name} | OTOG</title>
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
                <Breadcrumb>{props.contest.name}</Breadcrumb>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-heading text-lg font-semibold">
                  Home
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="container max-w-4xl flex flex-col flex-1 items-center justify-center">
          <ContestDisplay />
        </div>
      </section>
    </ContestLayout>
  )
}
ContestPage.footer = false

function ContestDisplay() {
  const { contestStatus } = useContest()
  if (contestStatus === 'PENDING') {
    return <PreContest />
  } else if (contestStatus === 'RUNNING') {
    return <MidContest />
  } else {
    return <PostContest />
  }
}

function PreContest() {
  const { contest } = useContest()
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-center font-heading text-4xl font-bold">
        การแข่งขัน {contest.name} กำลังจะเริ่ม
      </h1>
      <h2 className="text-center font-heading text-2xl font-bold">
        ในอีก <CountDown />
        ...
      </h2>
    </div>
  )
}

function CountDown() {
  const { contestId, contest, serverTime } = useContest()
  const remaining = useTimer({
    start: serverTime,
    end: contest.timeStart.toString(),
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
  return <>{toThaiDuration(remaining)}</>
}

function MidContest() {
  const { contest } = useContest()
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-center font-heading text-4xl font-bold">
        การแข่งขัน {contest.name}
      </h1>
      <h2 className="text-center font-heading text-2xl font-bold">
        เหลือเวลาอีก <Timer />
        ...
      </h2>
    </div>
  )
}

function Timer() {
  const { serverTime, contest } = useContest()
  const remaining = useTimer({
    start: serverTime,
    end: contest.timeEnd.toString(),
  })
  return <>{toThaiDuration(remaining)}</>
}

function PostContest() {
  const { contest } = useContest()
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-center font-heading text-4xl font-bold">
        การแข่งขัน {contest.name} จบลงแล้ว
      </h1>
      {environment.OFFLINE_MODE ? (
        <GeanButton />
      ) : (
        <Button asChild>
          <NextLink href={`/contest/${contest.id}/scoreboard`}>
            สรุปผลการแข่งขัน
          </NextLink>
        </Button>
      )}
    </div>
  )
}

const GeanButton = () => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const distanceBetween = (
      p1x: number,
      p1y: number,
      p2x: number,
      p2y: number
    ) => {
      const dx = p1x - p2x
      const dy = p1y - p2y
      return Math.sqrt(dx * dx + dy * dy)
    }
    const onMouseMove = (event: MouseEvent) => {
      const button = buttonRef.current
      if (!button) return
      const width = button.offsetWidth
      const height = button.offsetHeight
      const radius = Math.max(width * 0.75, height * 0.75, 100)

      const parent = button.parentNode as HTMLDivElement
      const bx = parent.offsetLeft + button.offsetLeft + width / 2
      const by = parent.offsetTop + button.offsetTop + height / 2

      const dist = distanceBetween(event.clientX, event.clientY, bx, by)
      const angle = Math.atan2(event.clientY - by, event.clientX - bx)

      const ox = -1 * Math.cos(angle) * Math.max(radius - dist, 0)
      const oy = -1 * Math.sin(angle) * Math.max(radius - dist, 0)

      const rx = oy / 2
      const ry = -ox / 2

      button.style.transform = `translate(${ox}px, ${oy}px) rotateX(${rx}deg) rotateY(${ry}deg)`
      button.style.boxShadow = `0px ${Math.abs(oy)}px ${
        (Math.abs(oy) / radius) * 40
      }px rgba(0,0,0,0.15)`
    }
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      document.removeEventListener('mousedown', onMouseMove)
    }
  }, [])
  return (
    <div className="relative">
      <Button
        style={{
          transformStyle: 'preserve-3d',
          transition: 'all 0.1s ease',
        }}
        className="cursor-none after:absolute after:left-0 after:top-0 after:-z-10 after:h-full after:w-full after:rounded-md after:bg-orange-200 after:content-[''] after:-translate-z-2"
        ref={buttonRef}
      >
        สรุปผลการแข่งขัน
      </Button>
    </div>
  )
}
