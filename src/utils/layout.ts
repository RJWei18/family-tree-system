import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { Member, Relationship } from '../types';

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
          type: 'virtual', // Use custom virtual node
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

      // Use sorted IDs to determine left/right position
      const sortedIds = [r.sourceMemberId, r.targetMemberId].sort();
      const [leftSpouseId] = sortedIds;

      const edgeIdSpouseA = `edge_${r.sourceMemberId}_${mId}`;
      const edgeIdSpouseB = `edge_${r.targetMemberId}_${mId}`;

      // Helper to determin handle
      const getHandle = (nodeId: string) => nodeId === leftSpouseId ? 'right' : 'left';

      // Check if edges already exist to avoid duplicates
      if (!edges.find(e => e.id === edgeIdSpouseA)) {
        edges.push({
          id: edgeIdSpouseA,
          source: r.sourceMemberId,
          target: mId,
          sourceHandle: getHandle(r.sourceMemberId), // If Left Spouse, connect from Right
          targetHandle: 't', // Connect to Top/Target handle of Virtual Node
          type: 'straight', // Force straight line for T-shape
          style: { stroke: '#8D6E63', strokeWidth: 2 }
        });
      }

      if (!edges.find(e => e.id === edgeIdSpouseB)) {
        edges.push({
          id: edgeIdSpouseB,
          source: r.targetMemberId,
          target: mId,
          sourceHandle: getHandle(r.targetMemberId), // If Right Spouse, connect from Left
          targetHandle: 't', // Connect to Top/Target handle of Virtual Node
          type: 'straight', // Force straight line for T-shape
          style: { stroke: '#8D6E63', strokeWidth: 2 }
        });
      }
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

      const isMarriage = sourceId.startsWith('marriage_');

      // Prevent duplicate edges
      const edgeId = `edge_${sourceId}_${r.targetMemberId}`;
      if (edges.find(e => e.id === edgeId)) return;

      edges.push({
        id: edgeId, // Use deterministic ID instead of r.id which might be unique per relationship entry but maps to same visual edge
        source: sourceId,
        target: r.targetMemberId,
        sourceHandle: isMarriage ? 's' : null, // If connection from marriage node, use Bottom/'s' handle
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#8D6E63', strokeWidth: 2 }
      });
    }
  });

  return { nodes, edges };
};

