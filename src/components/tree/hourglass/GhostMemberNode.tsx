import React from 'react';

export const GhostMemberNode: React.FC = () => {
    return (
        <div className="border-2 border-dashed border-slate-300 opacity-60 bg-white p-2 rounded-lg text-xs text-center shadow-sm w-[120px]">
            <div>參照節點</div>
            <div className="text-slate-400">已顯示於他處</div>
        </div>
    );
};
