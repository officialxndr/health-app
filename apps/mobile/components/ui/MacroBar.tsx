import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';

interface Props {
  label: string;
  value: number;
  target: number;
  color: string;
}

export function MacroBar({ label, value, target, color }: Props) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(value)}g / {target}g
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: FS.muted,
  },
  value: {
    fontSize: 12,
    color: FS.text,
  },
  track: {
    height: 6,
    backgroundColor: FS.surfaceHigh,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
