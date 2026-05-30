import { create } from 'zustand'

// Lightweight cross-component UI bus. The center FAB sets a `quickAction`;
// the relevant section sub-page consumes it (opens a modal/form) and clears it.
// This decouples the FAB from the target screen, so an action works whether or
// not that screen is already mounted when the FAB is tapped.
interface UiState {
  quickAction: string | null
  setQuickAction: (action: string | null) => void
  clearQuickAction: () => void
}

export const useUiStore = create<UiState>((set) => ({
  quickAction: null,
  setQuickAction: (action) => set({ quickAction: action }),
  clearQuickAction: () => set({ quickAction: null }),
}))
