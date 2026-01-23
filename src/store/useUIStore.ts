import { create } from 'zustand';

interface UIState {
    isQuickAddOpen: boolean;
    quickAddSourceId: string | null;
    openQuickAdd: (sourceId: string) => void;
    closeQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isQuickAddOpen: false,
    quickAddSourceId: null,
    openQuickAdd: (sourceId) => set({ isQuickAddOpen: true, quickAddSourceId: sourceId }),
    closeQuickAdd: () => set({ isQuickAddOpen: false, quickAddSourceId: null }),
}));
