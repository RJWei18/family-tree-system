import React, { useState } from 'react';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { useHourglassStore } from '../../../store/useHourglassStore';
import { Search } from 'lucide-react';

export const HourglassEmptyState: React.FC = () => {
  const members = useFamilyStore(s => s.members);
  const setFocus = useHourglassStore(s => s.setFocus);
  const [query, setQuery] = useState('');

  const memberList = Object.values(members);
  
  if (memberList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>家族樹尚無成員</p>
      </div>
    );
  }

  const filteredMembers = query
    ? memberList.filter(m =>
        (m.firstName + m.lastName).toLowerCase().includes(query.toLowerCase()) ||
        (m.lastName + m.firstName).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : memberList.slice(0, 10);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">選擇焦點人物</h2>
        <p className="text-gray-500 text-sm mb-6">
          找不到預設的首頁人物。請從下方選擇一位成員作為沙漏圖的中心點。
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜尋成員..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {filteredMembers.map(m => (
            <button
              key={m.id}
              onClick={() => setFocus(m.id)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {`${m.lastName || ''}${m.firstName || ''}`.trim()}
                </div>
              </div>
            </button>
          ))}
          {filteredMembers.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">找不到符合的成員</div>
          )}
        </div>
      </div>
    </div>
  );
};
