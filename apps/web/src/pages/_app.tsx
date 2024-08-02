// import { Toaster } from 'react-hot-toast'
// import { loader } from '@monaco-editor/react'
// import { Chat } from '@src/chat'
// import { Footer } from '@src/components/layout/Footer'
// import { NavBar } from '@src/components/layout/NavBar'
// import { OFFLINE_MODE } from '@src/config'
// import { ConfirmModalProvider } from '@src/context/ConfirmContext'
// import { SWRProvider } from '@src/context/SWRContext'
// import { SocketProvider } from '@src/context/SocketContext'
// import { UserProvider } from '@src/context/UserContext'
// import { useAnalytics } from '@src/hooks/useAnalytics'
// import { ErrorToastOptions, useErrorToaster } from '@src/hooks/useErrorToast'
// import 'focus-visible/dist/focus-visible'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  QueryClient as TsRestQueryClient,
  QueryClientProvider as TsRestQueryClientProvider,
} from '@ts-rest/react-query/tanstack'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
// import { ThemeProvider } from 'next-themes'
import { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'

import { Button } from '@otog/ui'
import '@otog/ui/styles.css'

import { Footer } from '../components/footer'
import { Navbar } from '../components/navbar'
import { ThemeProvider } from '../components/theme-provider'
import { UserContextProvider } from '../context/user-context'
import { inter, notosans, sarabun } from '../fonts'
import '../styles/nprogress.css'

dayjs.locale('th')
dayjs.extend(buddhistEra)

const ProgressBar = dynamic(() => import('./../components/progress-bar'), {
  ssr: false,
})

// if (OFFLINE_MODE) {
//   loader.config({
//     paths: {
//       vs: '/vs',
//     },
//   })
// }

type MyAppProps = AppProps<{
  //   errorData: ErrorToastOptions
  //   fallback: { [key: string]: string }
  session: Session
}>

export default function MyApp({ Component, pageProps }: MyAppProps) {
  const { session, ...props } = pageProps

  const [tsRestQueryClient] = useState(
    () =>
      new TsRestQueryClient({
        defaultOptions: { mutations: { throwOnError: false } },
      })
  )
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { mutations: { throwOnError: false } },
      })
  )

  //   useErrorToaster(errorData)
  //   useAnalytics()
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Become a god of competitive programming. Code and create algorithms efficiently."
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo196.png" type="image/png" />
        <link rel="shortcut icon" href="/logo196.png" />
        <link rel="apple-touch-icon" href="/logoIOS.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
          --font-sarabun: ${sarabun.style.fontFamily};
          --font-notosans: ${notosans.style.fontFamily};
        }
      `}</style>
      {/* 
          <SocketProvider>
          <ConfirmModalProvider>
         */}

      <SessionProvider session={session}>
        <TsRestQueryClientProvider client={tsRestQueryClient}>
          <QueryClientProvider client={queryClient}>
            <UserContextProvider session={session}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen flex flex-col">
                  <SkipToMainContent />
                  <ProgressBar />
                  <Navbar />
                  <Component {...props} />
                  <Footer />
                  {/* {!OFFLINE_MODE && <Chat /> */}
                </div>
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    className: '!text-foreground !bg-background',
                  }}
                />
              </ThemeProvider>
            </UserContextProvider>
          </QueryClientProvider>
        </TsRestQueryClientProvider>
      </SessionProvider>
    </>
  )
}

const SkipToMainContent = () => {
  return (
    <Button
      className="opacity-0 absolute left-4 top-4 focus-visible:opacity-100 focus-visible:z-50"
      onClick={() => {
        const nodes = document.getElementsByTagName('h1')
        const h1 = nodes[0]
        if (!h1) return
        h1.setAttribute('tabindex', '-1')
        h1.focus()
      }}
    >
      ข้ามไปยังเนื้อหาหลัก
    </Button>
  )
}
