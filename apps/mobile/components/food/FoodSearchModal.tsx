import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from '../ui/FSIcon';
import { useFoodStore } from '../../stores/foodStore';
import type { FoodItem, MealType } from '../../types';

interface Props {
  meal: MealType;
  onClose: () => void;
}

function ServingPicker({
  item,
  onAdd,
  onBack,
}: {
  item: FoodItem;
  onAdd: (qty: number) => void;
  onBack: () => void;
}) {
  const [qty, setQty] = useState('1');
  const qtyNum = parseFloat(qty) || 1;
  const cals = Math.round(item.calories * qtyNum);

  return (
    <View style={styles.servingPicker}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <FSIcon name="ChevronLeft" size={20} color={FS.text} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.pickerName}>{item.name}</Text>
      {item.brand && <Text style={styles.pickerBrand}>{item.brand}</Text>}

      <View style={styles.macroRow}>
        {[
          { label: 'Cal', value: cals, color: FS.text },
          { label: 'P', value: Math.round(item.protein * qtyNum) + 'g', color: FS.protein },
          { label: 'C', value: Math.round(item.carbs * qtyNum) + 'g', color: FS.carbs },
          { label: 'F', value: Math.round(item.fat * qtyNum) + 'g', color: FS.fat },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.macroChip}>
            <Text style={[styles.macroLabel, { color }]}>{label}</Text>
            <Text style={styles.macroValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.qtyRow}>
        <TouchableOpacity
          onPress={() => setQty(String(Math.max(0.25, qtyNum - 0.25)))}
          style={styles.qtyBtn} activeOpacity={0.7}
        >
          <FSIcon name="Minus" size={18} color={FS.text} />
        </TouchableOpacity>
        <View style={styles.qtyInputWrap}>
          <TextInput
            style={styles.qtyInput}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={styles.qtyUnit}>
            {`serving${qtyNum !== 1 ? 's' : ''} × ${item.servingSize}${item.servingUnit}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setQty(String(qtyNum + 0.25))}
          style={styles.qtyBtn} activeOpacity={0.7}
        >
          <FSIcon name="Plus" size={18} color={FS.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => onAdd(qtyNum)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnLabel}>Add to Log</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FoodSearchModal({ meal, onClose }: Props) {
  const { searchFoods, addLog } = useFoodStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const items = await searchFoods(q);
      setResults(items);
    } catch { setResults([]); } finally { setLoading(false); }
  }, [searchFoods]);

  const handleAdd = (foodItem: FoodItem, servingQty: number) => {
    addLog({ meal, foodItemLocalId: foodItem.id, servingQty });
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Food</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <FSIcon name="X" size={22} color={FS.text} />
          </TouchableOpacity>
        </View>

        {selected ? (
          <ServingPicker
            item={selected}
            onAdd={(qty) => handleAdd(selected, qty)}
            onBack={() => setSelected(null)}
          />
        ) : (
          <>
            {/* Search box */}
            <View style={styles.searchRow}>
              <FSIcon name="Search" size={18} color={FS.muted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={doSearch}
                placeholder="Search food or scan barcode…"
                placeholderTextColor={FS.muted}
                autoFocus
                returnKeyType="search"
              />
              {loading && <ActivityIndicator size="small" color={FS.muted} />}
            </View>

            {/* Results */}
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.length > 1 && !loading ? (
                  <Text style={styles.empty}>No results. Try a different search.</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => setSelected(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    {item.brand && <Text style={styles.resultBrand}>{item.brand}</Text>}
                  </View>
                  <Text style={styles.resultCal}>{Math.round(item.calories)} kcal</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: FS.border },
  title: { fontSize: 18, fontWeight: '700', color: FS.text },
  closeBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: FS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: FS.surface, borderRadius: 12, padding: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: FS.border },
  searchInput: { flex: 1, fontSize: 15, color: FS.text },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FS.border },
  resultName: { fontSize: 14, fontWeight: '500', color: FS.text },
  resultBrand: { fontSize: 12, color: FS.muted, marginTop: 2 },
  resultCal: { fontSize: 14, color: FS.muted, marginLeft: 8 },
  empty: { textAlign: 'center', color: FS.muted, marginTop: 40, fontSize: 14 },
  // Serving picker
  servingPicker: { flex: 1, padding: 20, gap: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backLabel: { fontSize: 14, color: FS.text },
  pickerName: { fontSize: 20, fontWeight: '700', color: FS.text },
  pickerBrand: { fontSize: 14, color: FS.muted, marginTop: -8 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroChip: { flex: 1, backgroundColor: FS.surface, borderRadius: 10, padding: 10, alignItems: 'center' },
  macroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  macroValue: { fontSize: 15, fontWeight: '700', color: FS.text, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: FS.surface, alignItems: 'center', justifyContent: 'center' },
  qtyInputWrap: { flex: 1, alignItems: 'center', gap: 4 },
  qtyInput: { fontSize: 28, fontWeight: '700', color: FS.text, textAlign: 'center', width: '100%' },
  qtyUnit: { fontSize: 12, color: FS.muted },
  addBtn: { backgroundColor: FS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  addBtnLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
