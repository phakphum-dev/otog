import { useMemo, useState } from 'react'
import { LuBook, LuBookOpen } from 'react-icons/lu'

import {
  ArrowLeftStartOnRectangleIcon,
  ChevronLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/table-core'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { ProblemTableRowSchema } from '@otog/contract'
import { Problem } from '@otog/database'
import { AccordionPrimitive } from '@otog/ui/accordion'
import { Button } from '@otog/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@otog/ui/collapsible'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Progress } from '@otog/ui/progress'
import { Select, SelectContent, SelectPrimitive } from '@otog/ui/select'

import { bookshelfKey } from '../../api/query'
import { DebouncedInput } from '../../components/debounced-input'
import {
  TableComponent,
  TableVirtuosoComponent,
} from '../../components/table-component'
import { ProblemTable } from '../../modules/problem/problem-table'
import { ShelfTable } from './shelf-table'

function Card({ id, name }: { id: number; name: string }) {
  const progress = 50
  const [open, setOpen] = useState(false)
  const data = useMemo(() => {
    const arr: Array<
      Pick<Problem, 'id' | 'name' | 'show' | 'memoryLimit' | 'timeLimit'>
    > = [
      {
        id: 1,
        name: 'asjdaskdj',
        show: true,
        memoryLimit: 32,
        timeLimit: 1,
      },
    ]
    return arr
  }, [])
  // const table = useReactTable({
  //   columns,
  //   data,
  //   getCoreRowModel: getCoreRowModel(),
  // })
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="border p-6 rounded-lg flex flex-col gap-4">
        <CollapsibleTrigger>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{name}</h2>
                {!open && <LuBook className="text-xl" />}
                {open && <LuBookOpen className="text-xl" />}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex">
                  <div className="bg-primary size-4 rounded-full border -ml-1"></div>
                  <div className="bg-primary size-4 rounded-full border -ml-1"></div>
                  <div className="bg-primary size-4 rounded-full border -ml-1"></div>
                </div>
                <p>สำเร็จ 99</p>
              </div>
            </div>
            <div>
              <div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <p>ความคืบหน้า</p>
                    <p>{progress} / 100</p>
                  </div>
                  <Progress
                    className="w-auto h-5 [&>*]:bg-primary"
                    value={progress}
                  ></Progress>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* <TableComponent table={table} /> */}
          <ShelfTable bookshelfId={id} />
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

// const columnHelper = createColumnHelper<{ id: number; name: string }>()
// const columns = [
//   columnHelper.accessor('id', {
//     header: '#',
//     enableSorting: false,
//   }),
//   columnHelper.accessor('name', {
//     header: 'ชื่อ',
//     enableSorting: false,
//   }),
// ]

export default function Shelf() {
  const router = useRouter()
  const progress = 50
  const getBookshelf = useQuery(bookshelfKey.getBookshelves())
  const shelfId = Number(router.query.shelfId)
  const currentBook = getBookshelf.data?.body.find(
    (book) => book.id === shelfId
  )
  return (
    <main className="container flex-1 py-8 flex flex-col gap-4">
      <div className="flex justify-between items-center m-4">
        <div className="flex gap-2">
          <Link href="/shelf">
            <ChevronLeftIcon className="size-8 hover:text-primary" />
          </Link>
          <h2 className="text-2xl font-semibold">{currentBook?.name}</h2>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <p>ความคืบหน้าทั้งหมด</p>
              <p>{progress} / 99</p>
            </div>
            <Progress
              className="w-96 h-5 [&>*]:bg-primary"
              value={progress}
            ></Progress>
          </div>
          <div className="flex items-center gap-3 flex-col-reverse">
            <div className="flex">
              <div className="bg-primary size-5 rounded-full border -ml-1"></div>
              <div className="bg-primary size-5 rounded-full border -ml-1"></div>
              <div className="bg-primary size-5 rounded-full border -ml-1"></div>
            </div>
            <p>สำเร็จ 99</p>
          </div>
        </div>
      </div>
      <div className="flex gap-4 sticky py-2 -my-2 top-[calc(var(--navbar))] bg-background z-10">
        <InputGroup>
          <InputLeftIcon>
            <MagnifyingGlassIcon />
          </InputLeftIcon>
          <DebouncedInput
            type="search"
            placeholder="ค้นหา..."
            onDebounce={(value) => {}}
          />
        </InputGroup>
        <div className="flex gap-2">
          <Select>
            <SelectPrimitive.Trigger asChild>
              <Button variant="outline" className="font-normal">
                <FunnelIcon />
                สถานะ
              </Button>
            </SelectPrimitive.Trigger>
            <SelectContent></SelectContent>
          </Select>
        </div>
      </div>
      {/* <Card></Card>
      <Card></Card> */}
      {getBookshelf.data?.body
        .filter((book) => book.parentId === shelfId)
        .map((book) => <Card id={book.id} name={book.name}></Card>)}
    </main>
  )
}
