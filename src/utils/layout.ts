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

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    if (edge.data?.type !== 'spouse') {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
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
  });

  return { nodes: layoutedNodes, edges };
};

export const buildGraph = (
    members: Record<string, Member>, 
    relationships: Relationship[]
) => {
    const nodes: Node[] = Object.values(members).map(m => ({
        id: m.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: m
    }));

    const edges: Edge[] = relationships.map(r => {
        const isSpouse = r.type === 'spouse';
        return {
            id: r.id,
            source: r.sourceMemberId,
            target: r.targetMemberId,
            animated: !isSpouse, 
            label: isSpouse ? '❤️' : undefined,
            labelStyle: isSpouse ? { fill: '#ec4899', fontWeight: 700, fontSize: 16 } : undefined,
            labelBgStyle: isSpouse ? { fill: 'rgba(255,255,255,0.7)', fillOpacity: 0.7 } : undefined,
            style: isSpouse 
                ? { stroke: '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' } 
                : { stroke: '#8b5cf6', strokeWidth: 2 },
            type: isSpouse ? 'straight' : 'smoothstep', 
            data: { type: r.type }
        };
    });

    return { nodes, edges };
};
