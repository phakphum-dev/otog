'use client'

import * as React from 'react'

import { useControllableState } from '@radix-ui/react-use-controllable-state'
import dayjs from 'dayjs'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Button } from './button'
import { Calendar } from './calendar'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from './utils'

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker(props, ref) {
    const { value: valueProp, onChange: onChangeProp, ...rest } = props
    const [value, onChange] = useControllableState({
      prop: valueProp,
      onChange: onChangeProp,
    })
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal aria-[invalid=true]:border-destructive',
              !value && 'text-muted-foreground'
            )}
            {...rest}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              dayjs(value).format('DD/MM/BBBB')
            ) : (
              <span>เลือกวันที่</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date?.toISOString())}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)

interface DateTimePickerProps {
  value?: string
  onChange?: (date: string) => void
}

export const DateTimePicker = React.forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(function DateTimePicker(props, ref) {
  const { value: valueProp, onChange: onChangeProp, ...rest } = props
  const [value, onChange] = useControllableState({
    prop: valueProp,
    onChange: onChangeProp,
  })
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal aria-[invalid=true]:border-destructive',
            !value && 'text-muted-foreground'
          )}
          {...rest}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            dayjs(value).format('DD/MM/BBBB HH:mm')
          ) : (
            <span>เลือกวันที่</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date?.toISOString())}
          initialFocus
        />
        <div className="p-4 pt-0">
          <Input
            type="time"
            className="block"
            defaultValue={value ? dayjs(value).format('HH:mm') : ''}
            onChange={(e) => {
              if (!value || e.target.valueAsDate === null) {
                return
              }
              const [hour, minute] = e.target.value.split(':')
              onChange(
                dayjs(value)
                  .set('hour', Number(hour))
                  .set('minute', Number(minute))
                  .toISOString()
              )
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
})
