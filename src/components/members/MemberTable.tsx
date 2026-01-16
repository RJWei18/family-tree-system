import React, { useMemo, useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageHelpers';
import { calculateGenerations } from '../../utils/generationHelpers';
import { createPortal } from 'react-dom';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import type { Member } from '../../types';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';
import { calculateAge } from "../../utils/dateHelpers";
import { getZodiac, getZodiacName, getHoroscope, getZodiacSortIndex } from "../../utils/zodiac";
import { Edit, Trash2, User, Plus, Crown, Check, Briefcase, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


const columnHelper = createColumnHelper<Member>();

interface MemberTableProps {
    onEdit: (member: Member) => void;
    isBatchMode: boolean;
    onBatchUpdate?: (memberId: string, field: keyof Member, value: any) => void;
    selectedIds: Set<string>;
    onSelectionChange: (id: string, selected: boolean) => void;
}


const DeleteConfirmationModal = ({ member, onConfirm, onCancel }: { member: Member, onConfirm: () => void, onCancel: () => void }) => {
    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                pointerEvents: 'auto'
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)'
                }}
                onClick={onCancel}
            />
            <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-rose-500">
                    <Trash2 size={24} />
                    <h3 className="text-xl font-bold text-slate-800">確認刪除？</h3>
                </div>
                <p className="text-slate-600">
                    您確定要刪除 <span className="font-bold text-slate-900 mx-1">{member.lastName}{member.firstName}</span> 嗎？
                </p>
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <p className="text-xs text-rose-600 font-bold">此動作無法復原！</p>
                    <p className="text-xs text-rose-500 mt-1">與此成員相關的親屬連結也會一併移除。</p>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-500 active:scale-95 transition-all"
                    >
                        確認刪除
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Extracted Component to isolate store dependency
const KinshipCell = ({ memberId }: { memberId: string }) => {
    const rootMemberId = useFamilyStore((state) => state.rootMemberId);
    const membersMap = useFamilyStore((state) => state.members);
    const relationships = useFamilyStore((state) => state.relationships);

    if (memberId === rootMemberId) {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 pointer-events-none">
            <Crown size={12} />
            我自己
        </span>;
    }
    if (rootMemberId) {
        const title = calculateRelationship(rootMemberId, memberId, membersMap, relationships);
        if (title && title !== '未知關係') {
            return <span className="text-violet-600 font-medium pointer-events-none">{title}</span>;
        }
    }
    return <span className="text-slate-400 text-xs">-</span>;
};

