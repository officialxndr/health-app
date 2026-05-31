import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigationStore } from '../../stores/navigationStore';
import { FoodTodayView }   from '../../components/food/FoodTodayView';
import { FoodRecipesView } from '../../components/food/FoodRecipesView';
import { FoodTrendsView }  from '../../components/food/FoodTrendsView';
import { FoodGoalsView }   from '../../components/food/FoodGoalsView';
import { QuickActionSheet } from '../../components/ui/QuickActionSheet';

const FOOD_ACTIONS = [
  { icon: 'Search',   label: 'Search food'  },
  { icon: 'ScanLine', label: 'Scan barcode' },
  { icon: 'Repeat',   label: 'Quick add'    },
  { icon: 'Utensils', label: 'New recipe'   },
];

export default function FoodScreen() {
  const subTab = useNavigationStore((s) => s.subTabs.food);
  const [sheet, setSheet] = useState(false);

  const renderTab = () => {
    switch (subTab) {
      case 'recipes': return <FoodRecipesView openSheet={() => setSheet(true)} />;
      case 'trends':  return <FoodTrendsView />;
      case 'goals':   return <FoodGoalsView />;
      default:        return <FoodTodayView openSheet={() => setSheet(true)} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderTab()}
      <QuickActionSheet
        visible={sheet}
        actions={FOOD_ACTIONS}
        onAction={() => setSheet(false)}
        onClose={() => setSheet(false)}
      />
    </View>
  );
}
