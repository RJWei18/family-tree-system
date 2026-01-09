export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  dateOfDeath?: string;
  photoUrl?: string;
  bio?: string;
  title?: string;
  jobTitle?: string;
  deathReason?: string;
  notes?: string;
  isDeceased?: boolean;
  status?: string;
  location?: string;
}

export type RelationshipType = 'parent' | 'spouse';

export interface Relationship {
  id: string;
  sourceMemberId: string;
  targetMemberId: string;
  type: RelationshipType;
}

export interface FamilyTreeState {
  members: Record<string, Member>;
  relationships: Relationship[];
  rootMemberId: string | null;
  setRootMember: (id: string) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addRelationship: (rel: Relationship) => void;
  removeRelationship: (id: string) => void;
}
