import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '../types';

export interface HourglassState {
  homeMemberId: string | null;
  ancestorDepth: number;
  descendantDepth: number | null;
  focusId: string | null;
  history: string[];
  collapsedOverride: Record<string, true>;
  expandedOverride: Record<string, true>;

  resolveInitial: (members: Record<string, Member>, homeName: string) => void;
  validateFocus: (members: Record<string, Member>) => void;
  setFocus: (id: string) => void;
  goBack: () => void;
  jumpTo: (breadcrumbIndex: number) => void;
  resetToHome: () => void;
  setHome: (id: string) => void;
  setAncestorDepth: (n: number) => void;
  setDescendantDepth: (n: number | null) => void;
  toggleDescendants: (id: string, currentlyCollapsed: boolean) => void;
}

export const useHourglassStore = create<HourglassState>()(
  persist(
    (set, get) => ({
      homeMemberId: null,
      ancestorDepth: 3,
      descendantDepth: 3,
      focusId: null,
      history: [],
      collapsedOverride: {},
      expandedOverride: {},

      resolveInitial: (members, homeName) => {
        let { homeMemberId, focusId } = get();
        
        // Find home member by name if not set
        if (!homeMemberId || !members[homeMemberId]) {
          const matchingMembers = Object.values(members)
            .filter(m => `${m.lastName || ''}${m.firstName || ''}`.trim() === homeName)
            .sort((a, b) => a.id.localeCompare(b.id));

          if (matchingMembers.length > 0) {
            if (matchingMembers.length > 1) {
              console.warn('Multiple members found for homeName:', homeName, 'taking first by id.');
            }
            homeMemberId = matchingMembers[0].id;
          } else {
            homeMemberId = null;
          }
          set({ homeMemberId });
        }

        if (!focusId || !members[focusId]) {
          set({ focusId: homeMemberId, history: [] });
        }
      },

      validateFocus: (members) => {
        const { focusId, homeMemberId } = get();
        if (focusId && !members[focusId]) {
          if (homeMemberId && members[homeMemberId]) {
            set({ focusId: homeMemberId, history: [] });
          } else {
            set({ focusId: null, history: [] });
          }
        }
      },

      setFocus: (id) => {
        const { focusId, history } = get();
        if (focusId === id) return;

        const newHistory = focusId ? [...history, focusId] : history;
        if (newHistory.length > 12) {
          newHistory.shift();
        }
        set({ focusId: id, history: newHistory });
      },

      goBack: () => {
        const { history } = get();
        if (history.length === 0) return;
        
        const newHistory = [...history];
        const lastId = newHistory.pop()!;
        set({ focusId: lastId, history: newHistory });
      },

      jumpTo: (breadcrumbIndex) => {
        const { history } = get();
        if (breadcrumbIndex < 0 || breadcrumbIndex >= history.length) return;
        
        const targetId = history[breadcrumbIndex];
        const newHistory = history.slice(0, breadcrumbIndex);
        set({ focusId: targetId, history: newHistory });
      },

      resetToHome: () => {
        const { homeMemberId, focusId } = get();
        if (!homeMemberId) return;
        
        if (focusId !== homeMemberId) {
          set({ 
            focusId: homeMemberId, 
            history: [], 
            collapsedOverride: {}, 
            expandedOverride: {} 
          });
        } else {
          set({ 
            collapsedOverride: {}, 
            expandedOverride: {} 
          });
        }
      },

      setHome: (id) => {
        set({ homeMemberId: id });
      },

      setAncestorDepth: (n) => {
        set({ 
          ancestorDepth: n,
          collapsedOverride: {},
          expandedOverride: {}
        });
      },

      setDescendantDepth: (n) => {
        set({ descendantDepth: n });
      },

      toggleDescendants: (id, currentlyCollapsed) => {
        const { collapsedOverride, expandedOverride } = get();
        if (currentlyCollapsed) {
          const newCollapsed = { ...collapsedOverride };
          delete newCollapsed[id];
          set({ 
            collapsedOverride: newCollapsed,
            expandedOverride: { ...expandedOverride, [id]: true }
          });
        } else {
          const newExpanded = { ...expandedOverride };
          delete newExpanded[id];
          set({ 
            expandedOverride: newExpanded,
            collapsedOverride: { ...collapsedOverride, [id]: true }
          });
        }
      }
    }),
    {
      name: 'family-tree-hourglass',
      partialize: (state) => ({
        homeMemberId: state.homeMemberId,
        ancestorDepth: state.ancestorDepth,
        descendantDepth: state.descendantDepth,
      }),
    }
  )
);
