import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FS } from '../constants/theme';
import { FSIcon } from '../components/ui/FSIcon';
import { FSButton } from '../components/ui/FSButton';
import { useWorkoutStore } from '../stores/workoutStore';
import { useNavigationStore } from '../stores/navigationStore';
import type { LocalExercise, LocalSet } from '../types';

// ── Focus state ───────────────────────────────────────────────────────────────
type FocusState = { exLocalId: string; setLocalId: string; field: 'w' | 'r' } | null;

// ── Numpad ────────────────────────────────────────────────────────────────────
function Numpad({
  onKey, onStep, field, onClose,
}: {
  onKey: (k: string) => void;
  onStep: (d: number) => void;
  field: 'w' | 'r';
  onClose: () => void;
}) {
  const K = ({ children, onPress, primary }: { children: React.ReactNode; onPress: () => void; primary?: boolean }) => (
    <TouchableOpacity onPress={onPress} style={[s.key, primary && s.keyPrimary]} activeOpacity={0.7}>
      {typeof children === 'string'
        ? <Text style={[s.keyLabel, primary && s.keyLabelPrimary]}>{children}</Text>
        : children}
    </TouchableOpacity>
  );
  return (
    <View style={s.numpad}>
      <K onPress={() => onKey('1')}>1</K>
      <K onPress={() => onKey('2')}>2</K>
      <K onPress={() => onKey('3')}>3</K>
      <K onPress={onClose}><FSIcon name="ChevronDown" size={22} color={FS.muted} /></K>

      <K onPress={() => onKey('4')}>4</K>
      <K onPress={() => onKey('5')}>5</K>
      <K onPress={() => onKey('6')}>6</K>
      <K onPress={() => onStep(1)}><Text style={s.keyLabel}>＋</Text></K>

      <K onPress={() => onKey('7')}>7</K>
      <K onPress={() => onKey('8')}>8</K>
      <K onPress={() => onKey('9')}>9</K>
      <K onPress={() => onStep(-1)}><Text style={s.keyLabel}>－</Text></K>

      <K onPress={() => onKey('del')}><FSIcon name="Delete" size={22} color={FS.muted} /></K>
      <K onPress={() => onKey('0')}>0</K>
      <K onPress={() => onKey('.')}>.</K>
      <K onPress={() => onKey('next')} primary>
        <Text style={[s.keyLabel, s.keyLabelPrimary]}>{field === 'w' ? 'Next' : 'Done'}</Text>
      </K>
    </View>
  );
}

