import { describe, it, expect } from 'vitest';
import { buildFamilyIndex } from '../familyIndex';
import { Member, Relationship } from '../../../types';

describe('familyIndex', () => {
  it('should ignore missing members, self relationships, and handle duplicates', () => {
    const members: Record<string, Member> = {
      A: { id: 'A', firstName: 'A', lastName: '', gender: 'male' },
      B: { id: 'B', firstName: 'B', lastName: '', gender: 'female' },
    };
    const rels: Relationship[] = [
      { id: '1', sourceMemberId: 'A', targetMemberId: 'B', type: 'spouse' },
      { id: '2', sourceMemberId: 'A', targetMemberId: 'B', type: 'spouse' }, // dup
      { id: '3', sourceMemberId: 'A', targetMemberId: 'A', type: 'spouse' }, // self
      { id: '4', sourceMemberId: 'A', targetMemberId: 'C', type: 'spouse' }, // missing
    ];
    
    const idx = buildFamilyIndex(members, rels);
    expect(idx.spousesOf['A']).toEqual(['B']);
    expect(idx.spousesOf['B']).toEqual(['A']);
  });
});
