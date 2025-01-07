import { ReactNode, forwardRef } from 'react'
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

import { Button } from '@otog/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPrimitive,
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
