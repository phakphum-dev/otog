import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'

import { RegisterBody } from '@otog/contract'
import { Button, Form, FormField, FormItem, FormLabel, Input } from '@otog/ui'

import Logo from '../../public/logo512.png'
import { query } from '../api'

export default function RegisterPage() {
  const form = useForm<RegisterBody>()
  const router = useRouter()

  const register = query.auth.register.useMutation()
  const onSubmit = form.handleSubmit(async (values) => {
    await toast.promise(register.mutateAsync({ body: values }), {
      loading: 'กำลังลงทะเบียน...',
      error: 'ลงทะเบียนไม่สำเร็จ',
      success: 'ลงทะเบียนสำเร็จ!',
    })
    router.push('/login')
  })
  return (
    <main className="container flex-1">
      <Head>
        <title>Register | OTOG</title>
      </Head>
      <Form {...form}>
        <form
          id="content"
          onSubmit={onSubmit}
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
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้ใช้</FormLabel>
                  <Input
                    {...field}
                    placeholder="ชื่อผู้ใช้"
                    required
                    autoFocus
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
                    placeholder="รหัสผ่าน"
                    required
                    type="password"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="showName"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อที่ใช้แสดง</FormLabel>
                  <Input {...field} placeholder="ชื่อที่ใช้แสดง" required />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-5">
              ลงทะเบียน
            </Button>
          </div>
        </form>
      </Form>
    </main>
  )
}
