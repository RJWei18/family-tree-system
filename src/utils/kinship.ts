import type { Member, Relationship } from '../types';

type RelationStep = 'father' | 'mother' | 'son' | 'daughter' | 'brother' | 'sister' | 'husband' | 'wife' | 'spouse';

interface GraphNode {
  id: string;
  edges: { target: string; type: RelationStep }[];
}

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
      // Source is parent of target
      const childType = target.gender === 'male' ? 'son' : target.gender === 'female' ? 'daughter' : 'son';
      graph[rel.sourceMemberId].edges.push({ target: rel.targetMemberId, type: childType });

      // Target is child of source
      const parentType = source.gender === 'male' ? 'father' : 'mother';
      graph[rel.targetMemberId].edges.push({ target: rel.sourceMemberId, type: parentType });
    } else if (rel.type === 'spouse') {
      const spType1 = target.gender === 'male' ? 'husband' : target.gender === 'female' ? 'wife' : 'spouse';
      const spType2 = source.gender === 'male' ? 'husband' : source.gender === 'female' ? 'wife' : 'spouse';
      
      graph[rel.sourceMemberId].edges.push({ target: rel.targetMemberId, type: spType1 });
      graph[rel.targetMemberId].edges.push({ target: rel.sourceMemberId, type: spType2 });
    }
  });

  // 2. BFS
  // Allow slightly deeper search for in-laws
  const MAX_DEPTH = 5;
  const queue: { id: string; path: RelationStep[] }[] = [{ id: rootId!, path: [] }];
  const visited = new Set<string>([rootId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    if (id === targetId) {
      return mapPathToTitle(path, members[targetId], members[rootId]);
    }

    if (path.length >= MAX_DEPTH) continue;

    const node = graph[id];
    if (!node) continue;

    for (const edge of node.edges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push({ id: edge.target, path: [...path, edge.type] });
      }
    }
  }

  return ''; // No relationship found or too distant
};

const mapPathToTitle = (path: RelationStep[], target: Member, root: Member): string => {
  if (path.length === 0) return '本人';
  const p = path.join(',');

  // --- 1. Direct Relationships ---
  if (p === 'father') return '爸爸';
  if (p === 'mother') return '媽媽';
  if (p === 'son') return '兒子';
  if (p === 'daughter') return '女兒';
  if (p === 'husband') return '老公';
  if (p === 'wife') return '老婆';
  if (p === 'spouse') return '配偶';

  // --- 2. Grandparents ---
  if (p === 'father,father') return '爺爺';
  if (p === 'father,mother') return '奶奶';
  if (p === 'mother,father') return '外公';
  if (p === 'mother,mother') return '外婆';
  
  // --- 2.5 Grandchildren (New Request) ---
  if (p === 'son,son') return '孫子';
  if (p === 'son,daughter') return '孫女';
  if (p === 'daughter,son') return '外孫';
  if (p === 'daughter,daughter') return '外孫女';

  // --- 3. Siblings ---
  if (p === 'father,son' || p === 'mother,son') return isOlder(target, root) ? '哥哥' : '弟弟';
  if (p === 'father,daughter' || p === 'mother,daughter') return isOlder(target, root) ? '姊姊' : '妹妹';

  // --- 4. Uncles / Aunts ---
  // Father's side
  if (p === 'father,father,son' || p === 'father,mother,son') return '伯伯/叔叔';
  if (p === 'father,father,daughter' || p === 'father,mother,daughter') return '姑姑';
  // Mother's side
  if (p === 'mother,father,son' || p === 'mother,mother,son') return '舅舅';
  if (p === 'mother,father,daughter' || p === 'mother,mother,daughter') return '阿姨';

  // --- 5. In-Laws ---
  const firstStep = path[0];
  const isSpouseStart = firstStep === 'husband' || firstStep === 'wife' || firstStep === 'spouse';
  
  if (isSpouseStart && path.length > 1) {
      const remainingPath = path.slice(1).join(',');
      const spouseLabel = firstStep === 'husband' ? '老公' : firstStep === 'wife' ? '老婆' : '配偶';

      // Parents-in-law
      if (remainingPath === 'father') return firstStep === 'husband' ? '公公' : '岳父';
      if (remainingPath === 'mother') return firstStep === 'husband' ? '婆婆' : '岳母';

      // Siblings-in-law
      // Try to be more specific if possible by looking at the full path structure
      // e.g. "father,son" relative to spouse means spouse's sibling
      // Simple mapping for now
      const simpleTitle = mapSimpleTitle(remainingPath);
      if (simpleTitle) {
          return `${spouseLabel}的${simpleTitle}`;
      }
      
      return `${spouseLabel}的親戚`;
  }
  
  // --- 6. Children's Spouses ---
  if (p === 'son,wife' || p === 'son,spouse') return '媳婦';
  if (p === 'daughter,husband' || p === 'daughter,spouse') return '女婿';

  return '親戚'; 
};

// Helper for simple mapping without age checks
const mapSimpleTitle = (p: string): string | null => {
    if (p === 'father') return '爸爸';
    if (p === 'mother') return '媽媽';
    if (p === 'father,father') return '爺爺';
    if (p === 'father,mother') return '奶奶';
    if (p === 'mother,father') return '外公';
    if (p === 'mother,mother') return '外婆';
    
    // Siblings (generic)
    if (p === 'father,son' || p === 'mother,son') return '兄弟';
    if (p === 'father,daughter' || p === 'mother,daughter') return '姊妹';

    return null;
}

const isOlder = (a: Member, b: Member): boolean => {
  if (!a.dateOfBirth || !b.dateOfBirth) return true; // Default to older if unknown
  return new Date(a.dateOfBirth) < new Date(b.dateOfBirth);
};
