import { useEffect, useState, useCallback } from 'react'
import { useWorkoutStore, type LocalExercise, type LocalSet } from '@/stores/workoutStore'
import { ExercisePicker } from '@/components/ExercisePicker'
import type { Exercise, WorkoutSession } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function useElapsedTimer(startedAt: Date | null) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Rest Timer ────────────────────────────────────────────────────────────────

function RestTimer({ restSeconds, onDone }: { restSeconds: number; onDone: () => void }) {
  const [seconds, setSeconds] = useState(restSeconds)

  useEffect(() => {
    if (seconds <= 0) { onDone(); return }
    const id = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds, onDone])

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-surfaceHigh border border-border rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50">
      <div>
        <p className="text-xs text-muted mb-0.5">Rest</p>
        <p className="text-3xl font-bold tabular-nums">{formatTime(seconds)}</p>
      </div>
      <button
        onClick={onDone}
        className="text-sm text-primary font-semibold px-5 py-2 bg-primary/10 rounded-xl"
      >
        Skip
      </button>
    </div>
  )
}

// ── Set Row ───────────────────────────────────────────────────────────────────

function SetRow({
  set,
  lastSet,
  onUpdate,
  onCheck,
  onRemove,
  isLast,
}: {
  set: LocalSet
  lastSet?: { weightKg: number; reps: number }
  onUpdate: (changes: Partial<Omit<LocalSet, 'localId'>>) => void
  onCheck: () => void
  onRemove: () => void
  isLast: boolean
}) {
  const prevText = lastSet ? `${lastSet.weightKg}×${lastSet.reps}` : '—'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${set.done ? 'bg-success/10' : ''}`}>
      <span className="text-muted text-sm w-5 text-center shrink-0">{set.setNumber}</span>
      <span className="text-muted text-xs w-14 text-center shrink-0 tabular-nums">{prevText}</span>
      <input
        type="number"
        inputMode="decimal"
        value={set.weightKg || ''}
        placeholder="0"
        onChange={e => onUpdate({ weightKg: parseFloat(e.target.value) || 0 })}
        className="bg-surfaceHigh rounded-lg text-center text-sm font-medium w-14 py-1.5 outline-none focus:ring-1 focus:ring-primary shrink-0"
      />
      <input
        type="number"
        inputMode="numeric"
        value={set.reps || ''}
        placeholder="0"
        onChange={e => onUpdate({ reps: parseInt(e.target.value) || 0 })}
        className="bg-surfaceHigh rounded-lg text-center text-sm font-medium w-14 py-1.5 outline-none focus:ring-1 focus:ring-primary shrink-0"
      />
      <button
        onClick={() => {
          onUpdate({ done: !set.done })
          if (!set.done) onCheck()
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 text-sm font-bold ${
          set.done ? 'bg-success text-white' : 'bg-surfaceHigh text-muted'
        }`}
      >
        ✓
      </button>
      {isLast && (
        <button onClick={onRemove} className="text-muted text-xs shrink-0">✕</button>
      )}
    </div>
  )
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({
  le,
  onSetDone,
}: {
  le: LocalExercise
  onSetDone: (restSeconds: number) => void
}) {
  const { addSet, removeSet, updateSet, updateExerciseNotes, removeExerciseFromSession } = useWorkoutStore()
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate">{le.exercise.name}</h3>
          {le.exercise.muscleGroup && (
            <p className="text-xs text-muted mt-0.5">{le.exercise.muscleGroup}</p>
          )}
        </div>
        <div className="flex items-center gap-3 ml-2 shrink-0">
          <button
            onClick={() => setShowNotes(v => !v)}
            className={`text-base leading-none ${showNotes ? 'text-primary' : 'text-muted'}`}
            title="Notes"
          >
            📝
          </button>
          <button
            onClick={() => removeExerciseFromSession(le.localId)}
            className="text-muted text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {showNotes && (
        <div className="px-4 py-2 border-b border-border">
          <textarea
            value={le.notes}
            onChange={e => updateExerciseNotes(le.localId, e.target.value)}
            placeholder="Notes for this exercise…"
            rows={2}
            className="w-full bg-surfaceHigh rounded-lg px-3 py-2 text-sm resize-none outline-none placeholder:text-muted"
          />
        </div>
      )}

      <div className="py-1">
        <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-medium text-muted uppercase tracking-wide">
          <span className="w-5 text-center shrink-0">SET</span>
          <span className="w-14 text-center shrink-0">PREV</span>
          <span className="w-14 text-center shrink-0">KG</span>
          <span className="w-14 text-center shrink-0">REPS</span>
          <span className="w-8 shrink-0"></span>
        </div>

        {le.sets.map((set, i) => (
          <SetRow
            key={set.localId}
            set={set}
            lastSet={le.lastSets[i]}
            onUpdate={changes => updateSet(le.localId, set.localId, changes)}
            onCheck={() => onSetDone(90)}
            onRemove={() => removeSet(le.localId, set.localId)}
            isLast={i === le.sets.length - 1 && le.sets.length > 1}
          />
        ))}
      </div>

      <button
        onClick={() => addSet(le.localId)}
        className="w-full text-sm text-primary py-2.5 hover:bg-primary/5 transition-colors font-medium"
      >
        + Add Set
      </button>
    </div>
  )
}

