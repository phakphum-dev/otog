import { ReactNode, forwardRef, useId } from 'react'
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
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'

import { Button } from '@otog/ui/button'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Label } from '@otog/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@otog/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPrimitive,
  SelectTrigger,
  SelectValue,
} from '@otog/ui/select'
import { Spinner } from '@otog/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@otog/ui/table'
import { clsx } from '@otog/ui/utils'

import { ClientOnly } from './client-only'
import { DebouncedInput } from './debounced-input'

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?:
      | string
      | ((props: { table: TanstackTable<TData> }) => string)
    cellClassName?:
      | string
      | ((props: { table: TanstackTable<TData> }) => string)
    cellRowSpan?: (row: Cell<TData, TValue>) => number
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  interface TableMeta<TData extends RowData> {
    expanded?: boolean
  }
}

interface TableComponentProps<T> {
  table: TanstackTable<T>
  isLoading?: boolean
  isError?: boolean
  className?: string
  classNames?: {
    container?: string
    header?: string
    headRow?: string
    head?: string
    body?: string
    bodyRow?: string
    cell?: string
  }
  footer?: ReactNode
}

export function TableVirtuosoComponent<T>({
  table,
  isLoading = false,
  isError = false,
  className,
  classNames,
  footer,
}: TableComponentProps<T>) {
  return (
    <ClientOnly>
      <TableVirtuoso
        data={table.getRowModel().rows}
        totalCount={table.getRowCount()}
        useWindowScroll
        // hack to get EmptyPlaceholder showing when overflow-hidden
        style={{ minHeight: table.getRowCount() === 0 ? 228 : 0 }}
        overscan={300}
        increaseViewportBy={{ bottom: 300, top: 300 }}
        components={{
          Scroller: (props) => (
            <TableContainer {...props} className={classNames?.container} />
          ),
          TableHead: forwardRef((props, ref) => (
            <TableHeader ref={ref} {...props} className={classNames?.header} />
          )),
          TableBody: forwardRef((props, ref) => (
            <TableBody ref={ref} {...props} className={classNames?.header} />
          )),
          TableRow: (props) => (
            <TableRow {...props} className={classNames?.bodyRow} />
          ),
          Table: (props) => <Table {...props} className={className} />,
          EmptyPlaceholder: () => (
            <TableEmptyPlaceholder
              table={table}
              isLoading={isLoading}
              isError={isError}
            />
          ),
          TableFoot: () => footer,
        }}
        fixedHeaderContent={() =>
          table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={classNames?.headRow}>
              {headerGroup.headers.map((header) => (
                <TableHeadComponent
                  key={header.id}
                  header={header}
                  table={table}
                  className={classNames?.head}
                />
              ))}
            </TableRow>
          ))
        }
        itemContent={(index, row) =>
          row
            .getVisibleCells()
            .map((cell) => (
              <TableCellComponent key={cell.id} cell={cell} table={table} />
            ))
        }
      />
    </ClientOnly>
  )
}

