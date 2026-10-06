export interface FamilyIndex {
  members: Record<string, import('../../types').Member>;
  parentsOf: Record<string, string[]>;
  childrenOf: Record<string, string[]>;
  spousesOf: Record<string, string[]>;
}

export type UnitRole = 'focus' | 'ancestor' | 'descendant';

export interface UnitMember {
  id: string;
  ghost: boolean;
  nodeId: string;
}

export interface Unit {
  id: string;
  role: UnitRole;
  row: number;
  members: UnitMember[];
  bloodIndex: number;
}

export interface ParentLink {
  fromUnitId: string;
  fromPair: string[];
  toNodeId: string;
}

export type BadgeKind = 'inlaw' | 'moreAncestors' | 'collapsed' | 'collapseToggle';
export interface BadgeSpec {
  id: string;
  kind: BadgeKind;
  anchorNodeId: string;
  targetMemberId: string;
  count?: number;
}

export interface HourglassModel {
  focusId: string;
  units: Unit[];
  links: ParentLink[];
  badges: BadgeSpec[];
}

export interface HourglassOptions {
  focusId: string;
  ancestorDepth: number;
  descendantDepth: number | null;
  collapsedOverride: ReadonlySet<string>;
  expandedOverride: ReadonlySet<string>;
}
