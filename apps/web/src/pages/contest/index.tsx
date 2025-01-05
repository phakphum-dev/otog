import dayjs from 'dayjs'
import Head from 'next/head'
import NextLink from 'next/link'

import { Contest } from '@otog/database'
import { Button } from '@otog/ui'

import { queryContest } from '../../api/query'
import { withSession } from '../../api/with-session'

interface ContestPageProps {
  currentContest: Contest | null
}

export const getServerSideProps = withSession<ContestPageProps>(async () => {
  const getCurrentContest = await queryContest.getCurrentContest.query()
  if (getCurrentContest.status !== 200) {
    return {
      props: {
        currentContest: null,
      },
    }
  }
  return {
    props: {
      currentContest: getCurrentContest.body.currentContest,
    },
  }
})

export default function ContestPage({ currentContest }: ContestPageProps) {
  return (
    <main className="container max-w-4xl flex-1 flex flex-col" id="content">
      <Head>
        <title>Contest | OTOG</title>
      </Head>
      {currentContest ? (
        <ContestDisplay contest={currentContest} />
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
  contest: Contest
}

const ContestDisplay = (props: ContestProps) => {
  if (dayjs(props.contest.timeStart).isBefore(Date.now())) {
    return <PreContest contest={props.contest} />
  }
}

const PreContest = (props: ContestProps) => {
  return null
  // const { contest, time } = props
  // const { data: serverTime } = useServerTime()
  // const remaining = useTimer(serverTime || time, contest.timeStart)
  // useEffect(() => {
  //   if (remaining <= 0) {
  //     mutate('time')
  //   }
  // }, [remaining])
  // return (
  //   <div className="flex flex-1 items-center justify-center">
  //     <div className="flex flex-col items-center gap-4">
  //       <h1 className="text-center font-heading text-4xl font-bold">
  //         การแข่งขัน {contest.name} กำลังจะเริ่ม
  //       </h1>
  //       <h2 className="text-center text-2xl font-bold">
  //         ในอีก {toThTimeFormat(remaining)}...
  //       </h2>
  //     </div>
  //   </div>
  // )
}
