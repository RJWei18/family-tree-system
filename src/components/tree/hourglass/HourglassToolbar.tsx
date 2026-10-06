import React, { useMemo } from 'react';
import { useHourglassStore } from '../../../store/useHourglassStore';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { resolveBookmarks } from '../../../utils/hourglass/hourglassModel';
import { buildFamilyIndex } from '../../../utils/hourglass/familyIndex';

export const HourglassToolbar: React.FC = () => {
  const { 
    focusId, history, homeMemberId, 
    goBack, jumpTo, setFocus, setHome,
    ancestorDepth, setAncestorDepth,
    descendantDepth, setDescendantDepth
  } = useHourglassStore();
  const members = useFamilyStore(s => s.members);
  const relationships = useFamilyStore(s => s.relationships);

  const index = useMemo(() => buildFamilyIndex(members, relationships), [members, relationships]);

  const bookmarks = useMemo(() => {
    if (!homeMemberId) return { home: null, mother: null, spouse: null };
    return resolveBookmarks(index, homeMemberId, focusId || homeMemberId);
  }, [index, homeMemberId, focusId]);

  if (!focusId || !members[focusId]) return null;

  const name = (id: string) => members[id] ? `${members[id].lastName || ''}${members[id].firstName || ''}`.trim() : 'Unknown';

  const breadcrumbs = [...history, focusId].map((id, idx) => (
    <React.Fragment key={`${id}-${idx}`}>
      {idx > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0" />}
      <button 
        onClick={() => {
          if (idx < history.length) jumpTo(idx);
        }}
        className={`whitespace-nowrap ${idx === history.length ? 'font-bold text-gray-900' : 'text-blue-600 hover:underline'}`}
      >
        {name(id)}
      </button>
    </React.Fragment>
  ));

  return (
    <div className="flex flex-col gap-2 p-2 bg-white border-b overflow-x-auto">
      <div className="flex items-center gap-4 min-w-max">
        <button 
          onClick={goBack} 
          disabled={history.length === 0}
          className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> 返回
        </button>
        
        <div className="flex items-center text-sm">
          {breadcrumbs}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-sm border-l pl-4">
          <button 
            onClick={() => bookmarks.home && setFocus(bookmarks.home)}
            className={`px-3 py-1 rounded border ${focusId === bookmarks.home ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            我的家系
          </button>
          <button 
            onClick={() => bookmarks.mother && setFocus(bookmarks.mother)}
            disabled={!bookmarks.mother}
            title={!bookmarks.mother ? '尚未登錄母親' : ''}
            className={`px-3 py-1 rounded border ${focusId === bookmarks.mother ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'} disabled:opacity-50`}
          >
            母系
          </button>
          <button 
            onClick={() => bookmarks.spouse && setFocus(bookmarks.spouse)}
            disabled={!bookmarks.spouse}
            title={!bookmarks.spouse ? '尚未登錄配偶' : ''}
            className={`px-3 py-1 rounded border ${focusId === bookmarks.spouse ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'} disabled:opacity-50`}
          >
            配偶家系
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm border-l pl-4 shrink-0">
          <label className="flex items-center gap-1 shrink-0">
            上代:
            <select 
              value={ancestorDepth} 
              onChange={e => setAncestorDepth(Number(e.target.value))}
              className="border rounded p-1 text-base sm:text-sm"
            >
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 shrink-0">
            下代:
            <select 
              value={descendantDepth === null ? 'all' : descendantDepth} 
              onChange={e => setDescendantDepth(e.target.value === 'all' ? null : Number(e.target.value))}
              className="border rounded p-1 text-base sm:text-sm"
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              <option value="all">全部</option>
            </select>
          </label>
        </div>

        <div className="flex items-center border-l pl-4 shrink-0">
          <button 
            onClick={() => setHome(focusId)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" />
            設為首頁
          </button>
        </div>
      </div>
    </div>
  );
};