export const TableComponent = <T,>({
  table,
  isLoading = false,
  isError = false,
  className,
  classNames,
  footer,
}: TableComponentProps<T>) => {
  return (
    <ClientOnly>
      <TableContainer className={classNames?.container}>
        <Table className={className}>
          <TableHeader className={classNames?.header}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={classNames?.headRow}>
                {headerGroup.headers.map((header) => (
                  <TableHeadComponent
                    key={header.id}
                    table={table}
                    header={header}
                    className={classNames?.head}
                  />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {table.getRowCount() === 0 ? (
            <TableEmptyPlaceholder
              table={table}
              isError={isError}
              isLoading={isLoading}
            />
          ) : (
            <TableBody className={classNames?.body}>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={classNames?.bodyRow}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCellComponent
                      key={cell.id}
                      cell={cell}
                      table={table}
                      className={classNames?.cell}
                    />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          )}
          {footer}
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
          colSpan={table.getAllColumns().length}
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

const TableHeadComponent = ({
  header,
  className,
  table,
}: {
  header: Header<any, unknown>
  className?: string
  table: TanstackTable<any>
}) => {
  const canSort = header.column.getCanSort()
  const headClassName = (() => {
    switch (typeof header.column.columnDef.meta?.headClassName) {
      case 'string':
        return header.column.columnDef.meta.headClassName
      case 'function':
        return header.column.columnDef.meta.headClassName({ table })
      default:
        return undefined
    }
  })()
  const children = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())
  if (canSort) {
    const sortDirection = header.column.getIsSorted()

    return (
      <TableHead className={clsx(className, headClassName)}>
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
    <TableHead className={clsx(className, headClassName)}>{children}</TableHead>
  )
}

const TableCellComponent = ({
  cell,
  className,
  table,
}: {
  cell: Cell<any, unknown>
  className?: string
  table: TanstackTable<any>
}) => {
  const columnDef = cell.column.columnDef

  const rowSpan = columnDef.meta?.cellRowSpan?.(cell)
  if (rowSpan !== undefined && rowSpan <= 0) return

  const cellClassName = (() => {
    switch (typeof cell.column.columnDef.meta?.cellClassName) {
      case 'string':
        return cell.column.columnDef.meta.cellClassName
      case 'function':
        return cell.column.columnDef.meta.cellClassName({ table })
      default:
        return undefined
    }
  })()
  return (
    <TableCell
      className={clsx(className, cellClassName)}
      rowSpan={rowSpan}
      // onClick={
      //   interactive ? undefined : (e) => onRowClick?.(row, e)
      // }
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}

export const TableSearch = ({ table }: { table: TanstackTable<any> }) => {
  return (
    <InputGroup className="w-full sm:w-80">
      <InputLeftIcon>
        <Search aria-hidden />
      </InputLeftIcon>
      <DebouncedInput
        onDebounce={(value) => {
          table.resetPageIndex()
          table.setGlobalFilter(value)
        }}
        placeholder="ค้นหา..."
      />
    </InputGroup>
  )
}

export const TablePagination = ({
  table,
  isLoading,
}: {
  table: TanstackTable<any>
  isLoading: boolean
}) => {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-8">
      {/* Results per page */}
      <div className="flex items-center gap-3">
        <Label htmlFor={id} className="max-sm:sr-only">
          แสดง
        </Label>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value))
          }}
        >
          <SelectTrigger id={id} className="w-fit whitespace-nowrap">
            <SelectValue placeholder="Select number of results" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
            {[5, 10, 25, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={pageSize.toString()}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TablePaginationInfo table={table} isLoading={isLoading} />
    </div>
  )
}

export const TablePaginationInfo = ({
  table,
  isLoading,
  className,
}: {
  table: TanstackTable<any>
  isLoading: boolean
  className?: string
}) => {
  return (
    <div className={clsx('flex items-center justify-between gap-8', className)}>
      {/* Page number information */}
      <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground items-center gap-2">
        {isLoading && <Spinner size="sm" />}
        <p
          className="whitespace-nowrap text-sm text-muted-foreground"
          aria-live="polite"
        >
          <span className="text-foreground">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{' '}
          จาก{' '}
          <span className="text-foreground">
            {table.getRowCount().toString()}
          </span>
        </p>
      </div>

      {/* Pagination buttons */}
      <Pagination>
        <PaginationContent>
          {/* First page button */}
          <PaginationItem>
            <Button
              size="icon"
              variant="outline"
              className="disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to first page"
            >
              <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </PaginationItem>
          {/* Previous page button */}
          <PaginationItem>
            <Button
              size="icon"
              variant="outline"
              className="disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </PaginationItem>
          {/* Next page button */}
          <PaginationItem>
            <Button
              size="icon"
              variant="outline"
              className="disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </PaginationItem>
          {/* Last page button */}
          <PaginationItem>
            <Button
              size="icon"
              variant="outline"
              className="disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
