import React from 'react';
import { View } from 'react-native';
import { useNavigationStore } from '../../stores/navigationStore';
import { HealthWeightView }  from '../../components/health/HealthWeightView';
import { HealthGoalsView }   from '../../components/health/HealthGoalsView';
import { HealthBodyView }    from '../../components/health/HealthBodyView';
import { HealthMeasureView } from '../../components/health/HealthMeasureView';

export default function HealthScreen() {
  const subTab = useNavigationStore((s) => s.subTabs.health);

  return (
    <View style={{ flex: 1 }}>
      {subTab === 'goals'   ? <HealthGoalsView />   :
       subTab === 'body'    ? <HealthBodyView />    :
       subTab === 'measure' ? <HealthMeasureView /> :
       <HealthWeightView />}
    </View>
  );
}
