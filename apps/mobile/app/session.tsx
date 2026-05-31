import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FS } from '../constants/theme';
import { FSIcon } from '../components/ui/FSIcon';
import { FSButton } from '../components/ui/FSButton';
import { useSessionStore } from '../stores/sessionStore';
import { useNavigationStore } from '../stores/navigationStore';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExSet { id: string; prev: string; w: number; r: number; done: boolean; }
interface Exercise { id: string; name: string; muscle: string; sets: ExSet[]; }
type FocusState = { ex: string; set: string; field: 'w' | 'r' } | null;

// ── Numpad ────────────────────────────────────────────────────────────────────
function Numpad({ onKey, onStep, field, onClose }: {
  onKey: (k: string) => void;
  onStep: (d: number) => void;
  field: 'w' | 'r';
  onClose: () => void;
}) {
  const K = ({ children, onPress, primary }: { children: React.ReactNode; onPress: () => void; primary?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[s.key, primary && s.keyPrimary]}
      activeOpacity={0.7}
    >
      {typeof children === 'string'
        ? <Text style={[s.keyLabel, primary && s.keyLabelPrimary]}>{children}</Text>
        : children}
    </TouchableOpacity>
  );

  return (
    <View style={s.numpad}>
      {/* Row 1 */}
      <K onPress={() => onKey('1')}>1</K>
      <K onPress={() => onKey('2')}>2</K>
      <K onPress={() => onKey('3')}>3</K>
      <K onPress={onClose}>
        <FSIcon name="ChevronDown" size={22} color={FS.muted} />
      </K>
      {/* Row 2 */}
      <K onPress={() => onKey('4')}>4</K>
      <K onPress={() => onKey('5')}>5</K>
      <K onPress={() => onKey('6')}>6</K>
      <K onPress={() => onStep(1)}>
        <Text style={s.keyLabel}>＋</Text>
      </K>
      {/* Row 3 */}
      <K onPress={() => onKey('7')}>7</K>
      <K onPress={() => onKey('8')}>8</K>
      <K onPress={() => onKey('9')}>9</K>
      <K onPress={() => onStep(-1)}>
        <Text style={s.keyLabel}>－</Text>
      </K>
      {/* Row 4 */}
      <K onPress={() => onKey('del')}>
        <FSIcon name="Delete" size={22} color={FS.muted} />
      </K>
      <K onPress={() => onKey('0')}>0</K>
      <K onPress={() => onKey('del')}>
        <FSIcon name="Delete" size={20} color={FS.muted} />
      </K>
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
  const { activeSession, finishSession, discardSession } = useSessionStore();
  const { setSection } = useNavigationStore();

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'e1', name: 'Goblet Squat (Kettlebell)', muscle: 'Legs',
      sets: [
        { id: 's1', prev: '30 × 8', w: 30, r: 8,  done: true  },
        { id: 's2', prev: '30 × 8', w: 30, r: 8,  done: true  },
        { id: 's3', prev: '30 × 8', w: 30, r: 0,  done: false },
      ],
    },
    {
      id: 'e2', name: 'Bench Press (Dumbbell)', muscle: 'Chest',
      sets: [
        { id: 's4', prev: '45 × 10', w: 45, r: 10, done: false },
        { id: 's5', prev: '45 × 10', w: 0,  r: 0,  done: false },
      ],
    },
  ]);
  const [focus, setFocus] = useState<FocusState>({ ex: 'e1', set: 's3', field: 'w' });

  const updateSet = (exId: string, setId: string, field: 'w' | 'r', val: number) =>
    setExercises((prev) =>
      prev.map((e) => e.id !== exId ? e : {
        ...e,
        sets: e.sets.map((s) => s.id !== setId ? s : { ...s, [field]: val }),
      })
    );

  const toggleDone = (exId: string, setId: string) =>
    setExercises((prev) =>
      prev.map((e) => e.id !== exId ? e : {
        ...e,
        sets: e.sets.map((s) => s.id !== setId ? s : { ...s, done: !s.done }),
      })
    );

  const removeSet = (exId: string, setId: string) =>
    setExercises((prev) =>
      prev.map((e) => e.id !== exId ? e : {
        ...e,
        sets: e.sets.filter((s) => s.id !== setId),
      })
    );

  const addSet = (exId: string) =>
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        const last = e.sets[e.sets.length - 1];
        const newId = 'snew_' + Date.now();
        return {
          ...e,
          sets: [...e.sets, { id: newId, prev: last ? `${last.w} × ${last.r}` : '—', w: last?.w ?? 0, r: 0, done: false }],
        };
      })
    );

  const draft = focus
    ? (exercises.find((e) => e.id === focus.ex)?.sets.find((s) => s.id === focus.set)?.[focus.field] ?? 0)
    : 0;

  const pressKey = (key: string) => {
    if (!focus) return;
    if (key === 'next') {
      if (focus.field === 'w') { setFocus({ ...focus, field: 'r' }); return; }
      toggleDone(focus.ex, focus.set); setFocus(null); return;
    }
    const cur = String(draft === 0 ? '' : draft);
    const next = key === 'del' ? cur.slice(0, -1) : cur + key;
    updateSet(focus.ex, focus.set, focus.field, parseInt(next || '0', 10) || 0);
  };

  const pressStep = (dir: number) => {
    if (!focus) return;
    updateSet(focus.ex, focus.set, focus.field, Math.max(0, (draft || 0) + dir * (focus.field === 'w' ? 5 : 1)));
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
        { text: 'Discard', style: 'destructive', onPress: () => { discardSession(); router.replace('/(tabs)'); } },
      ]
    );
  };

  const Cell = ({ e, set, field }: { e: Exercise; set: ExSet; field: 'w' | 'r' }) => {
    const on = focus?.ex === e.id && focus?.set === set.id && focus?.field === field;
    return (
      <TouchableOpacity
        onPress={() => setFocus({ ex: e.id, set: set.id, field })}
        style={[s.cell, on && s.cellFocused]}
        activeOpacity={0.7}
      >
        <Text style={[s.cellText, set[field] === 0 && s.cellMuted]}>
          {set[field] > 0 ? set[field] : 0}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={s.header}>
        <View style={s.timerBadge}>
          <FSIcon name="Timer" size={16} color={FS.muted} />
          <Text style={s.timerText}>2:00</Text>
        </View>
        <View style={s.headerCenter}>
          <Text style={s.sessionName}>{activeSession ?? 'Workout'}</Text>
          <Text style={s.elapsed}>{fmt(elapsed)}</Text>
        </View>
        <FSButton variant="success" onPress={handleFinish} style={s.finishBtn}>Finish</FSButton>
      </View>

      {/* exercise list */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: focus ? 290 : 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.map((e) => (
          <View key={e.id} style={s.exCard}>
            {/* exercise header */}
            <View style={s.exHeader}>
              <View>
                <Text style={s.exName}>{e.name}</Text>
                <Text style={s.exMuscle}>{e.muscle}</Text>
              </View>
              <View style={s.exIcons}>
                <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
                  <FSIcon name="StickyNote" size={20} color={FS.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
                  <FSIcon name="X" size={20} color={FS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* column headers */}
            <View style={s.colHeaders}>
              <View style={s.colSet}><Text style={s.colLabel}>Set</Text></View>
              <View style={s.colPrev}><Text style={[s.colLabel, { textAlign: 'center' }]}>Previous</Text></View>
              <View style={s.colVal}><Text style={[s.colLabel, { textAlign: 'center' }]}>lbs</Text></View>
              <View style={s.colVal}><Text style={[s.colLabel, { textAlign: 'center' }]}>Reps</Text></View>
              <View style={s.colCheck}>
                <FSIcon name="Check" size={13} color={FS.muted} />
              </View>
              <View style={s.colRemove} />
            </View>

            {/* sets */}
            {e.sets.map((set, i) => (
              <React.Fragment key={set.id}>
                <View style={[s.setRow, set.done && s.setRowDone]}>
                  <View style={s.colSet}>
                    <View style={s.setNum}><Text style={s.setNumText}>{i + 1}</Text></View>
                  </View>
                  <View style={s.colPrev}>
                    <Text style={s.prevText}>{set.prev}</Text>
                  </View>
                  <View style={s.colVal}><Cell e={e} set={set} field="w" /></View>
                  <View style={s.colVal}><Cell e={e} set={set} field="r" /></View>
                  <View style={s.colCheck}>
                    <TouchableOpacity
                      onPress={() => toggleDone(e.id, set.id)}
                      style={[s.checkBtn, set.done && s.checkBtnDone]}
                      activeOpacity={0.7}
                    >
                      <FSIcon name="Check" size={16} color={set.done ? '#fff' : FS.muted} />
                    </TouchableOpacity>
                  </View>
                  <View style={s.colRemove}>
                    {i === e.sets.length - 1 && e.sets.length > 1 ? (
                      <TouchableOpacity onPress={() => removeSet(e.id, set.id)} style={s.removeBtn} activeOpacity={0.7}>
                        <FSIcon name="X" size={15} color={FS.muted} />
                      </TouchableOpacity>
                    ) : <View />}
                  </View>
                </View>
                {/* rest timer divider */}
                <View style={s.restDivider}>
                  <View style={s.restLineLeft} />
                  <Text style={s.restLabel}>2:00</Text>
                  <View style={s.restLineRight} />
                </View>
              </React.Fragment>
            ))}

            {/* add set button */}
            <TouchableOpacity onPress={() => addSet(e.id)} style={s.addSetBtn} activeOpacity={0.7}>
              <FSIcon name="Plus" size={16} color={FS.text} />
              <Text style={s.addSetText}>Add Set </Text>
              <Text style={s.addSetTime}>(2:00)</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* add exercise */}
        <TouchableOpacity style={s.addExBtn} activeOpacity={0.7}>
          <FSIcon name="Plus" size={16} color={FS.muted} />
          <Text style={s.addExText}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDiscard} style={s.discardBtn} activeOpacity={0.7}>
          <Text style={s.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* numpad */}
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
  timerText: { fontSize: 13, color: FS.muted },
  headerCenter: { alignItems: 'center' },
  sessionName: { fontSize: 16, fontWeight: '700', color: FS.text },
  elapsed: { fontSize: 12, color: FS.muted, fontVariant: ['tabular-nums'] as any },
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
  addSetTime: { fontSize: 14, color: FS.muted, fontWeight: '400' },
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
