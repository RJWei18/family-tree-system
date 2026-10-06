import React from 'react';
import { useUIStore } from '../../store/useUIStore';

export const ViewModeSwitch: React.FC = () => {
    const { treeMode, setTreeMode } = useUIStore();

    return (
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            <button
                className={`whitespace-nowrap px-3 sm:px-4 py-1 text-sm rounded-md transition-colors ${treeMode === 'full' ? 'bg-white shadow-sm font-medium text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTreeMode('full')}
            >
                全家族圖
            </button>
            <button
                className={`whitespace-nowrap px-3 sm:px-4 py-1 text-sm rounded-md transition-colors ${treeMode === 'hourglass' ? 'bg-white shadow-sm font-medium text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setTreeMode('hourglass')}
            >
                沙漏圖
            </button>
        </div>
    );
};
