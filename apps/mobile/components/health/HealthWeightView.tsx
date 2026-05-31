import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSIcon } from '../ui/FSIcon';

const DATA = [188.5, 187.9, 188.1, 187.2, 186.8, 186.0, 185.4, 185.7, 184.9, 184.2, 183.8, 183.1, 182.9, 182.4];
const GOAL_W = 170, MAX_W = 190, MIN_W = 168;
const W = 300, H = 140;

function Chart() {
  const xOf = (i: number) => (i / (DATA.length - 1)) * W;
  const yOf = (v: number) => H - ((v - MIN_W) / (MAX_W - MIN_W)) * H;
  const goalY = yOf(GOAL_W);

  const linePath = DATA.map((v, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${W} ${H} L0 ${H} Z`;

  return (
    <Svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
      <Line x1={0} y1={goalY} x2={W} y2={goalY} stroke={FS.primary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
      <SvgText x={4} y={goalY - 5} fill={FS.primary} fontSize={9} fontWeight="600">GOAL 170</SvgText>
      <Path d={areaPath} fill={FS.primary} opacity={0.08} />
      <Path d={linePath} fill="none" stroke={FS.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {DATA.map((v, i) => (
        <Circle key={i} cx={xOf(i)} cy={yOf(v)} r={2.5} fill={FS.primary} />
      ))}
    </Svg>
  );
}

export function HealthWeightView() {
  const [period, setPeriod] = useState('30 Day');
  const periods = ['7 Day', '30 Day', '90 Day', '1 Year'];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* current weight hero */}
      <View style={s.card}>
        <View style={s.weightRow}>
          <View>
            <Text style={s.statLabel}>Current Weight</Text>
            <Text style={s.weightBig}>182.4 <Text style={s.weightUnit}>lb</Text></Text>
          </View>
          <Badge tone="success" icon="TrendingDown">−1.3 lb/wk</Badge>
        </View>
      </View>

      {/* trend chart */}
      <View style={s.card}>
        <View style={s.chartHead}>
          <Text style={s.cardTitle}>Weight Trend</Text>
          <Text style={s.yearLabel}>2026</Text>
        </View>
        <Chart />
        <View style={s.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              style={[s.periodBtn, period === p && s.periodBtnActive]} activeOpacity={0.7}>
              <Text style={[s.periodLabel, period === p && s.periodLabelActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* stat grid */}
      <View style={s.statGrid}>
        {[
          ['Lost · 30 days', '−4.2 lb',   FS.success],
          ['Goal ETA',       'Aug 14',     FS.text],
          ['Avg intake (7d)','1,840 cal',  FS.text],
          ['Body fat',       '18.2%',      FS.text],
        ].map(([l, v, c], i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statLabel}>{l as string}</Text>
            <Text style={[s.statVal, { color: c as string }]}>{v as string}</Text>
          </View>
        ))}
      </View>

      {/* pace banner */}
      <View style={s.paceBanner}>
        <View style={[s.paceHeader, { backgroundColor: FS.warning + '1a', borderTopLeftRadius: 14, borderTopRightRadius: 14 }]}>
          <FSIcon name="AlertTriangle" size={16} color={FS.warning} />
          <Text style={s.paceTitle}>Slightly Behind Pace</Text>
        </View>
        <View style={s.paceBody}>
          <Text style={s.paceText}>You're 0.4 lb/week behind. To stay on track for Aug 14:</Text>
          <View style={s.suggestions}>
            <View style={s.suggRow}>
              <FSIcon name="Footprints" size={15} color={FS.primary} />
              <Text style={s.suggText}>Walk briskly ~25 min</Text>
            </View>
            <View style={s.suggRow}>
              <FSIcon name="UtensilsCrossed" size={15} color={FS.primary} />
              <Text style={s.suggText}>Or trim ~120 cal from intake</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 16 },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  weightRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: FS.muted, marginBottom: 4 },
  weightBig: { fontSize: 30, fontWeight: '700', color: FS.text, letterSpacing: -0.3 },
  weightUnit: { fontSize: 16, color: FS.muted, fontWeight: '500' },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  yearLabel: { fontSize: 12, color: FS.muted },
  periodRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  periodBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', backgroundColor: FS.surfaceHigh },
  periodBtnActive: { backgroundColor: FS.primary },
  periodLabel: { fontSize: 12, color: FS.muted },
  periodLabelActive: { color: '#fff' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47.5%', backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  statVal: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  paceBanner: { backgroundColor: FS.surface, borderRadius: 16, borderWidth: 1, borderColor: FS.border, overflow: 'hidden' },
  paceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16 },
  paceTitle: { fontSize: 14, fontWeight: '600', color: FS.warning },
  paceBody: { padding: 12, paddingHorizontal: 16 },
  paceText: { fontSize: 14, color: FS.text, marginBottom: 8 },
  suggestions: { gap: 6 },
  suggRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggText: { fontSize: 13, color: FS.muted },
});
