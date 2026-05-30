import { useEffect, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  format,
} from 'date-fns'
import { api } from '@/lib/api'
import { ChevronLeft, ChevronRight } from '@/components/icons'

interface CalendarDatePickerProps {
  selectedDate: Date
  onSelect: (date: Date) => void
  onClose: () => void
}

export function CalendarDatePicker({ selectedDate, onSelect, onClose }: CalendarDatePickerProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate))
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const month = format(viewMonth, 'yyyy-MM')
    api.get('/food/logged-dates', { params: { month } })
      .then(({ data }) => setLoggedDates(new Set(data as string[])))
      .catch(() => {})
  }, [viewMonth])

  const today = new Date()
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Build the full 6-week grid
  const days: Date[] = []
  let cursor = calStart
  while (cursor <= calEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-1.5 text-muted hover:text-white rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-semibold text-sm">{format(viewMonth, 'MMMM yyyy')}</p>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-1.5 text-muted hover:text-white rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs text-muted py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, viewMonth)
            const hasData = loggedDates.has(dateStr)
            const isFuture = day > today

            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => {
                  onSelect(day)
                  onClose()
                }}
                className={`
                  relative flex flex-col items-center justify-center py-1.5 rounded-xl text-sm transition-colors
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isFuture ? 'opacity-20 cursor-not-allowed' : 'active:bg-surfaceHigh'}
                  ${isSelected ? 'bg-primary text-white' : isToday ? 'border border-primary text-primary' : ''}
                `}
              >
                <span className="text-sm font-medium leading-none">{format(day, 'd')}</span>
                {/* Dot indicator for days with logs */}
                <span
                  className={`
                    w-1 h-1 rounded-full mt-0.5
                    ${hasData
                      ? isSelected ? 'bg-white/80' : 'bg-primary'
                      : 'invisible'
                    }
                  `}
                />
              </button>
            )
          })}
        </div>

        {/* Today shortcut */}
        <div className="px-4 pb-4">
          <button
            onClick={() => { onSelect(today); onClose() }}
            className="w-full bg-surfaceHigh text-sm font-medium py-2.5 rounded-xl text-muted hover:text-white transition-colors"
          >
            Go to Today
          </button>
        </div>
      </div>
    </div>
  )
}
