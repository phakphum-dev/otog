import Head from 'next/head'
import Image from 'next/image'
import NextLink from 'next/link'

import { Button } from '@otog/ui'

import ComputerImage from '../../public/computer.svg'
import { withSession } from '../api/with-session'
import { useUserContext } from '../context/user-context'
import { environment } from '../env'
import { AnnouncementCarousel } from '../modules/announcement'
import { ProblemTable } from '../modules/problem/problem-table'

export default function HomePage() {
  const { isAuthenticated } = useUserContext()
  if (isAuthenticated) {
    return (
      <div className="container flex flex-col gap-6 flex-1 lg:max-w-screen-md py-8">
        <Head>
          <title>Problem | OTOG</title>
        </Head>
        <AnnouncementCarousel />
        <ProblemTable />
      </div>
    )
  }
  return (
    <main
      id="content"
      className="container flex justify-center items-center flex-1"
    >
      <Head>
        <title>One Tambon One Grader</title>
      </Head>
      <section className="flex flex-col gap-6">
        <h1 className="font-heading text-5xl lg:text-7xl font-bold tracking-tight text-balance lg:text-center">
          Become a god of Competitive Programming
        </h1>
        <p className="text-md lg:text-xl text-left lg:text-center text-muted-foreground">
          Code and create algorithms efficiently.
        </p>
        <div className="flex gap-4 lg:justify-center">
          <Button className="w-[100px]" asChild>
            <NextLink href="/register">Sign Up</NextLink>
          </Button>
          <Button className="w-[100px]" variant="outline" asChild>
            <NextLink href="/login">Sign in</NextLink>
          </Button>
        </div>
        <div className="flex items-center justify-center pt-10">
          <Image src={ComputerImage} alt="computer image" />
        </div>
      </section>
    </main>
  )
}

export const getServerSideProps = withSession(async () => {
  if (environment.OFFLINE_MODE) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
  return { props: {} }
})
