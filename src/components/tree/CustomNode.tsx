import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateAge } from '../../utils/dateHelpers';
import { getZodiac, getZodiacName } from '../../utils/zodiac';
import { FamilyAvatar } from '../common/FamilyAvatar';
import { BreathingHalo } from './BreathingHalo';

interface CustomNodeProps {
  data: Member;
}

const HANDLE_OFFSET = '38px'; // Centralized handle positioning

export const CustomNode = memo(({ data }: CustomNodeProps) => {
  // Performance Optimization: Granular Selector
  // Only re-render if THIS node's highlight status changes
  const isHighlighted = useFamilyStore((state) => state.highlightedMemberId === data.id);

  const age = useMemo(() => {
    const ageStr = calculateAge(data.dateOfBirth, data.dateOfDeath);
    return ageStr ? ageStr + '歲' : '';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;
  const zodiac = getZodiac(data.dateOfBirth || '');
  const zodiacName = getZodiacName(data.dateOfBirth || '');

  return (
    <div className={`family-node-container ${isDeceased ? 'node-deceased' : ''} group relative`}>
      {/* Handles - Essential for Edges to connect */}
      {/* Top/Bottom for Parent-Child */}
      <Handle type="target" position={Position.Top} className="!w-1 !h-1 !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1 !h-1 !bg-transparent !border-none" />

      {/* Left/Right for Spouse Connections - Aligned with Avatar Center */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-1 !h-1 !bg-transparent !border-none"
        style={{ top: HANDLE_OFFSET }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-1 !h-1 !bg-transparent !border-none"
        style={{ top: HANDLE_OFFSET }}
      />

      {/* Center Handle for complex routing */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, opacity: 0, border: 0 }}
      />

      {/* Avatar Group Container */}
      <div className="relative flex items-center justify-center w-20 h-20">

        {/* Highlight Effects */}
        {isHighlighted && <BreathingHalo />}

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

      {/* Detailed Tooltip on Hover */}
      <div className="absolute top-full mt-2 bg-white/90 backdrop-blur text-slate-700 text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap border border-slate-100">
        <div>{zodiac} {zodiacName}</div>
        {data.jobTitle && <div>{data.jobTitle}</div>}
        {isDeceased && <div className="text-slate-500">已故</div>}
      </div>
    </div>
  );
});
