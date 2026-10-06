import { describe, it, expect } from 'vitest';
import { layoutHourglass } from '../hourglassLayout';
import { HourglassModel } from '../types';
import { MEMBER_WIDTH, SIBLING_GAP } from '../constants';

describe('Layout Invariants', () => {
  it('I1: next.left - prev.right >= 40', () => {
    const model: HourglassModel = {
      focusId: 'P1',
      units: [
        {
          id: 'u1',
          role: 'focus',
          row: 0,
          members: [
            { id: 'P1', nodeId: 'P1', ghost: false },
            { id: 'P2', nodeId: 'P2', ghost: false }
          ],
          bloodIndex: 0
        }
      ],
      links: [],
      badges: []
    };
    const result = layoutHourglass(model, { members: {}, parentsOf: {}, childrenOf: {}, spousesOf: {} });
    const members = result.nodes.filter(n => n.kind === 'member').sort((a, b) => a.x - b.x);
    for (let i = 0; i < members.length - 1; i++) {
      const prev = members[i];
      const next = members[i + 1];
      expect(next.x - (prev.x + prev.width)).toBeGreaterThanOrEqual(40);
    }
  });

  it('I4: spouses adjacent, heart in the middle', () => {
    const model: HourglassModel = {
      focusId: 'P1',
      units: [
        {
          id: 'u1',
          role: 'focus',
          row: 0,
          members: [
            { id: 'P1', nodeId: 'P1', ghost: false },
            { id: 'P2', nodeId: 'P2', ghost: false }
          ],
          bloodIndex: 0
        }
      ],
      links: [],
      badges: []
    };
    const result = layoutHourglass(model, { members: {}, parentsOf: {}, childrenOf: {}, spousesOf: {} });
    const heart = result.nodes.find(n => n.kind === 'heart');
    expect(heart).toBeDefined();
    
    const members = result.nodes.filter(n => n.kind === 'member').sort((a, b) => a.x - b.x);
    const m1 = members[0];
    const m2 = members[1];
    
    const center1 = m1.x + MEMBER_WIDTH / 2;
    const center2 = m2.x + MEMBER_WIDTH / 2;
    const expectedHeartX = (center1 + center2) / 2 - heart!.width / 2;
    
    expect(heart!.x).toBeCloseTo(expectedHeartX, 1);
  });
});
