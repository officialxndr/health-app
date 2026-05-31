import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FS } from '../../constants/theme';
import { FSIcon } from './FSIcon';
import { Section, SECTION_TABS, useNavigationStore } from '../../stores/navigationStore';

// Section launcher shown on Dashboard/Settings (no sub-tabs)
const LAUNCHER = [
  { key: 'food',     label: 'Food',     icon: 'UtensilsCrossed' },
  { key: 'workout',  label: 'Workout',  icon: 'Dumbbell' },
  { key: 'health',   label: 'Health',   icon: 'HeartPulse' },
  { key: 'settings', label: 'Settings', icon: 'Settings' },
] as const;

interface Props {
  onFab: () => void;
}

export function CustomTabBar({ onFab }: Props) {
  const insets = useSafeAreaInsets();
  const { activeSection, subTabs, setSection, setSubTab } = useNavigationStore();

  const tabs = SECTION_TABS[activeSection];
  const hasTabs = tabs.length > 0;
  const hasFab = activeSection !== 'settings';

  const displayTabs = hasTabs
    ? tabs
    : LAUNCHER;

  const splitAt = Math.ceil(displayTabs.length / 2);
  const left  = displayTabs.slice(0, splitAt);
  const right = displayTabs.slice(splitAt);

  const handleTab = (key: string) => {
    if (hasTabs) {
      setSubTab(activeSection, key);
    } else {
      setSection(key as Section);
    }
  };

  const activeKey = hasTabs ? subTabs[activeSection] : activeSection;

  const renderTab = (t: { key: string; label: string; icon: string }) => {
    const on = t.key === activeKey;
    return (
      <TouchableOpacity
        key={t.key}
        onPress={() => handleTab(t.key)}
        style={styles.tab}
        activeOpacity={0.7}
      >
        <FSIcon
          name={t.icon}
          size={24}
          color={on ? FS.primary : FS.muted}
          strokeWidth={on ? 2.4 : 2}
        />
        <Text style={[styles.tabLabel, on && styles.tabLabelActive]}>{t.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 16 }]}>
      {hasFab ? (
        <View style={styles.row}>
          <View style={styles.half}>{left.map(renderTab)}</View>
          <View style={styles.fabSpace} />
          <View style={styles.half}>{right.map(renderTab)}</View>
        </View>
      ) : (
        <View style={styles.row}>{displayTabs.map(renderTab)}</View>
      )}

      {hasFab && (
        <TouchableOpacity
          onPress={onFab}
          style={styles.fab}
          activeOpacity={0.85}
        >
          <FSIcon name="Plus" size={28} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: FS.surface,
    borderTopWidth: 1,
    borderTopColor: FS.border,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    paddingTop: 4,
  },
  half: {
    flex: 1,
    flexDirection: 'row',
  },
  fabSpace: {
    width: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: FS.muted,
  },
  tabLabelActive: {
    color: FS.primary,
  },
  fab: {
    position: 'absolute',
    left: '50%',
    top: -22,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: FS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: FS.bg,
    shadowColor: FS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
