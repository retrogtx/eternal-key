"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerDemoProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

export function DatePickerDemo({ selected, onSelect }: DatePickerDemoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            "bg-white/5 border-white/10 text-white hover:bg-white/10",
            "transition-colors duration-200"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            <span className="text-white">
              {format(selected, "PPP")}
            </span>
          ) : (
            <span className="text-gray-400">Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-zinc-900 border border-white/10" 
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          initialFocus
          className="bg-zinc-900 text-white"
        />
      </PopoverContent>
    </Popover>
  )
}
