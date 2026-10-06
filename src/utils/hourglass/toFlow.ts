import type { LayoutResult } from './hourglassLayout';
import type { Node, Edge } from 'reactflow';

export function toFlow(result: LayoutResult): { nodes: Node[], edges: Edge[] } {
  return {
    nodes: result.nodes.map(n => ({
      id: n.id,
      type: n.kind === 'member' ? 'custom' : n.kind === 'badge' ? 'hgBadge' : n.kind,
      position: { x: n.x, y: n.y },
      data: n.payload
    })),
    edges: result.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.kind === 'spouse' ? 'straight' : 'smoothstep',
      animated: e.dashed,
      style: {
        stroke: e.kind === 'spouse' ? '#94a3b8' : '#8D6E63',
        strokeWidth: 2,
        strokeDasharray: e.dashed ? '5,5' : 'none',
        opacity: e.dashed ? 0.6 : 1,
      },
      pathOptions: e.kind === 'spouse' ? undefined : { borderRadius: 20, offset: 25 }
    }))
  };
}
