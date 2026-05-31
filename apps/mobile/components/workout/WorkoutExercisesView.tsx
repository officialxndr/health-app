import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from '../ui/FSIcon';

const GROUPS = [
  { muscle: 'Chest',     icon: 'Dumbbell',         exercises: ['Bench Press (Barbell)', 'Incline DB Press', 'Cable Chest Fly', 'Push-up'] },
  { muscle: 'Back',      icon: 'ArrowUpFromLine',   exercises: ['Pull-up', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row'] },
  { muscle: 'Legs',      icon: 'Footprints',        exercises: ['Squat (Barbell)', 'Romanian Deadlift', 'Leg Press', 'Goblet Squat'] },
  { muscle: 'Shoulders', icon: 'Zap',               exercises: ['OHP (Barbell)', 'Lateral Raise', 'Face Pull', 'Arnold Press'] },
  { muscle: 'Arms',      icon: 'Dumbbell',          exercises: ['Barbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher'] },
  { muscle: 'Core',      icon: 'CircleDot',         exercises: ['Plank', 'Ab Wheel Rollout', 'Cable Crunch', 'Hanging Leg Raise'] },
];

export function WorkoutExercisesView() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Chest: true });

  const filtered = query
    ? GROUPS.map((g) => ({ ...g, exercises: g.exercises.filter((e) => e.toLowerCase().includes(query.toLowerCase())) })).filter((g) => g.exercises.length > 0)
    : GROUPS;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.searchBox}>
        <FSIcon name="Search" size={16} color={FS.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises…"
          placeholderTextColor={FS.muted}
        />
      </View>

      {filtered.map((g) => {
        const isOpen = query ? true : !!expanded[g.muscle];
        return (
          <View key={g.muscle} style={s.group}>
            <TouchableOpacity
              onPress={() => setExpanded((x) => ({ ...x, [g.muscle]: !x[g.muscle] }))}
              style={s.groupHeader}
              activeOpacity={0.7}
            >
              <FSIcon name={g.icon} size={18} color={FS.primary} />
              <Text style={s.groupName}>{g.muscle}</Text>
              <Text style={s.groupCount}>{g.exercises.length}</Text>
              <FSIcon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} color={FS.muted} />
            </TouchableOpacity>
            {isOpen && g.exercises.map((ex, i) => (
              <View key={i} style={s.exercise}>
                <Text style={s.exerciseName} numberOfLines={1}>{ex}</Text>
                <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
                  <FSIcon name="Plus" size={16} color={FS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FS.surface, borderRadius: 12, padding: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: FS.border },
  searchInput: { flex: 1, fontSize: 14, color: FS.text },
  group: { backgroundColor: FS.surface, borderRadius: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 16 },
  groupName: { flex: 1, fontSize: 14, fontWeight: '600', color: FS.text },
  groupCount: { fontSize: 12, color: FS.muted },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: FS.border },
  exerciseName: { flex: 1, fontSize: 14, color: FS.text },
  addBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: FS.primary + '22', alignItems: 'center', justifyContent: 'center' },
});
