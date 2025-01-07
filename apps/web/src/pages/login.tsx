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
import { Button } from '@otog/ui/button'
import { Form, FormField, FormItem, FormLabel } from '@otog/ui/form'
import { Input } from '@otog/ui/input'

import Logo from '../../public/logo512.png'
import { withSession } from '../api/with-session'
import { useUserContext } from '../context/user-context'
import { environment } from '../env'

export default function LoginPage() {
  const router = useRouter()
  const form = useForm<LoginBody>()

  const { clearCache } = useUserContext()
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading('กำลังลงชื่อเข้าใช้...')
    try {
      const response = await signIn('otog', {
        username: values.username,
        password: values.password,
        redirect: false,
      })
      if (response?.status === 401) {
        toast.error('ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง', { id: toastId })
        return
      }
      if (!response?.ok) {
        throw response
      }
      toast.success('ลงชื่อเข้าใช้สำเร็จ !', { id: toastId })
      clearCache()
      router.replace(environment.OFFLINE_MODE ? '/contest' : '/')
    } catch (e: unknown) {
      toast.error('ลงชื่อใช้งานไม่สำเร็จ', { id: toastId })
    }
  })
  return (
    <main className="container flex-1">
      <Head>
        <title>Login | OTOG</title>
      </Head>
      <Form {...form}>
        <form
          id="content"
          onSubmit={onSubmit}
          className="mx-auto my-8 max-w-[300px] rounded-2xl border border-border p-5 shadow-md"
        >
          <div className="flex flex-col gap-4">
            <h1 className="sr-only">เข้าสู่ระบบ</h1>
            <Image
              src={Logo}
              className="mx-auto w-[100px] my-4"
              alt="otog logo"
            />
            <FormField
              control={form.control}
              name="username"
              defaultValue=""
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
              defaultValue=""
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
        destination: environment.OFFLINE_MODE ? '/contest' : '/',
        permanent: false,
      },
    }
  }
  return { props: {} }
})
