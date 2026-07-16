import { useState } from 'react'

import {
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react'

import { Submission, SubmissionStatus } from '@otog/database'
import { Button } from '@otog/ui/button'

import { useUserContext } from '../context/user-context'
import { SubmissionDialog } from './submission-dialog'

export const SubmissionStatusLabel: Record<SubmissionStatus, string> = {
  accept: 'ผ่านแล้ว',
  grading: 'กำลังตรวจ',
  waiting: 'กำลังรอตรวจ',
  reject: 'ไม่ผ่าน',
  compileError: 'Compilation Error',
  judgeError: 'Judge Error',
}

export function SubmissionStatusIcon(props: { status?: SubmissionStatus }) {
  switch (props.status) {
    case 'accept':
      return <CheckCircleIcon className="text-success" />
    case 'grading':
    case 'waiting':
      return <ClockIcon className="text-muted-foreground" />
    case 'reject':
      return <XCircleIcon className="text-destructive" />
    case 'compileError':
      return <WarningCircleIcon className="text-purple-500" />
    case 'judgeError':
      return <WarningCircleIcon className="text-purple-500" />
    default:
      return (
        <div className="size-[15px] border-muted-foreground border rounded-full" />
      )
  }
}

export const SubmissionStatusButton = ({
  submission,
}: {
  submission: Pick<Submission, 'id' | 'status' | 'userId' | 'public'> | null
}) => {
  const [open, setOpen] = useState(false)
  const { user } = useUserContext()

  const icon = <SubmissionStatusIcon status={submission?.status} />
  if (!submission) {
    return (
      <div
        className="[&>svg]:size-5 size-10 inline-flex justify-center items-center"
        title="ยังไม่ได้ส่ง"
      >
        {icon}
      </div>
    )
  }
  if (
    !user ||
    !(
      submission.userId === user.id ||
      user.role === 'admin' ||
      submission.public
    )
  ) {
    return (
      <div className="[&>svg]:size-5 size-10 inline-flex justify-center items-center">
        <SubmissionStatusIcon status={submission.status} />
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
