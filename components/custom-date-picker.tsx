"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CustomDatePickerComponent() {
  const [date, setDate] = React.useState<Date>()
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 201 }, (_, i) => currentYear - 100 + i)
  }, [])

  const handleYearChange = (year: string) => {
    setDate((prevDate) => {
      const newDate = prevDate ? new Date(prevDate) : new Date()
      newDate.setFullYear(parseInt(year, 10))
      return newDate
    })
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate)
              setIsCalendarOpen(false)
            }}
            initialFocus
            components={{
              Caption: ({ displayMonth }) => (
                <div className="flex items-center justify-center space-x-2 py-2">
                  <span className="text-sm font-medium">
                    {format(displayMonth, "MMMM")}
                  </span>
                  <Select
                    value={format(displayMonth, "yyyy")}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="h-7 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ),
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}