export const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220; // Enough for node + spacing
  const nodeHeight = 220; // Height of node slot

  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 200 });

  // Helpers to identify groups
  const nodeToGroupMap: Record<string, string> = {};
  const groupToNodesMap: Record<string, string[]> = {};

  nodes.forEach(node => {
    if (node.id.startsWith('marriage_')) {
      // It's a virtual node (marriage center)
      // We can find who belongs to this marriage based on ID?
      // Actually, we grouped spouses in 'buildGraph' but didn't assign them a group ID property in the node object itself
      // We need to infer groups from the marriage ID or vice versa.
    }
  });

  // Re-scan edges to define groups (Spouse + Spouse + MarriageNode)
  // Or simpler: Iterate nodes. If node is spouse, find if they have a marriage node connected.

  // Strategy:
  // 1. Identify "Marriage Groups": [SpouseA, SpouseB, MarriageNode]
  //    - MarriageNode ID: `marriage_SpouseA_SpouseB` (sorted)
  //    - Nodes: SpouseA, SpouseB, MarriageNode.

  nodes.forEach(node => {
    if (node.id.startsWith('marriage_')) {
      const parts = node.id.replace('marriage_', '').split('_');
      const groupName = `group_${parts.join('_')}`;

      parts.forEach(memberId => {
        nodeToGroupMap[memberId] = groupName;
        if (!groupToNodesMap[groupName]) groupToNodesMap[groupName] = [];
        if (!groupToNodesMap[groupName].includes(memberId)) groupToNodesMap[groupName].push(memberId);
      });

      // Also add the marriage node itself to the group
      nodeToGroupMap[node.id] = groupName;
      if (!groupToNodesMap[groupName]) groupToNodesMap[groupName] = [];
      groupToNodesMap[groupName].push(node.id);
    }
  });

  nodes.forEach((node) => {
    // Check if node is part of a group
    const groupId = nodeToGroupMap[node.id];
    if (groupId) {
      // If it's a group member, we don't set it individually in Dagre
      // We set the GROUP node instead below
    } else {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  // Set Group Nodes in Dagre
  Object.keys(groupToNodesMap).forEach(groupId => {
    // Group width = 2 * SpouseWidth + Spacing
    // 120 * 2 + 40 = 280. + Padding = 320.
    dagreGraph.setNode(groupId, { width: 320, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Map edges to Groups if nodes are in groups
    const sourceGroup = nodeToGroupMap[edge.source] || edge.source;
    const targetGroup = nodeToGroupMap[edge.target] || edge.target;

    if (sourceGroup !== targetGroup) {
      dagreGraph.setEdge(sourceGroup, targetGroup);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    // If node is in a group, position it relative to group
    const groupId = nodeToGroupMap[node.id];
    if (groupId) {
      const groupPos = dagreGraph.node(groupId);

      const parts = groupId.replace('group_', '').split('_');
      // parts is sorted IDs: [SmallerID, LargerID] aka [SpouseA, SpouseB]
      // SpouseA is LEFT. SpouseB is RIGHT.
      const spouseA = parts[0];
      const spouseB = parts[1];
      const marriageId = `marriage_${groupId.replace('group_', '')}`;

      const spacing = 40;
      const explicitNodeWidth = 120; // Visual width

      // Geometric Logic:
      // Group Width = 320 (Arbitrary DAGRE box).
      // Real content width = 120 + 40 + 120 = 280.
      // Center of Real Content = Center of GroupBox (assuming Dagre centers content).

      // Center X = groupPos.x.
      // Spouse A Center = Center X - (Spacing/2 + Width/2) = X - 20 - 60 = X - 80.
      // Spouse B Center = Center X + (Spacing/2 + Width/2) = X + 20 + 60 = X + 80.

      // TopLeft A = Center A - 60 = X - 140.
      // TopLeft B = Center B - 60 = X + 20.

      // Marriage Node Center = Center X.

      let xPos = 0;

      if (node.id === spouseA) {
        // Spouse A is Left.
        // Position is Top-Left.
        // Gap Center is at groupPos.x
        // Spouse A Right Edge is at groupPos.x - (spacing/2)
        // Spouse A TopLeft = groupPos.x - (spacing/2) - explicitNodeWidth
        xPos = groupPos.x - (spacing / 2) - explicitNodeWidth;
      } else if (node.id === spouseB) {
        // Spouse B is Right.
        // Left Edge is at groupPos.x + (spacing/2)
        // TopLeft = groupPos.x + (spacing/2)
        xPos = groupPos.x + (spacing / 2);
      } else if (node.id === marriageId) {
        // Marriage Node is Virtual (1x1).
        // It should be centred at groupPos.x
        // ReactFlow position is Top-Left.
        // For 1x1 node to be centered at X, TopLeft should be X - 0.5.
        // But actually, we want the HANDLES to align.
        // VirtualNode has center-aligned logic?
        // If we just put it at X, and width is 1. It is from X to X+1.
        // Essentially centered.
        xPos = groupPos.x;
      }

      const isMarriage = node.id.startsWith('marriage_');

      // Y Alignment
      // GroupY is center of row.
      // Spouse Node Height = 180 (slot). Visual ~120?
      // Handle is at Top + 40 (approx).
      // We want Handle Y to be consistent.
      // If we place Spouse Top at Y, Handle is at Y + 40.
      // We want Marriage Node (Virtual) at Y + 40.

      const topY = groupPos.y - (nodeHeight / 2);

      // Marriage Node Y matches the Handle Line.
      // Spouse Node Y = topY.
      // Marriage Node Y = topY + 40.

      const yPos = topY + (isMarriage ? 40 : 0);

      return {
        ...node,
        position: {
          x: xPos,
          y: yPos,
        },
        style: isMarriage ? {
          opacity: 1,
          width: 1, height: 1, background: 'transparent', zIndex: 0
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

  return { nodes: newNodes, edges };
};
