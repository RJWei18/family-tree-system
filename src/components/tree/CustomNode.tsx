import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Member } from '../../types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateAge } from '../../utils/dateHelpers';
import { getZodiac, getZodiacName, getHoroscope } from '../../utils/zodiac';
import { FamilyAvatar } from '../common/FamilyAvatar';
import { Plus } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

interface CustomNodeProps {
  data: Member;
}

// HANDLE_OFFSET removed as we are using 50% alignment now

export const CustomNode = memo(({ data }: CustomNodeProps) => {
  // Performance Optimization: Granular Selector
  // Only re-render if THIS node's highlight status changes
  const isHighlighted = useFamilyStore((state) => state.highlightedMemberId === data.id);
  const openQuickAdd = useUIStore((state) => state.openQuickAdd);

  const age = useMemo(() => {
    const ageStr = calculateAge(data.dateOfBirth, data.dateOfDeath);
    return ageStr ? ageStr + '歲' : '';
  }, [data.dateOfBirth, data.dateOfDeath]);

  const isDeceased = data.status === '殁' || data.status === 'Deceased' || !!data.dateOfDeath;
  const zodiac = getZodiac(data.dateOfBirth || '');
  const zodiacName = getZodiacName(data.dateOfBirth || '');
  const horoscope = getHoroscope(data.dateOfBirth || '');

  return (
    <div className={`family-node-container ${isDeceased ? 'node-deceased' : ''} group relative`}>
      {/* Handles - Essential for Edges to connect */}
      {/* Handles - Essential for Edges to connect */}
      {/* Top/Bottom for Parent-Child Relationship ONLY - Keep as is */}
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !bg-transparent !border-none" />

      {/* Left/Right for Spouse Connections - FORCED TO 50% CENTER */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-1 !h-1 !bg-transparent !border-none"
        style={{ top: '40px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-1 !h-1 !bg-transparent !border-none"
        style={{ top: '40px' }}
      />

      {/* Center Handle - Keeping as potential fallback/complex routing point */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, opacity: 0, border: 0 }}
      />

      {/* Avatar Group Container */}
      <div className="relative flex items-center justify-center w-20 h-20">

        {/* Quick Add Trigger - Visible on Group Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openQuickAdd(data.id);
          }}
          className="absolute -top-3 -right-3 z-30 bg-violet-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
          title="新增家庭成員"
        >
          <Plus size={14} strokeWidth={3} />
        </button>

        {/* Highlight Pulse - Gold Pulse Animation */}
        {isHighlighted && (
          <div className="absolute inset-0 rounded-full z-0 animate-ping bg-amber-400 opacity-75 duration-1000" />
        )}
        {/* Helper ring for persistent highlight */}
        {isHighlighted && (
          <div className="absolute -inset-1 rounded-full z-0 border-2 border-amber-400 opacity-80" />
        )}

        {/* Avatar Component - Z-10 to sit ABOVE highlight */}
        <div className={`relative z-10 w-full h-full ${isDeceased ? 'grayscale opacity-60' : ''}`}>
          {/* Deceased: Dashed Border & Memorial Icon */}
          {isDeceased && (
            <>
              {/* Dashed Border Overlay - Fine dashed as requested */}
              <div
                className="absolute inset-0 rounded-full z-20 pointer-events-none"
                style={{ border: '2px dashed #a8a29e' }} // Stone-400 for better visibility in grayscale
              />
              {/* Memorial Icon (White Ribbon / Candle) */}
              <div className="absolute -top-1 -right-1 z-30 drop-shadow-md">
                <span className="text-sm filter drop-shadow">🕯️</span>
              </div>
            </>
          )}

          <FamilyAvatar
            src={data.photoUrl}
            gender={data.gender}
            isDeceased={isDeceased}
            size="lg" // 80px
            className={`shadow-sm transition-transform duration-300 ${isDeceased ? '' : 'hover:scale-105'}`}
          />
        </div>
      </div>

      {/* Name Ribbon */}
      <div className={`name-ribbon flex flex-col items-center ${isDeceased ? '!bg-stone-200 !text-stone-600' : ''}`}>
        <span className="text-sm font-bold leading-none flex items-center gap-0.5">
          {isDeceased && <span className="text-[10px] opacity-70">†</span>}
          {data.firstName}
        </span>
        <span className="text-[10px] opacity-80 mt-0.5 font-normal flex items-center gap-1">
          <span>{isDeceased ? '(殁)' : ''} {age}</span>
          {zodiac && <span>{zodiac}</span>}
          {horoscope && <span title={horoscope.name}>{horoscope.icon}</span>}
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
