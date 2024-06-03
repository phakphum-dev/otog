import { TableVirtuoso } from 'react-virtuoso'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { flexRender } from '@tanstack/react-table'
import { Cell, RowData, Table as TanstackTable } from '@tanstack/table-core'

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectPrimitive,
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

import { ClientOnly } from './client-only'

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?: string
    cellClassName?: string
    cellRowSpan?: (row: Cell<TData, TValue>) => number
  }
}

interface TableComponentProps<T> {
  className?: string
  table: TanstackTable<T>
  isLoading?: boolean
  isError?: boolean
}

export function TableComponent<T>({
  className,
  table,
  isLoading = false,
  isError = false,
}: TableComponentProps<T>) {
  return (
    <ClientOnly>
      <TableVirtuoso
        className={className}
        data={table.getRowModel().rows}
        totalCount={table.getRowCount()}
        useWindowScroll
        // hack to get EmptyPlaceholder showing when overflow-hidden
        style={{ minHeight: table.getRowCount() === 0 ? 228 : 0 }}
        overscan={300}
        increaseViewportBy={{ bottom: 300, top: 300 }}
        components={{
          Scroller: TableContainer,
          TableHead: TableHeader,
          TableBody: TableBody,
          TableRow: TableRow,
          Table: Table,
          EmptyPlaceholder: () => (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-[180px] align-middle text-center"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : isError ? (
                    <div className="inline-flex gap-2 items-center">
                      <ExclamationTriangleIcon className="size-4" />
                      การโหลดข้อมูลผิดพลาด
                    </div>
                  ) : (
                    'ไม่มีข้อมูล'
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          ),
        }}
        fixedHeaderContent={() =>
          table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const children = header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                if (canSort) {
                  const sortDirection = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      className={clsx(
                        header.column.columnDef.meta?.headClassName
                      )}
                    >
                      <Select
                        value={sortDirection || ''}
                        onValueChange={(sortDirection) => {
                          header.column.toggleSorting(sortDirection === 'desc')
                        }}
                      >
                        <SelectPrimitive.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs [&>svg]:size-3 -mx-2 px-2"
                          >
                            {children}
                            {sortDirection === 'asc' ? (
                              <ArrowUpIcon />
                            ) : sortDirection === 'desc' ? (
                              <ArrowDownIcon />
                            ) : (
                              <ChevronUpDownIcon />
                            )}
                          </Button>
                        </SelectPrimitive.Trigger>
                        <SelectContent>
                          <SelectItem
                            value="asc"
                            onPointerUp={() => {
                              if (sortDirection === 'asc') {
                                header.column.clearSorting()
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              เรียงขึ้น
                              <ArrowUpIcon className="size-4" />
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="desc"
                            onPointerUp={() => {
                              if (sortDirection === 'desc') {
                                header.column.clearSorting()
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              เรียงลง
                              <ArrowDownIcon className="size-4" />
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                  )
                }
                return (
                  <TableHead
                    key={header.id}
                    className={clsx(
                      header.column.columnDef.meta?.headClassName
                    )}
                  >
                    {children}
                  </TableHead>
                )
              })}
            </TableRow>
          ))
        }
        itemContent={(index, row) =>
          row.getVisibleCells().map((cell) => {
            const columnDef = cell.column.columnDef

            const rowSpan = columnDef.meta?.cellRowSpan?.(cell)
            if (rowSpan !== undefined && rowSpan <= 0) return

            // const interactive =
            //   columnDef.meta?.interactive ?? columnDef.id === 'actions'

            return (
              <TableCell
                key={cell.id}
                className={clsx(cell.column.columnDef.meta?.cellClassName)}
                rowSpan={rowSpan}
                // onClick={
                //   interactive ? undefined : (e) => onRowClick?.(row, e)
                // }
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            )
          })
        }
      />
    </ClientOnly>
  )
}
