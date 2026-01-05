import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Member } from '../../types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';
import { Edit, Trash2, User, Plus, Crown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const columnHelper = createColumnHelper<Member>();

interface MemberTableProps {
  onEdit: (member: Member) => void;
  isBatchMode: boolean;
  onBatchUpdate?: (memberId: string, field: keyof Member, value: any) => void;
}

const calculateAge = (dobString?: string, dodString?: string): string => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const endDate = dodString ? new Date(dodString) : new Date();
    
    // Check for invalid dates
    if (isNaN(birthDate.getTime())) return '';
    if (isNaN(endDate.getTime())) return '';

    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 0 ? '0' : age.toString();
};

export const MemberTable: React.FC<MemberTableProps> = ({ onEdit, isBatchMode, onBatchUpdate }) => {
  const membersMap = useFamilyStore((state) => state.members);
  const deleteMember = useFamilyStore((state) => state.deleteMember);
  const addMember = useFamilyStore((state) => state.addMember);
  const rootMemberId = useFamilyStore((state) => state.rootMemberId);
  const relationships = useFamilyStore((state) => state.relationships);

  const members = useMemo(() => Object.values(membersMap), [membersMap]);

  const handleAddRow = () => {
    addMember({
        id: uuidv4(),
        firstName: '新成員',
        lastName: '',
        gender: 'male',
    });
  };

  const columns = useMemo(() => [
    columnHelper.accessor('photoUrl', {
      header: '頭像',
      cell: (info) => (
        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-500 shadow-sm flex items-center justify-center pointer-events-none">
            {info.getValue() ? <img src={info.getValue()} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
        </div>
      ),
      size: 60,
    }),
    columnHelper.accessor((row) => `${row.lastName || ''}${row.firstName}`, {
      id: 'fullName',
      header: '姓名',
      cell: (info) => {
        if (isBatchMode && onBatchUpdate) {
            return (
                <input 
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 w-full text-sm text-white focus:border-primary focus:outline-none"
                    value={info.row.original.firstName} 
                    placeholder="姓名"
                    onChange={(e) => {
                        onBatchUpdate(info.row.original.id, 'firstName', e.target.value);
                    }}
                />
            );
        }
        return <span className="font-semibold text-white tracking-wide text-lg pointer-events-none">
            {info.row.original.lastName}{info.row.original.firstName}
        </span>;
      },
    }),
    columnHelper.display({
        id: 'kinshipTitle',
        header: '稱謂',
        cell: (info) => {
            if (info.row.original.id === rootMemberId) {
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/50 pointer-events-none">
                    <Crown size={12} />
                    我自己
                </span>;
            }
            if (rootMemberId) {
                const title = calculateRelationship(rootMemberId, info.row.original.id, membersMap, relationships);
                if (title && title !== '未知關係') {
                     return <span className="text-violet-300 font-medium pointer-events-none">{title}</span>;
                }
            }
            return <span className="text-slate-600 text-xs">-</span>;
        }
    }),
    columnHelper.accessor('gender', {
      header: '性別',
      cell: (info) => {
        if (isBatchMode && onBatchUpdate) {
            return (
                <select 
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
                    value={info.getValue()}
                    onChange={(e) => onBatchUpdate(info.row.original.id, 'gender', e.target.value)}
                >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                </select>
            );
        }
        const val = info.getValue();
        const label = val === 'male' ? '男' : val === 'female' ? '女' : '其他';
        const bg = val === 'male' ? 'bg-blue-500/20 text-blue-300' : val === 'female' ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-500/20 text-slate-300';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} pointer-events-none`}>{label}</span>;
      },
    }),
    columnHelper.display({
        id: 'age',
        header: '年齡',
        cell: (info) => {
            const age = calculateAge(info.row.original.dateOfBirth, info.row.original.dateOfDeath);
            const isDeceased = !!info.row.original.dateOfDeath || info.row.original.status === 'Deceased' || info.row.original.status === '歿';
            return <span className={`text-sm ${isDeceased ? 'text-slate-500' : 'text-slate-300'} pointer-events-none`}>
                {age ? `${age}歲` : '-'}
                {isDeceased && <span className="text-[10px] ml-1 bg-slate-700 px-1 rounded">歿</span>}
            </span>;
        }
    }),
    columnHelper.accessor('dateOfBirth', {
      header: '生日',
      cell: (info) => {
          if (isBatchMode && onBatchUpdate) {
            return (
                <input 
                    type="date"
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 w-32 text-sm text-white focus:border-primary focus:outline-none"
                    value={info.getValue() || ''}
                    onChange={(e) => onBatchUpdate(info.row.original.id, 'dateOfBirth', e.target.value)}
                />
            );
          }
          return <span className="text-slate-400 font-mono text-sm pointer-events-none">{info.getValue() || '-'}</span>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: (props) => (
        <div className="flex gap-2 justify-end isolate relative z-10 w-full">
          {!isBatchMode && (
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Edit clicked', props.row.original.id);
                    onEdit(props.row.original);
                }}
                className="p-3 md:p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 active:bg-indigo-500/40 rounded-lg text-indigo-300 border border-indigo-500/30 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500"
                aria-label="編輯成員"
            >
                <Edit size={20} className="md:w-4 md:h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if(window.confirm('確定要刪除這位成員嗎？')) {
                    deleteMember(props.row.original.id);
                }
            }}
            className="p-3 md:p-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 rounded-lg text-rose-300 border border-rose-500/30 shadow-sm transition-all focus:ring-2 focus:ring-rose-500"
            aria-label="刪除成員"
          >
            <Trash2 size={20} className="md:w-4 md:h-4" />
          </button>
        </div>
      ),
    }),
  ], [onEdit, deleteMember, isBatchMode, onBatchUpdate, rootMemberId, membersMap, relationships]);

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-auto h-full pr-0 md:pr-2 flex flex-col bg-transparent">
      <table className="w-full border-collapse text-left min-w-[600px] md:min-w-0">
        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-20 shadow-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/10">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-3 md:p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/5">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group relative">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3 md:p-4 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
           {members.length === 0 && (
            <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                    <p>目前沒有家族成員</p>
                </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {isBatchMode && (
         <div className="p-4 border-t border-white/10 sticky bottom-0 bg-slate-900/90 backdrop-blur z-30 safe-area-pb">
             <button 
                onClick={handleAddRow}
                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
             >
                 <Plus size={18} />
                 新增一列
             </button>
         </div>
      )}
    </div>
  );
};
