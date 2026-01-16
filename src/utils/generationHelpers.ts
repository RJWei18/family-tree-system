import type { Member, Relationship } from '../types';

/**
 * Calculates the generation number for each member in the family tree.
 * 
 * Logic:
 * 1. Identify "Root" members (those with no recorded parents).
 * 2. Assign Generation 1 to Roots.
 * 3. Traverse Parent->Child relationships to assign Gen + 1.
 * 4. Sync Spouses to have the same generation as their partner (if one is higher/defined).
 * 
 * @param members Record<string, Member>
 * @param relationships Relationship[]
 * @returns Record<string, number> mapping memberId to generation number
 */
export const calculateGenerations = (
    members: Record<string, Member>,
    relationships: Relationship[]
): Record<string, number> => {
    const generationMap: Record<string, number> = {};
    const memberIds = Object.keys(members);

    // 1. Build Adjacency List for traversal
    // childrenMap: parentId -> [childId, childId...]
    // spouseMap: memberId -> [spouseId, spouseId...]
    const childrenMap: Record<string, string[]> = {};
    const spouseMap: Record<string, string[]> = {};
    const hasParent: Set<string> = new Set();

    relationships.forEach(rel => {
        if (rel.type === 'parent') {
            if (!childrenMap[rel.sourceMemberId]) childrenMap[rel.sourceMemberId] = [];
            childrenMap[rel.sourceMemberId].push(rel.targetMemberId);
            hasParent.add(rel.targetMemberId);
        } else if (rel.type === 'spouse') {
            if (!spouseMap[rel.sourceMemberId]) spouseMap[rel.sourceMemberId] = [];
            if (!spouseMap[rel.targetMemberId]) spouseMap[rel.targetMemberId] = [];
            spouseMap[rel.sourceMemberId].push(rel.targetMemberId);
            spouseMap[rel.targetMemberId].push(rel.sourceMemberId);
        }
    });

    // 2. Identify Roots (No parents)
    // Note: A "Spouse" who marries into the family but has no parents listed is technically a root 
    // in graph terms, but sociologically might be considered same gen as spouse.
    // We will initialize queue with ALL members who have NO parents.
    let queue: { id: string, gen: number }[] = [];

    memberIds.forEach(id => {
        if (!hasParent.has(id)) {
            // Potential root.
            // Check if they are married to someone who HAS parents?
            // If married to someone with parents, defer to spouse's gen (wait for spouse to process).
            // But if we start BFS from roots, we set them to Gen 1.
            // If they are married to a Gen 2, we need to correct it?
            // VISUALIZATION HEURISTIC: "Roots" are usually the oldest ancestors.
            // We set them to Gen 1.
            generationMap[id] = 1;
            queue.push({ id, gen: 1 });
        }
    });

    // 3. BFS Traversal
    // We might need to re-visit nodes if we find a "better" (deeper) generation path?
    // Actually, generation = max(parents) + 1.
    // So topological sort is ideal.
    // But since cycle is possible in bad data, BFS with "change detection" is safer.

    let changed = true;
    while (changed) {
        changed = false;

        // Propagate Parent -> Child
        relationships.forEach(rel => {
            if (rel.type === 'parent') {
                const parentGen = generationMap[rel.sourceMemberId] || 1;
                const childGen = generationMap[rel.targetMemberId] || 0;
                const newChildGen = parentGen + 1;

                if (newChildGen > childGen) {
                    generationMap[rel.targetMemberId] = newChildGen;
                    changed = true;
                }
            }
        });

        // Sync Spouses (Take max)
        relationships.forEach(rel => {
            if (rel.type === 'spouse') {
                const genA = generationMap[rel.sourceMemberId] || 1;
                const genB = generationMap[rel.targetMemberId] || 1;
                const maxGen = Math.max(genA, genB);

                if (maxGen > genA) {
                    generationMap[rel.sourceMemberId] = maxGen;
                    changed = true;
                }
                if (maxGen > genB) {
                    generationMap[rel.targetMemberId] = maxGen;
                    changed = true;
                }
            }
        });
    }

    return generationMap;
};
