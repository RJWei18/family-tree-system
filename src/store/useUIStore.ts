import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isQuickAddOpen: boolean;
    quickAddSourceId: string | null;
    openQuickAdd: (sourceId: string) => void;
    closeQuickAdd: () => void;
    treeMode: 'full' | 'hourglass';
    setTreeMode: (mode: 'full' | 'hourglass') => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isQuickAddOpen: false,
            quickAddSourceId: null,
            openQuickAdd: (sourceId) => set({ isQuickAddOpen: true, quickAddSourceId: sourceId }),
            closeQuickAdd: () => set({ isQuickAddOpen: false, quickAddSourceId: null }),
            treeMode: 'hourglass',
            setTreeMode: (mode) => set({ treeMode: mode }),
        }),
        {
            name: 'family-tree-ui',
            partialize: (state) => ({ treeMode: state.treeMode }),
        }
    )
);
