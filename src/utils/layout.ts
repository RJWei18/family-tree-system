import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { Member, Relationship } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 220;
const MEMBER_WIDTH = 120; // Visual width of avatar node approx (matches index.css .family-node-container)
const HEART_WIDTH = 32;   // Visual width of heart node

export const buildGraph = (
  members: Record<string, Member>,
  relationships: Relationship[]
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. Identify Marriage Clusters (Connected Components of Spouses)
  // Adjacency list for spouses
  const adj: Record<string, string[]> = {};
  Object.keys(members).forEach(id => { adj[id] = []; });

  const spouseEdges: Array<{ a: string, b: string }> = [];

  relationships.forEach(r => {
    if (r.type === 'spouse') {
      const a = r.sourceMemberId;
      const b = r.targetMemberId;
      if (adj[a] && !adj[a].includes(b)) adj[a].push(b);
      if (adj[b] && !adj[b].includes(a)) adj[b].push(a);
      spouseEdges.push({ a, b });
    }
  });

  const visited = new Set<string>();
  const marriageGroups: Array<string[]> = []; // Array of arrays of member IDs
  const memberToGroupId: Record<string, string> = {};

  Object.keys(members).forEach(memberId => {
    if (visited.has(memberId)) return;

    // If this member has no spouse, they might be single. 
    // If they have spouses, traverse to find the whole cluster.
    if (adj[memberId].length === 0) {
      // Single person (or not connected via marriage logic yet)
      visited.add(memberId);
      return;
    }

    // BFS for connected component
    const cluster: string[] = [];
    const queue = [memberId];
    visited.add(memberId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      cluster.push(curr);

      adj[curr]?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    marriageGroups.push(cluster);
  });

  // 2. Create Group Nodes & Heart Nodes
  marriageGroups.forEach(cluster => {
    // Sort cluster for deterministic order (e.g. by DOB or ID)
    cluster.sort();

    const groupId = `group_${cluster.join('_')}`;
    // Slot width = 180.
    const SLOT_WIDTH = 180;
    const groupWidth = cluster.length * SLOT_WIDTH;
    const groupHeight = 250; // Enough for node + heart

    // Register Group Node
    nodes.push({
      id: groupId,
      type: 'FamilyGroup',
      data: { label: '' },
      position: { x: 0, y: 0 }, // Will be set by Dagre
      style: { width: groupWidth, height: groupHeight }, // Explicit size for React Flow
    });

    cluster.forEach((mId, index) => {
      memberToGroupId[mId] = groupId;

      // Add Member Node
      // Position relative to Group
      const xOffset = index * SLOT_WIDTH + (SLOT_WIDTH - MEMBER_WIDTH) / 2 + 20; // +20 padding
      const yOffset = 50; // Padding top

      nodes.push({
        id: mId,
        type: 'custom',
        data: members[mId],
        position: { x: xOffset, y: yOffset },
        parentNode: groupId,
        extent: 'parent', // Constrain to group
      });
    });

    // Add Hearts for pairs
    // Iterate all unique pairs in this cluster that are actually spouses
    const pairs = spouseEdges.filter(p => cluster.includes(p.a) && cluster.includes(p.b));
    const processedPairs = new Set<string>();

    pairs.forEach(pair => {
      const [u, v] = [pair.a, pair.b].sort();
      const pairKey = `${u}_${v}`;
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      // Where to put the heart? 
      // Midpoint of U and V in the group.
      const idxU = cluster.indexOf(u);
      const idxV = cluster.indexOf(v);

      if (idxU === -1 || idxV === -1) return; // Should not happen

      // Calculate relative position
      const xU = idxU * SLOT_WIDTH + (SLOT_WIDTH - MEMBER_WIDTH) / 2 + 20;
      const xV = idxV * SLOT_WIDTH + (SLOT_WIDTH - MEMBER_WIDTH) / 2 + 20;

      // GEOMETRIC CENTER FORMULA (User Requested)
      // Formula: (x1 + x2)/2 + (MEMBER_WIDTH - HEART_WIDTH)/2
      const midX = (xU + xV) / 2 + (MEMBER_WIDTH - HEART_WIDTH) / 2;

      // FIXED HEART Y: Must line up with CustomNode handles at top: 40px.
      // Member Y = 50. Handle Y = 90.
      // Heart Top Y = 90 - 16 = 74.
      const midY = 74;

      const uData = members[u];
      const vData = members[v];

      // Determine Variant
      const uDead = uData.status === '殁' || uData.status === 'Deceased' || !!uData.dateOfDeath;
      const vDead = vData.status === '殁' || vData.status === 'Deceased' || !!vData.dateOfDeath;

      let variant = 'active';
      if (uDead && vDead) variant = 'deceased'; // both deceased
      else if (uDead || vDead) variant = 'widowed'; // one deceased

      const heartId = `heart_${pairKey}`;

      nodes.push({
        id: heartId,
        type: 'heart', // Registered as 'heartAnchor' or 'heart'
        data: { variant },
        position: { x: midX, y: midY },
        parentNode: groupId,
        draggable: false,
      });

      const edgeId = `edge_${u}_${v}`;

      // Let's fix handle based on Order
      // If idxU < idxV: U is Left, V is Right.
      // Connection: U(Right handle) -> V(Left handle)

      const leftId = idxU < idxV ? u : v;
      const rightId = idxU < idxV ? v : u;

      edges.push({
        id: edgeId,
        source: leftId,
        target: rightId,
        sourceHandle: 'right', // Explicit handle ID
        targetHandle: 'left',  // Explicit handle ID
        type: 'straight',
        style: {
          stroke: variant === 'deceased' ? '#78716C' : '#F59E0B',
          strokeWidth: 2,
          strokeDasharray: variant === 'deceased' ? '5,5' : undefined,
          opacity: variant === 'deceased' ? 0.5 : 1
        },
        zIndex: 1 // Behind nodes
      });
    });
  });

  // 3. Add Single Nodes (Visiting those not in clusters)
  Object.values(members).forEach(m => {
    if (!memberToGroupId[m.id]) {
      nodes.push({
        id: m.id,
        type: 'custom',
        data: m,
        position: { x: 0, y: 0 }
      });
    }
  });

  // 4. Edges: Parent -> Child
  relationships.forEach(r => {
    if (r.type === 'parent') {
      // Find valid source (Heart if couple, Member if single)
      let sourceId = r.sourceMemberId;
      let sourceHandle = 'bottom'; // Default to bottom for single parents, will be overridden for hearts

      // Locate 'Other Parent' to find the Heart
      const otherParentRel = relationships.find(rel =>
        rel.type === 'parent' &&
        rel.targetMemberId === r.targetMemberId &&
        rel.sourceMemberId !== r.sourceMemberId
      );

      if (otherParentRel) {
        const [p1, p2] = [r.sourceMemberId, otherParentRel.sourceMemberId].sort();
        const pairKey = `${p1}_${p2}`;
        const heartId = `heart_${pairKey}`;

        // Check adjacency
        if (adj[p1]?.includes(p2)) {
          sourceId = heartId;
          sourceHandle = 'source'; // Heart bottom handle
        }
      }

      // If Source is the Heart, it's inside a Group.
      const isHeart = sourceId.startsWith('heart_');

      // Determine Deceased Status based on Source
      let isSourceDeceased = false;
      if (isHeart) {
        // If source is Heart, check if it's 'deceased' variant 
        // Logic: Heart is only deceased if BOTH parents are deceased.
        const heartNode = nodes.find(n => n.id === sourceId);
        if (heartNode && heartNode.data.variant === 'deceased') {
          isSourceDeceased = true;
        }
      } else {
        // Single parent
        const parent = members[sourceId];
        if (parent && (parent.status === '殁' || parent.status === 'Deceased' || !!parent.dateOfDeath)) {
          isSourceDeceased = true;
        }
      }

      // Add Edge
      const edgeId = `edge_lineage_${sourceId}_${r.targetMemberId}`;
      if (!edges.find(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: sourceId,
          target: r.targetMemberId,
          sourceHandle: isHeart ? 'bottom' : sourceHandle, // Explicit strict check: Use 'bottom' for Heart
          targetHandle: 'top', // Explicit 'top' handle for child
          type: 'smoothstep', // Vertical departure
          style: {
            stroke: '#8D6E63',
            strokeWidth: 2,
            strokeDasharray: isSourceDeceased ? '5,5' : undefined,
            opacity: isSourceDeceased ? 0.6 : 1
          },
          // SHORTEST PATH VERTICAL: Offset ensures it drops down before turning
          pathOptions: { borderRadius: 20, offset: 25 }
        });
      }
    }
  });

  return { nodes, edges };
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: 'TB',
    ranker: 'tight-tree',
    nodesep: 80, // Increased to 80px as requested to prevent overlap
    ranksep: 100
  });

  // 1. Add Nodes to Dagre
  // We only track Top-Level nodes (groups and singles)
  nodes.forEach(node => {
    if (node.parentNode) return; // Skip children

    dagreGraph.setNode(node.id, {
      width: node.style?.width ? Number(node.style.width) : NODE_WIDTH,
      height: node.style?.height ? Number(node.style.height) : NODE_HEIGHT
    });
  });

  // 2. Add Edges to Dagre
  edges.forEach(edge => {
    // We need to map source/target to their Top-Level Containers
    const getTopLevelId = (id: string) => {
      const node = nodes.find(n => n.id === id);
      if (node?.parentNode) return node.parentNode;
      return id;
    };

    const sourceId = getTopLevelId(edge.source);
    const targetId = getTopLevelId(edge.target);

    if (sourceId && targetId && sourceId !== targetId) {
      // WEIGHT ADJUSTMENT
      // High weight to keep vertical alignment, but relying on Dagre for spacing
      let weight = 1;
      if (edge.type === 'smoothstep') {
        weight = 20; // Strong priority, but not extreme (was 100)
      } else if (edge.type === 'straight') {
        weight = 5;  // Spouse
      }

      dagreGraph.setEdge(sourceId, targetId, { weight });
    }
  });

  dagre.layout(dagreGraph);

  // 3. Apply positions
  const newNodes = nodes.map(node => {
    if (node.parentNode) {
      // It's a child. Keep its relative position.
      return node;
    }

    const pos = dagreGraph.node(node.id);
    if (!pos) return node;

    return {
      ...node,
      position: {
        x: pos.x - (node.style?.width ? Number(node.style.width) / 2 : NODE_WIDTH / 2),
        y: pos.y - (node.style?.height ? Number(node.style.height) / 2 : NODE_HEIGHT / 2),
      }
    };
  });

  return { nodes: newNodes, edges };
};
