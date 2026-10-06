import type { LayoutResult } from './hourglassLayout';
import type { Node, Edge } from 'reactflow';

export function toFlow(result: LayoutResult): { nodes: Node[], edges: Edge[] } {
  return {
    nodes: result.nodes.map(n => ({
      id: n.id,
      type: n.kind,
      position: { x: n.x, y: n.y },
      data: n.payload
    })),
    edges: result.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.kind === 'spouse' ? 'straight' : 'smoothstep'
    }))
  };
}
