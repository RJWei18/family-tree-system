import React from 'react';
import { useHourglassStore } from '../../../store/useHourglassStore';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { Focus } from 'lucide-react';

export const SelectionActionBar: React.FC = () => {
  const { focusId, setFocus } = useHourglassStore();
  const highlightedMemberId = useFamilyStore(s => s.highlightedMemberId);
  const members = useFamilyStore(s => s.members);

  if (!highlightedMemberId || !members[highlightedMemberId]) return null;
  if (highlightedMemberId === focusId) return null;

  const member = members[highlightedMemberId];
  const name = `${member.lastName || ''}${member.firstName || ''}`.trim();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2 flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Focus className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
        <button
          onClick={() => setFocus(highlightedMemberId)}
          className="ml-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm"
        >
          以此人為焦點
        </button>
      </div>
    </div>
  );
};
