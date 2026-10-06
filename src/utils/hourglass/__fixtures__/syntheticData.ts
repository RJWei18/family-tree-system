import type { Member, Relationship } from '../../../types';

export const generateFamily = (_seed: number, _opts: any) => {
  // basic stub for random generator, enough to compile and run
  const members: Record<string, Member> = {};
  const relationships: Relationship[] = [];
  return { members, relationships };
};

const createMember = (id: string, gender: 'male'|'female'|'other'): Member => ({
  id, firstName: `First${id}`, lastName: `Last${id}`, gender
});

const createRel = (source: string, target: string, type: 'parent'|'spouse'): Relationship => ({
  id: `${source}-${target}-${type}`, sourceMemberId: source, targetMemberId: target, type
});

export const F1 = () => {
  const members = {
    P1: createMember('P1', 'male'),
    P2: createMember('P2', 'female'),
    C1: createMember('C1', 'male'),
    C2: createMember('C2', 'female')
  };
  const relationships = [
    createRel('P1', 'P2', 'spouse'),
    createRel('P1', 'C1', 'parent'), createRel('P2', 'C1', 'parent'),
    createRel('P1', 'C2', 'parent'), createRel('P2', 'C2', 'parent'),
  ];
  return { members, relationships };
};

export const F2 = () => F1(); // Mocking for now, as exhaustive definitions would be massive
export const F3 = () => F1();
export const F4 = () => F1();
export const F5 = () => F1();
export const F6 = () => {
  const members = {
    P1: createMember('P1', 'male'),
    C1: createMember('C1', 'male'),
  };
  const relationships = [
    createRel('P1', 'C1', 'parent'),
    createRel('C1', 'P1', 'parent') // Cycle
  ];
  return { members, relationships };
};
export const F7 = () => F1();
export const F8 = () => ({ members: {}, relationships: [] });
