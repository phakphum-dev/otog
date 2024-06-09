import { useState } from 'react'

import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

import { Submission, SubmissionStatus } from '@otog/database'
import { Button } from '@otog/ui'

import { SubmissionDialog } from './submission-dialog'

export const SubmissionStatusLabel: Record<SubmissionStatus, string> = {
  accept: 'ผ่านแล้ว',
  grading: 'กำลังตรวจ',
  waiting: 'กำลังรอตรวจ',
  reject: 'ไม่ผ่าน',
}
export const SubmissionStatusButton = ({
  submission,
}: {
  submission: Pick<Submission, 'id' | 'status'> | null
}) => {
  const [open, setOpen] = useState(false)

  const icon = (() => {
    switch (submission?.status) {
      case 'accept':
        return <CheckCircleIcon className="text-success" />
      case 'grading':
      case 'waiting':
        return <ClockIcon className="text-muted-foreground" />
      case 'reject':
        return <XCircleIcon className="text-destructive" />
      default:
        return (
          <div className="size-[15px] border-muted-foreground border rounded-full" />
        )
    }
  })()

  if (!submission) {
    return (
      <div className="flex justify-center w-full gap-2" title="ยังไม่ได้ส่ง">
        {icon}
      </div>
    )
  }
  return (
    <>
      <Button
        title={SubmissionStatusLabel[submission.status]}
        variant="ghost"
        className="[&>svg]:size-5"
        size="icon"
        onClick={() => setOpen(true)}
      >
        {icon}
      </Button>
      <SubmissionDialog
        open={open}
        setOpen={setOpen}
        submissionId={submission.id}
      />
    </>
  )
}
