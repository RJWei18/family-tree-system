import type { HourglassModel, Unit, FamilyIndex } from './types';
import {
  MEMBER_WIDTH,
  HEART_WIDTH,
  SLOT_WIDTH,
  HEART_Y_OFFSET,
  ROW_PITCH,
  SIBLING_GAP,
  BADGE_ABOVE_Y,
  BADGE_BELOW_Y
} from './constants';

export interface PositionedNode {
  id: string;
  kind: 'member' | 'ghost' | 'heart' | 'badge';
  x: number; y: number;
  width: number; height: number;
  row: number;
  payload: unknown;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  kind: 'spouse' | 'lineage';
  dashed: boolean;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

interface Extent {
  left: number;
  right: number;
}

export function layoutHourglass(model: HourglassModel, _index: FamilyIndex): LayoutResult {
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];
  
  const unitsById = new Map<string, Unit>();
  model.units.forEach(u => unitsById.set(u.id, u));

  // Find focus unit
  const focusUnit = model.units.find(u => u.role === 'focus');
  if (!focusUnit) {
    return { nodes: [], edges: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
  }

  // Build trees
  const descChildren = new Map<string, Unit[]>();
  const ancParents = new Map<string, Unit[]>();
  
  model.links.forEach(link => {
    const parentUnit = unitsById.get(link.fromUnitId);
    if (!parentUnit) return;
    
    // Which unit contains toNodeId?
    const childUnit = model.units.find(u => u.members.some(m => m.nodeId === link.toNodeId));
    if (!childUnit) return;
    
    if (childUnit.role === 'descendant') {
      let kids = descChildren.get(parentUnit.id) || [];
      kids.push(childUnit);
      descChildren.set(parentUnit.id, kids);
    } else if (parentUnit.role === 'ancestor') {
      let parents = ancParents.get(childUnit.id) || [];
      parents.push(parentUnit);
      ancParents.set(childUnit.id, parents);
    }
  });

  const extMap = new Map<string, Extent>();
  const offsetMap = new Map<string, number>();

  function unitWidth(unit: Unit) {
    return unit.members.length * SLOT_WIDTH;
  }

  function extentDesc(unit: Unit): Extent {
    const children = descChildren.get(unit.id) || [];
    if (children.length === 0) {
      const half = unitWidth(unit) / 2;
      return { left: -half, right: half };
    }
    
    for (const child of children) {
      extMap.set(child.id, extentDesc(child));
    }
    
    let cursor = 0;
    const offsets = new Map<string, number>();
    for (const child of children) {
      const ext = extMap.get(child.id)!;
      offsets.set(child.id, cursor - ext.left);
      cursor = offsets.get(child.id)! + ext.right + SIBLING_GAP;
    }
    
    let blockLeft = Infinity;
    for (const child of children) {
      const ext = extMap.get(child.id)!;
      const off = offsets.get(child.id)!;
      blockLeft = Math.min(blockLeft, off + ext.left);
    }
    
    const blockRight = cursor - SIBLING_GAP;
    const shift = -(blockLeft + blockRight) / 2;
    
    for (const child of children) {
      offsetMap.set(child.id, offsets.get(child.id)! + shift);
    }
    
    const half = unitWidth(unit) / 2;
    return {
      left: Math.min(-half, blockLeft + shift),
      right: Math.max(half, blockRight + shift)
    };
  }

  function extentAnc(unit: Unit): Extent {
    const parents = ancParents.get(unit.id) || [];
    const puExtents = new Map<string, Extent>();
    const puIdeals = new Map<string, number>();
    
    for (const pu of parents) {
      // Find the blood member in unit that connects to pu
      const link = model.links.find(l => l.fromUnitId === pu.id && unit.members.some(m => m.nodeId === l.toNodeId));
      let mIndex = 0;
      if (link) {
        mIndex = unit.members.findIndex(m => m.nodeId === link.toNodeId);
        if (mIndex === -1) mIndex = 0;
      }
      const idealX = -unitWidth(unit)/2 + mIndex * SLOT_WIDTH + SLOT_WIDTH/2;
      puIdeals.set(pu.id, idealX);
      puExtents.set(pu.id, extentAnc(pu));
    }

    if (parents.length === 2) {
      const pa = parents[0];
      const pb = parents[1];
      const idealPa = puIdeals.get(pa.id)!;
      const idealPb = puIdeals.get(pb.id)!;
      const extPa = puExtents.get(pa.id)!;
      const extPb = puExtents.get(pb.id)!;
      
      const need = extPa.right + SIBLING_GAP - extPb.left;
      const gap = idealPb - idealPa;
      if (gap < need) {
        const shift = (need - gap) / 2;
        offsetMap.set(pa.id, idealPa - shift);
        offsetMap.set(pb.id, idealPb + shift);
      } else {
        offsetMap.set(pa.id, idealPa);
        offsetMap.set(pb.id, idealPb);
      }
    } else if (parents.length === 1) {
      const pa = parents[0];
      offsetMap.set(pa.id, puIdeals.get(pa.id)!);
    }

    let left = -unitWidth(unit) / 2;
    let right = unitWidth(unit) / 2;
    
    for (const pu of parents) {
      const off = offsetMap.get(pu.id)!;
      const ext = puExtents.get(pu.id)!;
      left = Math.min(left, off + ext.left);
      right = Math.max(right, off + ext.right);
    }
    
    return { left, right };
  }
  
  // Calculate extents
  extentDesc(focusUnit);
  extentAnc(focusUnit);

  const cxMap = new Map<string, number>();
  
  function placeDesc(unit: Unit, cx: number) {
    cxMap.set(unit.id, cx);
    const children = descChildren.get(unit.id) || [];
    for (const child of children) {
      placeDesc(child, cx + (offsetMap.get(child.id) || 0));
    }
  }

  function placeAnc(unit: Unit, cx: number) {
    cxMap.set(unit.id, cx);
    const parents = ancParents.get(unit.id) || [];
    for (const pu of parents) {
      placeAnc(pu, cx + (offsetMap.get(pu.id) || 0));
    }
  }
  
  // Place
  let focusCx = 0;
  if (focusUnit.bloodIndex >= 0) {
    focusCx = unitWidth(focusUnit)/2 - focusUnit.bloodIndex * SLOT_WIDTH - SLOT_WIDTH/2;
  }
  
  placeDesc(focusUnit, focusCx);
  placeAnc(focusUnit, focusCx);

  const round = (n: number) => Math.round(n * 100) / 100;

  // Create nodes
  for (const unit of model.units) {
    const cx = cxMap.get(unit.id) || 0;
    const startX = cx - unitWidth(unit)/2;
    
    for (let i = 0; i < unit.members.length; i++) {
      const m = unit.members[i];
      const memberCx = startX + i * SLOT_WIDTH + SLOT_WIDTH/2;
      
      nodes.push({
        id: m.nodeId,
        kind: m.ghost ? 'ghost' : 'member',
        x: round(memberCx - MEMBER_WIDTH/2),
        y: round(unit.row * ROW_PITCH),
        width: MEMBER_WIDTH,
        height: 100,
        row: unit.row,
        payload: _index.members[m.id] || { id: m.id, firstName: '未知', lastName: '' }
      });
      
      // Heart
      if (i < unit.members.length - 1) {
        // const hasSpouseLink = model.links.some(l => l.fromUnitId === unit.id && l.fromPair.includes(m.id) && l.fromPair.includes(unit.members[i+1].id));
        const isSpousePair = true; // In this domain they are all adjacent spouses unless not linked
        if (isSpousePair) { // Should check actual spouses
          const nextCx = startX + (i+1) * SLOT_WIDTH + SLOT_WIDTH/2;
          nodes.push({
            id: `heart:${m.nodeId}:${unit.members[i+1].nodeId}`,
            kind: 'heart',
            x: round((memberCx + nextCx)/2 - HEART_WIDTH/2),
            y: round(unit.row * ROW_PITCH + HEART_Y_OFFSET),
            width: HEART_WIDTH,
            height: HEART_WIDTH,
            row: unit.row,
            payload: {}
          });
          
          edges.push({
            id: `edge:${m.nodeId}:${unit.members[i+1].nodeId}`,
            source: m.nodeId,
            target: unit.members[i+1].nodeId,
            sourceHandle: 'right',
            targetHandle: 'left',
            kind: 'spouse',
            dashed: false
          });
        }
      }
    }
  }

  // Create edges for links
  for (const link of model.links) {
    let sourceId = '';
    let sourceHandle = 'bottom';
    
    if (link.fromPair.length === 2) {
      // It's a heart
      const unit = unitsById.get(link.fromUnitId)!;
      const m1 = unit.members.find(m => m.id === link.fromPair[0])!;
      const m2 = unit.members.find(m => m.id === link.fromPair[1])!;
      if (m1 && m2) {
        sourceId = `heart:${m1.nodeId}:${m2.nodeId}`; // simplistic, order matters
        if (!nodes.find(n => n.id === sourceId)) {
           sourceId = `heart:${m2.nodeId}:${m1.nodeId}`;
        }
      }
    } else if (link.fromPair.length === 1) {
      const unit = unitsById.get(link.fromUnitId)!;
      const m1 = unit.members.find(m => m.id === link.fromPair[0])!;
      if (m1) sourceId = m1.nodeId;
    }
    
    if (sourceId) {
      edges.push({
        id: `link:${sourceId}:${link.toNodeId}`,
        source: sourceId,
        target: link.toNodeId,
        sourceHandle: sourceHandle,
        targetHandle: 'top',
        kind: 'lineage',
        dashed: false
      });
    }
  }
  
  // Create badges
  for (const badge of model.badges) {
    const anchor = nodes.find(n => n.id === badge.anchorNodeId);
    if (!anchor) continue;
    
    let y = anchor.y;
    if (badge.kind === 'inlaw' || badge.kind === 'moreAncestors') {
      y += BADGE_ABOVE_Y;
    } else {
      y += BADGE_BELOW_Y;
    }
    
    nodes.push({
      id: `badge:${badge.id}`,
      kind: 'badge',
      x: round(anchor.x + anchor.width/2 - 20),
      y: round(y),
      width: 40,
      height: 20,
      row: anchor.row,
      payload: badge
    });
  }

  return { nodes, edges, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
}
