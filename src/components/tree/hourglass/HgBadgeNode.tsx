import React from 'react';

export const HgBadgeNode: React.FC<any> = ({ data }) => {
    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-slate-50 min-w-[32px] min-h-[32px] flex items-center justify-center">
            {data?.label || 'Badge'}
        </div>
    );
};
