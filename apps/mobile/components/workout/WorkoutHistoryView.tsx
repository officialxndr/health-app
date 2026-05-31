import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';

const HISTORY = [
  { name: 'Push Day',   date: 'Today',      duration: '48 min', sets: 18, volume: '8,420 lb', pr: true  },
  { name: 'Leg Day',    date: 'Wed May 28',  duration: '55 min', sets: 22, volume: '12,140 lb', pr: false },
  { name: 'Pull Day',   date: 'Mon May 26',  duration: '42 min', sets: 16, volume: '6,880 lb',  pr: false },
  { name: 'Push Day',   date: 'Sat May 24',  duration: '50 min', sets: 18, volume: '8,100 lb',  pr: false },
  { name: 'Leg Day',    date: 'Thu May 22',  duration: '58 min', sets: 24, volume: '11,800 lb', pr: false },
  { name: 'Pull Day',   date: 'Tue May 20',  duration: '40 min', sets: 15, volume: '6,500 lb',  pr: false },
  { name: 'Upper Body', date: 'Sun May 18',  duration: '45 min', sets: 20, volume: '9,200 lb',  pr: true  },
];

export function WorkoutHistoryView() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.countRow}>
        <Text style={s.countText}>{HISTORY.length} sessions</Text>
        <Text style={s.monthText}>This month</Text>
      </View>
      {HISTORY.map((w, i) => (
        <View key={i} style={s.card}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.name}>{w.name}</Text>
                {w.pr && <Badge tone="success" icon="Trophy">PR</Badge>}
              </View>
              <Text style={s.date}>{w.date}</Text>
            </View>
            <View style={s.duration}>
              <FSIcon name="Timer" size={13} color={FS.muted} />
              <Text style={s.durationText}>{w.duration}</Text>
            </View>
          </View>
          <View style={s.statRow}>
            {[['Sets', w.sets.toString()], ['Volume', w.volume]].map(([l, v]) => (
              <View key={l as string} style={s.stat}>
                <Text style={s.statLabel}>{l as string}</Text>
                <Text style={s.statVal}>{v as string}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 10 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  countText: { fontWeight: '600', fontSize: 15, color: FS.text },
  monthText: { fontSize: 13, color: FS.muted },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '600', color: FS.text },
  date: { fontSize: 12, color: FS.muted, marginTop: 3 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 12, color: FS.muted },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: FS.surfaceHigh, borderRadius: 10, padding: 10 },
  statLabel: { fontSize: 10, color: FS.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 2 },
  statVal: { fontSize: 14, fontWeight: '700', color: FS.text },
});
