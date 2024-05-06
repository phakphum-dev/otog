import { useRef } from 'react'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { flexRender } from '@tanstack/react-table'
import { Cell, RowData, Table as TanstackTable } from '@tanstack/table-core'

import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  clsx,
} from '@otog/ui'

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?: string
    cellClassName?: string
    cellRowSpan?: (row: Cell<TData, TValue>) => number
  }
}

interface CustomTableProps<T> {
  className?: string
  classNames?: {
    tableContainer?: string
    tableHeader?: string
    tableHead?: string
    tableHeadRow?: string
    tableBody?: string
    tableCell?: string
    tableBodyRow?: string
  }
  table: TanstackTable<T>
  isLoading?: boolean
  isError?: boolean
}

export function TableComponent<T>({
  className,
  classNames,
  table,
  isLoading = false,
  isError = false,
}: CustomTableProps<T>) {
  const containerRef = useRef<HTMLTableElement>(null)
  return (
    <TableContainer className={classNames?.tableContainer}>
      <Table ref={containerRef} className={className}>
        <TableHeader className={classNames?.tableHeader}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={classNames?.tableHeadRow}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const children = header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                if (canSort) {
                  // do something
                  return (
                    <TableHead
                      key={header.id}
                      className={clsx(
                        classNames?.tableHead,
                        header.column.columnDef.meta?.headClassName
                      )}
                    >
                      {children}
                    </TableHead>
                  )
                }
                return (
                  <TableHead
                    key={header.id}
                    className={clsx(
                      classNames?.tableHead,
                      header.column.columnDef.meta?.headClassName
                    )}
                  >
                    {children}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className={classNames?.tableBody}>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={table._getColumnDefs().length}
                className="py-20 align-middle text-center"
              >
                <Spinner />
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="py-20 align-middle text-center"
              >
                <div className="inline-flex gap-2 items-center">
                  <ExclamationTriangleIcon className="size-4" />
                  Failed to load resource
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={classNames?.tableBodyRow}
              >
                {row.getVisibleCells().map((cell) => {
                  const columnDef = cell.column.columnDef

                  const rowSpan = columnDef.meta?.cellRowSpan?.(cell)
                  if (rowSpan !== undefined && rowSpan <= 0) return

                  // const interactive =
                  //   columnDef.meta?.interactive ?? columnDef.id === 'actions'

                  return (
                    <TableCell
                      key={cell.id}
                      className={clsx(
                        classNames?.tableCell,
                        cell.column.columnDef.meta?.cellClassName
                      )}
                      rowSpan={rowSpan}
                      // onClick={
                      //   interactive ? undefined : (e) => onRowClick?.(row, e)
                      // }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table._getColumnDefs().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
