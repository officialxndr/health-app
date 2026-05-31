import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { format, subDays } from 'date-fns';
import { FS } from '../../constants/theme';
import { CalorieRing } from '../ui/CalorieRing';
import { MacroBar } from '../ui/MacroBar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';
import { useAuthStore } from '../../stores/authStore';
import { useHealthStore } from '../../stores/healthStore';
import { useFoodStore } from '../../stores/foodStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatWeight } from '../../lib/units';
import { Section, useNavigationStore } from '../../stores/navigationStore';
import { useRouter } from 'expo-router';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Weight sparkline (7-day mini line chart) ──────────────────────────────────
const SW = 280, SH = 44;

function WeightSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const minW = Math.min(...data) - 0.5;
  const maxW = Math.max(...data) + 0.5;
  const range = maxW - minW || 1;
  const xOf = (i: number) => (i / (data.length - 1)) * SW;
  const yOf = (v: number) => SH - ((v - minW) / range) * SH;
  const path = data.map((v, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ');
  return (
    <Svg width="100%" height={SH + 4} viewBox={`0 0 ${SW} ${SH + 4}`} style={{ marginTop: 10 }}>
      <Path d={path} fill="none" stroke={FS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Weekly calorie bars ───────────────────────────────────────────────────────
const GOAL = 2000; // fallback

export function DashboardOverview() {
  const { setSection } = useNavigationStore();
  const router = useRouter();
  const go = (s: Section) => setSection(s);

  const { user } = useAuthStore();
  const { stats, fetchStats, fetchWeightEntries, weightEntries } = useHealthStore();
  const { logs, fetchLogs, getDailyCalories } = useFoodStore();
  const { activeSessionLocalId, activeSessionName, loadSessions, sessions } = useWorkoutStore();
  const { unitSystem } = useSettingsStore();

  const [weekCalories, setWeekCalories] = useState<{ d: string; v: number }[]>([]);
  const [streak, setStreak] = useState(0);

  const profile = user?.profile;
  const calorieGoal = profile?.calorieGoal ?? GOAL;

  useEffect(() => {
    fetchLogs();
    fetchStats();
    const to = new Date().toISOString().slice(0, 10);
    const from = subDays(new Date(), 89).toISOString().slice(0, 10);
    fetchWeightEntries(from, to);
    loadSessions(3);

    // Build 7-day calorie data
    const today = new Date();
    const dailyData = getDailyCalories(
      format(subDays(today, 6), 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    );
    const byDate = new Map(dailyData.map((d) => [d.date, d.calories]));
    const bars = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return { d: format(d, 'EEE').slice(0, 2), v: byDate.get(dateStr) ?? 0 };
    });
    setWeekCalories(bars);

    // Streak: consecutive days with food logs
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
      if (byDate.has(dateStr) && (byDate.get(dateStr) ?? 0) > 0) { s++; } else { break; }
    }
    setStreak(s);
  }, []);

  // Today's totals from food logs
  const totals = logs.reduce(
    (acc, l) => {
      if (!l.foodItem) return acc;
      return {
        calories: acc.calories + l.foodItem.calories * l.servingQty,
        protein: acc.protein + l.foodItem.protein * l.servingQty,
        carbs: acc.carbs + l.foodItem.carbs * l.servingQty,
        fat: acc.fat + l.foodItem.fat * l.servingQty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Pace status
  const delta = stats?.dailyCalorieDelta;
  const goalType = profile?.goalType ?? 'MAINTAIN';
  const onTrack = stats?.onTrack ?? false;
  const paceStatus = (() => {
    if (onTrack || delta == null) return { label: 'On Pace', color: FS.success, icon: 'CheckCircle2' as const, body: '' };
    const abs = Math.round(Math.abs(delta));
    if (Math.abs(delta) < 150) return { label: 'Slightly Behind', color: FS.warning, icon: 'AlertTriangle' as const, body: goalType === 'LOSE' ? `Cut ~${abs} cal/day to stay on track` : `Add ~${abs} cal/day to stay on track` };
    return { label: 'Off Track', color: FS.danger, icon: 'AlertCircle' as const, body: goalType === 'LOSE' ? `Cut ~${abs} cal/day` : `Add ~${abs} cal/day` };
  })();

  // 7-day weight data for sparkline
  const last7Weight = weightEntries.slice(-7).map((e) => e.weightKg);
  const current = stats?.current;
  const recentSessions = sessions.filter((s) => s.finishedAt).slice(0, 3);

  const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const MAX_V = Math.max(calorieGoal * 1.1, ...weekCalories.map((b) => b.v));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Active session banner */}
      {activeSessionLocalId && (
        <TouchableOpacity
          onPress={() => router.push('/session')}
          activeOpacity={0.8}
          style={styles.sessionBanner}
        >
          <Text style={styles.sessionLabel}>Session in progress</Text>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionName}>{activeSessionName ?? 'Workout'}</Text>
            <Text style={styles.sessionCta}>Continue →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Greeting */}
      <View style={styles.greeting}>
        <View style={styles.greetRow}>
          <FSIcon name="UserCircle" size={44} strokeWidth={1.25} color={FS.muted} />
          <View>
            <Text style={styles.greetName}>{getGreeting()}</Text>
            <Text style={styles.greetSub}>{user?.name ?? 'You'}</Text>
          </View>
        </View>
        <Text style={styles.dateLabel}>{date}</Text>
      </View>

      {/* Calorie + macro card */}
      <Card onPress={() => go('food')}>
        <View style={styles.ringRow}>
          <CalorieRing eaten={Math.round(totals.calories)} goal={calorieGoal} />
          <View style={styles.macros}>
            <MacroBar label="Protein" value={Math.round(totals.protein)} target={profile?.proteinTarget ?? 150} color={FS.protein} />
            <MacroBar label="Carbs"   value={Math.round(totals.carbs)}   target={profile?.carbsTarget ?? 200}  color={FS.carbs}   />
            <MacroBar label="Fat"     value={Math.round(totals.fat)}     target={profile?.fatTarget ?? 65}     color={FS.fat}     />
          </View>
        </View>
        <Text style={styles.tapHint}>Tap to log food →</Text>
      </Card>

      {/* This week */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>This Week</Text>
          {streak > 0 && <Badge tone="warning" icon="Flame">{streak} day streak</Badge>}
        </View>
        <View style={styles.bars}>
          {weekCalories.map((b, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    height: `${Math.max(b.v > 0 ? (b.v / MAX_V) * 100 : 3, 3)}%` as any,
                    backgroundColor: b.v > 0 ? FS.primary : FS.surfaceHigh,
                    opacity: b.v === 0 ? 1 : (b.v >= calorieGoal * 0.8 ? 1 : 0.6),
                  },
                ]} />
              </View>
              <Text style={styles.barLabel}>{b.d}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Weight card with sparkline */}
      {current && (
        <Card onPress={() => go('health')}>
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.statLabel}>Current Weight</Text>
              <Text style={styles.weightVal}>{formatWeight(current.weightKg, unitSystem)}</Text>
              {stats?.weeklyChange != null && (
                <Text style={[styles.weightDelta, { color: stats.weeklyChange < 0 ? FS.success : stats.weeklyChange > 0 ? FS.danger : FS.muted }]}>
                  {stats.weeklyChange > 0 ? '+' : ''}{formatWeight(Math.abs(stats.weeklyChange), unitSystem)} this week
                </Text>
              )}
            </View>
            <View style={styles.etaRight}>
              {stats?.goalEta && <Text style={styles.statLabel}>Goal ETA</Text>}
              {stats?.goalEta && <Text style={styles.etaVal}>{stats.goalEta}</Text>}
            </View>
          </View>
          {last7Weight.length >= 2 && <WeightSparkline data={last7Weight} />}
        </Card>
      )}

      {/* Pace banner */}
      {(onTrack || (delta != null && delta !== 0)) && (
        <TouchableOpacity onPress={() => go('health')} activeOpacity={0.7} style={styles.paceBanner}>
          <View style={[styles.paceHeader, { backgroundColor: paceStatus.color + '1a' }]}>
            <FSIcon name={paceStatus.icon} size={16} color={paceStatus.color} />
            <Text style={[styles.paceTitle, { color: paceStatus.color }]}>{paceStatus.label}</Text>
            <Text style={styles.paceCta}>Pace →</Text>
          </View>
          {paceStatus.body ? (
            <View style={styles.paceBody}>
              <Text style={styles.paceText}>{paceStatus.body}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      )}

      {/* Recent workouts */}
      {recentSessions.length > 0 && (
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => go('workout')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {recentSessions.map((sess, i) => (
            <View key={sess.id} style={[styles.workoutRow, i > 0 && styles.workoutRowBorder]}>
              <View>
                <Text style={styles.workoutName}>{sess.name}</Text>
                <Text style={styles.workoutSub}>{new Date(sess.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
              <FSIcon name="Dumbbell" size={16} color={FS.muted} />
            </View>
          ))}
        </Card>
      )}

      {/* Workout suggestion if no recent sessions */}
      {recentSessions.length === 0 && !activeSessionLocalId && (
        <Card onPress={() => go('workout')}>
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.statLabel}>No recent workouts</Text>
              <Text style={styles.workoutName}>Start a session →</Text>
            </View>
            <FSIcon name="Dumbbell" size={28} color={FS.primary} />
          </View>
        </Card>
      )}

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
  sessionBanner: { backgroundColor: FS.primary + '33', borderWidth: 1, borderColor: FS.primary + '66', borderRadius: FS.radius.lg, padding: FS.space.lg },
  sessionLabel: { fontSize: 12, color: FS.primary, fontWeight: '500', marginBottom: 4 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionName: { fontSize: 16, fontWeight: '600', color: FS.text },
  sessionCta: { fontSize: 14, color: FS.primary, fontWeight: '500' },
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
  barFill: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 10, color: FS.muted },
  weightRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: FS.muted, marginBottom: 4 },
  weightVal: { fontSize: 24, fontWeight: '700', color: FS.text },
  weightDelta: { fontSize: 14, marginTop: 2 },
  etaRight: { alignItems: 'flex-end' },
  etaVal: { fontSize: 14, fontWeight: '500', color: FS.text, marginTop: 2 },
  paceBanner: { backgroundColor: FS.surface, borderRadius: FS.radius.lg, borderWidth: 1, borderColor: FS.border, overflow: 'hidden' },
  paceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16 },
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
