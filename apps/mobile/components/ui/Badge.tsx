import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from './FSIcon';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

interface Props {
  children: React.ReactNode;
  tone?: Tone;
  icon?: string;
}

const COLORS: Record<Tone, string> = {
  primary: FS.primary,
  success: FS.success,
  warning: FS.warning,
  danger:  FS.danger,
};

export function Badge({ children, tone = 'primary', icon }: Props) {
  const color = COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: color + '1a' }]}>
      {icon && <FSIcon name={icon} size={13} color={color} />}
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
