import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSIcon } from './FSIcon';
import { Section } from '../../stores/navigationStore';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'food',      label: 'Food',      icon: 'UtensilsCrossed' },
  { key: 'workout',   label: 'Workout',   icon: 'Dumbbell' },
  { key: 'health',    label: 'Health',    icon: 'HeartPulse' },
  { key: 'settings',  label: 'Settings',  icon: 'Settings' },
];

interface Props {
  section: Section;
  onSwitch: (s: Section) => void;
}

export function SectionHeader({ section, onSwitch }: Props) {
  const [open, setOpen] = useState(false);
  const current = SECTIONS.find((s) => s.key === section)!;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.titleBtn}
        activeOpacity={0.7}
      >
        <FSIcon name={current.icon} size={20} color={FS.primary} />
        <Text style={styles.title}>{current.label}</Text>
        <FSIcon name="ChevronDown" size={16} color={FS.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => { setOpen(false); onSwitch(s.key); }}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  activeOpacity={0.7}
                >
                  <FSIcon name={s.icon} size={20} color={active ? FS.primary : FS.muted} />
                  <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: FS.surface,
    borderBottomWidth: 1,
    borderBottomColor: FS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: FS.text,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 120,
    paddingHorizontal: 16,
  },
  menu: {
    backgroundColor: FS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemActive: {
    backgroundColor: FS.primary + '1a',
  },
  menuLabel: {
    fontSize: 14,
    color: FS.text,
  },
  menuLabelActive: {
    color: FS.primary,
    fontWeight: '600',
  },
});
