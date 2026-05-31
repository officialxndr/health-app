import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { CalorieRing } from '../ui/CalorieRing';
import { MacroBar } from '../ui/MacroBar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';
import { Section, useNavigationStore } from '../../stores/navigationStore';

const WEEK = [
  { d: 'Su', v: 1820 }, { d: 'Mo', v: 2010 }, { d: 'Tu', v: 1640 },
  { d: 'We', v: 1980 }, { d: 'Th', v: 2100 }, { d: 'Fr', v: 1604 }, { d: 'Sa', v: 0 },
];
const GOAL = 2000, MAX_V = 2200;

export function DashboardOverview() {
  const { setSection } = useNavigationStore();
  const go = (s: Section) => setSection(s);
  const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View style={styles.greetRow}>
          <FSIcon name="UserCircle" size={44} strokeWidth={1.25} color={FS.muted} />
          <View>
            <Text style={styles.greetName}>Good morning</Text>
            <Text style={styles.greetSub}>Alex</Text>
          </View>
        </View>
        <Text style={styles.dateLabel}>{date}</Text>
      </View>

      {/* Calorie + macro card */}
      <Card onPress={() => go('food')}>
        <View style={styles.ringRow}>
          <CalorieRing eaten={1604} goal={GOAL} />
          <View style={styles.macros}>
            <MacroBar label="Protein" value={112} target={150} color={FS.protein} />
            <MacroBar label="Carbs"   value={125} target={200} color={FS.carbs}   />
            <MacroBar label="Fat"     value={48}  target={65}  color={FS.fat}     />
          </View>
        </View>
        <Text style={styles.tapHint}>Tap to log food →</Text>
      </Card>

      {/* This week */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>This Week</Text>
          <Badge tone="warning" icon="Flame">5 day streak</Badge>
        </View>
        <View style={styles.bars}>
          {WEEK.map((b, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    height: `${Math.max((b.v / MAX_V) * 100, 3)}%` as any,
                    backgroundColor: b.v > 0 ? FS.primary : FS.surfaceHigh,
                    opacity: b.v === 0 ? 1 : (b.v >= GOAL * 0.8 ? 1 : 0.6),
                  },
                ]} />
              </View>
              <Text style={styles.barLabel}>{b.d}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Weight card */}
      <Card onPress={() => go('health')}>
        <View style={styles.weightRow}>
          <View>
            <Text style={styles.statLabel}>Current Weight</Text>
            <Text style={styles.weightVal}>182.4 lb</Text>
            <Text style={[styles.weightDelta, { color: FS.success }]}>−1.3 lb this week</Text>
          </View>
          <View style={styles.etaRight}>
            <Text style={styles.statLabel}>Goal ETA</Text>
            <Text style={styles.etaVal}>Aug 14</Text>
          </View>
        </View>
      </Card>

      {/* Pace banner */}
      <TouchableOpacity onPress={() => go('health')} activeOpacity={0.7} style={styles.paceBanner}>
        <View style={[styles.paceHeader, { backgroundColor: FS.warning + '1a' }]}>
          <FSIcon name="AlertTriangle" size={16} color={FS.warning} />
          <Text style={[styles.paceTitle, { color: FS.warning }]}>Slightly Behind</Text>
          <Text style={styles.paceCta}>Pace →</Text>
        </View>
        <View style={styles.paceBody}>
          <Text style={styles.paceText}>Cut ~120 cal/day to stay on track</Text>
        </View>
      </TouchableOpacity>

      {/* Recent workouts */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Workouts</Text>
          <TouchableOpacity onPress={() => go('workout')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {[['Push Day', 'Today'], ['Leg Day', '2d ago'], ['Pull Day', '4d ago']].map(([n, t], i) => (
          <View
            key={i}
            style={[styles.workoutRow, i > 0 && styles.workoutRowBorder]}
          >
            <View>
              <Text style={styles.workoutName}>{n}</Text>
              <Text style={styles.workoutSub}>{t}</Text>
            </View>
            <FSIcon name="Dumbbell" size={16} color={FS.muted} />
          </View>
        ))}
      </Card>

      {/* Quick links */}
      <View style={styles.quickGrid}>
        <Card onPress={() => go('workout')} style={styles.quickCard}>
          <FSIcon name="Dumbbell" size={28} color={FS.primary} />
          <Text style={styles.quickLabel}>Log Workout</Text>
        </Card>
        <Card onPress={() => go('health')} style={styles.quickCard}>
          <FSIcon name="Ruler" size={28} color={FS.primary} />
          <Text style={styles.quickLabel}>Measurements</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 16 },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetName: { fontSize: 20, fontWeight: '700', color: FS.text },
  greetSub: { color: FS.muted, fontSize: 14 },
  dateLabel: { color: FS.muted, fontSize: 13 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  macros: { flex: 1, gap: 12 },
  tapHint: { fontSize: 12, color: FS.muted, textAlign: 'center', marginTop: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 0 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '75%', maxWidth: 28, height: 64, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 3, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  barLabel: { fontSize: 10, color: FS.muted },
  weightRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: FS.muted, marginBottom: 4 },
  weightVal: { fontSize: 24, fontWeight: '700', color: FS.text },
  weightDelta: { fontSize: 14, marginTop: 2 },
  etaRight: { alignItems: 'flex-end' },
  etaVal: { fontSize: 14, fontWeight: '500', color: FS.text, marginTop: 2 },
  paceBanner: { backgroundColor: FS.surface, borderRadius: FS.radius.lg, borderWidth: 1, borderColor: FS.border, overflow: 'hidden' },
  paceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  paceTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  paceCta: { fontSize: 12, color: FS.muted },
  paceBody: { padding: 12, paddingHorizontal: 16 },
  paceText: { fontSize: 14, color: FS.muted },
  seeAll: { fontSize: 12, color: FS.primary },
  workoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  workoutRowBorder: { borderTopWidth: 1, borderTopColor: FS.border },
  workoutName: { fontSize: 14, fontWeight: '500', color: FS.text },
  workoutSub: { fontSize: 12, color: FS.muted },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, gap: 8 },
  quickLabel: { fontSize: 14, fontWeight: '500', color: FS.text },
});
