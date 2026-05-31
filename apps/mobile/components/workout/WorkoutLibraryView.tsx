import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';
import { useSessionStore, Routine } from '../../stores/sessionStore';
import { useRouter } from 'expo-router';

const TEMPLATE_DEFS = [
  { id: 'push',  name: 'Push Day',   muscles: 'Chest · Shoulders · Triceps' },
  { id: 'pull',  name: 'Pull Day',   muscles: 'Back · Biceps'               },
  { id: 'legs',  name: 'Leg Day',    muscles: 'Quads · Hamstrings · Glutes' },
  { id: 'upper', name: 'Upper Body', muscles: 'Chest · Back · Arms'         },
];

const TEMPLATES = [
  { name: 'Push Day',   muscles: 'Chest · Shoulders · Triceps', last: '2 days ago' },
  { name: 'Pull Day',   muscles: 'Back · Biceps',               last: '4 days ago' },
  { name: 'Leg Day',    muscles: 'Quads · Hamstrings · Glutes', last: '6 days ago' },
  { name: 'Upper Body', muscles: 'Chest · Back · Arms',         last: 'Never'      },
];

function fmtAge(ts: number | undefined) {
  if (!ts) return 'Never';
  const days = Math.round((Date.now() - ts) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getNext(routine: Routine) {
  if (!routine.templateIds.length) return null;
  let nextId = routine.templateIds[0];
  let nextTime = routine.lastDones[nextId] || 0;
  for (const id of routine.templateIds) {
    const t = routine.lastDones[id] || 0;
    if (t < nextTime) { nextId = id; nextTime = t; }
  }
  return TEMPLATE_DEFS.find((t) => t.id === nextId) ?? null;
}

export function WorkoutLibraryView() {
  const router = useRouter();
  const { routines, addRoutine, deleteRoutine, stampRoutine, startSession } = useSessionStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const create = () => {
    if (!newName.trim() || !selected.length) return;
    addRoutine({ id: 'r' + Date.now(), name: newName.trim(), templateIds: [...selected], lastDones: {} });
    setNewName(''); setSelected([]); setShowCreate(false);
  };

  const startRoutine = (r: Routine) => {
    const next = getNext(r);
    if (!next) return;
    stampRoutine(r.id, next.id);
    startSession(next.name);
    router.push('/session');
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Routines ── */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Routines</Text>
        {!showCreate && (
          <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.7}>
            <Text style={s.newLink}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {showCreate && (
        <View style={s.createCard}>
          <Text style={s.createTitle}>New Routine</Text>
          <TextInput
            style={s.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Routine name…"
            placeholderTextColor={FS.muted}
          />
          <Text style={s.pickHint}>SELECT TEMPLATES · TAP TO SET ORDER</Text>
          <View style={{ gap: 6 }}>
            {TEMPLATE_DEFS.map((t) => {
              const on  = selected.includes(t.id);
              const pos = selected.indexOf(t.id) + 1;
              return (
                <TouchableOpacity key={t.id} onPress={() => toggle(t.id)}
                  style={[s.pickRow, on && s.pickRowActive]} activeOpacity={0.7}>
                  <View style={[s.pickBadge, on && s.pickBadgeActive]}>
                    {on ? <Text style={s.pickNum}>{pos}</Text>
                        : <FSIcon name="Plus" size={13} color={FS.muted} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickName}>{t.name}</Text>
                    <Text style={s.pickMuscles}>{t.muscles}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={s.createActions}>
            <FSButton variant="neutral" onPress={() => { setShowCreate(false); setNewName(''); setSelected([]); }} style={{ flex: 1, borderRadius: 12 }}>Cancel</FSButton>
            <FSButton onPress={create} disabled={!newName.trim() || !selected.length} style={{ flex: 1, borderRadius: 12 }}>Create</FSButton>
          </View>
        </View>
      )}

      {!showCreate && routines.length === 0 && (
        <TouchableOpacity onPress={() => setShowCreate(true)} style={s.emptyCard} activeOpacity={0.7}>
          <View style={s.emptyIcon}>
            <FSIcon name="Repeat" size={18} color={FS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.emptyTitle}>Create a routine</Text>
            <Text style={s.emptySub}>Auto-rotate through your templates</Text>
          </View>
          <FSIcon name="ChevronRight" size={16} color={FS.muted} />
        </TouchableOpacity>
      )}

      {routines.map((r) => {
        const next = getNext(r);
        return (
          <View key={r.id} style={s.routineCard}>
            <View style={s.routineHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.routineName}>{r.name}</Text>
                <Text style={s.routineSub}>{r.templateIds.length} workout{r.templateIds.length !== 1 ? 's' : ''} in rotation</Text>
              </View>
              <TouchableOpacity onPress={() => deleteRoutine(r.id)} style={s.trashBtn} activeOpacity={0.7}>
                <FSIcon name="Trash2" size={15} color={FS.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startRoutine(r)} style={s.startBtn} activeOpacity={0.8}>
                <FSIcon name="Play" size={13} color="#fff" />
                <Text style={s.startBtnLabel}>Start</Text>
              </TouchableOpacity>
            </View>
            {next && (
              <View style={s.nextPill}>
                <FSIcon name="ArrowRightCircle" size={13} color={FS.primary} />
                <Text style={s.nextLabel}>Next: {next.name}</Text>
                <Text style={s.nextAge}>· {fmtAge(r.lastDones[next.id])}</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* ── Divider ── */}
      <View style={s.divider} />

      {/* ── Templates ── */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Templates</Text>
        <Text style={s.newLink}>+ New</Text>
      </View>
      <FSButton full onPress={() => { startSession('Quick Workout'); router.push('/session'); }} style={s.quickStart}>
        Quick Start
      </FSButton>
      <View style={s.templateGrid}>
        {TEMPLATES.map((t, i) => (
          <TouchableOpacity key={i}
            onPress={() => { startSession(t.name); router.push('/session'); }}
            style={s.templateCard} activeOpacity={0.7}>
            <View style={s.templateTop}>
              <Text style={s.templateName}>{t.name}</Text>
              <FSIcon name="MoreHorizontal" size={20} color={FS.muted} />
            </View>
            <Text style={s.templateMuscles}>{t.muscles}</Text>
            <View style={s.templateLast}>
              <FSIcon name="Clock" size={14} color={FS.muted} />
              <Text style={s.templateLastText}>Last {t.last}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '600', fontSize: 15, color: FS.text },
  newLink: { fontSize: 14, color: FS.primary, fontWeight: '500' },
  createCard: { backgroundColor: FS.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: FS.primary + '33', gap: 12 },
  createTitle: { fontSize: 13, fontWeight: '600', color: FS.primary },
  input: { backgroundColor: FS.surfaceHigh, borderWidth: 1, borderColor: FS.border, borderRadius: 10, padding: 10, paddingHorizontal: 12, fontSize: 14, color: FS.text },
  pickHint: { fontSize: 11, color: FS.muted, fontWeight: '600', letterSpacing: 0.8 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: FS.surfaceHigh, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 10, padding: 10, paddingHorizontal: 12 },
  pickRowActive: { backgroundColor: FS.primary + '18', borderColor: FS.primary + '55' },
  pickBadge: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: FS.border, alignItems: 'center', justifyContent: 'center' },
  pickBadgeActive: { backgroundColor: FS.primary, borderColor: FS.primary },
  pickNum: { fontSize: 12, fontWeight: '700', color: '#fff' },
  pickName: { fontSize: 13, fontWeight: '600', color: FS.text },
  pickMuscles: { fontSize: 11, color: FS.muted, marginTop: 2 },
  createActions: { flexDirection: 'row', gap: 8 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: FS.surface, borderRadius: 14, padding: 12, paddingHorizontal: 14 },
  emptyIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: FS.primary + '18', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  emptySub: { fontSize: 12, color: FS.muted, marginTop: 2 },
  routineCard: { backgroundColor: FS.surface, borderRadius: 16, padding: 14 },
  routineHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routineName: { fontSize: 15, fontWeight: '700', color: FS.text },
  routineSub: { fontSize: 12, color: FS.muted, marginTop: 2 },
  trashBtn: { padding: 6 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: FS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  startBtnLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  nextPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FS.primary + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 8 },
  nextLabel: { fontSize: 12, color: FS.primary, fontWeight: '600' },
  nextAge: { fontSize: 11, color: FS.muted },
  divider: { height: 1, backgroundColor: FS.border, marginVertical: 4 },
  quickStart: { borderRadius: 16, paddingVertical: 14 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard: { width: '47%', backgroundColor: FS.surface, borderRadius: 16, padding: 16, gap: 8, minHeight: 120 },
  templateTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  templateName: { fontSize: 16, fontWeight: '600', color: FS.text, lineHeight: 20 },
  templateMuscles: { fontSize: 12, color: FS.muted },
  templateLast: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' as any },
  templateLastText: { fontSize: 12, color: FS.muted },
});
