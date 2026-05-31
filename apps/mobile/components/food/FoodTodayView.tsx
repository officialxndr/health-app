import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import { format, addDays, subDays } from 'date-fns';
import { FS } from '../../constants/theme';
import { CalorieRing } from '../ui/CalorieRing';
import { MacroBar } from '../ui/MacroBar';
import { FSIcon } from '../ui/FSIcon';
import { useFoodStore } from '../../stores/foodStore';
import { useAuthStore } from '../../stores/authStore';
import { FoodSearchModal } from './FoodSearchModal';
import type { FoodLog, MealType } from '../../types';

const MEALS: { key: MealType; label: string; icon: string }[] = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: 'Coffee' },
  { key: 'LUNCH',     label: 'Lunch',     icon: 'Sun'    },
  { key: 'DINNER',    label: 'Dinner',    icon: 'Moon'   },
  { key: 'SNACK',     label: 'Snacks',    icon: 'Cookie' },
];

function dayLabel(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return format(d, 'EEEE');
}

function logCalories(log: FoodLog): number {
  if (log.foodItem) return log.foodItem.calories * log.servingQty;
  if (log.recipe?.nutrition) return log.recipe.nutrition.perServingCalories * log.servingQty;
  return 0;
}

function logMacros(log: FoodLog) {
  if (log.foodItem) return {
    protein: log.foodItem.protein * log.servingQty,
    carbs:   log.foodItem.carbs   * log.servingQty,
    fat:     log.foodItem.fat     * log.servingQty,
  };
  if (log.recipe?.nutrition) return {
    protein: log.recipe.nutrition.perServingProtein * log.servingQty,
    carbs:   log.recipe.nutrition.perServingCarbs   * log.servingQty,
    fat:     log.recipe.nutrition.perServingFat     * log.servingQty,
  };
  return { protein: 0, carbs: 0, fat: 0 };
}

