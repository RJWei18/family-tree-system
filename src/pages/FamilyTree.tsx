import React from 'react';
import { FamilyGraph } from '../components/tree/FamilyGraph';

export const FamilyTree: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
       <div className="h-14 border-b border-white/10 flex items-center px-6 bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
          <h2 className="font-bold text-white">家族樹狀圖 (Family Tree Visualization)</h2>
       </div>
       {/* Use flex-1 to fill remaining space explicitly */}
       <div className="flex-1 bg-slate-900 relative w-full">
          <FamilyGraph />
       </div>
    </div>
  );
};
