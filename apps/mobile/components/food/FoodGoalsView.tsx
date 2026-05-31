import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';

function Stepper({
  label, value, field, unit, step, min, max, onChange,
}: {
  label: string; value: number; field: string; unit: string;
  step: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepper}>
      <View style={{ flex: 1 }}>
        <Text style={s.stepperLabel}>{label}</Text>
        <Text style={s.stepperBig}>
          {value}<Text style={s.stepperUnit}> {unit}</Text>
        </Text>
      </View>
      <View style={s.stepperBtns}>
        {[1, -1].map((dir) => (
          <TouchableOpacity key={dir} onPress={() => onChange(Math.min(Math.max(value + dir * step, min), max))}
            style={s.stepBtn} activeOpacity={0.7}>
            <FSIcon name={dir === 1 ? 'Plus' : 'Minus'} size={16} color={FS.text} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function FoodGoalsView() {
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const set = (field: string, v: number) => setGoals((g) => ({ ...g, [field]: v }));

  const macroKcal = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
  const pPct = Math.round((goals.protein * 4 / macroKcal) * 100);
  const cPct = Math.round((goals.carbs * 4 / macroKcal) * 100);
  const fPct = 100 - pPct - cPct;
  const diff = macroKcal - goals.calories;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* macro split preview */}
      <View style={s.splitCard}>
        <Text style={s.splitTitle}>Macro Split</Text>
        <View style={s.bar}>
          <View style={[s.barSeg, { flex: pPct, backgroundColor: FS.protein, borderTopLeftRadius: 99, borderBottomLeftRadius: 99 }]} />
          <View style={[s.barSeg, { flex: cPct, backgroundColor: FS.carbs }]} />
          <View style={[s.barSeg, { flex: fPct, backgroundColor: FS.fat, borderTopRightRadius: 99, borderBottomRightRadius: 99 }]} />
        </View>
        <View style={s.legend}>
          {[['Protein', pPct + '%', FS.protein], ['Carbs', cPct + '%', FS.carbs], ['Fat', fPct + '%', FS.fat]].map(
            ([l, v, c]) => (
              <View key={l as string} style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: c as string }]} />
                <Text style={s.legendText}>{l as string} <Text style={s.legendBold}>{v as string}</Text></Text>
              </View>
            )
          )}
        </View>
      </View>

      <Stepper label="Daily Calories" value={goals.calories} field="calories" unit="kcal" step={50} min={1000} max={5000} onChange={(v) => set('calories', v)} />
      <Stepper label="Protein" value={goals.protein} field="protein" unit="g/day" step={5} min={50} max={300} onChange={(v) => set('protein', v)} />
      <Stepper label="Carbohydrates" value={goals.carbs} field="carbs" unit="g/day" step={5} min={50} max={500} onChange={(v) => set('carbs', v)} />
      <Stepper label="Fat" value={goals.fat} field="fat" unit="g/day" step={2} min={20} max={200} onChange={(v) => set('fat', v)} />

      <Text style={[s.diffText, { color: diff === 0 ? FS.success : FS.warning }]}>
        {macroKcal.toLocaleString()} kcal from macros · {Math.abs(diff)} kcal {diff > 0 ? 'over' : 'under'} goal
      </Text>
      <FSButton full style={s.saveBtn}>Save Goals</FSButton>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 12 },
  splitCard: { backgroundColor: FS.surface, borderRadius: 16, padding: 16, gap: 12 },
  splitTitle: { fontSize: 14, fontWeight: '600', color: FS.text },
  bar: { height: 10, borderRadius: 99, overflow: 'hidden', flexDirection: 'row', gap: 2 },
  barSeg: { height: '100%' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 12, color: FS.muted },
  legendBold: { fontWeight: '700', color: FS.text },
  stepper: { backgroundColor: FS.surface, borderRadius: 16, padding: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperLabel: { fontSize: 11, color: FS.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 3 },
  stepperBig: { fontSize: 22, fontWeight: '700', color: FS.text },
  stepperUnit: { fontSize: 13, color: FS.muted, fontWeight: '400' },
  stepperBtns: { gap: 5 },
  stepBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  diffText: { fontSize: 12, textAlign: 'center' },
  saveBtn: { borderRadius: 14, paddingVertical: 14 },
});
