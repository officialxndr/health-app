import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStore, FAB_ACTIONS } from '../../stores/navigationStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useRouter } from 'expo-router';
import { FS } from '../../constants/theme';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CustomTabBar } from '../../components/ui/CustomTabBar';
import { QuickActionSheet } from '../../components/ui/QuickActionSheet';

// Section screens
import DashboardScreen from './index';
import FoodScreen from './food';
import WorkoutScreen from './workout';
import HealthScreen from './health';
import SettingsScreen from './settings';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);

  const { activeSection, setSection } = useNavigationStore();
  const { startSession } = useSessionStore();

  const handleFabAction = (label: string) => {
    setFabOpen(false);
    if (label === 'Start workout' || label === 'Empty workout') {
      startSession('Quick Workout');
      router.push('/session');
    } else if (label === 'From template') {
      setSection('workout');
    } else if (label === 'Start Routine') {
      setSection('workout');
    }
  };

  const actions = FAB_ACTIONS[activeSection] || [];

  const renderScreen = () => {
    switch (activeSection) {
      case 'food':     return <FoodScreen />;
      case 'workout':  return <WorkoutScreen />;
      case 'health':   return <HealthScreen />;
      case 'settings': return <SettingsScreen />;
      default:         return <DashboardScreen />;
    }
  };

  return (
    <View style={[styles.shell, { paddingTop: insets.top }]}>
      <SectionHeader section={activeSection} onSwitch={setSection} />

      <View style={styles.content}>
        {renderScreen()}
      </View>

      <CustomTabBar onFab={() => setFabOpen(true)} />

      <QuickActionSheet
        visible={fabOpen}
        actions={actions}
        onAction={handleFabAction}
        onClose={() => setFabOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: FS.bg,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
