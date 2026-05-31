import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from '../ui/FSIcon';
import { useWorkoutStore } from '../../stores/workoutStore';
import type { Exercise } from '../../types';

export function WorkoutExercisesView() {
  const { searchExercises, getMuscleGroups } = useWorkoutStore();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);

  useEffect(() => {
    const groups = getMuscleGroups();
    setMuscleGroups(groups);
    setExercises(searchExercises('', undefined, undefined));
  }, []);

  const doSearch = useCallback((q: string, muscle: string | null) => {
    setExercises(searchExercises(q, muscle ?? undefined, undefined));
  }, [searchExercises]);

  return (
    <View style={s.root}>
      <View style={s.searchRow}>
        <FSIcon name="Search" size={16} color={FS.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={(q) => { setQuery(q); doSearch(q, selectedMuscle); }}
          placeholder="Search exercises…"
          placeholderTextColor={FS.muted}
        />
      </View>

      {muscleGroups.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
          <TouchableOpacity onPress={() => { setSelectedMuscle(null); doSearch(query, null); }}
            style={[s.chip, !selectedMuscle && s.chipActive]} activeOpacity={0.7}>
            <Text style={[s.chipLabel, !selectedMuscle && s.chipLabelActive]}>All</Text>
          </TouchableOpacity>
          {muscleGroups.map((mg) => (
            <TouchableOpacity key={mg} onPress={() => { setSelectedMuscle(mg); doSearch(query, mg); }}
              style={[s.chip, selectedMuscle === mg && s.chipActive]} activeOpacity={0.7}>
              <Text style={[s.chipLabel, selectedMuscle === mg && s.chipLabelActive]}>{mg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 && (
          <View style={s.empty}>
            <FSIcon name="Dumbbell" size={40} color={FS.border} />
            <Text style={s.emptyText}>
              {query ? 'No exercises match.' : 'No exercises yet.\nConnect to your server to sync the library.'}
            </Text>
          </View>
        )}
        {exercises.map((ex) => (
          <TouchableOpacity key={ex.id} style={s.exRow} activeOpacity={0.7}>
            <View style={s.exInfo}>
              <Text style={s.exName}>{ex.name}</Text>
              <View style={s.exMeta}>
                {ex.muscleGroup && <View style={s.metaChip}><Text style={s.metaLabel}>{ex.muscleGroup}</Text></View>}
                {ex.equipment && <View style={s.metaChip}><Text style={s.metaLabel}>{ex.equipment}</Text></View>}
              </View>
            </View>
            <FSIcon name="ChevronRight" size={16} color={FS.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 8, backgroundColor: FS.surface, borderRadius: 12, padding: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: FS.border },
  searchInput: { flex: 1, fontSize: 14, color: FS.text },
  chips: { flexShrink: 0 },
  chipsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: FS.surface, borderWidth: 1, borderColor: FS.border },
  chipActive: { backgroundColor: FS.primary, borderColor: FS.primary },
  chipLabel: { fontSize: 13, color: FS.muted, fontWeight: '500' },
  chipLabelActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FS.border },
  exInfo: { flex: 1 },
  exName: { fontSize: 14, fontWeight: '500', color: FS.text },
  exMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaChip: { backgroundColor: FS.surfaceHigh, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  metaLabel: { fontSize: 11, color: FS.muted },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: FS.muted, textAlign: 'center', lineHeight: 20 },
});
