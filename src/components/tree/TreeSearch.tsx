import React, { useState, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { Search, X } from 'lucide-react';
import { useFamilyStore } from '../../store/useFamilyStore';

export const TreeSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const members = useFamilyStore(s => s.members);
    const setHighlightedMemberId = useFamilyStore(s => s.setHighlightedMemberId);
    const { fitView } = useReactFlow();

    const memberList = Object.values(members);

    const filteredMembers = query
        ? memberList.filter(m =>
            (m.firstName + m.lastName).toLowerCase().includes(query.toLowerCase()) ||
            (m.lastName + m.firstName).toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5) // Limit to 5 results
        : [];

    const handleSelect = (memberId: string) => {
        setHighlightedMemberId(memberId);

        // Pan to node
        fitView({
            nodes: [{ id: memberId }],
            duration: 800,
            padding: 0.5,
            minZoom: 0.5,
            maxZoom: 1.5
        });

        setIsOpen(false);
        setQuery('');
    };

    // Close search results when clicking outside (simple implementation)
    useEffect(() => {
        const handleClick = () => setIsOpen(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="relative z-10 w-72" onClick={e => e.stopPropagation()}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white/90 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent sm:text-sm shadow-sm transition-all text-slate-800 font-medium"
                    placeholder="搜尋成員..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setHighlightedMemberId(null);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && filteredMembers.length > 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <ul className="max-h-60 overflow-auto py-1">
                        {filteredMembers.map((member) => (
                            <li key={member.id}>
                                <button
                                    onClick={() => handleSelect(member.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors flex items-center gap-3"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.gender === 'male' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-600'}`}>
                                        {member.photoUrl ? (
                                            <img src={member.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold">{member.firstName[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{member.firstName}</p>
                                        <p className="text-xs text-slate-400">
                                            {member.dateOfBirth ? new Date(member.dateOfBirth).getFullYear() : '未知年份'}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
