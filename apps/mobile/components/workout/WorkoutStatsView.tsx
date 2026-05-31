import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';

const WEEKLY_VOLUME = [41200, 38600, 44100, 39800, 47200, 42500, 45900, 48200];
const WEEK_LABELS   = ['Apr 7','Apr 14','Apr 21','Apr 28','May 5','May 12','May 19','May 26'];

const fmt = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString();

export function WorkoutStatsView() {
  const maxVol = Math.max(...WEEKLY_VOLUME) * 1.1;
  const W = 320, H = 80;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* stat cards */}
      <View style={s.grid}>
        {[
          ['Workouts / mo', '14',     'Dumbbell'],
          ['Avg duration',  '48 min', 'Timer'],
          ['Streak',        '5 days', 'Flame'],
          ['Best week',     '48.2k lb', 'Trophy'],
        ].map(([l, v, ic]) => (
          <View key={l as string} style={s.statCard}>
            <View style={s.statTop}>
              <FSIcon name={ic as string} size={14} color={FS.primary} />
              <Text style={s.statLabel}>{l as string}</Text>
            </View>
            <Text style={s.statVal}>{v as string}</Text>
          </View>
        ))}
      </View>

      {/* volume chart */}
      <View style={s.card}>
        <View style={s.chartHead}>
          <Text style={s.cardTitle}>Weekly Volume</Text>
          <Text style={[s.trend, { color: FS.success }]}>↑ 6% vs last month</Text>
        </View>
        <View style={s.chartWrap}>
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {WEEKLY_VOLUME.map((v, i) => {
              const barW = W / WEEKLY_VOLUME.length - 4;
              const h    = (v / maxVol) * H;
              const x    = i * (W / WEEKLY_VOLUME.length) + 2;
              const isLast = i === WEEKLY_VOLUME.length - 1;
              return (
                <Rect key={i} x={x} y={H - h} width={barW} height={h}
                  rx={3}
                  fill={isLast ? FS.primary : FS.primary + '66'}
                />
              );
            })}
          </Svg>
          <View style={s.xLabels}>
            {WEEKLY_VOLUME.map((v, i) => (
              <Text key={i} style={s.xLabel}>{fmt(v)}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* recent PRs */}
      <View style={s.card}>
        <Text style={[s.cardTitle, { marginBottom: 12 }]}>Recent PRs</Text>
        {[
          ['Bench Press', '185 lb × 5', 'May 30'],
          ['Squat',       '225 lb × 3', 'May 28'],
          ['OHP',         '115 lb × 5', 'May 26'],
          ['Pull-up',     'BW+45 × 6',  'May 18'],
        ].map(([ex, val, date], i) => (
          <View key={i as number} style={[s.prRow, i > 0 && s.prBorder]}>
            <View>
              <Text style={s.prName}>{ex as string}</Text>
              <Text style={s.prDate}>{date as string}</Text>
            </View>
            <View style={s.prRight}>
              <Text style={s.prVal}>{val as string}</Text>
              <Badge tone="success" icon="Trophy" />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', backgroundColor: FS.surface, borderRadius: 14, padding: 14, gap: 6 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 11, color: FS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal: { fontSize: 22, fontWeight: '700', color: FS.text },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  trend: { fontSize: 12, fontWeight: '600' },
  chartWrap: { gap: 8 },
  xLabels: { flexDirection: 'row' },
  xLabel: { flex: 1, fontSize: 9, color: FS.muted, textAlign: 'center' },
  prRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  prBorder: { borderTopWidth: 1, borderTopColor: FS.border },
  prName: { fontSize: 14, fontWeight: '500', color: FS.text },
  prDate: { fontSize: 12, color: FS.muted, marginTop: 2 },
  prRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prVal: { fontSize: 14, fontWeight: '600', color: FS.text },
});
