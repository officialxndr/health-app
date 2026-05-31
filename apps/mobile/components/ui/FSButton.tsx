import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FS } from '../../constants/theme';

type Variant = 'primary' | 'success' | 'neutral' | 'ghost' | 'danger';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const BG: Record<Variant, string> = {
  primary: FS.primary,
  success: FS.success,
  neutral: FS.surfaceHigh,
  ghost:   'transparent',
  danger:  FS.danger,
};

const FG: Record<Variant, string> = {
  primary: '#fff',
  success: '#fff',
  neutral: FS.text,
  ghost:   FS.primary,
  danger:  '#fff',
};

export function FSButton({ children, variant = 'primary', onPress, disabled, full, style, textStyle }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.btn,
        { backgroundColor: BG[variant] },
        full && styles.full,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: FG[variant] }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: FS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
