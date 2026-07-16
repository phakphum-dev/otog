import { startTransition, useEffect, useMemo, useState } from 'react'

import { Combobox, createListCollection } from '@ark-ui/react/combobox'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { matchSorter } from 'match-sorter'
import NextLink from 'next/link'

import { Button } from '@otog/ui/button'
import {
  Dialog,
  DialogOverlay,
  DialogPrimitive,
  DialogTrigger,
} from '@otog/ui/dialog'

import { problemKey } from '../api/query'

export function Search() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const openDialog = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', openDialog)
    return () => {
      document.removeEventListener('keydown', openDialog)
    }
  }, [])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MagnifyingGlassIcon
            aria-label="ค้นหา"
            className="text-muted-foreground"
          />
        </Button>
      </DialogTrigger>
      <DialogPrimitive.Portal>
        <DialogOverlay>
          <DialogPrimitive.Content className="self-start">
            <SearchCombobox onClose={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogOverlay>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}

function SearchCombobox({ onClose }: { onClose: () => void }) {
  const problemTable = useQuery(problemKey.getProblemTable())
  const problems = useMemo(
    () => problemTable.data?.body ?? [],
    [problemTable.data]
  )

  const [inputValue, setInputValue] = useState('')
  const matches = useMemo(() => {
    if (!inputValue) return problems.slice(0, 10)
    return matchSorter(problems, inputValue, {
      keys: ['name', 'id'],
    }).slice(0, 10)
  }, [inputValue, problems])

  const collection = useMemo(
    () =>
      createListCollection({
        items: matches,
        itemToString: (item) => item.name,
        itemToValue: (item) => item.id.toString(),
      }),
    [matches]
  )
  return (
    <Combobox.Root
      open
      disableLayer
      inputBehavior="autohighlight"
      selectionBehavior="clear"
      collection={collection}
      onValueChange={() => onClose()}
      onInputValueChange={({ inputValue }) => {
        startTransition(() => setInputValue(inputValue))
      }}
    >
      <div className="relative">
        <Combobox.Input
          placeholder="ค้นหา..."
          className="flex h-14 w-[32rem] rounded-md rounded-b-none border-b-0 border border-input bg-background pl-12 px-4 py-3 text-base placeholder:text-muted-foreground outline-none"
        />
        <div className="absolute inset-y-0 flex items-center left-4">
          <MagnifyingGlassIcon className="size-5 text-muted-foreground" />
        </div>
      </div>
      <Combobox.Content className="rounded-md rounded-t-none bg-background border max-h-[32rem] flex flex-col p-2 gap-0 overflow-y-auto">
        {collection.items.map((item) => (
          <Combobox.Item
            className="rounded-md data-[highlighted]:bg-accent px-4 py-3 data-[disabled]:text-muted-foreground flex gap-2"
            key={item.id}
            item={item}
            asChild
          >
            <NextLink href={`/problem/${item.id}`}>
              <Combobox.ItemText className="flex flex-col">
                <span className="text-muted-foreground text-sm font-semibold">
                  {item.id}
                </span>
                <span className="font-semibold tracking-wide">{item.name}</span>
              </Combobox.ItemText>
            </NextLink>
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.Root>
  )
}
