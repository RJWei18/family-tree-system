import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyTreeState } from '../types';

export const useFamilyStore = create<FamilyTreeState>()(
  persist(
    (set) => ({
      members: {},
      relationships: [],
      rootMemberId: null,
      highlightedMemberId: null,
      setHighlightedMemberId: (id) => set({ highlightedMemberId: id }),
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      addMember: (member) => set((state) => ({
        members: { ...state.members, [member.id]: member }
      })),
      updateMember: (id, updates) => set((state) => ({
        members: { ...state.members, [id]: { ...state.members[id], ...updates } }
      })),
      deleteMember: (id) => set((state) => {
        const newMembers = { ...state.members };
        delete newMembers[id];
        // Also remove relationships
        const newRels = state.relationships.filter(r => r.sourceMemberId !== id && r.targetMemberId !== id);
        return { members: newMembers, relationships: newRels };
      }),
      addRelationship: (rel) => set((state) => ({
        relationships: [...state.relationships, rel]
      })),
      setRootMember: (id) => set({ rootMemberId: id }),
      removeRelationship: (id) => set((state) => ({
        relationships: state.relationships.filter((r) => r.id !== id)
      })),
    }),
    {
      name: 'family-tree-storage',
    }
  )
);
