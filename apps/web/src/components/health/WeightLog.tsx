import { format } from 'date-fns'
import { formatWeight } from '@/lib/units'
import { Trash2 } from '@/components/icons'
import type { WeightEntry, UnitSystem } from '@/types'

export function WeightLog({
  entries,
  unitSystem,
  onDelete,
}: {
  entries: WeightEntry[]
  unitSystem: UnitSystem
  onDelete: (id: string) => void
}) {
  if (entries.length === 0) return null

  // Most recent first.
  const sorted = [...entries].sort((a, b) => +new Date(b.date) - +new Date(a.date))

  return (
    <div className="bg-surface rounded-2xl p-4">
      <p className="text-sm font-medium mb-2">Weight Log</p>
      <div className="divide-y divide-border">
        {sorted.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{formatWeight(e.weightKg, unitSystem)}</p>
              <p className="text-xs text-muted">{format(new Date(e.date), 'EEE, MMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              {e.bodyFat != null && <span className="text-xs text-muted">{e.bodyFat}% BF</span>}
              <button
                onClick={() => onDelete(e.id)}
                className="text-muted hover:text-danger transition-colors"
                aria-label="Delete weight entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
