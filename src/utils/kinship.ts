import type { Member, Relationship } from '../types';

type RelationStep = 'father' | 'mother' | 'son' | 'daughter' | 'brother' | 'sister' | 'husband' | 'wife' | 'spouse';

interface GraphNode {
  id: string;
  edges: { target: string; type: RelationStep }[];
}

// Helper: Calculate age-based rank (e.g., Big Brother, Second Sister)
const calculateSiblingRank = (
    targetId: string, 
    peers: Member[], 
    type: 'older_brother' | 'younger_brother' | 'older_sister' | 'younger_sister' | 'brother' | 'sister'
): string => {
    // Filter peers by gender matches the target
    const targetMember = peers.find(p => p.id === targetId);
    if (!targetMember) return '';

    // Sort all peers by birth date (Oldest first)
    const sortedPeers = [...peers].sort((a, b) => {
        const da = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : Infinity;
        const db = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : Infinity;
        return da - db;
    });

    const index = sortedPeers.findIndex(p => p.id === targetId);
    if (index === -1) return '';

    const total = sortedPeers.length;

    if (total === 1) {
         if (type === 'older_brother') return '哥哥';
         if (type === 'younger_brother') return '弟弟';
         if (type === 'older_sister') return '姊姊';
         if (type === 'younger_sister') return '妹妹';
    }

    const isEldest = index === 0;
    const isYoungest = index === total - 1 && total > 1;

    let suffix = '';
    if (type.includes('brother')) suffix = '哥'; 
    if (type.includes('sister')) suffix = '姊';
    
    if (type === 'younger_brother') suffix = '弟';
    if (type === 'younger_sister') suffix = '妹';
    
    if (isEldest) return `大${suffix}`;
    if (isYoungest && total > 2) return `小${suffix}`; 

    const numbers = ['大', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const numStr = numbers[index] || `${index + 1}`;
    
    return `${numStr}${suffix}`;
};

export const calculateRelationship = (
  rootId: string | null,
  targetId: string,
  members: Record<string, Member>,
  relationships: Relationship[]
): string => {
  if (!rootId || !members[rootId] || !members[targetId]) return '';
  if (rootId === targetId) return '本人';

  // 1. Build Graph
  const graph: Record<string, GraphNode> = {};
  Object.keys(members).forEach(id => {
    graph[id] = { id, edges: [] };
  });

  relationships.forEach(rel => {
    const source = members[rel.sourceMemberId];
    const target = members[rel.targetMemberId];
    if (!source || !target) return;

    if (rel.type === 'parent') {
      const childType = target.gender === 'male' ? 'son' : target.gender === 'female' ? 'daughter' : 'son';
      graph[rel.sourceMemberId].edges.push({ target: rel.targetMemberId, type: childType });

      const parentType = source.gender === 'male' ? 'father' : 'mother';
      graph[rel.targetMemberId].edges.push({ target: rel.sourceMemberId, type: parentType });
    } else if (rel.type === 'spouse') {
      const spType1 = target.gender === 'male' ? 'husband' : target.gender === 'female' ? 'wife' : 'spouse';
      const spType2 = source.gender === 'male' ? 'husband' : source.gender === 'female' ? 'wife' : 'spouse';
      
      graph[rel.sourceMemberId].edges.push({ target: rel.targetMemberId, type: spType1 });
      graph[rel.targetMemberId].edges.push({ target: rel.sourceMemberId, type: spType2 });
    }
  });

  // 2. BFS with ID Tracking
  const MAX_DEPTH = 8;
  // Queue stores: Current ID, Path of Types, Path of IDs (including start, excluding current? or including current?)
  // Let pathIds include the IDs encountered AFTER root.
  const queue: { id: string; path: RelationStep[]; pathIds: string[] }[] = [{ id: rootId!, path: [], pathIds: [] }];
  const visited = new Set<string>([rootId]);

  while (queue.length > 0) {
    const { id, path, pathIds } = queue.shift()!;

    if (id === targetId) {
      return mapPathToTitle(path, pathIds, members[targetId], members[rootId], members, relationships);
    }

    if (path.length >= MAX_DEPTH) continue;

    const node = graph[id];
    if (!node) continue;

    for (const edge of node.edges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push({ 
            id: edge.target, 
            path: [...path, edge.type], 
            pathIds: [...pathIds, edge.target] 
        });
      }
    }
  }

  return ''; 
};

/**
 * Enhanced Path Mapper with Ranking & ID Support
 */
