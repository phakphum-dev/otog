import { useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Head from 'next/head'
import NextLink from 'next/link'

import { Contest } from '@otog/database'
import { Button } from '@otog/ui'

import { appKey, appQuery, contestQuery } from '../../api/query'
import { withSession } from '../../api/with-session'
import { initialDataSuccess } from '../../utils/initial-data-success'
import { ONE_SECOND, getRemaining, toThTimeFormat } from '../../utils/time'
import { useTimer } from '../../utils/use-timer'

interface ContestPageProps {
  currentContest: Contest | null
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
  return (
    <main className="container max-w-4xl flex-1 flex flex-col" id="content">
      <Head>
        <title>Contest | OTOG</title>
      </Head>
      {props.currentContest ? (
        <ContestDisplay
          currentContest={props.currentContest}
          serverTime={props.serverTime}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h1 className="font-heading text-4xl font-semibold">
            ยังไม่มีการแข่งขัน
          </h1>
          <Button asChild>
            <NextLink href="/contest/history">ประวัติการแข่งขัน</NextLink>
          </Button>
        </div>
      )}
    </main>
  )
}

interface ContestProps {
  currentContest: Contest
  serverTime: string
}

const ContestDisplay = (props: ContestPageProps) => {
  if (props.currentContest === null) {
    return <NoContest />
  }
  console.log(props)
  if (dayjs().isBefore(props.currentContest.timeStart)) {
    return (
      <PreContest
        currentContest={props.currentContest}
        serverTime={props.serverTime}
      />
    )
  }
}

const NoContest = () => {
  return (
    <div className="flex flex-1 items-center justify-center flex-col gap-4">
      <h1 className="font-heading text-4xl font-semibold">
        ยังไม่มีการแข่งขัน
      </h1>
      <Button asChild>
        <NextLink href="/contest/history">ประวัติการแข่งขัน</NextLink>
      </Button>
    </div>
  )
}

const PreContest = (props: ContestProps) => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center font-heading text-4xl font-bold">
          การแข่งขัน {props.currentContest.name} กำลังจะเริ่ม
        </h1>
        <h2 className="text-center font-heading text-2xl font-bold">
          ในอีก <CountDown {...props} />
          ...
        </h2>
      </div>
    </div>
  )
}

const CountDown = (props: ContestProps) => {
  const serverTimeQuery = useQuery({
    ...appKey.time(),
    initialData: initialDataSuccess(props.serverTime),
  })
  const remaining = useTimer(
    serverTimeQuery.data.body,
    props.currentContest.timeStart.toString() // TODO
  )
  useEffect(() => {
    if (remaining <= 0) {
      serverTimeQuery.refetch()
    }
  }, [remaining])
  return <>{toThTimeFormat(remaining)}</>
}
