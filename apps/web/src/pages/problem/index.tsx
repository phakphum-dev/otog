import Head from 'next/head'

import { AnnouncementCarousel } from '../../modules/announcement'
import { ProblemTable } from '../../modules/problem/problem-table'

export default function HomePage() {
  return (
    <main
      className="container flex flex-col gap-6 flex-1 lg:max-w-screen-md py-8"
      id="content"
    >
      <Head>
        <title>Problem | OTOG</title>
      </Head>
      <AnnouncementCarousel />
      <ProblemTable />
    </main>
  )
}

export { getServerSideProps } from '../../api/server'
