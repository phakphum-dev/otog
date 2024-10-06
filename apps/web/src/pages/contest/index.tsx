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
      {currentContest ? null : (
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
