import { useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core'

import { ProblemTableRowSchema } from '@otog/contract'

import { keyProblem } from '../../api/query'
import { TableComponent } from '../../components/table-component'

export const ProblemTable = () => {
  const getProblems = useQuery(keyProblem.table())
  const table = useReactTable({
    columns,
    data: getProblems.data?.status === 200 ? getProblems.data.body : [],
    getCoreRowModel: getCoreRowModel(),
  })
  return <TableComponent table={table} />
}

const columnHelper = createColumnHelper<ProblemTableRowSchema>()
const columns = [
  columnHelper.accessor('id', {
    header: () => '#',
  }),
  columnHelper.accessor('name', {
    header: () => 'ชื่อ',
  }),
]
