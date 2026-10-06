import { FamilyIndex, HourglassOptions, HourglassModel, Unit, ParentLink, BadgeSpec, UnitMember, UnitRole } from './types';

export const buildHourglassModel = (index: FamilyIndex, opts: HourglassOptions): HourglassModel => {
  const { members, parentsOf, childrenOf, spousesOf } = index;
  const { focusId, ancestorDepth, descendantDepth, collapsedOverride, expandedOverride } = opts;

  if (!members[focusId]) {
    return { focusId, units: [], links: [], badges: [] };
  }

  const units: Unit[] = [];
  const links: ParentLink[] = [];
  const badges: BadgeSpec[] = [];
  const visited = new Set<string>();
  const ghostCounts = new Map<string, number>();

  const getGhostId = (id: string) => {
    const count = (ghostCounts.get(id) || 0) + 1;
    ghostCounts.set(id, count);
    return `ghost:${id}:${count}`;
  };

  const createUnitMember = (id: string, forceGhost: boolean = false): UnitMember => {
    const isGhost = forceGhost || visited.has(id);
    if (!isGhost) visited.add(id);
    return {
      id,
      ghost: isGhost,
      nodeId: isGhost ? getGhostId(id) : id
    };
  };

  // 1. Focus Unit
  const focusSpouses = spousesOf[focusId] || [];
  const focusBlood = createUnitMember(focusId);
  const focusMembers: UnitMember[] = [focusBlood];

  focusSpouses.forEach((spouseId, i) => {
    const spouseMem = createUnitMember(spouseId);
    if (i === 0) focusMembers.push(spouseMem); // right
    else if (i === 1) focusMembers.unshift(spouseMem); // left
    else if (i % 2 === 0) focusMembers.push(spouseMem); // right
    else focusMembers.unshift(spouseMem); // left
  });

  const focusBloodIndex = focusMembers.findIndex(m => m.id === focusId);
  const focusUnitId = `u:${focusMembers.map(m => m.id).join('+')}`;
  
  units.push({
    id: focusUnitId,
    role: 'focus',
    row: 0,
    members: focusMembers,
    bloodIndex: focusBloodIndex
  });

  focusMembers.forEach(m => {
    if (m.id !== focusId && !m.ghost && parentsOf[m.id]?.length) {
      badges.push({ id: `badge:inlaw:${m.nodeId}`, kind: 'inlaw', anchorNodeId: m.nodeId, targetMemberId: m.id });
    }
  });

  // 2. Ancestors
  const anc = (personId: string, row: number) => {
    const parents = parentsOf[personId] || [];
    if (parents.length === 0) return;

    if (row < -ancestorDepth) {
      // Find the node of personId that triggered this. Actually, the spec says "錨定 person". 
      // But we just need to anchor to the first non-ghost occurrence.
      badges.push({ id: `badge:moreAncestors:${personId}`, kind: 'moreAncestors', anchorNodeId: personId, targetMemberId: personId });
      return;
    }

    const unitMembers = parents.map(pId => createUnitMember(pId));
    const unitId = `u:anc:${unitMembers.map(m => m.nodeId).join('+')}`;
    units.push({
      id: unitId,
      role: 'ancestor',
      row,
      members: unitMembers,
      bloodIndex: -1
    });

    links.push({
      fromUnitId: unitId,
      fromPair: parents,
      toNodeId: personId // Link to the person who triggered this ancestor
    });

    unitMembers.forEach(m => {
      if (!m.ghost) anc(m.id, row - 1);
    });
  };

  anc(focusId, -1);

  // Helper to count hidden descendants
  const countHidden = (startId: string): number => {
    const hiddenVisited = new Set<string>();
    let count = 0;
    const q = [startId];
    while (q.length > 0) {
      const curr = q.shift()!;
      const kids = childrenOf[curr] || [];
      for (const kid of kids) {
        if (!hiddenVisited.has(kid)) {
          hiddenVisited.add(kid);
          // If the kid is not in the main visited set, count them
          if (!visited.has(kid)) {
            count++;
          }
          q.push(kid);
        }
      }
    }
    return count;
  };

  // 3. Descendants
  const desc = (bloodId: string, unitId: string, depthBelowFocus: number, bloodNodeId: string) => {
    const kids = childrenOf[bloodId] || [];
    if (kids.length === 0) return;

    let isCollapsed = false;
    if (collapsedOverride.has(bloodId)) {
      isCollapsed = true;
    } else if (expandedOverride.has(bloodId)) {
      isCollapsed = false;
    } else if (descendantDepth !== null && depthBelowFocus >= descendantDepth) {
      isCollapsed = true;
    }

    if (isCollapsed) {
      const hiddenCount = countHidden(bloodId);
      if (hiddenCount > 0) {
        badges.push({
          id: `badge:collapsed:${bloodNodeId}`,
          kind: 'collapsed',
          anchorNodeId: bloodNodeId,
          targetMemberId: bloodId,
          count: hiddenCount
        });
      }
      return;
    }

    badges.push({
      id: `badge:collapseToggle:${bloodNodeId}`,
      kind: 'collapseToggle',
      anchorNodeId: bloodNodeId,
      targetMemberId: bloodId
    });

    // Group kids by "other parent"
    const kidsByOtherParent = new Map<string, string[]>();
    kids.forEach(kidId => {
      const p = parentsOf[kidId] || [];
      const other = p.find(x => x !== bloodId) || 'SINGLE';
      if (!kidsByOtherParent.has(other)) kidsByOtherParent.set(other, []);
      kidsByOtherParent.get(other)!.push(kidId);
    });

    const unit = units.find(u => u.id === unitId)!;
    
    // Group order
    const orderedGroups: { otherParent: string, kids: string[] }[] = [];
    unit.members.forEach(m => {
      if (m.id !== bloodId && kidsByOtherParent.has(m.id)) {
        orderedGroups.push({ otherParent: m.id, kids: kidsByOtherParent.get(m.id)! });
        kidsByOtherParent.delete(m.id);
      }
    });
    // Remaining (e.g. SINGLE or other parents not in unit)
    kidsByOtherParent.forEach((kds, other) => {
      orderedGroups.push({ otherParent: other, kids: kds });
    });

    orderedGroups.forEach(group => {
      group.kids.forEach(kidId => {
        const kidSpouses = spousesOf[kidId] || [];
        const kidBlood = createUnitMember(kidId);
        const kidMembers: UnitMember[] = [kidBlood];
        
        kidSpouses.forEach((spId, i) => {
          const spMem = createUnitMember(spId);
          if (i === 0) kidMembers.push(spMem);
          else if (i === 1) kidMembers.unshift(spMem);
          else if (i % 2 === 0) kidMembers.push(spMem);
          else kidMembers.unshift(spMem);
        });

        const kidBloodIndex = kidMembers.findIndex(m => m.id === kidId);
        const kidUnitId = `u:desc:${kidMembers.map(m => m.nodeId).join('+')}`;
        
        units.push({
          id: kidUnitId,
          role: 'descendant',
          row: depthBelowFocus + 1,
          members: kidMembers,
          bloodIndex: kidBloodIndex
        });

        const fromPair = group.otherParent !== 'SINGLE' && unit.members.some(m => m.id === group.otherParent) 
          ? [bloodId, group.otherParent] 
          : [bloodId];

        links.push({
          fromUnitId: unitId,
          fromPair,
          toNodeId: kidBlood.nodeId
        });

        kidMembers.forEach(m => {
          if (m.id !== kidId && !m.ghost && parentsOf[m.id]?.length) {
            badges.push({ id: `badge:inlaw:${m.nodeId}`, kind: 'inlaw', anchorNodeId: m.nodeId, targetMemberId: m.id });
          }
        });

        if (!kidBlood.ghost) {
          desc(kidId, kidUnitId, depthBelowFocus + 1, kidBlood.nodeId);
        }
      });
    });
  };

  desc(focusId, focusUnitId, 0, focusBlood.nodeId);

  return { focusId, units, links, badges };
};

export const resolveBookmarks = (index: FamilyIndex, homeId: string, currentFocusId?: string) => {
  const home = index.members[homeId];
  if (!home) return { home: null, mother: null, spouse: null };

  const targetFocus = currentFocusId ? index.members[currentFocusId] : home;
  
  let motherId = null;
  if (targetFocus && index.parentsOf[targetFocus.id]) {
    const parents = index.parentsOf[targetFocus.id];
    const mother = parents.find(p => index.members[p]?.gender === 'female');
    if (mother) motherId = mother;
  }

  let spouseId = null;
  const spouses = targetFocus ? index.spousesOf[targetFocus.id] || [] : [];
  if (spouses.length > 0) {
    spouseId = spouses[0]; // simplistic for now
  }

  return {
    home: homeId,
    mother: motherId,
    spouse: spouseId,
    allSpouses: spouses
  };
};
