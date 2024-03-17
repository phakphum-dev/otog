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
// import '@src/styles/nprogress.css'
// import 'focus-visible/dist/focus-visible'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
// import { ThemeProvider } from 'next-themes'
import { AppProps } from 'next/app'
// import dynamic from 'next/dynamic'
import Head from 'next/head'

import '@otog/ui/styles.css'

import { ThemeProvider } from '../components/theme-provider'
import { anuphan, inter, sukhumvit } from '../fonts'

// const TopProgressBar = dynamic(
//   () => import('@src/components/layout/ProgressBar'),
//   {
//     ssr: false,
//   }
// )

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
          --font-anuphan: ${anuphan.style.fontFamily};
          --font-sukhumvit: ${sukhumvit.style.fontFamily};
        }
      `}</style>
      {/*  <SWRProvider fallback={fallback} session={session}>
          <UserProvider>
          <SocketProvider>
          <Toaster
          position="bottom-center"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-alpha-white-900',
          }}
          />
          <ConfirmModalProvider>
        <TopProgressBar /> */}

      <SessionProvider session={session}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            {/* <NavBar /> */}
            <Component {...props} />
            {/* {!OFFLINE_MODE && <Chat />}
                    <Footer /> */}
          </div>
        </ThemeProvider>
      </SessionProvider>
    </>
  )
}
