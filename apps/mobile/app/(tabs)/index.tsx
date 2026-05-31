import React from 'react';
import { View } from 'react-native';
import { useNavigationStore } from '../../stores/navigationStore';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';
import { DashboardGoals } from '../../components/dashboard/DashboardGoals';

export default function DashboardScreen() {
  const subTab = useNavigationStore((s) => s.subTabs.dashboard);

  return (
    <View style={{ flex: 1 }}>
      {subTab === 'goals' ? <DashboardGoals /> : <DashboardOverview />}
    </View>
  );
}