// ── Active Session ─────────────────────────────────────────────────────────────
export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSection } = useNavigationStore();
  const {
    activeSessionName,
    sessionStartedAt,
    localExercises,
    addSet,
    removeSet,
    updateSet,
    updateExerciseNotes,
    removeExerciseFromSession,
    finishSession,
    discardSession,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState(0);
  const [focus, setFocus] = useState<FocusState>(null);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const getFocusedValue = (): number => {
    if (!focus) return 0;
    const ex = localExercises.find((e) => e.localId === focus.exLocalId);
    const set = ex?.sets.find((s) => s.localId === focus.setLocalId);
    return set?.[focus.field === 'w' ? 'weightKg' : 'reps'] ?? 0;
  };

  const pressKey = (key: string) => {
    if (!focus) return;
    if (key === 'next') {
      if (focus.field === 'w') {
        setFocus({ ...focus, field: 'r' });
      } else {
        updateSet(focus.exLocalId, focus.setLocalId, { done: true });
        setFocus(null);
      }
      return;
    }
    const cur = String(getFocusedValue() === 0 ? '' : getFocusedValue());
    const next = key === 'del' ? cur.slice(0, -1) : cur + key;
    const val = parseFloat(next || '0') || 0;
    if (focus.field === 'w') {
      updateSet(focus.exLocalId, focus.setLocalId, { weightKg: val });
    } else {
      updateSet(focus.exLocalId, focus.setLocalId, { reps: Math.round(val) });
    }
  };

  const pressStep = (dir: number) => {
    if (!focus) return;
    const cur = getFocusedValue();
    if (focus.field === 'w') {
      updateSet(focus.exLocalId, focus.setLocalId, { weightKg: Math.max(0, cur + dir * 2.5) });
    } else {
      updateSet(focus.exLocalId, focus.setLocalId, { reps: Math.max(0, cur + dir) });
    }
  };

  const handleFinish = () => {
    finishSession();
    setSection('workout');
    router.replace('/(tabs)');
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard this workout?',
      "Your progress won't be saved.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardSession();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const Cell = ({ ex, set, field }: { ex: LocalExercise; set: LocalSet; field: 'w' | 'r' }) => {
    const on = focus?.exLocalId === ex.localId && focus?.setLocalId === set.localId && focus?.field === field;
    const val = field === 'w' ? set.weightKg : set.reps;
    return (
      <TouchableOpacity
        onPress={() => setFocus({ exLocalId: ex.localId, setLocalId: set.localId, field })}
        style={[s.cell, on && s.cellFocused]}
        activeOpacity={0.7}
      >
        <Text style={[s.cellText, val === 0 && s.cellMuted]}>{val > 0 ? val : 0}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.timerBadge}>
          <FSIcon name="Timer" size={16} color={FS.muted} />
          <Text style={s.timerText}>{fmt(elapsed)}</Text>
        </View>
        <View style={s.headerCenter}>
          <Text style={s.sessionName}>{activeSessionName ?? 'Workout'}</Text>
          <Text style={s.elapsed}>
            {sessionStartedAt
              ? new Date(sessionStartedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
        <FSButton variant="success" onPress={handleFinish} style={s.finishBtn}>Finish</FSButton>
      </View>

      {/* Exercise list */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: focus ? 290 : 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {localExercises.map((ex) => (
          <View key={ex.localId} style={s.exCard}>
            {/* Exercise header */}
            <View style={s.exHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.exName}>{ex.exercise.name}</Text>
                <Text style={s.exMuscle}>{ex.exercise.muscleGroup ?? ex.exercise.equipment ?? ''}</Text>
              </View>
              <View style={s.exIcons}>
                <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
                  <FSIcon name="StickyNote" size={20} color={FS.muted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => removeExerciseFromSession(ex.localId)}
                  activeOpacity={0.7}
                >
                  <FSIcon name="X" size={20} color={FS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Column headers */}
            <View style={s.colHeaders}>
              <View style={s.colSet}><Text style={s.colLabel}>Set</Text></View>
              <View style={s.colPrev}><Text style={[s.colLabel, { textAlign: 'center' }]}>Previous</Text></View>
              <View style={s.colVal}><Text style={[s.colLabel, { textAlign: 'center' }]}>lbs</Text></View>
              <View style={s.colVal}><Text style={[s.colLabel, { textAlign: 'center' }]}>Reps</Text></View>
              <View style={s.colCheck}><FSIcon name="Check" size={13} color={FS.muted} /></View>
              <View style={s.colRemove} />
            </View>

            {/* Sets */}
            {ex.sets.map((set, i) => {
              const lastSet = ex.lastSets[i];
              const prevLabel = lastSet ? `${lastSet.weightKg} × ${lastSet.reps}` : '—';
              return (
                <React.Fragment key={set.localId}>
                  <View style={[s.setRow, set.done && s.setRowDone]}>
                    <View style={s.colSet}>
                      <View style={s.setNum}><Text style={s.setNumText}>{i + 1}</Text></View>
                    </View>
                    <View style={s.colPrev}>
                      <Text style={s.prevText}>{prevLabel}</Text>
                    </View>
                    <View style={s.colVal}><Cell ex={ex} set={set} field="w" /></View>
                    <View style={s.colVal}><Cell ex={ex} set={set} field="r" /></View>
                    <View style={s.colCheck}>
                      <TouchableOpacity
                        onPress={() => updateSet(ex.localId, set.localId, { done: !set.done })}
                        style={[s.checkBtn, set.done && s.checkBtnDone]}
                        activeOpacity={0.7}
                      >
                        <FSIcon name="Check" size={16} color={set.done ? '#fff' : FS.muted} />
                      </TouchableOpacity>
                    </View>
                    <View style={s.colRemove}>
                      {i === ex.sets.length - 1 && ex.sets.length > 1 ? (
                        <TouchableOpacity
                          onPress={() => removeSet(ex.localId, set.localId)}
                          style={s.removeBtn}
                          activeOpacity={0.7}
                        >
                          <FSIcon name="X" size={15} color={FS.muted} />
                        </TouchableOpacity>
                      ) : <View />}
                    </View>
                  </View>
                  {/* Rest divider (only between sets, not after last) */}
                  {i < ex.sets.length - 1 && (
                    <View style={s.restDivider}>
                      <View style={s.restLineLeft} />
                      <Text style={s.restLabel}>{Math.floor(ex.restSeconds / 60)}:{String(ex.restSeconds % 60).padStart(2, '0')}</Text>
                      <View style={s.restLineRight} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}

            {/* Add set */}
            <TouchableOpacity onPress={() => addSet(ex.localId)} style={s.addSetBtn} activeOpacity={0.7}>
              <FSIcon name="Plus" size={16} color={FS.text} />
              <Text style={s.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise (placeholder — exercise picker to be wired) */}
        <TouchableOpacity style={s.addExBtn} activeOpacity={0.7}>
          <FSIcon name="Plus" size={16} color={FS.muted} />
          <Text style={s.addExText}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDiscard} style={s.discardBtn} activeOpacity={0.7}>
          <Text style={s.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Numpad */}
      {focus && (
        <Numpad
          onKey={pressKey}
          onStep={pressStep}
          field={focus.field}
          onClose={() => setFocus(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  header: { backgroundColor: FS.surface, borderBottomWidth: 1, borderBottomColor: FS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FS.surfaceHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timerText: { fontSize: 13, color: FS.muted, fontVariant: ['tabular-nums'] as any },
  headerCenter: { alignItems: 'center' },
  sessionName: { fontSize: 16, fontWeight: '700', color: FS.text },
  elapsed: { fontSize: 12, color: FS.muted },
  finishBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  exCard: { backgroundColor: FS.surface, borderRadius: 16 },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: FS.border },
  exName: { fontSize: 16, fontWeight: '600', color: FS.primary },
  exMuscle: { fontSize: 12, color: FS.muted, marginTop: 2 },
  exIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  colHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  colSet: { width: 38, alignItems: 'center' },
  colPrev: { flex: 1 },
  colVal: { width: 52 },
  colCheck: { width: 38, alignItems: 'center' },
  colRemove: { width: 30 },
  colLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: FS.muted },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, marginHorizontal: 6, borderRadius: 8 },
  setRowDone: { backgroundColor: FS.success + '1a' },
  setNum: { width: 34, height: 30, borderRadius: 8, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  setNumText: { fontSize: 14, fontWeight: '600', color: FS.text, fontVariant: ['tabular-nums'] as any },
  prevText: { textAlign: 'center', color: FS.muted, fontSize: 13, fontVariant: ['tabular-nums'] as any },
  cell: { width: 52, padding: 8, borderRadius: 8, alignItems: 'center', backgroundColor: FS.surfaceHigh },
  cellFocused: { backgroundColor: FS.surface, shadowColor: FS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 3, elevation: 3 },
  cellText: { fontSize: 15, fontWeight: '600', color: FS.text, fontVariant: ['tabular-nums'] as any },
  cellMuted: { color: FS.muted },
  checkBtn: { width: 38, height: 34, borderRadius: 8, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  checkBtnDone: { backgroundColor: FS.success },
  removeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  restDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  restLineLeft: { flex: 1, height: 2, borderRadius: 2, backgroundColor: FS.primary, opacity: 0.45 },
  restLabel: { fontSize: 14, fontWeight: '700', color: FS.primary, fontVariant: ['tabular-nums'] as any },
  restLineRight: { flex: 1, height: 2, borderRadius: 2, backgroundColor: FS.primary, opacity: 0.18 },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 4, marginHorizontal: 8, marginBottom: 8, backgroundColor: FS.surfaceHigh, borderRadius: 10, paddingVertical: 11, gap: 6 },
  addSetText: { fontSize: 14, fontWeight: '600', color: FS.text },
  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: FS.border, borderRadius: 16, padding: 16, gap: 4 },
  addExText: { fontSize: 14, color: FS.muted },
  discardBtn: { alignItems: 'center', padding: 8 },
  discardText: { fontSize: 14, color: FS.danger },
  numpad: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: FS.surface, borderTopWidth: 1, borderTopColor: FS.border, padding: 12, paddingBottom: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 8, zIndex: 50 },
  key: { width: '22%', aspectRatio: 1.6, backgroundColor: FS.surfaceHigh, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  keyPrimary: { backgroundColor: FS.primary },
  keyLabel: { fontSize: 22, color: FS.text },
  keyLabelPrimary: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
