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
                  className={classNames?.head}
                />
              ))}
            </TableRow>
          ))
        }
        itemContent={(index, row) =>
          row
            .getVisibleCells()
            .map((cell) => <TableCellComponent key={cell.id} cell={cell} />)
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
}: {
  header: Header<any, unknown>
  className?: string
}) => {
  const canSort = header.column.getCanSort()
  const children = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())
  if (canSort) {
    const sortDirection = header.column.getIsSorted()
    return (
      <TableHead
        className={clsx(className, header.column.columnDef.meta?.headClassName)}
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
    <TableHead
      className={clsx(className, header.column.columnDef.meta?.headClassName)}
    >
      {children}
    </TableHead>
  )
}

const TableCellComponent = ({
  cell,
  className,
}: {
  cell: Cell<any, unknown>
  className?: string
}) => {
  const columnDef = cell.column.columnDef

  const rowSpan = columnDef.meta?.cellRowSpan?.(cell)
  if (rowSpan !== undefined && rowSpan <= 0) return

  // const interactive =
  //   columnDef.meta?.interactive ?? columnDef.id === 'actions'

  return (
    <TableCell
      className={clsx(className, cell.column.columnDef.meta?.cellClassName)}
      rowSpan={rowSpan}
      // onClick={
      //   interactive ? undefined : (e) => onRowClick?.(row, e)
      // }
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}
