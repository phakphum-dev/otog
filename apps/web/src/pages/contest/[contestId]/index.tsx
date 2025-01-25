import Head from 'next/head'

import { ContestDetailSchema, ContestSchema } from '@otog/contract'

import { withQuery } from '../../../api/server'
import { SidebarProvider } from '@otog/ui/sidebar'
import { ContestSidebar } from '../../../components/contest-sidebar'

interface ContestPageProps {
  contest: ContestSchema
}

export const getServerSideProps = withQuery<ContestPageProps>(
  async ({ context, query }) => {
    const contestId = context.query.contestId as string
    if (Number.isNaN(Number(contestId))) {
      return { notFound: true }
    }
    const getContest = await query.contest.getContest.query({
      params: { contestId },
    })
    if (getContest.status !== 200) {
      throw getContest
    }
    if (getContest.body === null) {
      return { notFound: true }
    }
    return {
      props: {
        contest: getContest.body,
      },
    }
  }
)

export default function ContestPage(props: ContestPageProps) {
  return (
    <>
      <Head>
        <title>{props.contest.name} | OTOG</title>
      </Head>
      <ContestDisplay contest={props.contest} />
    </>
  )
}
ContestPage.footer = false

interface ContestDisplayProps {
  contest: ContestSchema
}

const ContestDisplay = (props: ContestDisplayProps) => {
  const contest = props.contest
  return (
    <SidebarProvider>
      <ContestSidebar contest={contest} />
    </SidebarProvider>
  )
}
