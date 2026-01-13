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
  const highlightedMemberId = useFamilyStore(s => s.highlightedMemberId);
  const isHighlighted = highlightedMemberId === data.id;

  const title = useMemo(() => {
    return calculateRelationship(rootMemberId, data.id, members, relationships);
  }, [rootMemberId, data.id, members, relationships]);

  const age = useMemo(() => {
    const ageStr = calculateAge(data.dateOfBirth, data.dateOfDeath);
    return ageStr ? ageStr + '歲' : '';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;
  const zodiac = getZodiac(data.dateOfBirth || '');

  // bgClass replaced by fixed CSS classes .family-node-container and .avatar-wrapper

  return (
    <div className={`family-node-container ${isDeceased ? 'node-deceased' : ''} group relative`}>
      {/* Handles - Essential for Edges to connect */}
      {/* Top/Bottom for Parent-Child */}
      <Handle type="target" position={Position.Top} className="!w-1 !h-1 !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1 !h-1 !bg-transparent !border-none" />

      {/* Left/Right for Spouse Connections (Restored) */}
      <Handle type="source" position={Position.Left} id="left" className="!w-1 !h-1 !bg-transparent !border-none !top-1/2" />
      <Handle type="source" position={Position.Right} id="right" className="!w-1 !h-1 !bg-transparent !border-none !top-1/2" />

      {/* Center Handle for complex routing if needed */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, opacity: 0, border: 0 }}
      />

      {/* Highlight Ring */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-full ring-4 ring-amber-400 z-50 scale-110 pointer-events-none" style={{ borderRadius: '50%' }} />
      )}

      {/* Avatar Section */}
      <div className="avatar-wrapper shadow-sm">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={data.firstName} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${data.gender === 'male' ? 'bg-[#E3F2FD] text-[#2196F3]' : data.gender === 'female' ? 'bg-[#FCE4EC] text-[#E91E63]' : 'bg-slate-100 text-slate-400'}`}>
            <User size={32} strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Name Ribbon */}
      <div className="name-ribbon flex flex-col items-center">
        <span className="text-sm font-bold leading-none">{data.firstName}</span>
        <span className="text-[10px] opacity-80 mt-0.5 font-normal flex items-center gap-1">
          <span>{age}</span>
          {zodiac && <span>{zodiac}</span>}
        </span>
      </div>

      {/* Detailed Tooltip on Hover (Optional, or simple details) */}
      <div className="absolute top-full mt-2 bg-white/90 backdrop-blur text-slate-700 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap border border-slate-100">
        <div>{getZodiac(data.dateOfBirth || '')} {getZodiacName(data.dateOfBirth || '')}</div>
        {data.jobTitle && <div>{data.jobTitle}</div>}
        {isDeceased && <div className="text-slate-500">已故</div>}
      </div>
    </div>
  );
});
