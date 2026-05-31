import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import { FS } from '../../constants/theme';
import { CalorieRing } from '../ui/CalorieRing';
import { MacroBar } from '../ui/MacroBar';
import { FSIcon } from '../ui/FSIcon';

const FOOD_LOGGED = new Set([-1, -2, -3, -5, -6, -7, -8, -10, -12, -13]);

const MEALS = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: 'Coffee',
    items: [['Oatmeal with berries', '120 g', 210], ['Greek yogurt', '1 × 170g', 145], ['Black coffee', '1 cup', 5]] },
  { key: 'LUNCH', label: 'Lunch', icon: 'Sun',
    items: [['Chicken Cobb salad', '1 serving', 520], ['Whole-grain roll', '1 × 60g', 160]] },
  { key: 'DINNER', label: 'Dinner', icon: 'Moon',
    items: [['Chicken Stir Fry', '1 serving', 520]] },
  { key: 'SNACK', label: 'Snacks', icon: 'Cookie',
    items: [['Protein shake', '1 scoop', 44]] },
] as const;

const GOAL = 2000;

function dayLabel(off: number) {
  if (off === 0) return 'Today';
  if (off === -1) return 'Yesterday';
  if (off === 1) return 'Tomorrow';
  const d = new Date(); d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
function dateSub(off: number) {
  const d = new Date(); d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function WeekStrip({ sel, onSel }: { sel: number; onSel: (o: number) => void }) {
  const WK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days = [-3, -2, -1, 0, 1, 2, 3].map((i) => sel + i);
  return (
    <View style={ws.strip}>
      {days.map((off) => {
        const d = new Date(); d.setDate(d.getDate() + off);
        const isSel = off === sel, isToday = off === 0, future = off > 0;
        const hasLog = FOOD_LOGGED.has(off);
        return (
          <TouchableOpacity key={off} onPress={() => onSel(off)} style={ws.day} activeOpacity={0.7}>
            <Text style={[ws.weekday, isSel && ws.weekdayActive]}>{WK[d.getDay()]}</Text>
            <View style={[ws.circle, isSel && ws.circleActive, isToday && !isSel && ws.circleToday, future && ws.circleFuture]}>
              <Text style={[ws.dateNum, isSel && ws.dateNumActive]}>{d.getDate()}</Text>
            </View>
            <View style={[ws.dot, hasLog && ws.dotVisible]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ws = StyleSheet.create({
  strip: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 12 },
  day: { flex: 1, alignItems: 'center', gap: 5 },
  weekday: { fontSize: 11, fontWeight: '600', color: FS.muted },
  weekdayActive: { color: FS.primary },
  circle: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  circleActive: { backgroundColor: FS.primary },
  circleToday: { borderColor: FS.primary },
  circleFuture: { opacity: 0.5 },
  dateNum: { fontSize: 14, fontWeight: '600', color: FS.text },
  dateNumActive: { color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 999, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: FS.primary },
});

function MonthCalendar({ sel, onPick, onClose }: { sel: number; onPick: (o: number) => void; onClose: () => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selDate = new Date(today); selDate.setDate(today.getDate() + sel);
  const [view, setView] = useState({ y: selDate.getFullYear(), m: selDate.getMonth() });
  const offsetOf = (d: Date) => Math.round((d.getTime() - today.getTime()) / 86400000);
  const first = new Date(view.y, view.m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const WK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const shiftMonth = (dir: number) => setView((v) => {
    const m = v.m + dir;
    return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mc.backdrop} onPress={onClose}>
        <Pressable style={mc.cal} onPress={(e) => e.stopPropagation()}>
          <View style={mc.header}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={mc.navBtn} activeOpacity={0.7}>
              <FSIcon name="ChevronLeft" size={20} color={FS.text} />
            </TouchableOpacity>
            <Text style={mc.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={mc.navBtn} activeOpacity={0.7}>
              <FSIcon name="ChevronRight" size={20} color={FS.text} />
            </TouchableOpacity>
          </View>
          <View style={mc.grid}>
            {WK.map((w, i) => <Text key={i} style={mc.wkLabel}>{w}</Text>)}
          </View>
          <View style={mc.daysGrid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={mc.cell} />;
              const date = new Date(view.y, view.m, d);
              const off = offsetOf(date);
              const isSel = off === sel, isToday = off === 0, future = off > 0;
              const hasLog = FOOD_LOGGED.has(off);
              return (
                <TouchableOpacity key={i} onPress={() => onPick(off)} style={mc.cell} activeOpacity={0.7}>
                  <View style={[mc.dayCircle, isSel && mc.dayCircleActive, isToday && !isSel && mc.dayCircleToday, { opacity: future ? 0.45 : 1 }]}>
                    <Text style={[mc.dayNum, isSel && mc.dayNumActive]}>{d}</Text>
                    {hasLog && !isSel && <View style={mc.dayDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={mc.footer}>
            <TouchableOpacity onPress={() => onPick(0)} activeOpacity={0.7}>
              <Text style={{ color: FS.primary, fontSize: 14, fontWeight: '600' }}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={mc.closeBtn} activeOpacity={0.7}>
              <Text style={{ color: FS.text, fontSize: 14, fontWeight: '500' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mc = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: 96, alignItems: 'center' },
  cal: { width: '90%', maxWidth: 360, backgroundColor: FS.surface, borderRadius: 20, borderWidth: 1, borderColor: FS.border, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '700', color: FS.text },
  grid: { flexDirection: 'row', marginBottom: 4 },
  wkLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: FS.muted, paddingVertical: 4 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  dayCircleActive: { backgroundColor: FS.primary },
  dayCircleToday: { borderColor: FS.primary },
  dayNum: { fontSize: 14, fontWeight: '500', color: FS.text },
  dayNumActive: { color: '#fff', fontWeight: '700' },
  dayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 999, backgroundColor: FS.primary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: FS.border },
  closeBtn: { backgroundColor: FS.surfaceHigh, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
});

export function FoodTodayView({ openSheet }: { openSheet: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ BREAKFAST: true, LUNCH: true, DINNER: false, SNACK: false });
  const [sel, setSel] = useState(0);
  const [showCal, setShowCal] = useState(false);

  const totals = MEALS.reduce((a, m) => a + m.items.reduce((s, it) => s + it[2], 0), 0);
  const remaining = GOAL - totals;

  return (
    <View style={s.root}>
      {/* date + ring header */}
      <View style={s.dateHeader}>
        <View style={s.dateRow}>
          <TouchableOpacity onPress={() => setSel((v) => v - 1)} style={s.chevron} activeOpacity={0.7}>
            <FSIcon name="ChevronLeft" size={24} color={FS.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCal(true)} style={s.datePicker} activeOpacity={0.7}>
            <View style={s.datePickerRow}>
              <Text style={s.dayLabel}>{dayLabel(sel)}</Text>
              <FSIcon name="Calendar" size={14} color={FS.muted} />
            </View>
            <Text style={s.dateSub}>{dateSub(sel)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSel((v) => v + 1)} style={s.chevron} activeOpacity={0.7}>
            <FSIcon name="ChevronRight" size={24} color={FS.muted} />
          </TouchableOpacity>
        </View>
        <WeekStrip sel={sel} onSel={setSel} />
        <View style={s.ringRow}>
          <CalorieRing eaten={totals} goal={GOAL} size={120} strokeWidth={9} />
          <View style={s.macros}>
            <MacroBar label="Protein" value={112} target={150} color={FS.protein} />
            <MacroBar label="Carbs"   value={125} target={200} color={FS.carbs}   />
            <MacroBar label="Fat"     value={48}  target={65}  color={FS.fat}     />
          </View>
        </View>
        <View style={s.remaining}>
          <Text style={[s.remainingText, remaining < 0 && { color: FS.danger }]}>
            {remaining < 0
              ? `${Math.abs(remaining)} kcal over goal`
              : `${remaining} kcal remaining`}
          </Text>
        </View>
      </View>

      {/* meal sections */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {MEALS.map((m) => {
          const cals = m.items.reduce((sum, it) => sum + it[2], 0);
          const isOpen = open[m.key];
          return (
            <View key={m.key} style={s.meal}>
              <TouchableOpacity
                onPress={() => setOpen((o) => ({ ...o, [m.key]: !o[m.key] }))}
                style={s.mealHeader}
                activeOpacity={0.7}
              >
                <View style={s.mealLeft}>
                  <FSIcon name={m.icon} size={16} color={FS.muted} />
                  <Text style={s.mealName}>{m.label}</Text>
                </View>
                <View style={s.mealRight}>
                  <Text style={s.mealCal}>{cals} kcal</Text>
                  <View style={{ transform: [{ rotate: isOpen ? '0deg' : '-90deg' }] }}>
                    <FSIcon name="ChevronDown" size={14} color={FS.muted} />
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); openSheet(); }}
                    style={s.addBtn}
                    activeOpacity={0.7}
                  >
                    <FSIcon name="Plus" size={16} color={FS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {isOpen && m.items.map((it, i) => (
                <View key={i} style={[s.item, i === 0 && s.itemFirst]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{it[0]}</Text>
                    <Text style={s.itemServ}>{it[1]}</Text>
                  </View>
                  <Text style={s.itemCal}>{it[2]} kcal</Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {showCal && (
        <MonthCalendar
          sel={sel}
          onPick={(off) => { setSel(off); setShowCal(false); }}
          onClose={() => setShowCal(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  dateHeader: { backgroundColor: FS.surface, borderBottomWidth: 1, borderBottomColor: FS.border },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  chevron: { padding: 4 },
  datePicker: { alignItems: 'center', gap: 2 },
  datePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayLabel: { fontWeight: '600', color: FS.text, fontSize: 15 },
  dateSub: { fontSize: 12, color: FS.muted },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 16 },
  macros: { flex: 1, gap: 10 },
  remaining: { alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: FS.border },
  remainingText: { fontSize: 12, color: FS.muted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 90, gap: 12 },
  meal: { backgroundColor: FS.surface, borderRadius: 16 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  mealLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealName: { fontWeight: '500', fontSize: 15, color: FS.text },
  mealRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealCal: { fontSize: 14, color: FS.muted },
  addBtn: { width: 28, height: 28, borderRadius: 999, backgroundColor: FS.primary + '33', alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: FS.border },
  itemFirst: { borderTopWidth: 1, borderTopColor: FS.border },
  itemName: { fontSize: 14, fontWeight: '500', color: FS.text },
  itemServ: { fontSize: 12, color: FS.muted },
  itemCal: { fontSize: 14, color: FS.text, flexShrink: 0 },
});
