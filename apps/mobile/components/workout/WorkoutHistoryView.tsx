import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { format, subMonths } from 'date-fns';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';
import { useWorkoutStore } from '../../stores/workoutStore';

// ── Volume bar chart (8 weeks) ────────────────────────────────────────────────
const CW = 300, CH = 60;

function VolumeChart({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const maxV = Math.max(...data, 1);
  const barW = 26;
  const gap = (CW - barW * data.length) / Math.max(data.length - 1, 1);

  return (
    <Svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`}>
      {data.map((v, i) => {
        const bh = Math.max((v / maxV) * CH, v > 0 ? 4 : 2);
        return (
          <Rect
            key={i}
            x={i * (barW + gap)}
            y={CH - bh}
            width={barW}
            height={bh}
            rx={4}
            fill={i === data.length - 1 ? FS.primary : FS.primary + '55'}
          />
        );
      })}
    </Svg>
  );
}

export function WorkoutHistoryView() {
  const { sessions, loadSessions, getVolume } = useWorkoutStore();

  useEffect(() => { loadSessions(30); }, []);

  // Build 8-week volume data
  const now = new Date();
  const volumeData = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 86400000);
    const weekVols = getVolume(weekStart.toISOString(), weekEnd.toISOString());
    return weekVols.reduce((s, w) => s + w.volume, 0);
  }).reverse();

  const lastWeek = volumeData[volumeData.length - 2] || 0;
  const thisWeek = volumeData[volumeData.length - 1] || 0;
  const volumeChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  const finished = sessions.filter((s) => s.finishedAt);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Volume chart */}
      <View style={s.chartCard}>
        <View style={s.chartHead}>
          <Text style={s.cardTitle}>Monthly Volume</Text>
          {volumeChange !== 0 && (
            <Text style={[s.trend, { color: volumeChange > 0 ? FS.success : FS.danger }]}>
              {volumeChange > 0 ? '↑' : '↓'} {Math.abs(volumeChange)}% vs last week
            </Text>
          )}
        </View>
        <VolumeChart data={volumeData} />
      </View>

      {/* Session count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{finished.length} sessions</Text>
        <Text style={s.monthText}>{format(now, 'MMMM yyyy')}</Text>
      </View>

      {/* Session cards */}
      {finished.map((session, i) => {
        const prs = session.exercises.flatMap((e) => e.sets.filter((s) => s.isPersonalBest)).length;
        const duration = session.finishedAt
          ? Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
          : null;
        return (
          <View key={session.id} style={s.card}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{session.name}</Text>
                  {prs > 0 && <Badge tone="success" icon="Trophy">{prs} PR</Badge>}
                </View>
                <Text style={s.date}>
                  {new Date(session.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {duration != null && (
                <View style={s.duration}>
                  <FSIcon name="Timer" size={13} color={FS.muted} />
                  <Text style={s.durationText}>{duration} min</Text>
                </View>
              )}
            </View>
            <View style={s.statRow}>
              <View style={s.stat}>
                <Text style={s.statLabel}>SETS</Text>
                <Text style={s.statVal}>{session.exercises.reduce((n, e) => n + e.sets.length, 0)}</Text>
              </View>
              {session.totalVolume != null && (
                <View style={s.stat}>
                  <Text style={s.statLabel}>VOLUME</Text>
                  <Text style={s.statVal}>{Math.round(session.totalVolume).toLocaleString()} lb</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {finished.length === 0 && (
        <Text style={{ color: FS.muted, textAlign: 'center', marginTop: 40, fontSize: 14 }}>
          No workout history yet.
        </Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 12 },
  chartCard: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  trend: { fontSize: 12, fontWeight: '600' },
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
