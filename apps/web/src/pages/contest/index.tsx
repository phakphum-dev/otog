import { useEffect, useRef } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Head from 'next/head'
import NextLink from 'next/link'

import { CurrentContest } from '@otog/contract'
import { Button } from '@otog/ui'

import { appKey, appQuery, contestKey, contestQuery } from '../../api/query'
import { withSession } from '../../api/with-session'
import { environment } from '../../env'
import { AnnouncementCarousel } from '../../modules/announcement'
import { TaskCard } from '../../modules/contest/task-card'
import { initialDataSuccess } from '../../utils/initial-data-success'
import { toThaiDuration, toTimerFormat } from '../../utils/time'
import { useTimer } from '../../utils/use-timer'

interface ContestPageProps {
  currentContest: CurrentContest | null
  serverTime: string
}

export const getServerSideProps = withSession<ContestPageProps>(async () => {
  const getCurrentContest = await contestQuery.getCurrentContest.query()
  const getTime = await appQuery.time.query()
  if (getCurrentContest.status !== 200) {
    throw getCurrentContest
  }
  if (getTime.status !== 200) {
    throw getTime
  }
  return {
    props: {
      currentContest: getCurrentContest.body.currentContest,
      serverTime: getTime.body,
    },
  }
})

export default function ContestPage(props: ContestPageProps) {
  const currentContestQuery = useQuery({
    ...contestKey.getCurrentContest(),
    initialData: initialDataSuccess({ currentContest: props.currentContest }),
  })
  const currentContest =
    currentContestQuery.data.status === 200
      ? currentContestQuery.data.body.currentContest
      : null
  return (
    <>
      <Head>
        <title>Contest | OTOG</title>
      </Head>
      <ContestDisplay
        currentContest={currentContest}
        serverTime={props.serverTime}
      />
    </>
  )
}

interface ContestProps {
  currentContest: CurrentContest
  serverTime: string
}

const ContestDisplay = (props: ContestPageProps) => {
  if (props.currentContest === null) {
    return <NoContest />
  }
  if (dayjs().isBefore(props.currentContest.timeStart)) {
    return (
      <PreContest
        currentContest={props.currentContest}
        serverTime={props.serverTime}
      />
    )
  }
  if (
    dayjs().isAfter(props.currentContest.timeStart) &&
    dayjs().isBefore(props.currentContest.timeEnd)
  ) {
    return (
      <MidContest
        currentContest={props.currentContest}
        serverTime={props.serverTime}
      />
    )
  }
  if (dayjs().isBefore(dayjs(props.currentContest.timeEnd).add(3, 'hours'))) {
    return (
      <PostContest
        currentContest={props.currentContest}
        serverTime={props.serverTime}
      />
    )
  }
  return <NoContest />
}

const NoContest = () => {
  return (
    <main
      className="flex flex-1 items-center justify-center flex-col gap-4"
      id="content"
    >
      <h1 className="font-heading text-4xl font-semibold">
        ยังไม่มีการแข่งขัน
      </h1>
      <Button asChild>
        <NextLink href="/contest/history">ประวัติการแข่งขัน</NextLink>
      </Button>
    </main>
  )
}

const PreContest = (props: ContestProps) => {
  return (
    <main
      className="container max-w-4xl flex flex-col flex-1 items-center justify-center"
      id="content"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center font-heading text-4xl font-bold">
          การแข่งขัน {props.currentContest.name} กำลังจะเริ่ม
        </h1>
        <h2 className="text-center font-heading text-2xl font-bold">
          ในอีก <CountDown {...props} />
          ...
        </h2>
      </div>
    </main>
  )
}

const CountDown = (props: ContestProps) => {
  const serverTimeQuery = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(props.serverTime),
  })
  const remaining = useTimer({
    start: serverTimeQuery.data.body,
    end: props.currentContest.timeStart.toString(), // TODO
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (remaining <= 0) {
      queryClient.invalidateQueries({
        queryKey: contestKey.getCurrentContest._def,
      })
    }
  }, [remaining])
  return <>{toThaiDuration(remaining)}</>
}

const MidContest = (props: ContestProps) => {
  return (
    <main
      className="container lg:max-w-screen-md flex flex-col gap-6 flex-1 py-8"
      id="content"
    >
      <AnnouncementCarousel contestId={props.currentContest.id} />
      <div className="flex justify-between gap-2">
        <h2 className="whitespace-nowrap font-heading text-xl font-semibold">
          {props.currentContest.name}
        </h2>
        <p className="font-semibold text-xl tabular-nums">
          <Timer {...props} />
        </p>
      </div>
      <ul className="flex flex-col gap-6">
        {props.currentContest.contestProblem.map(({ problem }) => (
          <li key={problem.id}>
            <TaskCard problem={problem} contestId={props.currentContest.id} />
          </li>
        ))}
      </ul>
    </main>
  )
}

const Timer = (props: ContestProps) => {
  const serverTimeQuery = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(props.serverTime),
  })
  const remaining = useTimer({
    start: serverTimeQuery.data.body,
    end: props.currentContest.timeEnd.toString(), // TODO
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (remaining <= 0) {
      queryClient.invalidateQueries({
        queryKey: contestKey.getCurrentContest._def,
      })
    }
  }, [remaining])
  return <>{toTimerFormat(remaining)}</>
}

const PostContest = (props: ContestProps) => {
  return (
    <main
      className="container max-w-4xl flex flex-col flex-1 items-center justify-center"
      id="content"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center font-heading text-4xl font-bold">
          การแข่งขัน {props.currentContest.name} จบลงแล้ว
        </h1>
        {environment.OFFLINE_MODE ? (
          <GeanButton />
        ) : (
          <Button asChild>
            <NextLink href={`/contest/${props.currentContest.id}`}>
              สรุปผลการแข่งขัน
            </NextLink>
          </Button>
        )}
      </div>
    </main>
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
