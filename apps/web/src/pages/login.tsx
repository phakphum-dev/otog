import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

// import { useUserData } from '@src/context/UserContext'
// import { errorToast, onErrorToast } from '@src/hooks/useErrorToast'
import { signIn } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

import { LoginBody } from '@otog/contract'
import { Button, Form, FormField, FormItem, FormLabel, Input } from '@otog/ui'

import Logo from '../../public/logo512.png'
import { withSession } from '../api/withSession'
import { environment } from '../env'

export default function LoginPage() {
  const router = useRouter()
  const form = useForm<LoginBody>()
  //   const { clearCache } = useUserData()
  const onSubmit = async (credentials: LoginBody) => {
    try {
      const response = await signIn('otog', {
        username: credentials.username,
        password: credentials.password,
        redirect: false,
      })
      if (response?.ok) {
        toast.success('ลงชื่อเข้าใช้สำเร็จ !')
        // clearCache()
        router.replace(environment.OFFLINE_MODE ? '/contest' : '/problem')
      } else if (response?.status === 401) {
        // errorToast({
        //   title: 'ลงชื่อเข้าใช้งานไม่สำเร็จ !',
        //   description: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง',
        //   status: 'error',
        //   code: 401,
        // })
      } else {
        throw response
      }
    } catch (e: unknown) {
      //   onErrorToast(e)
    }
  }
  return (
    <main className="container flex-1">
      <Head>
        <title>Login | OTOG</title>
      </Head>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto my-8 max-w-[300px] rounded-2xl border border-border p-5 shadow-md"
        >
          <div className="flex flex-col gap-4">
            <Image
              src={Logo}
              className="mx-auto w-[100px] my-4"
              alt="otog logo"
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้ใช้</FormLabel>
                  <Input
                    {...field}
                    placeholder="ชื่อผู้ใช้"
                    autoFocus
                    required
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <Input
                    {...field}
                    type="password"
                    placeholder="รหัสผ่าน"
                    required
                  />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-5">
              เข้าสู่ระบบ
            </Button>
            {/* {session ? (
              <Button onClick={() => signOut()}>Sign out here</Button>
            ) : (
              <Button onClick={() => signIn('google')} leftIcon={<FaGoogle />}>
                ลงชื่อเข้าใช้ด้วย Google
              </Button>
            )} */}
            {!environment.OFFLINE_MODE && (
              <>
                <hr />
                <Button asChild variant="secondary">
                  <NextLink href="/register">ลงทะเบียน</NextLink>
                </Button>
              </>
            )}
          </div>
        </form>
      </Form>
    </main>
  )
}

export const getServerSideProps = withSession(async (session) => {
  if (session) {
    return {
      redirect: {
        destination: environment.OFFLINE_MODE ? '/contest' : '/problem',
        permanent: false,
      },
    }
  }
  return { props: {} }
})
