import { useEffect } from 'react'

import { useIntersectionObserver } from '@uidotdev/usehooks'

import { Spinner } from '@otog/ui/spinner'
import { TableCell, TableFooter, TableRow } from '@otog/ui/table'

import { TableComponent, TableComponentProps } from './table-component'

export interface InfiniteProps {
  fetchNextPage: () => void
  hasNextPage: boolean
}
export interface InfiniteTableProps
  extends InfiniteProps,
    TableComponentProps<any> {}

export const InfiniteTable = ({
  table,
  fetchNextPage,
  hasNextPage,
  ...props
}: InfiniteTableProps) => {
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: '0px',
  })
  const isIntersecting = entry?.isIntersecting
  useEffect(() => {
    if (isIntersecting) {
      fetchNextPage()
    }
  }, [isIntersecting])
  return (
    <TableComponent
      table={table}
      {...props}
      footer={
        hasNextPage && (
          <TableFooter className="bg-inherit" ref={ref}>
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="align-middle text-center"
              >
                <Spinner />
              </TableCell>
            </TableRow>
          </TableFooter>
        )
      }
    />
  )
}
