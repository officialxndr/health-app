import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';

function SecHeader({ label }: { label: string }) {
  return (
    <Text style={styles.secHeader}>{label}</Text>
  );
}

function StepperRow({
  label, note, value, unit, onInc, onDec, first,
}: {
  label: string; note?: string; value: number; unit: string;
  onInc: () => void; onDec: () => void; first?: boolean;
}) {
  return (
    <View style={[styles.row, first && styles.rowFirst]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity onPress={onDec} style={styles.stepBtn} activeOpacity={0.7}>
          <FSIcon name="Minus" size={13} color={FS.text} />
        </TouchableOpacity>
        <Text style={styles.stepVal}>
          {value} <Text style={styles.stepUnit}>{unit}</Text>
        </Text>
        <TouchableOpacity onPress={onInc} style={styles.stepBtn} activeOpacity={0.7}>
          <FSIcon name="Plus" size={13} color={FS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function DashboardGoals() {
  const [nutr, setNutr] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const bump = (field: keyof typeof nutr, d: number, min: number, max: number) =>
    setNutr((n) => ({ ...n, [field]: Math.min(Math.max(n[field] + d, min), max) }));

  const macroKcal = nutr.protein * 4 + nutr.carbs * 4 + nutr.fat * 9;
  const pPct = Math.round((nutr.protein * 4 / macroKcal) * 100);
  const cPct = Math.round((nutr.carbs   * 4 / macroKcal) * 100);
  const fPct = Math.max(100 - pPct - cPct, 0);

  const currentW = 182.4;
  const [goalW, setGoalW] = useState(170);
  const [mode, setMode]   = useState<'rate' | 'date'>('rate');
  const [rate, setRate]   = useState(1.0);

  const lbsToLose = Math.max(currentW - goalW, 0);
  const eta = new Date();
  eta.setDate(eta.getDate() + Math.round((lbsToLose / rate) * 7));
  const etaStr = eta.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const [weeklyTarget, setWeeklyTarget] = useState(4);
  const [focus, setFocus] = useState('cut');
  const FOCUSES = [['cut', 'Cut'], ['maintain', 'Maintain'], ['bulk', 'Bulk'], ['recomp', 'Recomp']];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Nutrition ── */}
      <SecHeader label="Nutrition" />
      <View style={styles.card}>
        {/* macro split bar */}
        <View style={styles.splitBar}>
          <View style={[styles.splitSeg, { flex: pPct, backgroundColor: FS.protein }]} />
          <View style={[styles.splitSeg, { flex: cPct, backgroundColor: FS.carbs }]} />
          <View style={[styles.splitSeg, { flex: fPct, backgroundColor: FS.fat }]} />
        </View>
        <View style={styles.splitLegend}>
          {[['Protein', pPct + '%', FS.protein], ['Carbs', cPct + '%', FS.carbs], ['Fat', fPct + '%', FS.fat]].map(
            ([l, v, c]) => (
              <View key={l as string} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: c as string }]} />
                <Text style={styles.legendLabel}>{l as string} <Text style={styles.legendVal}>{v as string}</Text></Text>
              </View>
            )
          )}
        </View>
        <StepperRow first label="Daily Calories" value={nutr.calories} unit="kcal"
          note={macroKcal !== nutr.calories ? `${macroKcal} kcal from macros` : undefined}
          onInc={() => bump('calories', 50, 1000, 5000)} onDec={() => bump('calories', -50, 1000, 5000)} />
        <StepperRow label="Protein" value={nutr.protein} unit="g"
          note={`${nutr.protein * 4} kcal · ${pPct}%`}
          onInc={() => bump('protein', 5, 30, 400)} onDec={() => bump('protein', -5, 30, 400)} />
        <StepperRow label="Carbohydrates" value={nutr.carbs} unit="g"
          note={`${nutr.carbs * 4} kcal · ${cPct}%`}
          onInc={() => bump('carbs', 5, 30, 600)} onDec={() => bump('carbs', -5, 30, 600)} />
        <StepperRow label="Fat" value={nutr.fat} unit="g"
          note={`${nutr.fat * 9} kcal · ${fPct}%`}
          onInc={() => bump('fat', 2, 10, 200)} onDec={() => bump('fat', -2, 10, 200)} />
      </View>

      {/* ── Weight Goal ── */}
      <SecHeader label="Weight Goal" />
      <View style={styles.card}>
        <View style={styles.weightChips}>
          <View style={styles.chip}>
            <Text style={styles.chipLabelMuted}>CURRENT</Text>
            <Text style={styles.chipVal}>{currentW} <Text style={styles.chipUnit}>lb</Text></Text>
          </View>
          <View style={[styles.chip, styles.chipGoal]}>
            <Text style={styles.chipLabelPrimary}>GOAL</Text>
            <View style={styles.chipGoalRow}>
              <Text style={styles.chipVal}>{goalW} <Text style={styles.chipUnit}>lb</Text></Text>
              <View style={styles.microStep}>
                {[-1, 1].map((d) => (
                  <TouchableOpacity key={d} onPress={() => setGoalW((g) => Math.min(Math.max(g + d, 90), currentW - 1))}
                    style={styles.microBtn} activeOpacity={0.7}>
                    <FSIcon name={d > 0 ? 'Plus' : 'Minus'} size={12} color={FS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.chipSub}>−{lbsToLose.toFixed(1)} lb to lose</Text>
          </View>
        </View>

        {/* rate / date toggle */}
        <View style={styles.toggle}>
          {[['rate', 'By Rate'], ['date', 'By Date']].map(([k, l]) => (
            <TouchableOpacity key={k} onPress={() => setMode(k as 'rate' | 'date')}
              style={[styles.toggleOpt, mode === k && styles.toggleOptActive]} activeOpacity={0.7}>
              <Text style={[styles.toggleLabel, mode === k && styles.toggleLabelActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'rate' && (
          <View style={styles.rateGrid}>
            {[0.5, 1.0, 1.5, 2.0].map((r) => (
              <TouchableOpacity key={r} onPress={() => setRate(r)}
                style={[styles.ratePill, rate === r && styles.ratePillActive]} activeOpacity={0.7}>
                <Text style={[styles.ratePillLabel, rate === r && styles.ratePillLabelActive]}>{r} lb</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ETA result */}
        <View style={styles.etaBox}>
          <View>
            <Text style={styles.etaBoxLabel}>{mode === 'rate' ? 'ESTIMATED REACH' : 'REQUIRED RATE'}</Text>
            <Text style={styles.etaBoxVal}>{etaStr}</Text>
          </View>
          <FSIcon name="Target" size={28} color={FS.primary} strokeWidth={1.5} />
        </View>
      </View>

      {/* ── Training ── */}
      <SecHeader label="Training" />
      <View style={styles.card}>
        <View style={styles.trainingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Weekly Sessions</Text>
            <Text style={styles.rowNote}>{weeklyTarget} workouts per week</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => setWeeklyTarget((v) => Math.max(v - 1, 1))} style={styles.stepBtn} activeOpacity={0.7}>
              <FSIcon name="Minus" size={13} color={FS.text} />
            </TouchableOpacity>
            <Text style={styles.stepVal}>{weeklyTarget}</Text>
            <TouchableOpacity onPress={() => setWeeklyTarget((v) => Math.min(v + 1, 7))} style={styles.stepBtn} activeOpacity={0.7}>
              <FSIcon name="Plus" size={13} color={FS.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.focusGrid, { borderTopWidth: 1, borderTopColor: FS.border, paddingTop: 12 }]}>
          {FOCUSES.map(([k, l]) => (
            <TouchableOpacity key={k} onPress={() => setFocus(k)}
              style={[styles.focusPill, focus === k && styles.focusPillActive]} activeOpacity={0.7}>
              <Text style={[styles.focusPillLabel, focus === k && styles.focusPillLabelActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FSButton full style={styles.saveBtn}>Save All Goals</FSButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { paddingTop: 4, paddingHorizontal: 16, paddingBottom: 90, gap: 0 },
  secHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, color: FS.muted, marginTop: 16, marginBottom: 6, paddingHorizontal: 4 },
  card: { backgroundColor: FS.surface, borderRadius: 16 },
  splitBar: { height: 8, borderRadius: 99, overflow: 'hidden', flexDirection: 'row', gap: 2, margin: 14, marginBottom: 8 },
  splitSeg: { height: '100%' },
  splitLegend: { flexDirection: 'row', gap: 16, marginHorizontal: 14, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 2 },
  legendLabel: { fontSize: 12, color: FS.muted },
  legendVal: { fontWeight: '700', color: FS.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: FS.border },
  rowFirst: { borderTopWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: FS.text },
  rowNote: { fontSize: 11, color: FS.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  stepBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: 15, fontWeight: '700', minWidth: 50, textAlign: 'center', color: FS.text, fontVariant: ['tabular-nums'] as any },
  stepUnit: { fontSize: 11, color: FS.muted, fontWeight: '400' },
  weightChips: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 10 },
  chip: { flex: 1, backgroundColor: FS.surfaceHigh, borderRadius: 12, padding: 10 },
  chipGoal: { backgroundColor: FS.primary + '18', borderWidth: 1, borderColor: FS.primary + '33' },
  chipLabelMuted: { fontSize: 10, color: FS.muted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  chipLabelPrimary: { fontSize: 10, color: FS.primary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  chipVal: { fontSize: 20, fontWeight: '700', color: FS.text },
  chipUnit: { fontSize: 12, color: FS.muted, fontWeight: '400' },
  chipGoalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipSub: { fontSize: 11, color: FS.primary, marginTop: 3 },
  microStep: { flexDirection: 'row', gap: 3 },
  microBtn: { width: 24, height: 24, borderRadius: 6, backgroundColor: FS.primary + '33', alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: FS.surfaceHigh, borderRadius: 10, padding: 3, gap: 2, marginHorizontal: 16, marginBottom: 10 },
  toggleOpt: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  toggleOptActive: { backgroundColor: FS.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3 },
  toggleLabel: { fontSize: 13, fontWeight: '500', color: FS.muted },
  toggleLabelActive: { color: FS.text },
  rateGrid: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 10 },
  ratePill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: FS.surfaceHigh, alignItems: 'center' },
  ratePillActive: { backgroundColor: FS.primary },
  ratePillLabel: { fontSize: 13, fontWeight: '600', color: FS.muted },
  ratePillLabelActive: { color: '#fff' },
  etaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 14, backgroundColor: FS.primary + '15', borderWidth: 1, borderColor: FS.primary + '25', borderRadius: 12, padding: 12 },
  etaBoxLabel: { fontSize: 10, color: FS.primary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  etaBoxVal: { fontSize: 18, fontWeight: '700', color: FS.text },
  trainingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  focusGrid: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 14 },
  focusPill: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: FS.surfaceHigh, alignItems: 'center' },
  focusPillActive: { backgroundColor: FS.primary },
  focusPillLabel: { fontSize: 12, fontWeight: '600', color: FS.muted },
  focusPillLabelActive: { color: '#fff' },
  saveBtn: { marginTop: 16, borderRadius: 14, paddingVertical: 14 },
});
