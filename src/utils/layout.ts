import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { Member, Relationship } from '../types';

const nodeWidth = 160; // Reduced from 280 (Node is 120px)
const nodeHeight = 180; // Increased spacing for tree height

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Increase spacing to prevent children from overlapping neighbors
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 200, // Vertical spacing between generations
    nodesep: 150, // Horizontal spacing between sibling groups
    edgesep: 50   // Spacing between edges
  });

  const nodeToGroupMap: Record<string, string> = {};
  const groupToNodesMap: Record<string, string[]> = {};

  nodes.forEach(node => {
    if (node.id.startsWith('marriage_')) {
      const parts = node.id.replace('marriage_', '').split('_');
      const [spouseA, spouseB] = parts;
      const groupId = `group_${parts.join('_')}`;

      nodeToGroupMap[spouseA] = groupId;
      nodeToGroupMap[spouseB] = groupId;
      nodeToGroupMap[node.id] = groupId;
      groupToNodesMap[groupId] = [spouseA, spouseB, node.id];
    }
  });

  const processedGroups = new Set<string>();

  nodes.forEach((node) => {
    const groupId = nodeToGroupMap[node.id];
    if (groupId) {
      if (!processedGroups.has(groupId)) {
        // Couple Group Width: 2 Nodes + 40px spacing
        // Width = 120 (Node) + 40 (Space) + 120 (Node) = 280
        // We use slightly larger for Dagre buffer
        dagreGraph.setNode(groupId, { width: 320, height: nodeHeight });
        processedGroups.add(groupId);
      }
    } else {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  edges.forEach((edge) => {
    const source = nodeToGroupMap[edge.source] || edge.source;
    const target = nodeToGroupMap[edge.target] || edge.target;
    if (source !== target) {
      dagreGraph.setEdge(source, target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const groupId = nodeToGroupMap[node.id];

    if (groupId) {
      const groupPos = dagreGraph.node(groupId);
      const [spouseA, spouseB, marriageId] = groupToNodesMap[groupId];

      // Layout: [SpouseA] - 40px - [SpouseB]
      // MarriageNode in exact center

      const center = groupPos.x;
      const spacing = 40;
      const explicitNodeWidth = 120; // Visual width

      // Spouse A (Left) center = GroupCenter - (Spacing/2) - (NodeWidth/2)
      // Spouse B (Right) center = GroupCenter + (Spacing/2) + (NodeWidth/2)
      // Marriage Node = GroupCenter

      let newX = center;

      if (node.id === spouseA) {
        newX = center - (spacing / 2) - (explicitNodeWidth / 2);
      } else if (node.id === spouseB) {
        newX = center + (spacing / 2) + (explicitNodeWidth / 2);
      } else if (node.id === marriageId) {
        newX = center;
      }

      const isMarriage = node.id.startsWith('marriage_');
      return {
        ...node,
        position: {
          x: newX - (isMarriage ? 10 : explicitNodeWidth / 2), // Adjust for anchor (top-left vs center)
          // Note: ReactFlow position is Top-Left by default. 
          // If we want 'newX' to be the center, we subtract half width.
          // Node visual width 120. Marriage node width 20.

          y: groupPos.y - (nodeHeight / 2),
        },
        style: isMarriage ? {
          opacity: 1, // Make it visible for debugging, or keep semi-visible as connector
          width: 20, height: 20, background: '#8D6E63', borderRadius: '50%', border: '2px solid white', zIndex: 0
        } : undefined
      };
    } else {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }
  });

  return { nodes: layoutedNodes, edges };
};

export const buildGraph = (
  members: Record<string, Member>,
  relationships: Relationship[]
) => {
  // 0. Nodes Base
  let nodes: Node[] = Object.values(members).map(m => ({
    id: m.id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: m
  }));

  const edges: Edge[] = [];
  const marriageNodes: Record<string, string> = {}; // key: sorted_ids, value: nodeId

  // 1. Process Spouses -> Create Virtual Marriage Nodes
  relationships.forEach(r => {
    if (r.type === 'spouse') {
      const ids = [r.sourceMemberId, r.targetMemberId].sort();
      const key = ids.join('_');

      if (!marriageNodes[key]) {
        const marriageId = `marriage_${key}`;
        marriageNodes[key] = marriageId;

        // Add Virtual Node
        nodes.push({
          id: marriageId,
          type: 'default', // Using default dot node for now, or 'output'
          data: { label: '' },
          position: { x: 0, y: 0 },
          draggable: true // Allow dragging
        });
      }

      // Edges from Partners to Marriage Node (Spouse Relationship)
      const mId = marriageNodes[key];

      // Determine Left/Right based on sorted IDs or simply use Left->Right logic
      // Ideally, the left node connects to its Right Handle, and right node to Left Handle.
      // But Dagre sorting might flip them. 
      // Simplified: Just use side handles for both.

      edges.push({
        id: `edge_${r.sourceMemberId}_${mId}`,
        source: r.sourceMemberId,
        target: mId,
        sourceHandle: 'right', // Connect from Right side of Spouse
        targetHandle: null,    // To Center of Marriage Node
        style: { stroke: '#8D6E63', strokeWidth: 2 }
      });
      edges.push({
        id: `edge_${r.targetMemberId}_${mId}`,
        source: r.targetMemberId,
        target: mId,
        sourceHandle: 'left', // Connect from Left side of Spouse
        targetHandle: null,   // To Center of Marriage Node
        style: { stroke: '#8D6E63', strokeWidth: 2 }
      });
    }
  });

  // 2. Process Parent-Child -> Route through Marriage Node if applicable
  // Sort logic remains for siblings ordering
  const sortedRelationships = [...relationships].sort((a, b) => {
    if (a.type !== 'parent' || b.type !== 'parent') return 0;
    if (a.sourceMemberId === b.sourceMemberId) {
      const childA = members[a.targetMemberId];
      const childB = members[b.targetMemberId];
      const da = childA?.dateOfBirth ? new Date(childA.dateOfBirth).getTime() : Infinity;
      const db = childB?.dateOfBirth ? new Date(childB.dateOfBirth).getTime() : Infinity;
      return da - db;
    }
    return 0;
  });

  sortedRelationships.forEach(r => {
    if (r.type === 'parent') {
      // Check if parent has a spouse? 
      // Ideally we find the "Marriage Node" that represents [Parent + OtherParent].
      // But here we only have "Parent -> Child". We need to know who the other parent is to find the marriage node.
      // We can search the relationship list for another parent of this child?

      const otherParentRel = relationships.find(rel =>
        rel.type === 'parent' &&
        rel.targetMemberId === r.targetMemberId &&
        rel.sourceMemberId !== r.sourceMemberId
      );

      let sourceId = r.sourceMemberId;

      if (otherParentRel) {
        const ids = [r.sourceMemberId, otherParentRel.sourceMemberId].sort();
        const key = ids.join('_');
        if (marriageNodes[key]) {
          sourceId = marriageNodes[key];
          // Check if we already added the edge from MarriageNode -> Child
          if (edges.find(e => e.source === sourceId && e.target === r.targetMemberId)) {
            return; // Already added
          }
        }
      }

      edges.push({
        id: r.id,
        source: sourceId,
        target: r.targetMemberId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#8D6E63', strokeWidth: 2 }
      });
    }
  });

  return { nodes, edges };
};
