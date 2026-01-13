import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { Member, Relationship } from '../types';

const nodeWidth = 280;
const nodeHeight = 100;

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Helper to map node ID to its "Layout Group ID"
  // For spouses, we group them into a single "Couple Node" for Dagre.
  // Format: "couple_A_B"
  const nodeToGroupMap: Record<string, string> = {};
  const groupToNodesMap: Record<string, string[]> = {};

  // 1. Identify Groups via Marriage Nodes
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

  // 2. Set Nodes for Dagre (Grouped or Single)
  const processedGroups = new Set<string>();

  nodes.forEach((node) => {
    const groupId = nodeToGroupMap[node.id];

    if (groupId) {
      if (!processedGroups.has(groupId)) {
        // Create ONE simplified node for the whole couple in Dagre
        // Width = 2 * nodeWidth + spacing
        dagreGraph.setNode(groupId, { width: nodeWidth * 2 + 100, height: nodeHeight });
        processedGroups.add(groupId);
      }
    } else {
      // Individual node
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  // 3. Set Edges for Dagre
  edges.forEach((edge) => {
    // Retarget edges to Group IDs if applicable
    const source = nodeToGroupMap[edge.source] || edge.source;
    const target = nodeToGroupMap[edge.target] || edge.target;

    // Avoid self-loops (internal edges within a couple)
    if (source !== target) {
      dagreGraph.setEdge(source, target);
    }
  });

  dagre.layout(dagreGraph);

  // 4. Update Node Positions
  const layoutedNodes = nodes.map((node) => {
    const groupId = nodeToGroupMap[node.id];

    if (groupId) {
      // Position relative to group
      const groupPos = dagreGraph.node(groupId);
      // groupPos is center of the group

      // Structure: [SpouseA] [MarriageNode] [SpouseB]
      const [spouseA, spouseB, marriageId] = groupToNodesMap[groupId];

      let offsetX = 0;
      const totalWidth = nodeWidth * 2 + 100;
      const startX = groupPos.x - totalWidth / 2;

      if (node.id === spouseA) {
        // Left
        offsetX = startX + nodeWidth / 2;
      } else if (node.id === spouseB) {
        // Right
        offsetX = startX + nodeWidth + 100 - nodeWidth / 2 + nodeWidth; // Wait, simple math
        // Left Node Center: startX + nodeWidth/2
        // Right Node Center: startX + nodeWidth + 100 + nodeWidth/2

        offsetX = startX + nodeWidth + 100 + nodeWidth / 2;
      } else if (node.id === marriageId) {
        // Center
        offsetX = groupPos.x;
      }

      const isMarriage = node.id.startsWith('marriage_');
      return {
        ...node,
        position: {
          x: offsetX - (isMarriage ? 10 : nodeWidth / 2),
          y: groupPos.y - (isMarriage ? 10 : nodeHeight / 2),
        },
        style: isMarriage ? { opacity: 0.5, width: 20, height: 20, background: '#ec4899', borderRadius: '50%' } : undefined
      };

    } else {
      // Standard single node
      const nodeWithPosition = dagreGraph.node(node.id);
      const x = nodeWithPosition ? nodeWithPosition.x : 0;
      const y = nodeWithPosition ? nodeWithPosition.y : 0;

      return {
        ...node,
        position: {
          x: x - nodeWidth / 2,
          y: y - nodeHeight / 2,
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
        style: { stroke: '#ec4899', strokeWidth: 2 }
      });
      edges.push({
        id: `edge_${r.targetMemberId}_${mId}`,
        source: r.targetMemberId,
        target: mId,
        sourceHandle: 'left', // Connect from Left side of Spouse
        targetHandle: null,   // To Center of Marriage Node
        style: { stroke: '#ec4899', strokeWidth: 2 }
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
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      });
    }
  });

  return { nodes, edges };
};
