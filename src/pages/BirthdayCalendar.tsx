import React, { useMemo, useState } from 'react';
import { useFamilyStore } from '../store/useFamilyStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Cake } from 'lucide-react';
import type { Member } from '../types';
import { calculateAge } from '../utils/dateHelpers';
import { FamilyAvatar } from '../components/common/FamilyAvatar';

export const BirthdayCalendar: React.FC = () => {
    const members = useFamilyStore((state) => state.members);
    // HMR Trigger: Refresh Layout
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const { days, monthlyBirthdays } = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const daysArray: { date: number, members: Member[] }[] = [];
        const monthMembers: { member: Member, day: number, age: number }[] = [];

        // Previous month filler
        for (let i = 0; i < firstDayOfMonth; i++) {
            daysArray.push({ date: 0, members: [] });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const birthdayMembers = Object.values(members).filter(m => {
                if (!m.dateOfBirth) return false;
                const dob = new Date(m.dateOfBirth);
                return dob.getMonth() === month && dob.getDate() === i;
            });

            daysArray.push({ date: i, members: birthdayMembers });

            // Add to monthly summary
            birthdayMembers.forEach(m => {
                const age = calculateAge(m.dateOfBirth, m.dateOfDeath);
                monthMembers.push({
                    member: m,
                    day: i,
                    age: age ? parseInt(age) : 0
                });
            });
        }

        // Sort monthly members by day
        monthMembers.sort((a, b) => a.day - b.day);

        return { days: daysArray, monthlyBirthdays: monthMembers };

    }, [year, month, members]);

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="flex flex-col md:flex-row w-full gap-4 py-6 px-[40px] max-w-[1200px] mx-auto box-border">

            {/* Sidebar: Monthly Summary */}
            <aside className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                <div className="glass-panel p-4 bg-white/60 flex flex-col">
                    <h2 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                        <Cake className="text-[#FAD089]" size={20} />
                        本月壽星 ({monthlyBirthdays.length})
                    </h2>

                    <div className="flex-1 pr-1 space-y-3">
                        {monthlyBirthdays.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-8">本月沒有壽星</p>
                        ) : (
                            monthlyBirthdays.map(({ member, day, age }) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                                    {/* Fixed Width Date Column */}
                                    <div className="w-[36px] shrink-0 text-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">DATE</div>
                                        <div className="text-xl font-black text-[#FAD089] leading-none drop-shadow-sm filter">
                                            {day}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-8 bg-slate-100 shrink-0" />

                                    {/* Avatar & Info */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <FamilyAvatar src={member.photoUrl} gender={member.gender} size="sm" isDeceased={!!member.dateOfDeath} />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm text-[var(--text-main)] truncate">
                                                {member.lastName}{member.firstName}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] truncate">
                                                {age > 0 ? `${age} 歲` : '生日快樂'}
                                            </div>
                                        </div>
                                    </div>

                                    {!!member.dateOfDeath && <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded whitespace-nowrap">紀念</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Calendar Grid */}
            <div className="flex-1 flex flex-col glass-panel bg-white/60 shadow-sm border border-white/50 rounded-2xl min-h-0">
                {/* Calendar Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <CalendarIcon size={20} className="text-[var(--text-muted)]" />
                        {year} 年 {month + 1} 月
                    </h2>
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--text-main)]">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium px-3 py-1.5 rounded-full bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--accent)] transition-colors mx-1">
                            今天
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--text-main)]">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 flex flex-col p-6">
                    {/* Week Header */}
                    <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--bg-main)] rounded-t-lg">
                        {weekDays.map(d => (
                            <div key={d} className="py-2 text-center text-xs font-bold text-[var(--text-muted)] opacity-70">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 auto-rows-fr bg-white rounded-b-lg shadow-inner">
                        {days.map((day, idx) => {
                            if (day.date === 0) return <div key={idx} className="bg-slate-50/30 border-b border-r border-slate-100/50 min-h-[120px]" />;

                            const isToday = new Date().getDate() === day.date && new Date().getMonth() === month && new Date().getFullYear() === year;

                            return (
                                <div key={idx} className={`
                                    relative border-b border-r border-[var(--border-color)]/30 p-1 min-h-[120px] flex flex-col items-center gap-1 transition-colors
                                    ${isToday ? 'bg-[#FAD089]/20' : 'hover:bg-slate-50'}
                                `}>
                                    <div className="w-full flex justify-end px-2 pt-1">
                                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#FAD089] text-[#5D4037]' : 'text-[var(--text-muted)]'}`}>
                                            {day.date}
                                        </span>
                                    </div>

                                    {/* Birthdays on this day */}
                                    <div className="flex flex-col gap-1 w-full px-1 flex-1">
                                        {day.members.map(m => {
                                            const isDeceased = !!m.dateOfDeath;
                                            return (
                                                <div key={m.id} className={`
                                                    flex items-center gap-1.5 p-1 rounded-md mb-1 transition-all
                                                    ${isDeceased ? 'bg-slate-100/50' : 'bg-pink-50/50 hover:bg-pink-100'}
                                                `}>
                                                    {/* Tiny Avatar (24px approx) */}
                                                    <div className="w-6 h-6 shrink-0">
                                                        <FamilyAvatar
                                                            src={m.photoUrl}
                                                            gender={m.gender}
                                                            size="sm"
                                                            isDeceased={isDeceased}
                                                            className="!w-6 !h-6 !border-[1px]"
                                                        />
                                                    </div>

                                                    {/* Name Truncated */}
                                                    <div className="min-w-0 flex-1 text-[10px] font-medium truncate text-slate-700">
                                                        {m.lastName}{m.firstName}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
