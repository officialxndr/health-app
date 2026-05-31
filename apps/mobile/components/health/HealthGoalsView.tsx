import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';

const RATES = [0.5, 1.0, 1.5, 2.0];

export function HealthGoalsView() {
  const [goalW, setGoalW] = useState(170);
  const [rate, setRate]   = useState(1.0);
  const currentW = 182.4;
  const lbsToLose = Math.max(currentW - goalW, 0);
  const weeksNeeded = lbsToLose / rate;
  const eta = new Date();
  eta.setDate(eta.getDate() + Math.round(weeksNeeded * 7));
  const etaStr = eta.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* current weight */}
      <View style={s.card}>
        <Text style={s.statLabel}>Current Weight</Text>
        <Text style={s.bigVal}>{currentW} <Text style={s.unit}>lb</Text></Text>
      </View>

      {/* goal weight */}
      <View style={s.card}>
        <View style={s.goalRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.statLabelUp}>GOAL WEIGHT</Text>
            <Text style={s.bigVal}>{goalW} <Text style={s.unit}>lb</Text></Text>
            <Text style={s.toLose}>{lbsToLose.toFixed(1)} lb to lose</Text>
          </View>
          <View style={s.stepBtns}>
            {[1, -1].map((d) => (
              <TouchableOpacity key={d} onPress={() => setGoalW((g) => Math.min(Math.max(g + d, 90), currentW - 1))}
                style={s.stepBtn} activeOpacity={0.7}>
                <FSIcon name={d === 1 ? 'Plus' : 'Minus'} size={18} color={FS.text} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* rate selector */}
      <View style={s.card}>
        <Text style={s.statLabelUp}>WEEKLY RATE OF LOSS</Text>
        <View style={s.rateGrid}>
          {RATES.map((r) => (
            <TouchableOpacity key={r} onPress={() => setRate(r)}
              style={[s.ratePill, rate === r && s.ratePillActive]} activeOpacity={0.7}>
              <Text style={[s.ratePillLabel, rate === r && s.ratePillLabelActive]}>{r} lb</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.rateNote}>
          {rate <= 0.5 ? 'Conservative — very sustainable'
           : rate <= 1.0 ? 'Moderate — recommended'
           : rate <= 1.5 ? 'Aggressive — challenging'
           : 'Very aggressive — difficult to sustain'}
        </Text>
      </View>

      {/* ETA */}
      <View style={[s.card, s.etaCard]}>
        <View>
          <Text style={s.etaLabel}>ESTIMATED REACH</Text>
          <Text style={s.etaVal}>{etaStr}</Text>
          <Text style={s.etaSub}>{Math.round(weeksNeeded)} weeks · ~{Math.round(rate * 500)} cal/day deficit</Text>
        </View>
        <FSIcon name="Target" size={36} color={FS.primary} strokeWidth={1.5} />
      </View>

      <FSButton full style={s.saveBtn}>Save Goal</FSButton>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 14 },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16 },
  statLabel: { fontSize: 12, color: FS.muted, marginBottom: 4 },
  statLabelUp: { fontSize: 12, color: FS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  bigVal: { fontSize: 28, fontWeight: '700', color: FS.text },
  unit: { fontSize: 14, color: FS.muted, fontWeight: '400' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toLose: { fontSize: 12, color: FS.muted, marginTop: 4 },
  stepBtns: { gap: 5 },
  stepBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  rateGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  ratePill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: FS.surfaceHigh, alignItems: 'center' },
  ratePillActive: { backgroundColor: FS.primary },
  ratePillLabel: { fontSize: 13, fontWeight: '600', color: FS.muted },
  ratePillLabelActive: { color: '#fff' },
  rateNote: { fontSize: 12, color: FS.muted, textAlign: 'center' },
  etaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: FS.primary + '18', borderWidth: 1, borderColor: FS.primary + '33' },
  etaLabel: { fontSize: 12, color: FS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  etaVal: { fontSize: 22, fontWeight: '700', color: FS.text },
  etaSub: { fontSize: 12, color: FS.muted, marginTop: 3 },
  saveBtn: { borderRadius: 14, paddingVertical: 14 },
});