// ── Workout Summary ───────────────────────────────────────────────────────────

function WorkoutSummary({ session, elapsed, onDone }: { session: WorkoutSession; elapsed: number; onDone: () => void }) {
  const prs = session.exercises.flatMap(e => e.sets.filter(s => s.isPersonalBest))
  const duration = session.finishedAt
    ? Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : Math.round(elapsed / 60)

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-end">
      <div className="w-full bg-surface rounded-t-3xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-center">Workout Complete!</h2>
        <p className="text-muted text-center text-sm">{session.name}</p>

        <div className="flex justify-center gap-8 py-2">
          <div className="text-center">
            <p className="text-2xl font-bold">{duration}</p>
            <p className="text-xs text-muted">minutes</p>
          </div>
          {session.totalVolume != null && (
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(session.totalVolume).toLocaleString()}</p>
              <p className="text-xs text-muted">kg volume</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold">{session.exercises.length}</p>
            <p className="text-xs text-muted">exercises</p>
          </div>
        </div>

        {prs.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4">
            <p className="text-warning font-semibold text-sm mb-2">🏆 {prs.length} Personal Best{prs.length > 1 ? 's' : ''}!</p>
            {prs.map(s => (
              <p key={s.id} className="text-xs text-muted">
                {s.weightKg}kg × {s.reps} reps
              </p>
            ))}
          </div>
        )}

        <button onClick={onDone} className="w-full bg-primary text-white font-semibold py-3 rounded-2xl">
          Done
        </button>
      </div>
    </div>
  )
}

// ── Active Session (main export) ──────────────────────────────────────────────

interface ActiveSessionProps {
  onFinish: () => void
}

export function ActiveSession({ onFinish }: ActiveSessionProps) {
  const { activeSession, sessionStartedAt, localExercises, finishSession, discardSession, addExerciseToSession } =
    useWorkoutStore()
  const elapsed = useElapsedTimer(sessionStartedAt)
  const [showPicker, setShowPicker] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null)
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 90 })

  const handleSetDone = useCallback((restSeconds: number) => {
    setRestTimer({ active: true, seconds: restSeconds })
  }, [])

  const handleFinish = async () => {
    setFinishing(true)
    try {
      const session = await finishSession()
      setCompletedSession(session)
    } catch {
      setFinishing(false)
    }
  }

  const handleSummaryDone = () => {
    setCompletedSession(null)
    onFinish()
  }

  const handleAddExercise = (exercise: Exercise) => {
    addExerciseToSession(exercise)
    setShowPicker(false)
  }

  if (!activeSession) return null

  // Exercise picker overlay
  if (showPicker) {
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col">
        <div className="bg-surface border-b border-border px-4 py-3 safe-top flex items-center gap-3">
          <button onClick={() => setShowPicker(false)} className="text-primary font-medium">← Back</button>
          <h2 className="font-semibold">Add Exercise</h2>
        </div>
        <ExercisePicker onSelect={handleAddExercise} />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3 safe-top flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-bold leading-tight">{activeSession.name}</h1>
          <p className="text-xs text-muted tabular-nums">{formatTime(elapsed)}</p>
        </div>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="bg-success text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-60"
        >
          {finishing ? '…' : 'Finish'}
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
        {localExercises.length === 0 && (
          <p className="text-center text-muted text-sm py-10">
            No exercises added yet.
          </p>
        )}

        {localExercises.map(le => (
          <ExerciseCard key={le.localId} le={le} onSetDone={handleSetDone} />
        ))}

        <button
          onClick={() => setShowPicker(true)}
          className="w-full border-2 border-dashed border-border text-muted text-sm py-4 rounded-2xl hover:border-primary hover:text-primary transition-colors"
        >
          + Add Exercise
        </button>

        <button
          onClick={() => setShowDiscard(true)}
          className="w-full text-danger text-sm py-2"
        >
          Discard Workout
        </button>
      </div>

      {/* Rest timer */}
      {restTimer.active && (
        <RestTimer
          restSeconds={restTimer.seconds}
          onDone={() => setRestTimer({ active: false, seconds: 90 })}
        />
      )}

      {/* Discard confirmation */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="w-full bg-surface rounded-t-2xl p-6 space-y-3">
            <h3 className="font-semibold text-center">Discard this workout?</h3>
            <p className="text-muted text-sm text-center">Your progress won't be saved.</p>
            <button
              onClick={() => { discardSession(); onFinish() }}
              className="w-full bg-danger text-white font-semibold py-3 rounded-xl"
            >
              Discard
            </button>
            <button onClick={() => setShowDiscard(false)} className="w-full text-muted py-2">
              Keep Going
            </button>
          </div>
        </div>
      )}

      {/* Workout summary */}
      {completedSession && (
        <WorkoutSummary session={completedSession} elapsed={elapsed} onDone={handleSummaryDone} />
      )}
    </div>
  )
}
