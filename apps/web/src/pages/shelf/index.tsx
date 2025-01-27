import { useState } from 'react'
import { LuBookMarked, LuBookmark } from 'react-icons/lu'

import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

import { Button } from '@otog/ui/button'
import { InputGroup, InputLeftIcon } from '@otog/ui/input'
import { Progress } from '@otog/ui/progress'
import { Select, SelectContent, SelectPrimitive } from '@otog/ui/select'

import { DebouncedInput } from '../../components/debounced-input'

function Card() {
  const progress = 50
  const [marked, setMarked] = useState(false)
  return (
    <Link href={'/shelf/1'}>
      <section className="border p-6 rounded-lg flex flex-col gap-4">
        <div className="flex justify-between">
          {/* <Link href="/shelf/1">
          <h2 className="text-xl font-semibold underline underline-offset-2 hover:text-primary">
          หัวข้อ
          </h2>
          </Link> */}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">หัวข้อ</h2>
            <button
              onClick={(e) => {
                setMarked(!marked)
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              {!marked && <LuBookmark className="text-xl" />}
              {marked && (
                <LuBookmark
                  className="text-xl fill-primary"
                  // fill="#ff851b"
                  strokeWidth={0}
                />
              )}
            </button>
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
                <p>{progress}/99</p>
              </div>
              {/* <div className="bg-primary w-auto h-5 rounded-full"></div> */}
              <Progress
                className="w-auto h-5 [&>*]:bg-primary"
                value={progress}
              ></Progress>
            </div>
          </div>
        </div>
      </section>
    </Link>
  )
}

export default function BookShelf() {
  return (
    <main className="container flex-1 py-8 flex gap-4 flex-col">
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
                {/* {statusFilterValue && (
                <>
                  <hr className="h-full border-l" />
                  {getRowStatusIcon(statusFilterValue)}
                  <div className="font-normal">
                    {RowStatusLabel[statusFilterValue]}
                  </div>
                </>
              )} */}
              </Button>
            </SelectPrimitive.Trigger>
            <SelectContent>
              {/* {Object.entries(RowStatusLabel).map(([value, label]) => (
              <SelectItem
                value={value}
                key={value}
                onPointerUp={() => {
                  if (value === statusFilterValue) {
                    statusColumn.setFilterValue('')
                  }
                }}
              >
                <div className="flex gap-2 items-center">
                  {getRowStatusIcon(value as RowStatus)}
                  {label}
                </div>
              </SelectItem>
            ))} */}
            </SelectContent>
          </Select>
          {/* {newProblemFilterValue && (
          <Button
            variant="outline"
            className="font-normal"
            onClick={toggleNewProblemFilter}
          >
            โจทย์วันนี้
            <XMarkIcon />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ViewColumnsIcon aria-label="คอลัมน์ที่แสดง" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={passedCountColumn.getIsVisible()}
              onClick={() => passedCountColumn.toggleVisibility()}
            >
              ผู้ที่ผ่าน
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
        </div>
      </div>
      <Card></Card>
      <Card></Card>
      <Card></Card>
      <Card></Card>
    </main>
  )
}
