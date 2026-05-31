import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable,
} from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { format, subDays } from 'date-fns';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';
import { useHealthStore } from '../../stores/healthStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatWeight, toDisplay } from '../../lib/units';

type Period = '7 Day' | '30 Day' | '90 Day';
const PERIODS: Period[] = ['7 Day', '30 Day', '90 Day'];

// ── SVG weight chart ──────────────────────────────────────────────────────────
const W = 300, H = 140;

function WeightChart({ data, goalKg }: { data: number[]; goalKg?: number | null }) {
  if (data.length < 2) return <View style={{ height: H + 20 }} />;
  const minV = Math.min(...data, goalKg ?? Infinity) - 2;
  const maxV = Math.max(...data, goalKg ?? -Infinity) + 2;
  const range = maxV - minV || 1;
  const xOf = (i: number) => (i / (data.length - 1)) * W;
  const yOf = (v: number) => H - ((v - minV) / range) * H;
  const linePath = data.map((v, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W} ${H} L0 ${H} Z`;
  const goalY = goalKg != null ? yOf(goalKg) : null;

  return (
    <Svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
      {goalY != null && (
        <Line x1={0} y1={goalY} x2={W} y2={goalY} stroke={FS.primary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
      )}
      <Path d={areaPath} fill={FS.primary} opacity={0.08} />
      <Path d={linePath} fill="none" stroke={FS.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Log weight modal ──────────────────────────────────────────────────────────
function LogWeightModal({ onClose, unitSystem }: { onClose: () => void; unitSystem: string }) {
  const { addWeightEntry } = useHealthStore();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const handleSave = () => {
    const val = parseFloat(weight);
    if (!val || val <= 0) return;
    const kg = unitSystem === 'IMPERIAL' ? val / 2.20462 : val;
    const bf = parseFloat(bodyFat) || undefined;
    addWeightEntry(kg, bf);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={m.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={m.title}>Log Weight</Text>
          <View style={m.row}>
            <Text style={m.label}>Weight ({unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'})</Text>
            <TextInput
              style={m.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder={unitSystem === 'IMPERIAL' ? '185.0' : '84.0'}
              placeholderTextColor={FS.muted}
              autoFocus
            />
          </View>
          <View style={m.row}>
            <Text style={m.label}>Body Fat % (optional)</Text>
            <TextInput
              style={m.input}
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="decimal-pad"
              placeholder="18.5"
              placeholderTextColor={FS.muted}
            />
          </View>
          <View style={m.actions}>
            <FSButton variant="neutral" onPress={onClose} style={{ flex: 1 }}>Cancel</FSButton>
            <FSButton onPress={handleSave} style={{ flex: 1 }}>Save</FSButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function HealthWeightView() {
  const [period, setPeriod] = useState<Period>('30 Day');
  const [showLog, setShowLog] = useState(false);

  const { stats, weightEntries, fetchStats, fetchWeightEntries } = useHealthStore();
  const { user } = useAuthStore();
  const { unitSystem } = useSettingsStore();

  const goalKg = user?.profile?.goalWeightKg ?? null;

  useEffect(() => {
    fetchStats();
    const days = period === '7 Day' ? 7 : period === '30 Day' ? 30 : 90;
    const to = new Date().toISOString().slice(0, 10);
    const from = subDays(new Date(), days).toISOString().slice(0, 10);
    fetchWeightEntries(from, to);
  }, [period]);

  const chartData = weightEntries.map((e) => toDisplay(e.weightKg, unitSystem));
  const current = stats?.current;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Current weight hero */}
      <View style={s.card}>
        <View style={s.weightRow}>
          <View>
            <Text style={s.statLabel}>Current Weight</Text>
            <Text style={s.weightBig}>
              {current ? formatWeight(current.weightKg, unitSystem) : '—'}
            </Text>
          </View>
          <View style={s.heroRight}>
            {stats?.weeklyChange != null && (
              <Badge tone={stats.weeklyChange < 0 ? 'success' : 'warning'} icon={stats.weeklyChange < 0 ? 'TrendingDown' : 'TrendingUp'}>
                {stats.weeklyChange > 0 ? '+' : ''}{formatWeight(Math.abs(stats.weeklyChange), unitSystem)}/wk
              </Badge>
            )}
            <TouchableOpacity style={s.logBtn} onPress={() => setShowLog(true)} activeOpacity={0.7}>
              <FSIcon name="Plus" size={16} color="#fff" />
              <Text style={s.logBtnLabel}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Trend chart */}
      <View style={s.card}>
        <View style={s.chartHead}>
          <Text style={s.cardTitle}>Weight Trend</Text>
          <Text style={s.yearLabel}>{format(new Date(), 'yyyy')}</Text>
        </View>
        <WeightChart data={chartData} goalKg={goalKg != null ? toDisplay(goalKg, unitSystem) : null} />
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              style={[s.periodBtn, period === p && s.periodBtnActive]} activeOpacity={0.7}>
              <Text style={[s.periodLabel, period === p && s.periodLabelActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stat grid */}
      <View style={s.statGrid}>
        {[
          { label: 'Lost · 30 days', value: stats?.weeklyChange != null ? formatWeight(Math.abs(stats.weeklyChange) * 4, unitSystem) : '—', color: stats?.weeklyChange != null && stats.weeklyChange < 0 ? FS.success : FS.text },
          { label: 'Goal ETA', value: stats?.goalEta ?? '—', color: FS.text },
          { label: 'Avg intake (7d)', value: stats?.calorieAvg7 != null ? `${Math.round(stats.calorieAvg7)} cal` : '—', color: FS.text },
          { label: 'Body fat', value: current?.bodyFat != null ? `${current.bodyFat}%` : '—', color: FS.text },
        ].map(({ label, value, color }) => (
          <View key={label} style={s.statCard}>
            <Text style={s.statLabel}>{label}</Text>
            <Text style={[s.statVal, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Pace banner */}
      {stats && stats.dailyCalorieDelta != null && (
        <View style={s.paceBanner}>
          <View style={[s.paceHeader, { backgroundColor: stats.onTrack ? FS.success + '1a' : FS.warning + '1a' }]}>
            <FSIcon name={stats.onTrack ? 'CheckCircle2' : 'AlertTriangle'} size={16} color={stats.onTrack ? FS.success : FS.warning} />
            <Text style={[s.paceTitle, { color: stats.onTrack ? FS.success : FS.warning }]}>
              {stats.onTrack ? 'On Pace' : 'Slightly Behind Pace'}
            </Text>
          </View>
          {!stats.onTrack && (
            <View style={s.paceBody}>
              <Text style={s.paceText}>
                Adjust by ~{Math.abs(Math.round(stats.dailyCalorieDelta))} cal/day to reach your goal by {stats.goalEta ?? 'your goal date'}.
              </Text>
            </View>
          )}
        </View>
      )}

      {showLog && (
        <LogWeightModal unitSystem={unitSystem} onClose={() => setShowLog(false)} />
      )}
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
  heroRight: { alignItems: 'flex-end', gap: 8 },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logBtnLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
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
  paceTitle: { fontSize: 14, fontWeight: '600' },
  paceBody: { padding: 12, paddingHorizontal: 16 },
  paceText: { fontSize: 14, color: FS.muted },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: FS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: FS.text },
  row: { gap: 6 },
  label: { fontSize: 13, color: FS.muted },
  input: { backgroundColor: FS.surfaceHigh, borderRadius: 12, padding: 12, paddingHorizontal: 16, fontSize: 16, color: FS.text, borderWidth: 1, borderColor: FS.border },
  actions: { flexDirection: 'row', gap: 10 },
});
