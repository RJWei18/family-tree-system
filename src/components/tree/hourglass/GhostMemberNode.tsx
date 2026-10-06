import React from 'react';
import type { Member } from '../../../types';
import { useFamilyStore } from '../../../store/useFamilyStore';

interface GhostMemberNodeProps {
  data: Member;
}

export const GhostMemberNode: React.FC<GhostMemberNodeProps> = ({ data }) => {
    const setHighlightedMemberId = useFamilyStore(s => s.setHighlightedMemberId);
    
    return (
        <div 
          onClick={() => setHighlightedMemberId(data.id)}
          className="border-2 border-dashed border-slate-300 opacity-60 bg-white p-2 rounded-lg text-xs text-center shadow-sm w-[120px] cursor-pointer hover:border-blue-400"
        >
            <div className="font-medium text-slate-700">{data.lastName}{data.firstName}</div>
            <div className="text-slate-400 scale-90 mt-1">已顯示於他處</div>
        </div>
    );
};
