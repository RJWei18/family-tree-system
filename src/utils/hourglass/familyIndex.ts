import { Member, Relationship } from '../../types';
import { FamilyIndex } from './types';

export const buildFamilyIndex = (
  members: Record<string, Member>,
  relationships: Relationship[]
): FamilyIndex => {
  const index: FamilyIndex = {
    members,
    parentsOf: {},
    childrenOf: {},
    spousesOf: {},
  };

  const rawParentsOf: Record<string, string[]> = {};
  const rawSpousesOf: Record<string, Set<string>> = {};
  const rawChildrenOf: Record<string, string[]> = {};

  for (const rel of relationships) {
    const { sourceMemberId, targetMemberId, type } = rel;
    if (!members[sourceMemberId] || !members[targetMemberId]) continue;
    if (sourceMemberId === targetMemberId) continue;

    if (type === 'parent') {
      if (!rawParentsOf[targetMemberId]) rawParentsOf[targetMemberId] = [];
      if (!rawParentsOf[targetMemberId].includes(sourceMemberId)) {
        rawParentsOf[targetMemberId].push(sourceMemberId);
      }
      if (!rawChildrenOf[sourceMemberId]) rawChildrenOf[sourceMemberId] = [];
      if (!rawChildrenOf[sourceMemberId].includes(targetMemberId)) {
        rawChildrenOf[sourceMemberId].push(targetMemberId);
      }
    } else if (type === 'spouse') {
      if (!rawSpousesOf[sourceMemberId]) rawSpousesOf[sourceMemberId] = new Set();
      if (!rawSpousesOf[targetMemberId]) rawSpousesOf[targetMemberId] = new Set();
      rawSpousesOf[sourceMemberId].add(targetMemberId);
      rawSpousesOf[targetMemberId].add(sourceMemberId);
    }
  }

  // Sort parents
  const parentIds = Object.keys(rawParentsOf).sort();
  for (const childId of parentIds) {
    const parents = rawParentsOf[childId];
    parents.sort((a, b) => {
      const gA = members[a].gender;
      const gB = members[b].gender;
      if (gA === gB) return a.localeCompare(b);
      if (gA === 'male') return -1;
      if (gB === 'male') return 1;
      if (gA === 'female') return -1;
      if (gB === 'female') return 1;
      return a.localeCompare(b);
    });

    if (parents.length > 2) {
      console.warn(`Child ${childId} has more than 2 parents.`);
      index.parentsOf[childId] = parents.slice(0, 2);
    } else {
      index.parentsOf[childId] = parents;
    }
  }

  // Sort children
  const childrenKeys = Object.keys(rawChildrenOf).sort();
  for (const parentId of childrenKeys) {
    const children = rawChildrenOf[parentId];
    children.sort((a, b) => {
      const mA = members[a];
      const mB = members[b];
      const dA = mA.dateOfBirth;
      const dB = mB.dateOfBirth;
      if (dA && dB) {
        const cmp = dA.localeCompare(dB);
        if (cmp !== 0) return cmp;
      }
      if (dA && !dB) return -1;
      if (!dA && dB) return 1;
      return a.localeCompare(b);
    });
    index.childrenOf[parentId] = children;
  }

  // Sort spouses
  const spouseKeys = Object.keys(rawSpousesOf).sort();
  for (const personId of spouseKeys) {
    index.spousesOf[personId] = Array.from(rawSpousesOf[personId]).sort((a, b) => a.localeCompare(b));
  }

  // Ensure deterministic empty arrays for output stability if needed, but the spec says "所有輸出陣列一律明確排序，不得依賴物件鍵順序". 
  // Object.keys(members).sort().forEach() could be used to initialize empty arrays, but the spec implies we can just keep the keys that exist.

  return index;
};
