import toast from 'react-hot-toast'

import { ProblemDetailSchema } from '@otog/contract'
import { Link } from '@otog/ui/link'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@otog/ui/table'

import { problemQuery } from '../api/query'

interface ProblemDetailProps {
  problem: ProblemDetailSchema
}
export function ProblemDetail(props: ProblemDetailProps) {
  const downloadAttachment = problemQuery.downloadAttachment.useMutation()
  const download = async () => {
    const response = await downloadAttachment.mutateAsync({
      params: { problemId: props.problem.id.toString() },
    })
    if (response.status !== 200) {
      console.error(
        'Failed to download attachment for problem',
        props.problem.id,
        response
      )
      toast.error('ไม่สามารถดาวน์โหลดไฟล์แนบได้')
      return
    }
    const presignedUrl = response.body.url
    window.open(presignedUrl, '_blank')
  }
  return (
    <div className="flex flex-col gap-2 mt-6">
      <h3 className="text-xl font-bold font-heading">รายละเอียด</h3>
      <TableContainer className="w-fit">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">โจทย์</TableCell>
              <TableCell className="text-end">
                <Link
                  className="text-sm"
                  variant="hidden"
                  isExternal
                  href={`/api/problem/${props.problem.id}`}
                >
                  [ดาวน์โหลด]
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                ระยะเวลาจำกัด
              </TableCell>
              <TableCell className="text-end">
                {props.problem.timeLimit / 1000} วินาที
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                หน่วยความจำสูงสุด
              </TableCell>
              <TableCell className="text-end">
                {props.problem.memoryLimit} MB
              </TableCell>
            </TableRow>
            {props.problem.attachmentMetadata && (
              <TableRow>
                <TableCell className="text-muted-foreground">ไฟล์แนบ</TableCell>
                <TableCell className="text-end">
                  <Link className="text-sm" variant="hidden" asChild>
                    <button type="button" onClick={download}>
                      [ดาวน์โหลด]
                    </button>
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
