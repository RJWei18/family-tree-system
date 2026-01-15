import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateAge } from '../../utils/dateHelpers';
import { getZodiac, getZodiacName } from '../../utils/zodiac';
import { FamilyAvatar } from '../common/FamilyAvatar';

interface CustomNodeProps {
  data: Member;
}

export const CustomNode = memo(({ data }: CustomNodeProps) => {
  const highlightedMemberId = useFamilyStore(s => s.highlightedMemberId);
  const isHighlighted = highlightedMemberId === data.id;

  const age = useMemo(() => {
    const ageStr = calculateAge(data.dateOfBirth, data.dateOfDeath);
    return ageStr ? ageStr + '歲' : '';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;
  const zodiac = getZodiac(data.dateOfBirth || '');

  return (
    <div className={`family-node-container ${isDeceased ? 'node-deceased' : ''} group relative`}>
      {/* Handles - Essential for Edges to connect */}
      {/* Top/Bottom for Parent-Child */}
      <Handle type="target" position={Position.Top} className="!w-1 !h-1 !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1 !h-1 !bg-transparent !border-none" />

      {/* Left/Right for Spouse Connections (Restored) - Aligned with Avatar Center (40px) */}
      <Handle type="source" position={Position.Left} id="left" className="!w-1 !h-1 !bg-transparent !border-none !top-[38px]" />
      <Handle type="source" position={Position.Right} id="right" className="!w-1 !h-1 !bg-transparent !border-none !top-[38px]" />

      {/* Center Handle for complex routing if needed */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, opacity: 0, border: 0 }}
      />

      {/* Avatar Group Container - Ensures Layout & Highlight Centering */}
      <div className="relative flex items-center justify-center w-20 h-20">

        {/* Highlight Effects - Behind Avatar (Z-0) to create outer breathing light */}
        {isHighlighted && (
          // Fixed Centered Container for Ripple - Explicit sizes to be circular
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center pointer-events-none z-0 rounded-full"
            style={{ borderRadius: '50%' }}
          >
            {/* Steady Outer Glow - Halo */}
            <div className="absolute inset-0 rounded-full border-[4px] border-[#FAD089]/50 shadow-[0_0_20px_rgba(250,208,137,0.6)]" style={{ borderRadius: '50%' }} />

            {/* Expanding Breathing Ripple 1 */}
            <div className="absolute inset-0 rounded-full border-[2px] border-[#FAD089] animate-ripple opacity-80" style={{ borderRadius: '50%' }} />

            {/* Expanding Breathing Ripple 2 (Delayed) */}
            <div className="absolute inset-0 rounded-full border-[2px] border-[#FAD089] animate-ripple opacity-60" style={{ animationDelay: '0.6s', borderRadius: '50%' }} />
          </div>
        )}

        {/* Avatar Component - Z-10 to sit ABOVE highlight */}
        <div className="relative z-10 w-full h-full">
          <FamilyAvatar
            src={data.photoUrl}
            gender={data.gender}
            isDeceased={isDeceased}
            size="lg" // 80px
            className="shadow-sm transition-transform duration-300 hover:scale-105"
          />
        </div>
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
