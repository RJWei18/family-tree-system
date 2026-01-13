import React, { useState } from 'react';
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

    return (
        // Non-blocking container positioned consistently
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {/* The Card itself - pointer-events-auto to allow interaction */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-6 w-80 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-violet-100 text-violet-600 rounded-lg">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">稱謂計算機</h2>
                        <p className="text-sm text-slate-500">計算兩位成員之間的親戚關係</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Person A */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">出發點 (我是...)</label>
                        <select
                            className="input-field w-full py-2.5 bg-slate-50 border-slate-200"
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

                    <div className="flex justify-center -my-2">
                        <button
                            onClick={handleSwap}
                            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors border border-slate-200 hover:border-violet-200"
                            title="交換位置"
                        >
                            <ArrowRightLeft size={16} />
                        </button>
                    </div>

                    {/* Person B */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">對象 (他是我的...)</label>
                        <select
                            className="input-field w-full py-2.5 bg-slate-50 border-slate-200"
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

                    {/* Result */}
                    {result && (
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-slate-500 text-sm block mb-1">關係稱謂</span>
                            <span className="text-2xl font-bold text-violet-700">{result}</span>
                        </div>
                    )}

                    <button
                        onClick={handleCalculate}
                        disabled={!personA || !personB}
                        className="w-full btn btn-primary py-3 text-lg shadow-lg shadow-violet-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        開始計算
                    </button>
                </div>
            </div>
        </div>
    );
};
