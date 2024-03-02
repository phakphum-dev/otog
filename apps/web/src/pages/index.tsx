import Head from 'next/head'
import Image from 'next/image'
import NextLink from 'next/link'

import { Button } from '@otog/ui'

import ComputerImage from '../../public/computer.svg'

export default function HomePage() {
  return (
    <main className="container">
      <Head>
        <title>Login | OTOG</title>
      </Head>
      <div className="flex flex-col gap-16 md:flex-row md:pb-16">
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="font-heading text-5xl font-bold tracking-tight">
            Become a god of Competitive Programming
          </h1>
          <div className="text-md text-gray-500">
            Code and Create algorithms efficiently.
          </div>
          <div className="flex gap-4">
            <NextLink passHref legacyBehavior href="/register">
              <Button
                className="w-[100px]"
                // colorScheme="otog"
              >
                Sign Up
              </Button>
            </NextLink>
            <NextLink passHref legacyBehavior href="/login">
              <Button className="w-[100px]" variant="outline">
                Sign in
              </Button>
            </NextLink>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Image src={ComputerImage} alt="computer image" />
        </div>
      </div>
    </main>
  )
}

// export const getServerSideProps = withSession(async (session) => {
//   if (OFFLINE_MODE) {
//     return {
//       redirect: {
//         permanent: false,
//         destination: '/login',
//       },
//     }
//   }
//   if (session) {
//     return {
//       redirect: {
//         permanent: false,
//         destination: '/problem',
//       },
//     }
//   }
//   return { props: {} }
// })
