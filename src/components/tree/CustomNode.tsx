import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { User, Skull } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';

interface CustomNodeProps {
  data: Member;
}

export const CustomNode = memo(({ data }: CustomNodeProps) => {
  const members = useFamilyStore(s => s.members);
  const relationships = useFamilyStore(s => s.relationships);
  const rootMemberId = useFamilyStore(s => s.rootMemberId);

  const title = useMemo(() => {
    return calculateRelationship(rootMemberId, data.id, members, relationships);
  }, [rootMemberId, data.id, members, relationships]);

  const age = useMemo(() => {
     if (!data.dateOfBirth) return '?';
     const birth = new Date(data.dateOfBirth);
     const death = data.dateOfDeath ? new Date(data.dateOfDeath) : new Date();
     const diff = death.getFullYear() - birth.getFullYear();
     return diff + '歲';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;

  return (
    <div className={`glass-panel w-64 p-4 border shadow-xl backdrop-blur-md bg-opacity-80 hover:bg-opacity-100 transition-all ${title === '本人' ? 'border-amber-500/50 bg-amber-900/10' : 'border-white/20'}`}>
      <Handle type="target" position={Position.Top} className="!bg-violet-500 w-3 h-3" />
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 flex items-center justify-center ${data.gender === 'male' ? 'border-sky-500' : 'border-pink-500'} ${isDeceased ? 'grayscale' : ''}`}>
            {data.photoUrl ? (
                <img src={data.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${data.gender === 'male' ? 'bg-sky-500/20 text-sky-500' : 'bg-pink-500/20 text-pink-500'}`}>
                    <User size={24} />
                </div>
            )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-lg leading-tight">{data.firstName}</h3>
            {title && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">{title}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
             <span>{data.gender === 'male' ? '男' : '女'}</span>
             <span>•</span>
             <span>{age}</span>
             {isDeceased && (
                <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                    <Skull size={10} /> 歿
                </span>
                </>
             )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500 w-3 h-3" />
    </div>
  );
});
