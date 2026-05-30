import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { MuscleVolume } from '@/types'

// ExerciseDB stores muscleGroup as an uppercase body-part label. Map each to a
// region key used by the silhouette below.
const GROUP_TO_REGION: Record<string, string> = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  'UPPER ARMS': 'upperArms',
  'LOWER ARMS': 'lowerArms',
  'UPPER LEGS': 'upperLegs',
  'LOWER LEGS': 'lowerLegs',
  WAIST: 'waist',
  NECK: 'neck',
}

const REGION_LABEL: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  upperArms: 'Arms',
  lowerArms: 'Forearms',
  upperLegs: 'Legs',
  lowerLegs: 'Calves',
  waist: 'Core',
  neck: 'Neck',
}

function intensityColor(sets: number): string {
  if (sets <= 0) return 'var(--color-surface-high)'
  const t = Math.min(1, sets / 12)
  return `rgba(99, 102, 241, ${(0.3 + 0.7 * t).toFixed(2)})`
}

export function MuscleMap({ days = 7 }: { days?: number }) {
  const [byRegion, setByRegion] = useState<Record<string, number>>({})

  useEffect(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - days)
    api.get<MuscleVolume[]>('/workouts/muscle-volume', {
      params: { from: from.toISOString(), to: to.toISOString() },
    })
      .then(({ data }) => {
        const map: Record<string, number> = {}
        for (const row of data) {
          const region = GROUP_TO_REGION[row.muscleGroup]
          if (region) map[region] = (map[region] ?? 0) + row.sets
        }
        setByRegion(map)
      })
      .catch(() => {})
  }, [days])

  const fill = (region: string) => intensityColor(byRegion[region] ?? 0)
  const untrained = Object.keys(REGION_LABEL).filter((r) => !(byRegion[r] > 0))

  // Simple front + back silhouettes built from rounded shapes.
  const Figure = ({ back }: { back: boolean }) => (
    <svg viewBox="0 0 100 200" className="h-44 w-auto">
      {/* head (neutral) */}
      <circle cx="50" cy="14" r="9" fill="var(--color-surface-high)" />
      {/* neck */}
      <rect x="45" y="22" width="10" height="6" rx="2" fill={fill('neck')} />
      {/* shoulders */}
      <ellipse cx="33" cy="34" rx="9" ry="6" fill={fill('shoulders')} />
      <ellipse cx="67" cy="34" rx="9" ry="6" fill={fill('shoulders')} />
      {/* torso: chest (front) or back */}
      <rect x="36" y="30" width="28" height="26" rx="6" fill={fill(back ? 'back' : 'chest')} />
      {/* waist / core */}
      <rect x="38" y="56" width="24" height="22" rx="5" fill={fill('waist')} />
      {/* upper arms */}
      <rect x="22" y="34" width="9" height="30" rx="4" fill={fill('upperArms')} />
      <rect x="69" y="34" width="9" height="30" rx="4" fill={fill('upperArms')} />
      {/* lower arms */}
      <rect x="20" y="64" width="8" height="26" rx="4" fill={fill('lowerArms')} />
      <rect x="72" y="64" width="8" height="26" rx="4" fill={fill('lowerArms')} />
      {/* upper legs */}
      <rect x="39" y="80" width="10" height="44" rx="4" fill={fill('upperLegs')} />
      <rect x="51" y="80" width="10" height="44" rx="4" fill={fill('upperLegs')} />
      {/* lower legs */}
      <rect x="40" y="126" width="8" height="46" rx="4" fill={fill('lowerLegs')} />
      <rect x="52" y="126" width="8" height="46" rx="4" fill={fill('lowerLegs')} />
      <text x="50" y="194" textAnchor="middle" className="fill-muted" fontSize="9">
        {back ? 'Back' : 'Front'}
      </text>
    </svg>
  )

  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">Muscle Focus</p>
        <span className="text-xs text-muted">Last {days} days</span>
      </div>
      <div className="flex items-center justify-center gap-6 py-2">
        <Figure back={false} />
        <Figure back={true} />
      </div>
      {untrained.length > 0 ? (
        <p className="text-xs text-muted text-center">
          Needs work: {untrained.map((r) => REGION_LABEL[r]).join(', ')}
        </p>
      ) : (
        <p className="text-xs text-success text-center">Every muscle group trained recently — nice balance.</p>
      )}
    </div>
  )
}
