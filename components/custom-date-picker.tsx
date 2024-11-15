"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'

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

interface CustomDatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}

export function CustomDatePickerComponent({ selected, onSelect }: CustomDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => currentYear + i) // Only future years
  }, [])

  const handleYearChange = (year: string) => {
    if (selected) {
      const newDate = new Date(selected)
      newDate.setFullYear(parseInt(year, 10))
      onSelect(newDate)
    }
  }

  // Ensure only future dates can be selected
  const disablePastDates = (date: Date) => {
    return date < new Date();
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? format(selected, "PPP") : <span>Pick a deadline date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(newDate) => {
              onSelect(newDate);
              setIsCalendarOpen(false);
            }}
            disabled={disablePastDates}
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