import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from './FSIcon';

interface Action {
  icon: string;
  label: string;
}

interface Props {
  visible: boolean;
  actions: Action[];
  onAction: (label: string) => void;
  onClose: () => void;
}

export function QuickActionSheet({ visible, actions, onAction, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quick Actions</Text>
          <View style={styles.list}>
            {actions.map(({ icon, label }, i) => (
              <TouchableOpacity
                key={i}
                style={styles.row}
                onPress={() => onAction(label)}
                activeOpacity={0.7}
              >
                <FSIcon name={icon} size={20} color={FS.primary} />
                <Text style={styles.rowLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: FS.surface,
    borderTopLeftRadius: FS.radius.xl,
    borderTopRightRadius: FS.radius.xl,
    padding: FS.space.xl,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: FS.surfaceHigh,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: FS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FS.surfaceHigh,
    borderRadius: FS.radius.md,
    padding: 14,
  },
  rowLabel: {
    fontSize: 15,
    color: FS.text,
  },
});