// ── Month calendar modal ──────────────────────────────────────────────────────
function MonthCalendar({ selected, onPick, onClose }: { selected: Date; onPick: (d: Date) => void; onClose: () => void }) {
  const [view, setView] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  const first = new Date(view.y, view.m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const shiftMonth = (dir: number) => setView((v) => {
    const m = v.m + dir;
    return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const WK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mc.backdrop} onPress={onClose}>
        <Pressable style={mc.cal} onPress={(e) => e.stopPropagation()}>
          <View style={mc.header}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={mc.navBtn} activeOpacity={0.7}>
              <FSIcon name="ChevronLeft" size={20} color={FS.text} />
            </TouchableOpacity>
            <Text style={mc.monthLabel}>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={mc.navBtn} activeOpacity={0.7}>
              <FSIcon name="ChevronRight" size={20} color={FS.text} />
            </TouchableOpacity>
          </View>
          <View style={mc.grid}>{WK.map((w, i) => <Text key={i} style={mc.wkLabel}>{w}</Text>)}</View>
          <View style={mc.daysGrid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={mc.cell} />;
              const date = new Date(view.y, view.m, d); date.setHours(0, 0, 0, 0);
              const isSel = date.getTime() === selected.setHours(0, 0, 0, 0);
              const isToday = date.getTime() === today.getTime();
              const future = date > today;
              return (
                <TouchableOpacity key={i} onPress={() => onPick(date)} style={mc.cell} activeOpacity={0.7}>
                  <View style={[mc.dayCircle, isSel && mc.dayCircleActive, isToday && !isSel && mc.dayCircleToday, { opacity: future ? 0.45 : 1 }]}>
                    <Text style={[mc.dayNum, isSel && mc.dayNumActive]}>{d}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={mc.footer}>
            <TouchableOpacity onPress={() => onPick(new Date())} activeOpacity={0.7}>
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

// ── Main view ─────────────────────────────────────────────────────────────────
export function FoodTodayView() {
  const { logs, date, setDate, fetchLogs, deleteLog } = useFoodStore();
  const { user } = useAuthStore();
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({
    BREAKFAST: true, LUNCH: true, DINNER: false, SNACK: false,
  });
  const [showCal, setShowCal] = useState(false);
  const [addModalMeal, setAddModalMeal] = useState<MealType | null>(null);

  const profile = user?.profile;
  const calorieGoal = profile?.calorieGoal ?? 2000;
  const proteinTarget = profile?.proteinTarget ?? 150;
  const carbsTarget = profile?.carbsTarget ?? 200;
  const fatTarget = profile?.fatTarget ?? 65;

  useEffect(() => { fetchLogs(); }, []);

  const totals = logs.reduce(
    (acc, l) => {
      const m = logMacros(l);
      return {
        calories: acc.calories + logCalories(l),
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const remaining = calorieGoal - Math.round(totals.calories);

  const navigateDay = (dir: number) => {
    const next = dir > 0 ? addDays(date, 1) : subDays(date, 1);
    setDate(next);
  };

  return (
    <View style={s.root}>
      {/* Date header */}
      <View style={s.dateHeader}>
        <View style={s.dateRow}>
          <TouchableOpacity onPress={() => navigateDay(-1)} style={s.chevron} activeOpacity={0.7}>
            <FSIcon name="ChevronLeft" size={24} color={FS.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCal(true)} style={s.datePicker} activeOpacity={0.7}>
            <View style={s.datePickerRow}>
              <Text style={s.dayLabel}>{dayLabel(date)}</Text>
              <FSIcon name="Calendar" size={14} color={FS.muted} />
            </View>
            <Text style={s.dateSub}>{format(date, 'MMM d, yyyy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateDay(1)} style={s.chevron} activeOpacity={0.7}>
            <FSIcon name="ChevronRight" size={24} color={FS.muted} />
          </TouchableOpacity>
        </View>

        {/* Ring + macros */}
        <View style={s.ringRow}>
          <CalorieRing eaten={Math.round(totals.calories)} goal={calorieGoal} size={120} strokeWidth={9} />
          <View style={s.macros}>
            <MacroBar label="Protein" value={Math.round(totals.protein)} target={proteinTarget} color={FS.protein} />
            <MacroBar label="Carbs"   value={Math.round(totals.carbs)}   target={carbsTarget}   color={FS.carbs}   />
            <MacroBar label="Fat"     value={Math.round(totals.fat)}     target={fatTarget}     color={FS.fat}     />
          </View>
        </View>
        <View style={s.remaining}>
          <Text style={[s.remainingText, remaining < 0 && { color: FS.danger }]}>
            {remaining < 0 ? `${Math.abs(remaining)} kcal over goal` : `${remaining} kcal remaining`}
          </Text>
        </View>
      </View>

      {/* Meal sections */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {MEALS.map((meal) => {
          const mealLogs = logs.filter((l) => l.meal === meal.key);
          const mealCals = mealLogs.reduce((s, l) => s + logCalories(l), 0);
          const isOpen = expandedMeals[meal.key];
          return (
            <View key={meal.key} style={s.meal}>
              <TouchableOpacity
                onPress={() => setExpandedMeals((o) => ({ ...o, [meal.key]: !o[meal.key] }))}
                style={s.mealHeader}
                activeOpacity={0.7}
              >
                <View style={s.mealLeft}>
                  <FSIcon name={meal.icon as any} size={16} color={FS.muted} />
                  <Text style={s.mealName}>{meal.label}</Text>
                </View>
                <View style={s.mealRight}>
                  {mealLogs.length > 0 && <Text style={s.mealCal}>{Math.round(mealCals)} kcal</Text>}
                  <View style={{ transform: [{ rotate: isOpen ? '0deg' : '-90deg' }] }}>
                    <FSIcon name="ChevronDown" size={14} color={FS.muted} />
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); setAddModalMeal(meal.key); }}
                    style={s.addBtn}
                    activeOpacity={0.7}
                  >
                    <FSIcon name="Plus" size={16} color={FS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {isOpen && mealLogs.map((log, i) => {
                const name = log.foodItem?.name ?? log.recipe?.name ?? '—';
                const servingLabel = log.foodItem
                  ? `${log.servingQty} × ${log.foodItem.servingSize}${log.foodItem.servingUnit}`
                  : `${log.servingQty} serving${log.servingQty !== 1 ? 's' : ''}`;
                return (
                  <TouchableOpacity
                    key={log.id}
                    onLongPress={() => deleteLog(log.id)}
                    style={[s.item, i === 0 && s.itemFirst]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{name}</Text>
                      <Text style={s.itemServ}>{servingLabel}</Text>
                    </View>
                    <Text style={s.itemCal}>{Math.round(logCalories(log))} kcal</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Calendar picker */}
      {showCal && (
        <MonthCalendar
          selected={date}
          onPick={(d) => { setDate(d); setShowCal(false); }}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* Food search modal */}
      {addModalMeal && (
        <FoodSearchModal
          meal={addModalMeal}
          onClose={() => setAddModalMeal(null)}
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
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: FS.border },
  closeBtn: { backgroundColor: FS.surfaceHigh, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
});
