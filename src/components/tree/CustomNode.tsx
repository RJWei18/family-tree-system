import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { User, Skull } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';
import { calculateAge } from '../../utils/dateHelpers';

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
     const ageStr = calculateAge(data.dateOfBirth, data.dateOfDeath);
     return ageStr ? ageStr + '歲' : '?';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;

  return (
    <div className={`w-64 p-4 border rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm ${title === '本人' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 'bg-white/90 border-slate-200 hover:border-violet-200 hover:shadow-xl'}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 w-3 h-3 border-2 border-white" />
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 flex items-center justify-center ${data.gender === 'male' ? 'border-sky-400 bg-sky-50' : data.gender === 'female' ? 'border-pink-400 bg-pink-50' : 'border-slate-300 bg-slate-50'} ${isDeceased ? 'grayscale opacity-75' : ''}`}>
            {data.photoUrl ? (
                <img src={data.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${data.gender === 'male' ? 'text-sky-400' : data.gender === 'female' ? 'text-pink-400' : 'text-slate-400'}`}>
                    <User size={24} />
                </div>
            )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{data.firstName}</h3>
            {title && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200">{title}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
             <span>{data.gender === 'male' ? '男' : '女'}</span>
             <span className="text-slate-300">•</span>
             <span>{age}</span>
             {isDeceased && (
                <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-400 bg-slate-100 px-1 rounded border border-slate-200">
                    <Skull size={10} /> 殁
                </span>
                </>
             )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 w-3 h-3 border-2 border-white" />
    </div>
  );
});
