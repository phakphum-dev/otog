import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { toast } from 'react-hot-toast'

import {
  CheckIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useReactTable } from '@tanstack/react-table'
import {
  Cell,
  Row,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import { produce } from 'immer'

import { Problem } from '@otog/database'
import { Button } from '@otog/ui/button'
import { Textarea } from '@otog/ui/textarea'

import { problemQuery } from '../api/query'
import { useUserContext } from '../context/user-context'
import { useClipboard } from '../hooks/use-clipboard'
import { TableComponent } from './table-component'

interface Testcase {
  input: string
  output: string
}

interface ExampleTableProps {
  problem: Problem
}

export const ExampleTable = ({ problem }: ExampleTableProps) => {
  const examples: Testcase[] = (problem.examples as unknown as Testcase[]) ?? []
  const { isAdmin } = useUserContext()
  const [isEditing, setEditing] = useState(false)
  const [testcases, setTestcases] = useState(examples)

  const updateProblemExamples = problemQuery.updateProblemExamples.useMutation()

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Testcase>()
    return [
      columnHelper.accessor('input', {
        header: 'Input',
        cell: ({ cell, row }) => <TestcaseCell row={row} cell={cell} />,
        meta: {
          headClassName: 'border-r',
          cellClassName: 'border-r relative align-top group/example',
        },
        enableSorting: false,
      }),
      columnHelper.accessor('output', {
        header: 'Output',
        cell: ({ cell, row }) => (
          <>
            <TestcaseCell row={row} cell={cell} />
            <DeleteTestcase row={row} />
            <InsertTestcase row={row} />
          </>
        ),
        meta: {
          headClassName: '',
          cellClassName: 'relative align-top group/example',
        },
        enableSorting: false,
      }),
    ]
  }, [])

  const table = useReactTable({
    columns,
    data: testcases,
    getCoreRowModel: getCoreRowModel(),
  })

  if (examples.length === 0 && !isAdmin) {
    return null
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-xl font-bold font-heading">ตัวอย่าง</h3>
        {isAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="แก้ไข"
            onClick={() => {
              setEditing(true)
              if (testcases.length === 0) {
                setTestcases(
                  produce((tests) => {
                    tests.push({ input: '', output: '' })
                  })
                )
              }
            }}
          >
            <PencilIcon />
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(false)
                setTestcases(examples)
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                const toastId = toast.loading('กำลังบันทึก...')
                updateProblemExamples.mutateAsync(
                  {
                    params: { problemId: problem.id.toString() },
                    body: testcases,
                  },
                  {
                    onError: (result) => {
                      console.error(result)
                      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', {
                        id: toastId,
                      })
                    },
                    onSuccess: () => {
                      toast.success('บันทึกสำเร็จแล้ว', { id: toastId })
                      setEditing(false)
                    },
                  }
                )
              }}
            >
              บันทึก
            </Button>
          </div>
        )}
      </div>
      <TestcaseTableContext.Provider
        value={{ isEditing, setEditing, testcases, setTestcases }}
      >
        <TableComponent
          table={table}
          className="table-fixed relative group/table"
          classNames={{
            container: 'overflow-x-visible overflow-y-visible',
            bodyRow: 'group/row',
          }}
        />
      </TestcaseTableContext.Provider>
    </div>
  )
}

interface TestcaseTableContextValue {
  isEditing: boolean
  setEditing: (isEditing: boolean) => void
  testcases: Testcase[]
  setTestcases: Dispatch<SetStateAction<Testcase[]>>
}
const TestcaseTableContext = createContext<TestcaseTableContextValue>(
  {} as TestcaseTableContextValue
)
const useTestcaseTableContext = () => useContext(TestcaseTableContext)

const TestcaseCell = ({
  cell,
  row,
}: {
  row: Row<Testcase>
  cell: Cell<Testcase, string>
}) => {
  const { onCopy, hasCopied } = useClipboard()
  const { isEditing, setTestcases } = useTestcaseTableContext()
  useEffect(() => {
    if (hasCopied) {
      toast.success('คัดลอกไปยังคลิปบอร์ดแล้ว')
    }
  }, [hasCopied])
  if (isEditing) {
    return (
      <Textarea
        className="font-mono"
        value={cell.getValue()}
        onChange={(e) => {
          const value = e.target.value
          setTestcases(
            produce((testcases) => {
              const col = cell.column.id as 'input' | 'output'
              testcases[row.index]![col] = value
            })
          )
        }}
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <code className="whitespace-pre" id="input">
        {cell.getValue()}
      </code>
      <Button
        onClick={() => onCopy(cell.getValue())}
        size="icon"
        variant="ghost"
        className="invisible absolute right-2 top-2 group-hover/example:visible"
      >
        {hasCopied ? <CheckIcon /> : <DocumentDuplicateIcon />}
      </Button>
    </div>
  )
}

const DeleteTestcase = ({ row }: { row: Row<Testcase> }) => {
  const { isEditing, setTestcases } = useTestcaseTableContext()
  if (!isEditing) {
    return null
  }

  const onRemove = () => {
    setTestcases(
      produce((tests) => {
        tests.splice(row.index, 1)
      })
    )
  }
  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 invisible group-hover/row:visible"
      onClick={onRemove}
    >
      <TrashIcon />
    </Button>
  )
}

const InsertTestcase = ({ row }: { row: Row<Testcase> }) => {
  const { isEditing, setTestcases } = useTestcaseTableContext()
  if (!isEditing) {
    return null
  }
  const addEmptyTestcase = () => {
    setTestcases(
      produce((testcases) => {
        testcases.splice(row.index + 1, 0, { input: '', output: '' })
      })
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute -bottom-5 -right-5 invisible group-hover/row:visible"
      onClick={addEmptyTestcase}
    >
      <PlusIcon />
    </Button>
  )
}
