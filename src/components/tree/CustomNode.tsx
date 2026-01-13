import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { User, Skull, Briefcase } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';
import { calculateAge } from '../../utils/dateHelpers';
import { getZodiac, getZodiacName } from '../../utils/zodiac';

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
  const zodiac = getZodiac(data.dateOfBirth || '');

  const bgClass = useMemo(() => {
    if (isDeceased) return 'border-slate-500 bg-slate-50';
    if (title === '本人') return 'bg-amber-50 border-amber-200 ring-2 ring-amber-100';
    if (data.gender === 'male') return 'bg-blue-200 border-blue-300 hover:border-blue-400 hover:shadow-xl';
    if (data.gender === 'female') return 'bg-pink-200 border-pink-300 hover:border-pink-400 hover:shadow-xl';
    return 'bg-white/90 border-slate-200 hover:border-violet-200 hover:shadow-xl';
  }, [isDeceased, title, data.gender]);

  return (
    <div className={`w-64 p-4 border rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm ${bgClass} relative group`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 w-3 h-3 border-2 border-white" />

      {/* Side Handles for Spouse Connections */}
      <Handle type="source" position={Position.Right} id="right" className="!bg-pink-400 w-3 h-3 border-2 border-white !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-blue-400 w-3 h-3 border-2 border-white !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />

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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg leading-tight truncate ${isDeceased ? 'text-slate-600' : 'text-slate-800'}`}>{data.firstName}</h3>
            {title && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200 shrink-0">{title}</span>}
          </div>

          {data.jobTitle && (
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
              <Briefcase size={10} />
              <span className="truncate">{data.jobTitle}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="text-sm flex items-center gap-0.5" title="生肖">
              <span>{zodiac}</span>
              <span className="text-[10px] text-slate-400">{getZodiacName(data.dateOfBirth || '')}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>{age}</span>
            {isDeceased && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500 bg-slate-200 px-1 rounded border border-slate-300">
                  <Skull size={10} />
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
