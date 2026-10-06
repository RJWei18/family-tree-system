import React from 'react';
import { useHourglassStore } from '../../../store/useHourglassStore';

export const HgBadgeNode: React.FC<any> = ({ data }) => {
    const { setFocus, toggleDescendants } = useHourglassStore();

    const handleClick = () => {
        if (data.kind === 'inlaw' || data.kind === 'moreAncestors') {
            setFocus(data.targetMemberId);
        } else if (data.kind === 'collapsed' || data.kind === 'collapseToggle') {
            const isCollapsed = data.kind === 'collapsed';
            toggleDescendants(data.targetMemberId, isCollapsed);
        }
    };

    let label = 'Badge';
    if (data.kind === 'inlaw') label = '配偶家系 >';
    else if (data.kind === 'moreAncestors') label = '更多祖先 >';
    else if (data.kind === 'collapsed') label = `[+${data.count} 後代]`;
    else if (data.kind === 'collapseToggle') label = '[-]';

    return (
        <div 
            onClick={handleClick}
            className="bg-white border border-slate-200 shadow-sm rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-slate-50 min-w-[32px] min-h-[32px] flex items-center justify-center font-medium text-slate-700 pointer-events-auto"
        >
            {label}
        </div>
    );
};
