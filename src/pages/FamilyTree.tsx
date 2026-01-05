import React from 'react';
import { FamilyGraph } from '../components/tree/FamilyGraph';

export const FamilyTree: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
       <div className="h-14 border-b border-slate-200 flex items-center px-6 bg-white/80 backdrop-blur-sm z-10 shrink-0">
          <h2 className="font-bold text-slate-700">家族樹狀圖 (Family Tree Visualization)</h2>
       </div>
       {/* Use flex-1 to fill remaining space explicitly */}
       <div className="flex-1 bg-slate-50 relative w-full overflow-hidden">
          {/* Optional Grid Pattern for Tree View */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                   backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
                   backgroundSize: '24px 24px' 
               }} 
          />
          <FamilyGraph />
       </div>
    </div>
  );
};
