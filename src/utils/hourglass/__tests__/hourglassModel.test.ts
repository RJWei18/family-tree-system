import { describe, it, expect } from 'vitest';
import { buildHourglassModel, resolveBookmarks } from '../hourglassModel';
import { buildFamilyIndex } from '../familyIndex';
import { F1, F6, F8 } from '../__fixtures__/syntheticData';

describe('hourglassModel', () => {
  it('EC-01, EC-02, EC-03: F1 basic generation', () => {
    const { members, relationships } = F1();
    const idx = buildFamilyIndex(members, relationships);
    const model = buildHourglassModel(idx, {
      focusId: 'P1', ancestorDepth: 3, descendantDepth: 3,
      collapsedOverride: new Set(), expandedOverride: new Set()
    });
    expect(model.units.length).toBeGreaterThan(0);
    // P1 focus unit + C1, C2 descendants
    expect(model.units.find(u => u.role === 'focus')).toBeDefined();
    expect(model.units.filter(u => u.role === 'descendant').length).toBe(2);
  });

  it('EC-06: Cycle should not cause infinite loop', () => {
    const { members, relationships } = F6();
    const idx = buildFamilyIndex(members, relationships);
    const model = buildHourglassModel(idx, {
      focusId: 'P1', ancestorDepth: 3, descendantDepth: 3,
      collapsedOverride: new Set(), expandedOverride: new Set()
    });
    // Should complete without timeout
    expect(model).toBeDefined();
  });

  it('EC-10: Empty data should not crash', () => {
    const { members, relationships } = F8();
    const idx = buildFamilyIndex(members, relationships);
    const model = buildHourglassModel(idx, {
      focusId: 'X', ancestorDepth: 3, descendantDepth: 3,
      collapsedOverride: new Set(), expandedOverride: new Set()
    });
    expect(model.units.length).toBe(0);
  });
});

describe('resolveBookmarks', () => {
  it('should resolve correctly', () => {
    const { members, relationships } = F1();
    const idx = buildFamilyIndex(members, relationships);
    const bm = resolveBookmarks(idx, 'P1');
    expect(bm.spouse).toBe('P2');
  });
});
