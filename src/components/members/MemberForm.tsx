import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFamilyStore } from '../../store/useFamilyStore';
import type { Member, Gender } from '../../types';
import { Heart, Crown, ChevronLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface MemberFormProps {
  initialData?: Member;
  onClose: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({ initialData, onClose }) => {
  const [formData, setFormData] = useState<Partial<Member>>({
    firstName: '',
    lastName: '',
    gender: 'male',
    ...initialData
  });

  const [fatherId, setFatherId] = useState<string>('');
  const [motherId, setMotherId] = useState<string>('');
  const [spouseId, setSpouseId] = useState<string>('');
  const [isMe, setIsMe] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const members = useFamilyStore(state => state.members);
  const relationships = useFamilyStore(state => state.relationships);
  const rootMemberId = useFamilyStore(state => state.rootMemberId);
  
  const addMember = useFamilyStore(state => state.addMember);
  const updateMember = useFamilyStore(state => state.updateMember);
  const addRelationship = useFamilyStore(state => state.addRelationship);
  const removeRelationship = useFamilyStore(state => state.removeRelationship);
  const setRootMember = useFamilyStore(state => state.setRootMember);

  useEffect(() => {
    if (initialData) {
      if (rootMemberId === initialData.id) {
        setIsMe(true);
      }

      // Find parents
      const parentRels = relationships.filter(r => r.targetMemberId === initialData.id && r.type === 'parent');
      parentRels.forEach(r => {
        const parent = members[r.sourceMemberId];
        if (parent && (parent.gender === 'male')) setFatherId(parent.id);
        if (parent && (parent.gender === 'female')) setMotherId(parent.id);
      });

      // Find spouse
      const spouseRel = relationships.find(r => 
        (r.sourceMemberId === initialData.id && r.type === 'spouse') ||
        (r.targetMemberId === initialData.id && r.type === 'spouse')
      );
      if (spouseRel) {
        setSpouseId(spouseRel.sourceMemberId === initialData.id ? spouseRel.targetMemberId : spouseRel.sourceMemberId);
      }
    }
  }, [initialData, relationships, members, rootMemberId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName) return; 

    let memberId = initialData?.id;

    if (initialData) {
      updateMember(initialData.id, formData);
    } else {
      memberId = uuidv4();
      addMember({
        id: memberId,
        firstName: formData.firstName!,
        lastName: '',
        gender: formData.gender as Gender,
        dateOfBirth: formData.dateOfBirth,
        dateOfDeath: formData.dateOfDeath,
        bio: formData.bio,
        photoUrl: formData.photoUrl,
        title: formData.title,
        status: formData.status,
        location: formData.location
      });
    }

    if (memberId) {
       if (isMe) {
         setRootMember(memberId);
       } else if (rootMemberId === memberId && !isMe) {
         setRootMember(''); 
       }

       // Handle Parents
       const relevantParentRels = relationships.filter(r => r.targetMemberId === memberId && r.type === 'parent');
       relevantParentRels.forEach(r => removeRelationship(r.id));

       if (fatherId) addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: memberId, type: 'parent' });
       if (motherId) addRelationship({ id: uuidv4(), sourceMemberId: motherId, targetMemberId: memberId, type: 'parent' });

       // Handle Spouse
       const existingSpouseRels = relationships.filter(r => 
         (r.sourceMemberId === memberId && r.type === 'spouse') || 
         (r.targetMemberId === memberId && r.type === 'spouse')
       );
       existingSpouseRels.forEach(r => removeRelationship(r.id));

       if (spouseId) {
         addRelationship({ id: uuidv4(), sourceMemberId: memberId, targetMemberId: spouseId, type: 'spouse' });
       }
        
       // Auto link parents as spouse
       if (fatherId && motherId) {
          const parentsSpouseRel = relationships.find(r => 
            (r.sourceMemberId === fatherId && r.targetMemberId === motherId && r.type === 'spouse') ||
            (r.sourceMemberId === motherId && r.targetMemberId === fatherId && r.type === 'spouse')
          );
          if (!parentsSpouseRel) {
            addRelationship({ id: uuidv4(), sourceMemberId: fatherId, targetMemberId: motherId, type: 'spouse' });
          }
       }
    }

    onClose();
  };

  const potentialFathers = Object.values(members).filter(m => m.gender === 'male' && m.id !== initialData?.id);
  const potentialMothers = Object.values(members).filter(m => m.gender === 'female' && m.id !== initialData?.id);
  const potentialSpouses = Object.values(members).filter(m => m.id !== initialData?.id); 

  if (!mounted) return null;

  const content = (
    <div 
        style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            isolation: 'isolate',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column'
        }}
    >
      {/* Backdrop */}
      <div 
        style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter backdrop
            backdropFilter: 'blur(4px)'
        }}
        onClick={onClose} 
      />
      
      {/* Mobile-First Container - Light Theme */}
      <div 
        style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '100%',
            maxWidth: '100%', 
            height: '100dvh',
            backgroundColor: '#ffffff', // White
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        }}
        className="md:w-[800px] md:left-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white w-full relative">
            
            {/* Header - Light Theme */}
            <div className="flex items-center gap-4 p-4 md:p-6 border-b border-slate-100 bg-white shrink-0 z-10 shadow-sm">
                <button type="button" onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-95 transition-transform text-slate-500">
                    <ChevronLeft size={28} />
                </button>
                <div className="flex-1">
                     <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {initialData ? '編輯成員' : '新增成員'}
                    </h2>
                </div>
                <button 
                  type="submit" 
                  className="btn-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-violet-500/20 active:transform active:translate-y-0.5 transition-all text-sm"
                >
                    儲存
                </button>
            </div>

            {/* Scrollable Content - Light Theme */}
            <div 
                className="flex-1 overflow-y-scroll custom-scrollbar p-5 pb-32 md:pb-10 w-full bg-slate-50 overflow-x-hidden"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
            
                {/* Visual Set as Me Section */}
                <div className="mb-8">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">角色設定</p>
                     <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                        <div 
                            onClick={() => setIsMe(false)}
                            className={`flex-1 min-w-[45%] p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center active:scale-95 transform duration-100 ${!isMe ? 'border-indigo-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'}`}
                        >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${!isMe ? 'border-primary' : 'border-slate-300'}`}>
                                {!isMe && <div className="w-4 h-4 bg-primary rounded-full" />}
                            </div>
                            <span className={`font-bold text-lg ${!isMe ? 'text-slate-800' : 'text-slate-500'}`}>一般成員</span>
                        </div>

                        <div 
                            onClick={() => setIsMe(true)}
                            className={`flex-1 min-w-[45%] p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center active:scale-95 transform duration-100 ${isMe ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'}`}
                        >
                             <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${isMe ? 'border-amber-500' : 'border-slate-300'}`}>
                                {isMe && <div className="w-4 h-4 bg-amber-500 rounded-full" />}
                            </div>
                             <span className={`font-bold text-lg ${isMe ? "text-amber-600" : "text-slate-500"}`}>這是本人</span>
                        </div>
                     </div>
                     {isMe && (
                         <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                             <Crown size={16} className="text-amber-500 mt-0.5 shrink-0" />
                             <p className="text-sm text-amber-700">系統將以此成員為中心，自動計算其他成員的親屬稱謂 (如爸爸、舅舅、女婿...)</p>
                         </div>
                     )}
                </div>

                {/* Mobile Stacked Layout */}
                <div className="space-y-6">
                    
                    {/* Basic Info Card */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">基本資料</h3>
                        
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">姓名</label>
                                <input 
                                    className="input-field text-lg py-3 text-slate-800 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary" 
                                    placeholder="例如: 王大明" 
                                    value={formData.firstName} 
                                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">性別</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${formData.gender === "male" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}>
                                        <input type="radio" className="hidden" name="gender" value="male" checked={formData.gender === "male"} onChange={() => setFormData({...formData, gender: "male"})} />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.gender === "male" ? "bg-blue-100" : "bg-slate-100"}`}>
                                            <span className="text-lg font-bold">♂</span>
                                        </div>
                                        <span className="font-bold">男性</span>
                                    </label>
                                    
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${formData.gender === "female" ? "bg-pink-50 border-pink-500 text-pink-700 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}>
                                        <input type="radio" className="hidden" name="gender" value="female" checked={formData.gender === "female"} onChange={() => setFormData({...formData, gender: "female"})} />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.gender === "female" ? "bg-pink-100" : "bg-slate-100"}`}>
                                            <span className="text-lg font-bold">♀</span>
                                        </div>
                                        <span className="font-bold">女性</span>
                                    </label>

                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${formData.gender === "other" ? "bg-slate-100 border-slate-500 text-slate-700 shadow-sm" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}>
                                        <input type="radio" className="hidden" name="gender" value="other" checked={formData.gender === "other"} onChange={() => setFormData({...formData, gender: "other"})} />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.gender === "other" ? "bg-slate-200" : "bg-slate-100"}`}>
                                            <span className="text-lg font-bold">?</span>
                                        </div>
                                        <span className="font-bold">其他</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">狀態</label>
                                <input className="input-field py-2.5 text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" value={formData.status || ""} onChange={e => setFormData({...formData, status: e.target.value})} placeholder="例如: 在世, 歿" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">居住地 / 位置</label>
                                <input 
                                    className="input-field py-2.5 text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" 
                                    value={formData.location || ''} 
                                    onChange={e => setFormData({...formData, location: e.target.value})} 
                                    placeholder="例如: 台北市, 美國加州..." 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">出生日期</label>
                                    <input type="date" className="input-field py-2.5 text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" value={formData.dateOfBirth || ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">歿於 (選填)</label>
                                    <input type="date" className="input-field py-2.5 text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" value={formData.dateOfDeath || ''} onChange={e => setFormData({...formData, dateOfDeath: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200 my-4" />

                    {/* Relationships Card */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">親屬連結</h3>
                         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            
                            {/* Parents Group */}
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">父母 (自動連結)</label>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">父</span>
                                        <select className="input-field pl-10 h-12 appearance-none cursor-pointer text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" value={fatherId} onChange={e => setFatherId(e.target.value)}>
                                            <option value="">未選擇父親</option>
                                            {potentialFathers.map(m => (
                                                <option key={m.id} value={m.id}>{m.lastName}{m.firstName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">母</span>
                                        <select className="input-field pl-10 h-12 appearance-none cursor-pointer text-slate-800 bg-slate-50 border-slate-200 focus:bg-white" value={motherId} onChange={e => setMotherId(e.target.value)}>
                                            <option value="">未選擇母親</option>
                                            {potentialMothers.map(m => (
                                                <option key={m.id} value={m.id}>{m.lastName}{m.firstName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100" />
                            
                            {/* Spouse Group */}
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                                    <Heart size={12} className="text-pink-500" /> 配偶
                                </label>
                                <select className="input-field h-12 appearance-none cursor-pointer border-pink-100 bg-pink-50/30 text-slate-800 focus:bg-white focus:border-pink-300" value={spouseId} onChange={e => setSpouseId(e.target.value)}>
                                    <option value="">未選擇配偶</option>
                                    {potentialSpouses.map(m => (
                                        <option key={m.id} value={m.id}>{m.lastName}{m.firstName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
