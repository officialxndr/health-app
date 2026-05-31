import { create } from 'zustand';

export type Section = 'dashboard' | 'food' | 'workout' | 'health' | 'settings';

export const SECTION_TABS: Record<Section, { key: string; label: string; icon: string }[]> = {
  dashboard: [
    { key: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { key: 'goals',    label: 'Goals',    icon: 'Target' },
  ],
  food: [
    { key: 'today',   label: 'Today',   icon: 'Calendar' },
    { key: 'recipes', label: 'Recipes', icon: 'Utensils' },
    { key: 'trends',  label: 'Trends',  icon: 'Flame' },
    { key: 'goals',   label: 'Goals',   icon: 'Target' },
  ],
  workout: [
    { key: 'library',   label: 'Library',   icon: 'LayoutGrid' },
    { key: 'history',   label: 'History',   icon: 'Trophy' },
    { key: 'exercises', label: 'Exercises', icon: 'Dumbbell' },
    { key: 'stats',     label: 'Stats',     icon: 'BarChart2' },
  ],
  health: [
    { key: 'weight',  label: 'Weight',  icon: 'Activity' },
    { key: 'goals',   label: 'Goals',   icon: 'Flame' },
    { key: 'body',    label: 'Body',    icon: 'HeartPulse' },
    { key: 'measure', label: 'Measure', icon: 'Ruler' },
  ],
  settings: [],
};

export const FAB_ACTIONS: Record<Section, { icon: string; label: string }[]> = {
  dashboard: [
    { icon: 'UtensilsCrossed', label: 'Log food' },
    { icon: 'Activity',        label: 'Log weight' },
    { icon: 'Dumbbell',        label: 'Start workout' },
  ],
  food: [
    { icon: 'Search',    label: 'Search food' },
    { icon: 'ScanLine',  label: 'Scan barcode' },
    { icon: 'Repeat',    label: 'Quick add' },
    { icon: 'Utensils',  label: 'New recipe' },
  ],
  workout: [
    { icon: 'Repeat',   label: 'Start Routine' },
    { icon: 'Plus',     label: 'Empty workout' },
    { icon: 'Clock',    label: 'From template' },
  ],
  health: [
    { icon: 'Activity', label: 'Log weight' },
    { icon: 'Ruler',    label: 'Log measurement' },
  ],
  settings: [],
};

interface NavigationState {
  activeSection: Section;
  subTabs: Record<Section, string>;
  fabOpen: boolean;
  setSection: (section: Section) => void;
  setSubTab: (section: Section, tab: string) => void;
  setFabOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: 'dashboard',
  subTabs: {
    dashboard: 'overview',
    food:      'today',
    workout:   'library',
    health:    'weight',
    settings:  '',
  },
  fabOpen: false,
  setSection: (section) => set({ activeSection: section }),
  setSubTab:  (section, tab) => set((s) => ({ subTabs: { ...s.subTabs, [section]: tab } })),
  setFabOpen: (open) => set({ fabOpen: open }),
}));
