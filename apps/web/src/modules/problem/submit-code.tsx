import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileArrowUpIcon } from '@phosphor-icons/react'
import { File } from '@web-std/file'
import { z } from 'zod'

import { Problem } from '@otog/database'
import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@otog/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@otog/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'

import { submissionQuery } from '../../api/query'
import { FileInput } from '../../components/file-input'
import { Language, LanguageName } from '../../enums'

const SubmitCodeFormSchema = z.object({
  sourceCode: z.instanceof(File),
  language: z.nativeEnum(Language),
})
type SubmitCodeFormSchema = z.infer<typeof SubmitCodeFormSchema>

export const SubmitCode = (props: {
  problem: Pick<Problem, 'id' | 'name'>
  contestId?: number
  onSuccess: () => void
}) => {
  const [open, setOpen] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<SubmitCodeFormSchema>({
    defaultValues: { language: 'cpp' },
    resolver: zodResolver(SubmitCodeFormSchema),
  })

  const uploadFile = submissionQuery.uploadFile.useMutation({})
  const onSubmit = form.handleSubmit(async (values) => {
    const toastId = toast.loading(`กำลังส่งข้อ ${props.problem.name}...`)
    await uploadFile.mutateAsync(
      {
        params: { problemId: props.problem.id.toString() },
        query: { contestId: props.contestId?.toString() },
        body: values,
      },
      {
        onError: (result) => {
          console.error(result)
          toast.error('ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', { id: toastId })
        },
        onSuccess: () => {
          toast.success('ส่งสำเร็จแล้ว', { id: toastId })
          setOpen(false)
          props?.onSuccess()
        },
      }
    )
  })
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button title="ส่งด้วยไฟล์" size="icon" variant="secondary">
          <FileArrowUpIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>ส่งข้อ {props.problem.name ?? '-'}</DialogTitle>
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.stopPropagation()
              onSubmit(e)
            }}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="sourceCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อัปโหลด</FormLabel>
                  <FormControl>
                    <FileInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ภาษา</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger {...field}>
                        <SelectValue placeholder="เลือกภาษา" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(LanguageName).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={uploadFile.isPending}
          >
            ส่ง
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">ยกเลิก</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
