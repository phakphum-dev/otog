import { TableVirtuoso } from 'react-virtuoso'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { flexRender } from '@tanstack/react-table'
import {
  Cell,
  Header,
  RowData,
  Table as TanstackTable,
} from '@tanstack/table-core'

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

export function TableVirtuosoComponent<T>({
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
            <TableEmptyPlaceholder
              table={table}
              isLoading={isLoading}
              isError={isError}
            />
          ),
        }}
        fixedHeaderContent={() =>
          table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeaderComponent key={header.id} header={header} />
              ))}
            </TableRow>
          ))
        }
        itemContent={(index, row) =>
          row
            .getVisibleCells()
            .map((cell) => <TableCellComponent cell={cell} />)
        }
      />
    </ClientOnly>
  )
}

export const TableComponent = <T,>({
  className,
  table,
  isLoading = false,
  isError = false,
}: TableComponentProps<T>) => {
  return (
    <ClientOnly>
      <TableContainer>
        <Table className={className}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeaderComponent header={header} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowCount() === 0 ? (
              <TableEmptyPlaceholder
                table={table}
                isError={isError}
                isLoading={isLoading}
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCellComponent key={cell.id} cell={cell} />
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ClientOnly>
  )
}

const TableEmptyPlaceholder = ({
  table,
  isLoading,
  isError,
}: {
  table: TanstackTable<any>
  isLoading: boolean
  isError: boolean
}) => {
  return (
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
  )
}

const TableHeaderComponent = ({ header }: { header: Header<any, unknown> }) => {
  const canSort = header.column.getCanSort()
  const children = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())
  if (canSort) {
    const sortDirection = header.column.getIsSorted()
    return (
      <TableHead className={clsx(header.column.columnDef.meta?.headClassName)}>
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
                <ArrowDownIcon />
              ) : sortDirection === 'desc' ? (
                <ArrowUpIcon />
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
                น้อยไปมาก
                <ArrowDownIcon className="size-4" />
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
                มากไปน้อย
                <ArrowUpIcon className="size-4" />
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableHead>
    )
  }
  return (
    <TableHead className={clsx(header.column.columnDef.meta?.headClassName)}>
      {children}
    </TableHead>
  )
}

const TableCellComponent = ({ cell }: { cell: Cell<any, unknown> }) => {
  const columnDef = cell.column.columnDef

  const rowSpan = columnDef.meta?.cellRowSpan?.(cell)
  if (rowSpan !== undefined && rowSpan <= 0) return

  // const interactive =
  //   columnDef.meta?.interactive ?? columnDef.id === 'actions'

  return (
    <TableCell
      className={clsx(cell.column.columnDef.meta?.cellClassName)}
      rowSpan={rowSpan}
      // onClick={
      //   interactive ? undefined : (e) => onRowClick?.(row, e)
      // }
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}
