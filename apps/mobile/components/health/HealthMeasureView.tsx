import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../ui/FSButton';
import { useHealthStore } from '../../stores/healthStore';

const MEASUREMENTS = [
  { name: 'Waist',       current: 33.5, prev: '34.2 in', delta: '−0.7', good: true  },
  { name: 'Chest',       current: 42.0, prev: '41.5 in', delta: '+0.5', good: true  },
  { name: 'Hips',        current: 38.5, prev: '39.0 in', delta: '−0.5', good: true  },
  { name: 'Left Arm',    current: 14.5, prev: '14.0 in', delta: '+0.5', good: true  },
  { name: 'Right Arm',   current: 14.5, prev: '14.0 in', delta: '+0.5', good: true  },
  { name: 'Left Thigh',  current: 22.0, prev: '22.5 in', delta: '−0.5', good: true  },
  { name: 'Right Thigh', current: 22.0, prev: '22.5 in', delta: '−0.5', good: true  },
  { name: 'Neck',        current: 15.5, prev: '15.5 in', delta: '0.0',  good: false },
];

export function HealthMeasureView() {
  const [logging, setLogging] = useState(false);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.headRow}>
        <View>
          <Text style={s.headTitle}>Body Measurements</Text>
          <Text style={s.headSub}>Last logged May 15, 2026</Text>
        </View>
        <FSButton onPress={() => setLogging((v) => !v)} style={s.logBtn}>
          {logging ? 'Cancel' : '+ Log'}
        </FSButton>
      </View>

      {logging && (
        <View style={s.logCard}>
          <Text style={s.logTitle}>New Entry — Today</Text>
          {MEASUREMENTS.map((m, i) => (
            <View key={i} style={s.logRow}>
              <Text style={s.logName}>{m.name}</Text>
              <TextInput
                style={s.logInput}
                defaultValue={m.current.toString()}
                keyboardType="decimal-pad"
              />
              <Text style={s.logUnit}>in</Text>
            </View>
          ))}
          <FSButton full style={{ borderRadius: 12, marginTop: 4 }}>Save Measurements</FSButton>
        </View>
      )}

      {/* measurements table */}
      <View style={s.table}>
        <View style={s.tableHead}>
          {['Measurement', 'Current', 'Last', 'Change'].map((h, i) => (
            <Text key={h} style={[s.headCell, i === 0 ? s.cellLeft : s.cellRight]}>{h}</Text>
          ))}
        </View>
        {MEASUREMENTS.map((m, i) => (
          <View key={i} style={[s.tableRow, i > 0 && s.rowBorder]}>
            <Text style={[s.cell, s.cellLeft, s.cellName]}>{m.name}</Text>
            <Text style={[s.cell, s.cellRight, s.cellBold]}>{m.current} in</Text>
            <Text style={[s.cell, s.cellRight, s.cellMuted]}>{m.prev}</Text>
            <Text style={[s.cell, s.cellRight, s.cellBold, {
              color: m.delta === '0.0' ? FS.muted : m.good ? FS.success : FS.danger,
            }]}>{m.delta}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headTitle: { fontWeight: '600', fontSize: 15, color: FS.text },
  headSub: { fontSize: 12, color: FS.muted, marginTop: 2 },
  logBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  logCard: { backgroundColor: FS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: FS.primary + '44', gap: 10 },
  logTitle: { fontSize: 13, fontWeight: '600', color: FS.primary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logName: { flex: 1, fontSize: 13, color: FS.muted },
  logInput: { width: 70, backgroundColor: FS.surfaceHigh, borderWidth: 1, borderColor: FS.border, borderRadius: 8, padding: 6, paddingHorizontal: 10, fontSize: 14, color: FS.text, textAlign: 'right' },
  logUnit: { fontSize: 12, color: FS.muted, width: 18 },
  table: { backgroundColor: FS.surface, borderRadius: 16, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', padding: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: FS.border },
  headCell: { fontSize: 10, color: FS.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 11, paddingHorizontal: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: FS.border },
  cell: { fontSize: 14 },
  cellLeft: { flex: 1, textAlign: 'left', color: FS.text },
  cellRight: { width: 56, textAlign: 'right' },
  cellName: { fontWeight: '500' },
  cellBold: { fontWeight: '700', color: FS.text, fontVariant: ['tabular-nums'] as any },
  cellMuted: { color: FS.muted },
});
