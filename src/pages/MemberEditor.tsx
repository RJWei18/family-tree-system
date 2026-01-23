import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MemberTable } from '../components/members/MemberTable';
import { MemberForm } from '../components/members/MemberForm';
import type { Member } from '../types';
import { Plus, Table2, Check, Download, Upload, Users, Copy, Trash2 } from 'lucide-react';
import { useFamilyStore } from '../store/useFamilyStore';
import { exportToCSV, parseCSV, parseCSVFromURL, copyCSVToClipboard } from '../utils/csvHelpers';
import { v4 as uuidv4 } from 'uuid';

// Helper Modal for Cloud Import
const CloudImportModal = ({
    isOpen,
    onClose,
    onImport,
    url,
    setUrl
}: {
    isOpen: boolean,
    onClose: () => void,
    onImport: () => void,
    url: string,
    setUrl: (s: string) => void
}) => {
    if (!isOpen) return null;

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
                onClick={onClose}
            />
            {/* White Modal */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">連結 Google Sheets</h3>
                <div className="text-slate-600 text-sm space-y-2">
                    <p>請將您的 Google Sheet 發布為 CSV：</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-500">
                        <li>點擊 Google Sheet 左上角 <strong>檔案 (File)</strong></li>
                        <li>選擇 <strong>分享 (Share)</strong> &gt; <strong>發布到網路 (Publish to web)</strong></li>
                        <li>將格式從「網頁」改為 <strong>CSV (逗號分隔值)</strong></li>
                        <li>點擊發布，複製產生的連結貼在下方：</li>
                    </ol>
                </div>
                <input
                    className="input-field w-full text-slate-800 bg-slate-50 border-slate-200 focus:bg-white"
                    placeholder="貼上連結... (https://docs.google.com/...output=csv)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-medium">取消</button>
                    <button onClick={onImport} className="btn-primary px-6 py-2 shadow-lg shadow-violet-500/20">讀取資料</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Helper Modal for Batch Set Parents
const BatchSetParentsModal = ({
    isOpen,
    onClose,
    onConfirm,
    members,
    selectedCount
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (fatherId: string, motherId: string) => void,
    members: Record<string, Member>,
    selectedCount: number
}) => {
    const [fatherId, setFatherId] = useState('');
    const [motherId, setMotherId] = useState('');

    if (!isOpen) return null;

    const potentialFathers = Object.values(members).filter(m => m.gender === 'male');
    const potentialMothers = Object.values(members).filter(m => m.gender === 'female');

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
                onClick={onClose}
            />
            {/* White Modal */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl relative z-10 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">批次設定父母</h3>
                    <p className="text-slate-500 text-sm">將統一設定選取的 <span className="text-primary font-bold">{selectedCount}</span> 位成員的父母親。</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">選擇父親</label>
                        <select className="input-field h-12 w-full appearance-none cursor-pointer text-slate-800 bg-slate-50 border-slate-200" value={fatherId} onChange={e => setFatherId(e.target.value)}>
                            <option value="">(不設定)</option>
                            {potentialFathers.map(m => (
                                <option key={m.id} value={m.id}>{m.lastName}{m.firstName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">選擇母親</label>
                        <select className="input-field h-12 w-full appearance-none cursor-pointer text-slate-800 bg-slate-50 border-slate-200" value={motherId} onChange={e => setMotherId(e.target.value)}>
                            <option value="">(不設定)</option>
                            {potentialMothers.map(m => (
                                <option key={m.id} value={m.id}>{m.lastName}{m.firstName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-medium">取消</button>
                    <button
                        onClick={() => onConfirm(fatherId, motherId)}
                        className="btn-primary px-6 py-2 shadow-lg shadow-violet-500/20"
                        disabled={!fatherId && !motherId}
                    >
                        確認與套用
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const BatchDeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    count
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    count: number
}) => {
    if (!isOpen) return null;

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
                onClick={onClose}
            />
            <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-rose-500">
                    <Trash2 size={24} />
                    <h3 className="text-xl font-bold text-slate-800">確認批量刪除？</h3>
                </div>
                <p className="text-slate-600">
                    您確定要刪除選取的 <span className="font-bold text-slate-900 mx-1">{count}</span> 位成員嗎？
                </p>
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <p className="text-xs text-rose-600 font-bold">此動作無法復原！</p>
                    <p className="text-xs text-rose-500 mt-1">與這些成員相關的親屬連結也會一併移除。</p>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors font-medium"
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

export const MemberEditor: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | undefined>();
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchParentsModalOpen, setIsBatchParentsModalOpen] = useState(false);
    const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloud Import State
    const [cloudUrl, setCloudUrl] = useState('');
    const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

    // Load saved URL on mount
    useEffect(() => {
        const saved = localStorage.getItem('family_tree_cloud_url');
        if (saved) setCloudUrl(saved);
    }, []);

    const members = useFamilyStore((state) => state.members);
    const relationships = useFamilyStore((state) => state.relationships);
    const updateMember = useFamilyStore((state) => state.updateMember);
    const addMember = useFamilyStore((state) => state.addMember);
    const addRelationship = useFamilyStore((state) => state.addRelationship);
    const removeRelationship = useFamilyStore((state) => state.removeRelationship);
    const deleteMember = useFamilyStore((state) => state.deleteMember);

    const handleBatchDeleteClick = () => {
        setIsBatchDeleteModalOpen(true);
    };

    const confirmBatchDelete = () => {
        selectedIds.forEach(id => {
            deleteMember(id);
        });
        setSelectedIds(new Set());
        setIsBatchDeleteModalOpen(false);
    };

    // Sync selectedIds with members to remove stale IDs
    useEffect(() => {
        setSelectedIds(prev => {
            const next = new Set<string>();
            let hasChanges = false;
            prev.forEach(id => {
                if (members[id]) {
                    next.add(id);
                } else {
                    hasChanges = true;
                }
            });
            return hasChanges ? next : prev;
        });
    }, [members]);

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setIsFormOpen(true);
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setEditingMember(undefined);
    };

    const handleBatchUpdate = useCallback((memberId: string, field: keyof Member, value: any) => {
        updateMember(memberId, { [field]: value });
    }, [updateMember]);

    const handleSelectionChange = useCallback((id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (selected) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const handleBatchSetParents = (fatherId: string, motherId: string) => {
        selectedIds.forEach(memberId => {
            // Skip if setting self as parent (loop)
            if (memberId === fatherId || memberId === motherId) return;

            // 1. Remove existing parent relationships for this member
            const existingParentRels = relationships.filter(r => r.targetMemberId === memberId && r.type === 'parent');
            existingParentRels.forEach(r => removeRelationship(r.id));

            // 2. Add new relationships
            if (fatherId) {
                addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: memberId, type: 'parent' });
            }
            if (motherId) {
                addRelationship({ id: uuidv4(), sourceMemberId: motherId, targetMemberId: memberId, type: 'parent' });
            }
        });

        // Check if new parents should be spouses
        if (fatherId && motherId) {
            const parentsSpouseRel = relationships.find(r =>
                (r.sourceMemberId === fatherId && r.targetMemberId === motherId && r.type === 'spouse') ||
                (r.sourceMemberId === motherId && r.targetMemberId === fatherId && r.type === 'spouse')
            );
            if (!parentsSpouseRel) {
                addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: motherId, type: 'spouse' });
            }
        }

        setIsBatchParentsModalOpen(false);
        setSelectedIds(new Set()); // clear selection
        alert('批量設定完成！');
    };

    const handleExport = () => {
        exportToCSV(Object.values(members), relationships);
    };

    const handleCopyCSV = () => {
        copyCSVToClipboard(Object.values(members), relationships);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleCloudImport = async () => {
        if (!cloudUrl) return;

        try {
            const { members: importedMembers, relationships: rawRels } = await parseCSVFromURL(cloudUrl);

            localStorage.setItem('family_tree_cloud_url', cloudUrl);

            importedMembers.forEach(m => {
                if (members[m.id]) {
                    updateMember(m.id, m);
                } else {
                    addMember(m);
                }
            });

            rawRels.forEach(rel => {
                const { memberId, fatherId, motherId, spouseId } = rel;

                const existingParentRels = relationships.filter(r => r.targetMemberId === memberId && r.type === 'parent');
                existingParentRels.forEach(r => removeRelationship(r.id));

                if (fatherId) addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: memberId, type: 'parent' });
                if (motherId) addRelationship({ id: uuidv4(), sourceMemberId: motherId, targetMemberId: memberId, type: 'parent' });

                if (spouseId) {
                    const exists = relationships.find(r =>
                        (r.sourceMemberId === memberId && r.targetMemberId === spouseId && r.type === 'spouse') ||
                        (r.sourceMemberId === spouseId && r.targetMemberId === memberId && r.type === 'spouse')
                    );
                    if (!exists) {
                        addRelationship({ id: uuidv4(), sourceMemberId: memberId, targetMemberId: spouseId, type: 'spouse' });
                    }
                }
            });

            alert(`雲端同步成功！已更新 ${importedMembers.length} 筆資料。`);
            setIsCloudModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('讀取失敗，請確認網址是否為公開的 CSV 連結 (File -> Share -> Publish to web)');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { members: importedMembers, relationships: rawRels } = await parseCSV(file);

            importedMembers.forEach(m => {
                if (members[m.id]) {
                    updateMember(m.id, m);
                } else {
                    addMember(m);
                }
            });

            rawRels.forEach(rel => {
                const { memberId, fatherId, motherId, spouseId } = rel;

                const existingParentRels = relationships.filter(r => r.targetMemberId === memberId && r.type === 'parent');
                existingParentRels.forEach(r => removeRelationship(r.id));

                if (fatherId) {
                    addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: memberId, type: 'parent' });
                }
                if (motherId) {
                    addRelationship({ id: uuidv4(), sourceMemberId: motherId, targetMemberId: memberId, type: 'parent' });
                }
                if (spouseId) {
                    const exists = relationships.find(r =>
                        (r.sourceMemberId === memberId && r.targetMemberId === spouseId && r.type === 'spouse') ||
                        (r.sourceMemberId === spouseId && r.targetMemberId === memberId && r.type === 'spouse')
                    );
                    if (!exists) {
                        addRelationship({ id: uuidv4(), sourceMemberId: memberId, targetMemberId: spouseId, type: 'spouse' });
                    }
                }
            });

            alert(`成功匯入 ${importedMembers.length} 筆成員資料！`);
        } catch (err) {
            console.error(err);
            alert('匯入失敗，請檢查 CSV 格式');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold heading-gradient mb-2">成員管理</h2>
                    <p className="text-sm md:text-base text-slate-500">管理您的家族資料庫，或從雲端同步資料。</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />

                    <button
                        onClick={() => setIsCloudModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-medium bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 active:scale-95 shadow-sm"
                        title="從雲端載入"
                    >
                        <Download size={18} className="rotate-180" />
                        <span className="hidden sm:inline">讀取雲端表單</span>
                        <span className="sm:hidden">雲端</span>
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                        title="匯出 CSV"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">匯出</span>
                    </button>

                    <button
                        onClick={handleCopyCSV}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                        title="複製 CSV 到剪貼簿"
                    >
                        <Copy size={18} />
                        <span className="hidden sm:inline">複製</span>
                    </button>

                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                        title="匯入 CSV"
                    >
                        <Upload size={18} />
                        <span className="hidden sm:inline">匯入</span>
                    </button>

                    <div className="w-px h-10 bg-slate-200 mx-1 hidden md:block"></div>

                    <button
                        onClick={() => setIsBatchMode(!isBatchMode)}
                        className={`flex items-center gap-2 px-4 py-3 md:px-5 md:py-3 rounded-xl transition-all font-bold border ${isBatchMode
                            ? 'bg-violet-50 border-violet-500 text-violet-700 scale-105 shadow-lg shadow-violet-500/10'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {isBatchMode ? <Check size={20} /> : <Table2 size={20} />}
                        {isBatchMode ? '完成批次' : '批次模式'}
                    </button>


                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-violet-500/20 flex-1 md:flex-none justify-center px-6 py-3"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">新增成員</span>
                        <span className="sm:hidden">新增</span>
                    </button>

                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden glass-panel border-0 bg-white/50 shadow-inner relative">
                <MemberTable
                    onEdit={handleEdit}
                    isBatchMode={isBatchMode}
                    onBatchUpdate={handleBatchUpdate}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                />

                {/* Floating Batch Actions Toolbar */}
                {isBatchMode && createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 100000,
                            pointerEvents: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            width: 'auto'
                        }}
                    >
                        <div className="flex gap-2 p-2 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl pointer-events-auto shadow-violet-500/10">
                            <button
                                onClick={handleBatchDeleteClick}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-rose-600 border border-slate-100 font-bold hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide"
                                disabled={selectedIds.size === 0}
                            >
                                <Trash2 size={20} />
                                <span>刪除 ({selectedIds.size})</span>
                            </button>
                            <div className="w-px bg-slate-200 my-2"></div>
                            <button
                                onClick={() => setIsBatchParentsModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/20 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedIds.size === 0}
                            >
                                <Users size={20} />
                                <span>設定父母 ({selectedIds.size})</span>
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {isFormOpen && !isBatchMode && (
                <MemberForm
                    initialData={editingMember}
                    onClose={handleClose}
                />
            )}

            {/* Cloud Import Modal */}
            <CloudImportModal
                isOpen={isCloudModalOpen}
                onClose={() => setIsCloudModalOpen(false)}
                onImport={handleCloudImport}
                url={cloudUrl}
                setUrl={setCloudUrl}
            />

            {/* Batch Parents Modal */}
            <BatchSetParentsModal
                isOpen={isBatchParentsModalOpen}
                onClose={() => setIsBatchParentsModalOpen(false)}
                onConfirm={handleBatchSetParents}
                members={members}
                selectedCount={selectedIds.size}
            />

            <BatchDeleteConfirmationModal
                isOpen={isBatchDeleteModalOpen}
                onClose={() => setIsBatchDeleteModalOpen(false)}
                onConfirm={confirmBatchDelete}
                count={selectedIds.size}
            />
        </div>
    );
};
