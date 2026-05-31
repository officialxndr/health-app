import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSButton } from '../ui/FSButton';

export function HealthBodyView() {
  const weight = 182.4, fatPct = 18.2;
  const fatMass  = +(weight * fatPct / 100).toFixed(1);
  const leanMass = +(weight - fatMass).toFixed(1);
  const bmi  = +(weight / (69 * 69) * 703).toFixed(1);
  const ffmi = +(leanMass / 2.205 / Math.pow(1.75, 2)).toFixed(1);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* body fat card */}
      <View style={s.card}>
        <View style={s.bfRow}>
          <View>
            <Text style={s.label}>Body Fat</Text>
            <Text style={s.bfVal}>{fatPct}<Text style={s.bfUnit}>%</Text></Text>
          </View>
          <Badge tone="success">Athletic range</Badge>
        </View>
        <View style={s.bfBar}>
          <View style={[s.bfFill, { width: `${fatPct}%` as any }]} />
        </View>
        <View style={s.bfScale}>
          {['Essential 4%', 'Athletic 14%', 'Fitness 22%', 'Obese 32%+'].map((l) => (
            <Text key={l} style={s.scaleLabel}>{l}</Text>
          ))}
        </View>
      </View>

      {/* composition grid */}
      <View style={s.grid}>
        {[
          ['Lean Mass', leanMass + ' lb', FS.success],
          ['Fat Mass',  fatMass  + ' lb', FS.muted],
          ['BMI',       bmi.toString(),   FS.text],
          ['FFMI',      ffmi.toString(),  FS.primary],
        ].map(([l, v, c]) => (
          <View key={l as string} style={s.gridCard}>
            <Text style={s.gridLabel}>{l as string}</Text>
            <Text style={[s.gridVal, { color: c as string }]}>{v as string}</Text>
          </View>
        ))}
      </View>

      {/* composition bar */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Composition</Text>
        <View style={s.compBar}>
          <View style={[s.compSeg, { flex: leanMass, backgroundColor: FS.primary }]} />
          <View style={[s.compSeg, { flex: fatMass,  backgroundColor: FS.warning + 'cc' }]} />
        </View>
        <View style={s.compLegend}>
          {[['Lean', leanMass + ' lb', FS.primary], ['Fat', fatMass + ' lb', FS.warning]].map(([l, v, c]) => (
            <View key={l as string} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: c as string }]} />
              <Text style={s.legendText}>{l as string} <Text style={s.legendBold}>{v as string}</Text></Text>
            </View>
          ))}
        </View>
      </View>

      <FSButton variant="neutral" full style={{ borderRadius: 14 }}>Update Body Fat %</FSButton>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 16 },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  label: { fontSize: 12, color: FS.muted, marginBottom: 4 },
  bfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  bfVal: { fontSize: 36, fontWeight: '700', color: FS.text, letterSpacing: -0.5 },
  bfUnit: { fontSize: 18, color: FS.muted, fontWeight: '400' },
  bfBar: { height: 12, borderRadius: 99, overflow: 'hidden', backgroundColor: FS.surfaceHigh, marginBottom: 8 },
  bfFill: { height: '100%', borderRadius: 99, backgroundColor: FS.success },
  bfScale: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabel: { fontSize: 10, color: FS.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: { width: '47.5%', backgroundColor: FS.surface, borderRadius: 14, padding: 14 },
  gridLabel: { fontSize: 11, color: FS.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 4 },
  gridVal: { fontSize: 22, fontWeight: '700' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: FS.text, marginBottom: 12 },
  compBar: { height: 20, borderRadius: 99, overflow: 'hidden', flexDirection: 'row', gap: 2, marginBottom: 10 },
  compSeg: { height: '100%' },
  compLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 12, color: FS.muted },
  legendBold: { fontWeight: '700', color: FS.text },
});
