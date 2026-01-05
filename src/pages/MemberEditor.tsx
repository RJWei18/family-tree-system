import React, { useState, useRef } from 'react';
import { MemberTable } from '../components/members/MemberTable';
import { MemberForm } from '../components/members/MemberForm';
import type { Member } from '../types';
import { Plus, Table2, Check, Download, Upload } from 'lucide-react';
import { useFamilyStore } from '../store/useFamilyStore';
import { exportToCSV, parseCSV } from '../utils/csvHelpers';
import { v4 as uuidv4 } from 'uuid';

export const MemberEditor: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = useFamilyStore((state) => state.members);
  const relationships = useFamilyStore((state) => state.relationships);
  const updateMember = useFamilyStore((state) => state.updateMember);
  const addMember = useFamilyStore((state) => state.addMember);
  const addRelationship = useFamilyStore((state) => state.addRelationship);
  const removeRelationship = useFamilyStore((state) => state.removeRelationship);

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingMember(undefined);
  };

  const handleBatchUpdate = (memberId: string, field: keyof Member, value: any) => {
      updateMember(memberId, { [field]: value });
  };

  const handleExport = () => {
    exportToCSV(Object.values(members), relationships);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { members: importedMembers, relationships: rawRels } = await parseCSV(file);
      
      // Update Members
      importedMembers.forEach(m => {
          // If ID exists, overwrite. Else add.
          if (members[m.id]) {
              updateMember(m.id, m);
          } else {
              addMember(m);
          }
      });

      // Update Relationships
      rawRels.forEach(rel => {
          const { memberId, fatherId, motherId, spouseId } = rel;
          
          // Clear old parents
           const existingParentRels = relationships.filter(r => r.targetMemberId === memberId && r.type === 'parent');
           existingParentRels.forEach(r => removeRelationship(r.id));

          // Add Father
          if (fatherId) {
              addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: memberId, type: 'parent' });
          }
          // Add Mother
          if (motherId) {
             addRelationship({ id: uuidv4(), sourceMemberId: motherId, targetMemberId: memberId, type: 'parent' });
          }
          // Add Spouse (Check if exists first to avoid duplicate)
          if (spouseId) {
             // simplified logic: just add if strictly needed, real world might need check
             // check if relationship already exists
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
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold heading-gradient mb-2">成員管理</h2>
          <p className="text-slate-400">管理您的家族資料庫，新增或編輯成員詳細資訊。</p>
        </div>
        <div className="flex gap-3">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
            />
            
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="匯出 CSV"
            >
                <Download size={18} />
                <span className="hidden sm:inline">匯出</span>
            </button>
            <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="匯入 CSV"
            >
                <Upload size={18} />
                <span className="hidden sm:inline">匯入</span>
            </button>

            <div className="w-px h-10 bg-white/10 mx-1"></div>

            <button
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium border ${
                    isBatchMode 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'
                }`}
            >
                {isBatchMode ? <Check size={18} /> : <Table2 size={18} />}
                {isBatchMode ? '完成編輯' : '批次模式'}
            </button>
            <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary flex items-center gap-2 shadow-lg shadow-violet-500/20"
                disabled={isBatchMode}
            >
                <Plus size={20} />
                新增成員
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden glass-panel border-0 bg-slate-900/40 shadow-inner">
        <MemberTable 
            onEdit={handleEdit} 
            isBatchMode={isBatchMode}
            onBatchUpdate={handleBatchUpdate}
        />
      </div>

      {isFormOpen && !isBatchMode && (
        <MemberForm
          initialData={editingMember}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
