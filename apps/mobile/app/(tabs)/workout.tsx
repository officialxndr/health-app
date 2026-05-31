import React from 'react';
import { View } from 'react-native';
import { useNavigationStore } from '../../stores/navigationStore';
import { WorkoutLibraryView }   from '../../components/workout/WorkoutLibraryView';
import { WorkoutHistoryView }   from '../../components/workout/WorkoutHistoryView';
import { WorkoutExercisesView } from '../../components/workout/WorkoutExercisesView';
import { WorkoutStatsView }     from '../../components/workout/WorkoutStatsView';

export default function WorkoutScreen() {
  const subTab = useNavigationStore((s) => s.subTabs.workout);

  return (
    <View style={{ flex: 1 }}>
      {subTab === 'history'   ? <WorkoutHistoryView />   :
       subTab === 'exercises' ? <WorkoutExercisesView /> :
       subTab === 'stats'     ? <WorkoutStatsView />     :
       <WorkoutLibraryView />}
    </View>
  );
}
