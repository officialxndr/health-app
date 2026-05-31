import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { Badge } from '../ui/Badge';
import { FSButton } from '../ui/FSButton';
import { FSIcon } from '../ui/FSIcon';

const RECIPES = [
  { name: 'Chicken Stir Fry',    cal: 520, p: 42, c: 38, f: 14, time: '25 min', servings: 2 },
  { name: 'Overnight Oats',      cal: 380, p: 18, c: 55, f: 9,  time: '5 min',  servings: 1 },
  { name: 'Tuna Salad Wrap',     cal: 440, p: 38, c: 32, f: 16, time: '10 min', servings: 1 },
  { name: 'Protein Pancakes',    cal: 320, p: 28, c: 30, f: 8,  time: '15 min', servings: 1 },
  { name: 'Greek Chicken Bowl',  cal: 580, p: 45, c: 52, f: 14, time: '20 min', servings: 2 },
  { name: 'Egg White Omelette',  cal: 220, p: 26, c: 4,  f: 10, time: '10 min', servings: 1 },
];

export function FoodRecipesView({ openSheet }: { openSheet: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = RECIPES.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <FSIcon name="Search" size={16} color={FS.muted} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes…"
            placeholderTextColor={FS.muted}
          />
        </View>
        <FSButton onPress={openSheet} style={s.newBtn}>+ New</FSButton>
      </View>

      {filtered.map((r, i) => (
        <View key={i} style={s.card}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{r.name}</Text>
              <View style={s.meta}>
                <View style={s.metaItem}>
                  <FSIcon name="Clock" size={12} color={FS.muted} />
                  <Text style={s.metaText}>{r.time}</Text>
                </View>
                <View style={s.metaItem}>
                  <FSIcon name="Users" size={12} color={FS.muted} />
                  <Text style={s.metaText}>{r.servings} serving{r.servings > 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>
            <Badge tone="primary">{r.cal} kcal</Badge>
          </View>
          <View style={s.macroRow}>
            {[['P', r.p + 'g', FS.protein], ['C', r.c + 'g', FS.carbs], ['F', r.f + 'g', FS.fat]].map(([l, v, c]) => (
              <View key={l as string} style={s.macroChip}>
                <Text style={[s.macroLetter, { color: c as string }]}>{l as string}</Text>
                <Text style={s.macroVal}>{v as string}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.logBtn} activeOpacity={0.7}>
            <Text style={s.logBtnText}>Log Serving</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FS.surface, borderRadius: 12, padding: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: FS.border },
  searchInput: { flex: 1, fontSize: 14, color: FS.text },
  newBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  card: { backgroundColor: FS.surface, borderRadius: 16, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600', color: FS.text },
  meta: { flexDirection: 'row', gap: 12, marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: FS.muted },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroChip: { flex: 1, backgroundColor: FS.surfaceHigh, borderRadius: 8, padding: 8, alignItems: 'center' },
  macroLetter: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  macroVal: { fontSize: 13, fontWeight: '700', color: FS.text },
  logBtn: { borderWidth: 1, borderColor: FS.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  logBtnText: { fontSize: 13, fontWeight: '600', color: FS.primary },
});