const mapPathToTitle = (
    path: RelationStep[], 
    pathIds: string[],
    target: Member, 
    root: Member,
    allMembers: Record<string, Member>,
    allRels: Relationship[]
): string => {
  if (path.length === 0) return '本人';
  const p = path.join(',');
  const isOlder = (a: Member, b: Member) => {
      if (!a?.dateOfBirth) return true; 
      if (!b?.dateOfBirth) return false;
      return new Date(a.dateOfBirth) < new Date(b.dateOfBirth);
  };

  // --- Helper to find siblings for ranking ---
  const findSiblings = (memberId: string): Member[] => {
      const parentRels = allRels.filter(r => r.targetMemberId === memberId && r.type === 'parent');
      if (parentRels.length === 0) return [target]; 
      
      const siblingIds = new Set<string>();
      parentRels.forEach(pr => {
          const siblings = allRels
            .filter(r => r.sourceMemberId === pr.sourceMemberId && r.type === 'parent')
            .map(r => r.targetMemberId);
          siblings.forEach(s => siblingIds.add(s));
      });
      return Array.from(siblingIds).map(id => allMembers[id]).filter(m => m !== undefined);
  };

  // --- 1. Direct Family ---
  if (p === 'father') return '爸爸';
  if (p === 'mother') return '媽媽';
  if (p === 'son') return '兒子';
  if (p === 'daughter') return '女兒';
  if (p === 'husband') return '老公';
  if (p === 'wife') return '老婆';
  if (p === 'spouse') return '配偶';

  // --- 1.5 Sibling Spouses (In-Laws I) ---
  if (p === 'father,son,wife' || p === 'mother,son,wife' || p === 'father,son,spouse' || p === 'mother,son,spouse') {
      // Find the brother (intermediate)
      // PathIds: [FatherID, BrotherID, WifeID]
      // Brother is at index 1 (0-based) ? No.
      // BFS PathIds defined as: [...pathIds, edge.target].
      // Step 1: Father (index 0). Step 2: Son/Brother (index 1). Step 3: Wife (index 2).
      const brotherId = pathIds[1];
      const brother = allMembers[brotherId];
      if (brother) {
          return isOlder(brother, root) ? '嫂嫂' : '弟媳';
      }
      // Fallback
      return isOlder(target, root) ? '嫂嫂' : '弟媳';
  }
  if (p === 'father,daughter,husband' || p === 'mother,daughter,husband' || p === 'father,daughter,spouse' || p === 'mother,daughter,spouse') {
      const sisterId = pathIds[1];
      const sister = allMembers[sisterId];
      if (sister) {
          return isOlder(sister, root) ? '姊夫' : '妹夫';
      }
      return isOlder(target, root) ? '姊夫' : '妹夫';
  }

  // --- 2. Grand & Great-Grand Parents ---
  if (p === 'father,father') return '爺爺';
  if (p === 'father,mother') return '奶奶';
  if (p === 'mother,father') return '外公';
  if (p === 'mother,mother') return '外婆';
  
  if (p === 'father,father,father') return '阿祖 (曾祖父)';
  if (p === 'father,father,mother') return '阿祖 (曾祖母)';
  if (p === 'father,mother,father') return '阿祖 (曾外祖父)';
  if (p === 'father,mother,mother') return '阿祖 (曾外祖母)';
  
  if (path.length >= 4 && path.slice(0,4).every(s => s === 'father')) return '太祖';

  // --- 2.5 Descendants ---
  if (p === 'son,son') return '孫子';
  if (p === 'son,daughter') return '孫女';
  if (p === 'daughter,son') return '外孫';
  if (p === 'daughter,daughter') return '外孫女';
  
  if (p === 'son,son,son') return '曾孫';
  if (p === 'son,son,daughter') return '曾孫女';

  // --- 3. Siblings (With Ranking) ---
  if (p === 'father,son' || p === 'mother,son') {
      const siblings = findSiblings(root.id).filter(m => m.gender === 'male');
      const type = isOlder(target, root) ? 'older_brother' : 'younger_brother';
      const rank = calculateSiblingRank(target.id, siblings, type);
      return rank || (type === 'older_brother' ? '哥哥' : '弟弟');
  }
  if (p === 'father,daughter' || p === 'mother,daughter') {
      const siblings = findSiblings(root.id).filter(m => m.gender === 'female');
      const type = isOlder(target, root) ? 'older_sister' : 'younger_sister';
      const rank = calculateSiblingRank(target.id, siblings, type);
      return rank || (type === 'older_sister' ? '姊姊' : '妹妹');
  }

  // --- 4. Nephews/Nieces ---
  if (p === 'father,son,son' || p === 'mother,son,son' || p === 'father,son,daughter' || p === 'mother,son,daughter') {
     return target.gender === 'male' ? '姪子' : '姪女';
  }
  if (p === 'father,daughter,son' || p === 'mother,daughter,son' || p === 'father,daughter,daughter' || p === 'mother,daughter,daughter') {
     return target.gender === 'male' ? '外甥' : '外甥女';
  }

  // --- 5. Parents' Siblings (Uncles/Aunts) ---
  const isUncleAunt = p === 'father,father,son' || p === 'father,mother,son' || 
                      p === 'father,father,daughter' || p === 'father,mother,daughter' || 
                      p === 'mother,father,son' || p === 'mother,mother,son' || 
                      p === 'mother,father,daughter' || p === 'mother,mother,daughter';
                      
  if (isUncleAunt) {
      if (p.startsWith('father')) {
           if (p.endsWith('son')) {
                const fatherRel = allRels.find(r => r.targetMemberId === root.id && r.type === 'parent' && allMembers[r.sourceMemberId]?.gender === 'male');
                const father = fatherRel ? allMembers[fatherRel.sourceMemberId] : null;
                if (father) return isOlder(target, father) ? '伯伯' : '叔叔';
                return '伯叔';
           } 
           return '姑姑';
      }
      if (p.startsWith('mother')) {
          if (p.endsWith('son')) return '舅舅';
          return '阿姨';
      }
  }

  // Uncle's Wife / Aunt's Husband
  if (p.match(/^father,(father|mother),son,(wife|spouse)$/)) return '嬸嬸/伯母';
  if (p.match(/^father,(father|mother),daughter,(husband|spouse)$/)) return '姑丈';
  
  if (p.match(/^mother,(father|mother),son,(wife|spouse)$/)) return '舅媽';
  
  // Aunt (Mother's Sister) Husband -> 姨丈
  if (p.match(/^mother,(father|mother),daughter,(husband|spouse)$/)) return '姨丈';


  // --- 6. Cousins (Step 1: Identify Cousin) ---
  const isCousin = p.match(/^(father|mother),(father|mother),(son|daughter),(son|daughter)$/);
  
  if (isCousin) {
      // Tang or Biao?
      const isTang = p.match(/^father,(father,son|mother,son),(son|daughter)$/);
      const isOlderCousin = isOlder(target, root);
      const isMale = target.gender === 'male';
      
      if (isTang) {
          if (isMale) return isOlderCousin ? '堂哥' : '堂弟';
          return isOlderCousin ? '堂姊' : '堂妹';
      } else {
          // Biao
          if (isMale) return isOlderCousin ? '表哥' : '表弟';
          return isOlderCousin ? '表姊' : '表妹';
      }
  }

  // --- 6.1 Cousin Spouses ---
  // Path: Cousin + Spouse (5 steps). PathIds size = 5 (indices 0..4)
  // [Parent, GrandP, Uncle/Aunt, Cousin, Spouse]
  // Cousin is at PathIds[3]
  if (p.match(/^(father|mother),(father|mother),(son|daughter),(son|daughter),(wife|husband|spouse)$/)) {
      const cousinId = pathIds[3];
      const cousin = allMembers[cousinId];
      
      const cousinPath = path.slice(0, 4).join(',');
      const isTang = cousinPath.match(/^father,(father,son|mother,son),(son|daughter)$/);
      const prefix = isTang ? '堂' : '表';
      
      const isSpouseMale = target.gender === 'male'; 
      // Compare Cousin's Age to Root
      const cousinIsOlder = cousin ? isOlder(cousin, root) : false; // Default false

      if (isSpouseMale) {
          return cousinIsOlder ? `${prefix}姊夫` : `${prefix}妹夫`;
      } else {
          return cousinIsOlder ? `${prefix}嫂` : `${prefix}弟媳`;
      }
  }

  // --- 6.2 Cousin Children ---
  // Path: Cousin + Child (5 steps)
  if (p.match(/^(father|mother),(father|mother),(son|daughter),(son|daughter),(son|daughter)$/)) {
      const cousinGenderStep = path[3]; // GENDER STEP, NOT ID.
      const isCousinMale = cousinGenderStep === 'son'; // Was Cousin a son or daughter?
      
      const cousinPath = path.slice(0, 4).join(',');
      const isTang = cousinPath.match(/^father,(father,son|mother,son),(son|daughter)$/);
      const prefix = isTang ? '堂' : '表';
      
      const isChildMale = target.gender === 'male';
      const base = isCousinMale ? (isChildMale ? '姪' : '姪女') : (isChildMale ? '外甥' : '外甥女');
      
      return `${prefix}${base}`;
  }


  // --- 7. In-Laws (Simplified generic) ---
  const firstStep = path[0];
  const isSpouseStart = firstStep === 'husband' || firstStep === 'wife' || firstStep === 'spouse';
  
  if (isSpouseStart && path.length > 1) {
      const remainingPath = path.slice(1).join(',');
      const spouseLabel = firstStep === 'husband' ? '老公' : firstStep === 'wife' ? '老婆' : '配偶';

      if (remainingPath === 'father') return firstStep === 'husband' ? '公公' : '岳父';
      if (remainingPath === 'mother') return firstStep === 'husband' ? '婆婆' : '岳母';

      if (remainingPath === 'brother' || remainingPath === 'father,son' || remainingPath === 'mother,son') {
          return `${spouseLabel}的兄弟`;
      }
  }
  
  // --- 8. Children's Spouses ---
  if (p === 'son,wife' || p === 'son,spouse') return '媳婦';
  if (p === 'daughter,husband' || p === 'daughter,spouse') return '女婿';

  // Fallback for distant
  if (path.length >= 6) return '遠親';

  return '親戚'; 
};
