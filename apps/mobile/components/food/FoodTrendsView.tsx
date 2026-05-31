import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { FS } from '../../constants/theme';
import { MacroBar } from '../ui/MacroBar';

const DATA_7D  = [1820, 2010, 1640, 1980, 2100, 1604, 0];
const DATA_30D = Array.from({ length: 30 }, (_, i) => i % 7 === 0 ? 0 : 1600 + Math.round(Math.random() * 500));
const DATA_90D = Array.from({ length: 90 }, (_, i) => i % 14 === 0 ? 0 : 1650 + Math.round(Math.random() * 450));
const TREND_DATA: Record<string, number[]> = { '7d': DATA_7D, '30d': DATA_30D, '90d': DATA_90D };
const LABELS_7D = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const GOAL = 2000;

export function FoodTrendsView() {
  const [period, setPeriod] = useState('7d');
  const current = TREND_DATA[period];
  const filled  = current.filter((v) => v > 0);
  const avg     = Math.round(filled.reduce((a, b) => a + b, 0) / (filled.length || 1));
  const maxV    = Math.max(...current, GOAL + 200);
  const status  = avg > GOAL * 1.05 ? { label: 'Slightly over', color: FS.danger }
                : avg < GOAL * 0.85 ? { label: 'Under target',  color: FS.warning }
                : { label: 'On track', color: FS.success };

  const BAR_W = 320;
  const BAR_H = 80;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* period toggle */}
      <View style={s.toggle}>
        {[['7d', '7 Day'], ['30d', '30 Day'], ['90d', '90 Day']].map(([k, l]) => (
          <TouchableOpacity key={k} onPress={() => setPeriod(k)}
            style={[s.toggleOpt, period === k && s.toggleOptActive]} activeOpacity={0.7}>
            <Text style={[s.toggleLabel, period === k && s.toggleLabelActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* stat chips */}
      <View style={s.chips}>
        {[['Avg', avg.toLocaleString() + ' cal'], ['Goal', GOAL.toLocaleString() + ' cal'], ['Logged', `${filled.length} / ${current.length}d`]].map(([l, v]) => (
          <View key={l as string} style={s.chip}>
            <Text style={s.chipLabel}>{l as string}</Text>
            <Text style={s.chipVal}>{v as string}</Text>
          </View>
        ))}
      </View>

      {/* calorie chart */}
      <View style={s.card}>
        <View style={s.chartHeader}>
          <Text style={s.cardTitle}>Calorie Intake</Text>
          <Text style={[s.status, { color: status.color }]}>{status.label}</Text>
        </View>
        <View style={s.chartContainer}>
          <Svg width="100%" height={BAR_H} viewBox={`0 0 ${BAR_W} ${BAR_H}`}>
            {/* goal line */}
            <Line
              x1={0} y1={BAR_H - (GOAL / maxV) * BAR_H}
              x2={BAR_W} y2={BAR_H - (GOAL / maxV) * BAR_H}
              stroke={FS.primary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.4}
            />
            {current.map((v, i) => {
              const barW = BAR_W / current.length - 2;
              const h = v > 0 ? Math.max((v / maxV) * BAR_H, 4) : 0;
              const x = i * (BAR_W / current.length) + 1;
              const y = BAR_H - h;
              return (
                <Rect
                  key={i}
                  x={x} y={y} width={barW} height={h}
                  rx={2}
                  fill={v === 0 ? FS.surfaceHigh : v > GOAL * 1.1 ? FS.danger : FS.primary}
                  opacity={v === 0 ? 0.4 : 0.85}
                />
              );
            })}
          </Svg>
          {period === '7d' && (
            <View style={s.xLabels}>
              {LABELS_7D.map((l, i) => (
                <Text key={i} style={s.xLabel}>{l}</Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* macro averages */}
      <View style={s.card}>
        <Text style={[s.cardTitle, { marginBottom: 14 }]}>Avg Macro Split</Text>
        <View style={{ gap: 10 }}>
          <MacroBar label="Protein" value={112} target={150} color={FS.protein} />
          <MacroBar label="Carbs"   value={125} target={200} color={FS.carbs}   />
          <MacroBar label="Fat"     value={48}  target={65}  color={FS.fat}     />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 16 },
  toggle: { flexDirection: 'row', backgroundColor: FS.surface, padding: 4, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: FS.border },
  toggleOpt: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  toggleOptActive: { backgroundColor: FS.primary },
  toggleLabel: { fontSize: 13, fontWeight: '500', color: FS.muted },
  toggleLabelActive: { color: '#fff' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, backgroundColor: FS.surface, borderRadius: 14, padding: 12, alignItems: 'center' },
  chipLabel: { fontSize: 11, color: FS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  chipVal: { fontSize: 15, fontWeight: '700', color: FS.text },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  status: { fontSize: 12, fontWeight: '600' },
  chartContainer: { gap: 8 },
  xLabels: { flexDirection: 'row' },
  xLabel: { flex: 1, fontSize: 10, color: FS.muted, textAlign: 'center' },
});
