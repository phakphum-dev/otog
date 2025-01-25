// import { ConfirmModalProvider } from '@src/context/ConfirmContext'
// import { useAnalytics } from '@src/hooks/useAnalytics'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  QueryClient as TsRestQueryClient,
  QueryClientProvider as TsRestQueryClientProvider,
} from '@ts-rest/react-query/tanstack'
import { ClickToComponent } from 'click-to-react-component'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'

import { Button } from '@otog/ui/button'
import '@otog/ui/styles.css'
import { TooltipProvider } from '@otog/ui/tooltip'

import { Chat } from '../components/chat'
import { Footer } from '../components/footer'
import { Navbar } from '../components/navbar'
import { ThemeProvider } from '../components/theme-provider'
import { SocketProvider } from '../context/socket-context'
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

      <SessionProvider session={session}>
        <TsRestQueryClientProvider client={tsRestQueryClient}>
          <QueryClientProvider client={queryClient}>
            <UserContextProvider session={session}>
              <SocketProvider>
                <TooltipProvider delayDuration={0}>
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
                      <Chat />
                      {((Component as any).footer ?? true) && <Footer />}
                    </div>
                    <Toaster
                      position="bottom-center"
                      toastOptions={{
                        className: '!text-foreground !bg-background',
                      }}
                    />
                    <ClickToComponent />
                  </ThemeProvider>
                </TooltipProvider>
              </SocketProvider>
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
      asChild
    >
      <a href="#content">ข้ามไปยังเนื้อหาหลัก</a>
    </Button>
  )
}
