import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FS } from '../../constants/theme';

interface Props {
  eaten: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({ eaten, goal, size = 130, strokeWidth = 10 }: Props) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const dash = pct * circ;
  const color = pct < 0.75 ? FS.success : pct < 0.95 ? FS.warning : FS.danger;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={FS.border} strokeWidth={strokeWidth} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{Math.round(eaten).toLocaleString()}</Text>
        <Text style={styles.label}>/ {goal.toLocaleString()} kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: FS.text,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 11,
    color: FS.muted,
  },
});
