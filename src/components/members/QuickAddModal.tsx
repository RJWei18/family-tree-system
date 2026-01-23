import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Heart, Baby, Link as LinkIcon, UserPlus } from 'lucide-react';
import type { Member, Gender } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useFamilyStore } from '../../store/useFamilyStore';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceMember: Member | null;
    onAdd: (newMember: Member, relationshipType: 'child' | 'spouse', isExisting?: boolean) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
    isOpen,
    onClose,
    sourceMember,
    onAdd
}) => {
    const [mode, setMode] = useState<'create' | 'link'>('create');

    const [lastName, setLastName] = useState(sourceMember?.lastName || '');
    const [firstName, setFirstName] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [relationshipType, setRelationshipType] = useState<'child' | 'spouse'>('child');

    // For Link Mode
    const [selectedExistingId, setSelectedExistingId] = useState<string>('');

    const members = useFamilyStore(state => state.members);
    const relationships = useFamilyStore(state => state.relationships);

    // Filter for Orphans (Members with NO parents)
    // Also exclude self and existing relationships to avoid duplicates/cycles
    const orphanCandidates = useMemo(() => {
        if (!isOpen || !sourceMember) return [];

        const allMemberIds = Object.keys(members);
        const membersWithParents = new Set(
            relationships
                .filter(r => r.type === 'parent')
                .map(r => r.targetMemberId)
        );

        return allMemberIds
            .map(id => members[id])
            .filter(m => {
                // Must not be self
                if (m.id === sourceMember.id) return false;
                // For 'child' link: Candidate must not already have parents (is an orphan in tree)
                // Note: If linking as 'spouse', they technically *can* have parents, but to keep it simple 
                // and avoid complex layout merges, we often restrict 'Link' to disjoint trees or orphans.
                // Let's allow orphans for now as requested.
                if (membersWithParents.has(m.id)) return false;

                return true;
            })
            .sort((a, b) => a.firstName.localeCompare(b.firstName));
    }, [members, relationships, isOpen, sourceMember]);

    // Reset when source changes
    React.useEffect(() => {
        if (sourceMember) {
            setLastName(sourceMember.lastName);
            setRelationshipType('child'); // Default to child
            setSelectedExistingId('');
            setMode('create');
        }

        setLastName('');
        setFirstName('');
        setGender('male');
    }, [sourceMember, isOpen]);

    if (!isOpen || !sourceMember) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            const newMember: Member = {
                id: uuidv4(),
                firstName,
                lastName,
                gender,
                photoUrl: '',
            };
            onAdd(newMember, relationshipType, false);
        } else {
            // Link Existing
            if (!selectedExistingId) return;
            const existingMember = members[selectedExistingId];
            if (existingMember) {
                onAdd(existingMember, relationshipType, true);
            }
        }
        onClose();
    };

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
                    backgroundColor: 'rgba(93, 64, 55, 0.2)', // Warm brown transparent
                    backdropFilter: 'blur(8px)' // Stronger glass effect
                }}
                onClick={onClose}
            />

            <div className="bg-[#FFFBF0] p-8 rounded-[32px] w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 shadow-[#5D4037]/10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-[#8D6E63] hover:text-[#5D4037] p-2 hover:bg-[#FAD089]/20 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-6 text-center">
                    <div className="inline-flex p-3 rounded-2xl bg-[#FAD089]/20 text-[#5D4037] mb-4">
                        {mode === 'create' ? <Plus size={32} /> : <LinkIcon size={32} />}
                    </div>
                    <h3 className="text-2xl font-bold text-[#5D4037]">
                        {mode === 'create' ? '添加新成員' : '連結現有成員'}
                    </h3>
                    <p className="text-[#8D6E63] text-sm mt-2 font-medium">
                        在 <span className="text-[#5D4037] font-bold border-b-2 border-[#FAD089]/50">{sourceMember.lastName}{sourceMember.firstName}</span> 的樹狀圖節點下
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Mode Switcher */}
                    <div className="flex bg-[#FAD089]/10 p-1 rounded-2xl mb-4">
                        <button
                            type="button"
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'create'
                                ? 'bg-white text-[#5D4037] shadow-sm'
                                : 'text-[#8D6E63] hover:text-[#5D4037]'
                                }`}
                        >
                            <UserPlus size={16} />
                            新增成員
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('link')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'link'
                                ? 'bg-white text-[#5D4037] shadow-sm'
                                : 'text-[#8D6E63] hover:text-[#5D4037]'
                                }`}
                        >
                            <LinkIcon size={16} />
                            連結現有
                        </button>
                    </div>

                    {/* Relationship Type Toggle */}
                    <div className="grid grid-cols-2 gap-3 bg-[#FAD089]/10 p-1.5 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setRelationshipType('child')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all ${relationshipType === 'child'
                                ? 'bg-white text-[#5D4037] shadow-sm ring-1 ring-[#FAD089]/50'
                                : 'text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FAD089]/10'
                                }`}
                        >
                            <Baby size={20} />
                            子女
                        </button>
                        <button
                            type="button"
                            onClick={() => setRelationshipType('spouse')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all ${relationshipType === 'spouse'
                                ? 'bg-white text-[#E57373] shadow-sm ring-1 ring-[#FFCDD2]'
                                : 'text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FAD089]/10'
                                }`}
                        >
                            <Heart size={20} />
                            配偶
                        </button>
                    </div>

                    {mode === 'create' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#8D6E63] ml-1">姓名</label>
                                <input
                                    className="w-full bg-white border-2 border-transparent focus:border-[#FAD089] text-[#5D4037] font-bold text-lg placeholder-[#D7CCC8] py-4 px-5 rounded-2xl outline-none transition-all shadow-sm"
                                    value={firstName}
                                    onChange={e => {
                                        setFirstName(e.target.value);
                                        setLastName('');
                                    }}
                                    placeholder="請輸入名字"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#8D6E63] ml-1">性別</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center justify-center gap-2 cursor-pointer py-3 px-4 rounded-xl flex-1 border-2 transition-all ${gender === 'male'
                                        ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1E88E5]'
                                        : 'bg-white border-transparent hover:bg-[#F5F5F5] text-[#9E9E9E]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={gender === 'male'}
                                            onChange={() => setGender('male')}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-lg">男</span>
                                    </label>
                                    <label className={`flex items-center justify-center gap-2 cursor-pointer py-3 px-4 rounded-xl flex-1 border-2 transition-all ${gender === 'female'
                                        ? 'bg-[#FCE4EC] border-[#F48FB1] text-[#D81B60]'
                                        : 'bg-white border-transparent hover:bg-[#F5F5F5] text-[#9E9E9E]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={gender === 'female'}
                                            onChange={() => setGender('female')}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-lg">女</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#8D6E63] ml-1">選擇現有成員 (孤兒成員)</label>
                            <select
                                className="w-full bg-white border-2 border-transparent focus:border-[#FAD089] text-[#5D4037] font-bold text-lg py-4 px-5 rounded-2xl outline-none transition-all shadow-sm appearance-none cursor-pointer"
                                value={selectedExistingId}
                                onChange={e => setSelectedExistingId(e.target.value)}
                                required
                            >
                                <option value="">請選擇...</option>
                                {orphanCandidates.length > 0 ? (
                                    orphanCandidates.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.lastName}{m.firstName} ({m.gender === 'male' ? '男' : '女'})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>沒有可連結的孤兒成員</option>
                                )}
                            </select>
                            <p className="text-xs text-[#8D6E63] ml-1 mt-1">
                                * 僅列出目前沒有父母的成員
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 rounded-2xl font-bold text-[#5D4037] text-lg shadow-lg active:scale-95 transition-all mt-4 bg-gradient-to-r from-[#FAD089] to-[#FFCC80] hover:from-[#FFCA28] hover:to-[#FFA726] shadow-[#FAD089]/30 border border-[#FFE082]"
                        disabled={mode === 'create' ? !firstName : !selectedExistingId}
                    >
                        {mode === 'create' ? '確認新增' : '確認連結'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};
