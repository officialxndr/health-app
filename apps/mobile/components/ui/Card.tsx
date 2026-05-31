import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FS } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  outlined?: boolean;
  style?: ViewStyle;
}

export function Card({ children, onPress, outlined, style }: Props) {
  const content = (
    <View style={[styles.card, outlined && styles.outlined, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FS.surface,
    borderRadius: FS.radius.lg,
    padding: FS.space.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: FS.border,
  },
});
