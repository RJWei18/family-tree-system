import React from 'react';
import { FamilyGraph } from '../components/tree/FamilyGraph';
import { QuickAddModal } from '../components/members/QuickAddModal';
import { useUIStore } from '../store/useUIStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { v4 as uuidv4 } from 'uuid';
import type { Member } from '../types';

export const FamilyTree: React.FC = () => {
   const {
      isQuickAddOpen,
      quickAddSourceId,
      closeQuickAdd
   } = useUIStore();

   const members = useFamilyStore((state) => state.members);
   const addMember = useFamilyStore((state) => state.addMember);
   const addRelationship = useFamilyStore((state) => state.addRelationship);

   const sourceMember = quickAddSourceId ? members[quickAddSourceId] : null;

   const handleQuickAdd = (newMember: Member, type: 'child' | 'spouse', isExisting?: boolean) => {
      // 1. Add Member (Only if not linking an existing one)
      if (!isExisting) {
         addMember(newMember);
      }

      // 2. Add Relationship
      if (quickAddSourceId) {
         if (type === 'child') {
            addRelationship({
               id: uuidv4(),
               sourceMemberId: quickAddSourceId,
               targetMemberId: newMember.id,
               type: 'parent'
            });
         } else {
            addRelationship({
               id: uuidv4(),
               sourceMemberId: quickAddSourceId,
               targetMemberId: newMember.id,
               type: 'spouse'
            });
         }
      }
   };

   return (
      <div className="w-full h-full flex flex-col flex-1 min-h-0">
         <div className="h-14 border-b border-slate-200 flex items-center px-6 bg-white/80 backdrop-blur-sm z-10 shrink-0">
            <h2 className="font-bold text-slate-700">家族樹狀圖 (Family Tree Visualization)</h2>
         </div>
         {/* Use flex-1 to fill remaining space explicitly */}
         <div className="flex-1 bg-slate-50 relative w-full overflow-hidden flex flex-col">
            {/* Optional Grid Pattern for Tree View */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
               style={{
                  backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
               }}
            />
            <FamilyGraph />

            <QuickAddModal
               isOpen={isQuickAddOpen}
               onClose={closeQuickAdd}
               sourceMember={sourceMember}
               onAdd={handleQuickAdd}
            />
         </div>
      </div>
   );
};
