import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFamilyStore } from '../../store/useFamilyStore';
import { calculateRelationship } from '../../utils/kinship';
import { X, Calculator, ArrowRightLeft } from 'lucide-react';

interface KinshipCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KinshipCalculator: React.FC<KinshipCalculatorProps> = ({ isOpen, onClose }) => {
    const members = useFamilyStore(s => s.members);
    const relationships = useFamilyStore(s => s.relationships);
    const memberList = Object.values(members);

    const [personA, setPersonA] = useState<string>('');
    const [personB, setPersonB] = useState<string>('');
    const [result, setResult] = useState<string>('');

    const handleCalculate = () => {
        if (!personA || !personB) return;
        const title = calculateRelationship(personA, personB, members, relationships);
        setResult(title || '無直接關係');
    };

    const handleSwap = () => {
        setPersonA(personB);
        setPersonB(personA);
        setResult(''); // Clear result on swap
    };

    if (!isOpen) return null;

    return createPortal(
        // Modal Overlay - Centered and High Z-Index
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Modal Overlay */}
            <div
                className="absolute inset-0 backdrop-blur-md animate-in fade-in duration-200"
                style={{ backgroundColor: 'rgba(93, 64, 55, 0.2)' }}
                onClick={onClose}
            />

            {/* The Card */}
            <div className="bg-[#FFFBF0] rounded-[32px] shadow-2xl p-8 w-full max-w-sm pointer-events-auto relative animate-in zoom-in-95 duration-200 shadow-[#5D4037]/10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#FAD089]/20 text-[#8D6E63] hover:text-[#5D4037] transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[#FAD089]/20 text-[#5D4037] rounded-2xl">
                        <Calculator size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#5D4037]">稱謂計算機</h2>
                        <p className="text-sm text-[#8D6E63] font-medium mt-1">計算兩位成員之間的親戚關係</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Person A */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#8D6E63] uppercase tracking-wider ml-1">出發點 (我是...)</label>
                        <select
                            className="w-full bg-white border-2 border-transparent focus:border-[#FAD089] text-[#5D4037] font-bold text-base py-3 px-4 rounded-xl outline-none transition-all shadow-sm appearance-none cursor-pointer hover:bg-white/80"
                            value={personA}
                            onChange={(e) => setPersonA(e.target.value)}
                        >
                            <option value="">請選擇成員</option>
                            {memberList.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.firstName} {m.dateOfBirth ? `(${new Date(m.dateOfBirth).getFullYear()})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center -my-3 z-10 relative">
                        <button
                            onClick={handleSwap}
                            className="p-2.5 rounded-full bg-[#FFFBF0] text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FAD089]/20 transition-all border-2 border-[#EFEBE9] hover:border-[#FAD089] shadow-sm transform hover:rotate-180 duration-300"
                            title="交換位置"
                        >
                            <ArrowRightLeft size={20} />
                        </button>
                    </div>

                    {/* Person B */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#8D6E63] uppercase tracking-wider ml-1">對象 (他是我的...)</label>
                        <select
                            className="w-full bg-white border-2 border-transparent focus:border-[#FAD089] text-[#5D4037] font-bold text-base py-3 px-4 rounded-xl outline-none transition-all shadow-sm appearance-none cursor-pointer hover:bg-white/80"
                            value={personB}
                            onChange={(e) => setPersonB(e.target.value)}
                        >
                            <option value="">請選擇成員</option>
                            {memberList.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.firstName} {m.dateOfBirth ? `(${new Date(m.dateOfBirth).getFullYear()})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Result with Ribbon Style */}
                    {result && (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2 pt-2">
                            <span className="text-[#8D6E63] text-xs font-bold mb-2 uppercase tracking-wide">計算結果</span>
                            <div className="relative">
                                {/* Ribbon Tail Left */}
                                <div className="absolute top-2 -left-3 border-r-[12px] border-r-[#FBC02D] border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent transform rotate-180 brightness-75"></div>
                                {/* Ribbon Tail Right */}
                                <div className="absolute top-2 -right-3 border-l-[12px] border-l-[#FBC02D] border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent transform rotate-180 brightness-75"></div>

                                {/* Main Ribbon Body */}
                                <div className="bg-gradient-to-r from-[#FAD089] to-[#FFCC80] text-[#5D4037] px-8 py-3 rounded-lg shadow-lg transform -skew-x-6 relative z-10 border-b-4 border-[#FFA000]/20">
                                    <span className="text-2xl font-bold block transform skew-x-6 leading-none">
                                        {result}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={!personA || !personB}
                        className="w-full py-4 rounded-2xl font-bold text-[#5D4037] text-lg shadow-lg active:scale-95 transition-all mt-4 bg-gradient-to-r from-[#FAD089] to-[#FFCC80] hover:from-[#FFCA28] hover:to-[#FFA726] shadow-[#FAD089]/30 border border-[#FFE082] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        開始計算
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