// Selection Checkbox Component (Enlarged & Refined)
const SelectCheckbox = ({ selected, onChange }: { selected: boolean, onChange: (s: boolean) => void }) => {
    return (
        <div
            onClick={() => onChange(!selected)}
            className={`w-7 h-7 rounded-md border-2 cursor-pointer flex items-center justify-center transition-all duration-200 ${selected ? 'bg-primary border-primary scale-105 shadow-sm shadow-primary/30' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
        >
            <Check
                size={20}
                strokeWidth={4}
                className={`text-white transition-all duration-200 ${selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            />
        </div>
    );
};

export const MemberTable: React.FC<MemberTableProps> = ({ onEdit, isBatchMode, onBatchUpdate, selectedIds, onSelectionChange }) => {
    const membersMap = useFamilyStore((state) => state.members);
    const deleteMember = useFamilyStore((state) => state.deleteMember);
    const addMember = useFamilyStore((state) => state.addMember);

    // local state for delete modal
    const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteMember(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const members = useMemo(() => Object.values(membersMap), [membersMap]);

    const handleAddRow = () => {
        addMember({
            id: uuidv4(),
            firstName: '新成員',
            lastName: '',
            gender: 'male',
        });
    };
    const relationships = useFamilyStore((state) => state.relationships);
    const generationMap = useMemo(() => calculateGenerations(membersMap, relationships), [membersMap, relationships]);

    const columns = useMemo(() => {
        const cols = [


            columnHelper.accessor('photoUrl', {
                header: '頭像',
                cell: (info) => {
                    const src = info.getValue();
                    const displaySrc = getOptimizedImageUrl(src);

                    return (
                        <div className="relative group flex items-center justify-center">
                            {/* Main Avatar (48px = 3rem = w-12/h-12) */}
                            <div
                                className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center pointer-events-none transition-transform group-hover:scale-105"
                                style={{ width: '48px', height: '48px', minWidth: '48px' }} // Force size
                            >
                                {displaySrc ? (
                                    <img
                                        src={displaySrc}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        alt="Avatar"
                                    />
                                ) : (
                                    <User size={24} className="text-slate-400" />
                                )}
                            </div>

                            {/* Hover Preview (Large) */}
                            {displaySrc && (
                                <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="w-32 h-32 rounded-xl bg-white shadow-2xl border-[3px] border-white ring-1 ring-slate-100 overflow-hidden relative">
                                        <img
                                            src={displaySrc}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            alt="Preview"
                                        />
                                        {/* Helper Text */}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] py-1 text-center backdrop-blur-sm">
                                            {info.row.original.lastName}{info.row.original.firstName}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                },
                size: 80, // Increased size to accommodate 48px + padding
            }),
            columnHelper.accessor((row) => `${row.lastName || ''}${row.firstName}`, {
                id: 'fullName',
                header: '姓名',
                cell: (info) => {
                    if (isBatchMode && onBatchUpdate) {
                        return (
                            <input
                                className="bg-white border border-slate-200 rounded px-2 py-1 w-full text-sm text-slate-800 focus:border-primary focus:outline-none"
                                value={info.row.original.firstName}
                                placeholder="姓名"
                                onChange={(e) => {
                                    onBatchUpdate(info.row.original.id, 'firstName', e.target.value);
                                }}
                            />
                        );
                    }
                    return <span className="font-semibold text-slate-900 tracking-wide text-lg pointer-events-none">
                        {info.row.original.lastName}{info.row.original.firstName}
                    </span>;
                },
            }),
            columnHelper.accessor('id', {
                id: 'generation',
                header: '世代',
                cell: info => {
                    const gen = generationMap[info.getValue()];
                    return (
                        <div className="flex items-center gap-1">
                            {gen ? (
                                <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    ${gen === 1 ? 'bg-amber-100 text-amber-700' :
                                        gen === 2 ? 'bg-sky-100 text-sky-700' :
                                            gen === 3 ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-600'}
                                `}>
                                    第 {gen} 代
                                </span>
                            ) : '-'}
                        </div>
                    );
                },
                sortingFn: (rowA, rowB) => {
                    const genA = generationMap[rowA.original.id] || 999;
                    const genB = generationMap[rowB.original.id] || 999;
                    return genA - genB;
                },
                enableSorting: true,
            }),
            columnHelper.display({
                id: 'kinshipTitle',
                header: '稱謂',
                cell: (info) => <KinshipCell memberId={info.row.original.id} />
            }),
            columnHelper.accessor('jobTitle', {
                header: '職稱',
                cell: (info) => {
                    if (isBatchMode && onBatchUpdate) {
                        return (
                            <input
                                className="bg-white border border-slate-200 rounded px-2 py-1 w-24 text-sm text-slate-800 focus:border-primary focus:outline-none"
                                value={info.getValue() || ''}
                                placeholder="職稱"
                                onChange={(e) => {
                                    onBatchUpdate(info.row.original.id, 'jobTitle', e.target.value);
                                }}
                            />
                        );
                    }
                    return (
                        <div className="flex items-center gap-1 text-slate-600 text-sm">
                            {info.getValue() && <Briefcase size={14} className="text-slate-400" />}
                            <span>{info.getValue() || '-'}</span>
                        </div>
                    );
                }
            }),
            columnHelper.accessor('location', {
                header: '位置',
                cell: (info) => {
                    if (isBatchMode && onBatchUpdate) {
                        return (
                            <input
                                className="bg-white border border-slate-200 rounded px-2 py-1 w-24 text-sm text-slate-800 focus:border-primary focus:outline-none"
                                value={info.getValue() || ''}
                                placeholder="位置"
                                onChange={(e) => {
                                    onBatchUpdate(info.row.original.id, 'location', e.target.value);
                                }}
                            />
                        );
                    }
                    return <span className="text-slate-600 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{info.getValue() || '-'}</span>;
                }
            }),
            columnHelper.accessor('gender', {
                header: '性別',
                cell: (info) => {
                    if (isBatchMode && onBatchUpdate) {
                        return (
                            <select
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-800 focus:border-primary focus:outline-none"
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
                    // Light Theme Badges
                    const bg = val === 'male' ? 'bg-blue-50 text-blue-600 border border-blue-100' : val === 'female' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-slate-50 text-slate-500 border border-slate-100';
                    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} pointer-events-none`}>{label}</span>;
                },
            }),
            // AGE Column - Using accessor for custom sorting value (numeric age)
            columnHelper.accessor(
                (row) => {
                    const age = calculateAge(row.dateOfBirth, row.dateOfDeath);
                    return age ? parseInt(age) : -1;
                },
                {
                    id: 'age',
                    header: '年齡',
                    cell: (info) => {
                        const ageStr = info.getValue() === -1 ? '' : info.getValue().toString();
                        // We need original row data for deceased check
                        const isDeceased = !!info.row.original.dateOfDeath || info.row.original.status === 'Deceased' || info.row.original.status === '歿';

                        return <span className={`text-sm ${isDeceased ? 'text-slate-400' : 'text-slate-600'} pointer-events-none`}>
                            {ageStr ? `${ageStr}歲` : '-'}
                            {isDeceased && <span className="text-[10px] ml-1 bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded">歿</span>}
                        </span>;
                    }
                }
            ),
            columnHelper.accessor((row) => getZodiacSortIndex(row.dateOfBirth || ''), {
                id: 'zodiac',
                header: ({ column }) => (
                    <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={column.getToggleSortingHandler()}>
                        <span>生肖</span>
                        {{
                            asc: <ArrowUp size={14} className="text-violet-500" />,
                            desc: <ArrowDown size={14} className="text-violet-500" />,
                        }[column.getIsSorted() as string] ?? <div className="w-[14px]" />}
                    </div>
                ),
                cell: (info) => {
                    const date = info.row.original.dateOfBirth || '';
                    const z = getZodiac(date);
                    const n = getZodiacName(date);
                    return <span className="text-sm text-slate-600 flex items-center gap-1">
                        <span className="text-lg" role="img" aria-label="zodiac">{z}</span>
                        <span>{n || '-'}</span>
                    </span>;
                },
                sortingFn: 'basic'
            }),
            columnHelper.accessor((row) => {
                const h = getHoroscope(row.dateOfBirth || '');
                return h ? h.index : -1;
            }, {
                id: 'horoscope',
                header: ({ column }) => (
                    <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={column.getToggleSortingHandler()}>
                        <span>星座</span>
                        {{
                            asc: <ArrowUp size={14} className="text-violet-500" />,
                            desc: <ArrowDown size={14} className="text-violet-500" />,
                        }[column.getIsSorted() as string] ?? <div className="w-[14px]" />}
                    </div>
                ),
                cell: (info) => {
                    const h = getHoroscope(info.row.original.dateOfBirth || '');
                    return (
                        <div className="flex items-center gap-1 min-w-[70px]">
                            {h ? (
                                <>
                                    <span className="text-lg leading-none filter grayscale-[0.2]">{h.icon}</span>
                                    <span className="text-sm text-slate-600 font-medium">{h.name}</span>
                                </>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                        </div>
                    );
                },
                sortingFn: 'basic',
            }),
            columnHelper.accessor('dateOfBirth', {
                header: '生日',
                cell: (info) => {
                    if (isBatchMode && onBatchUpdate) {
                        return (
                            <input
                                type="date"
                                className="bg-white border border-slate-200 rounded px-2 py-1 w-32 text-sm text-slate-800 focus:border-primary focus:outline-none"
                                value={info.getValue() || ''}
                                onChange={(e) => onBatchUpdate(info.row.original.id, 'dateOfBirth', e.target.value)}
                            />
                        );
                    }
                    return <span className="text-slate-500 font-mono text-sm pointer-events-none">{info.getValue() || '-'}</span>;
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
                                className="p-3 md:p-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-lg text-indigo-600 border border-indigo-100 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500"
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
                                setDeleteTarget(props.row.original);
                            }}
                            className="p-3 md:p-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-lg text-rose-600 border border-rose-100 shadow-sm transition-all focus:ring-2 focus:ring-rose-500"
                            aria-label="刪除成員"
                        >
                            <Trash2 size={20} className="md:w-4 md:h-4" />
                        </button>
                    </div>
                ),
            }),
        ];

        if (isBatchMode) {
            // Prepend Selection Column
            return [
                columnHelper.display({
                    id: 'select',
                    header: () => (
                        <div className="flex items-center justify-center">
                            <span className="text-xs">選取</span>
                        </div>
                    ),
                    cell: (info) => (
                        <div className="flex items-center justify-center">
                            <SelectCheckbox
                                selected={selectedIds.has(info.row.original.id)}
                                onChange={(s) => onSelectionChange(info.row.original.id, s)}
                            />
                        </div>
                    ),
                    size: 60
                }),
                ...cols
            ];
        }
        return cols;
    }, [onEdit, isBatchMode, onBatchUpdate, selectedIds, onSelectionChange]);

    const table = useReactTable({
        data: members,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });



    return (
        <>
            <div className="w-full h-full pr-0 md:pr-2 flex flex-col bg-transparent">
                {/* ALWAYS TABLE VIEW AS PER FEEDBACK */}
                <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm h-full flex flex-col">
                    <table className="w-full border-collapse text-left min-w-[600px] md:min-w-0">
                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 shadow-sm border-b border-slate-200">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="p-3 md:p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 transition-colors"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {{
                                                    asc: <ArrowUp size={14} />,
                                                    desc: <ArrowDown size={14} />,
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-3 md:p-4 align-middle">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isBatchMode && (
                    <div className="p-4 border-t border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur z-30 safe-area-pb mt-auto">
                        <button
                            onClick={handleAddRow}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={18} />
                            新增一列
                        </button>
                    </div>
                )}
            </div>

            {deleteTarget && (
                <DeleteConfirmationModal
                    member={deleteTarget}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
};
