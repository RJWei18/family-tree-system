import React, { useMemo, useState } from 'react';
import { useFamilyStore } from '../store/useFamilyStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Cake, Skull } from 'lucide-react';
import type { Member } from '../types';

export const BirthdayCalendar: React.FC = () => {
    const members = useFamilyStore((state) => state.members);
    
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const calendarData = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        
        const days: { date: number, members: Member[] }[] = [];
        
        // Fill empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ date: 0, members: [] });
        }

        // Fill current month days
        for (let i = 1; i <= daysInMonth; i++) {
            // Find members born on this day (ignoring year)
            // Note: dateOfBirth string is usually YYYY-MM-DD
            const birthdayMembers = Object.values(members).filter(m => {
                if (!m.dateOfBirth) return false;
                const dob = new Date(m.dateOfBirth);
                return dob.getMonth() === month && dob.getDate() === i;
            });
            days.push({ date: i, members: birthdayMembers });
        }

        return days;

    }, [year, month, members]);

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="h-full flex flex-col p-4 md:p-8 bg-slate-50 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold heading-gradient mb-2 flex items-center gap-3">
                        <CalendarIcon className="text-violet-600" />
                        壽星月曆
                    </h2>
                    <p className="text-slate-500">查看本月過生日的家族成員。</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                        <ChevronLeft />
                    </button>
                    <span className="text-xl font-bold text-slate-800 w-32 text-center">
                        {year}年 {month + 1}月
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Weekday Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {weekDays.map(d => (
                        <div key={d} className="py-3 text-center text-sm font-bold text-slate-500">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-auto overflow-y-auto">
                    {calendarData.map((day, idx) => {
                        const isToday = new Date().getDate() === day.date && new Date().getMonth() === month && new Date().getFullYear() === year;

                        if (day.date === 0) return <div key={idx} className="bg-slate-50/50 border-b border-r border-slate-100 min-h-[100px]" />;

                        return (
                            <div key={idx} className={`border-b border-r border-slate-100 p-2 min-h-[100px] flex flex-col gap-1 transition-colors hover:bg-slate-50 ${isToday ? 'bg-amber-50/50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>
                                        {day.date}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-1">
                                    {day.members.map(m => {
                                        const isDeceased = !!m.dateOfDeath || m.status === '殁' || m.status === 'Deceased';
                                        return (
                                            <div key={m.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                                                isDeceased 
                                                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                                : 'bg-violet-50 text-violet-700 border-violet-100'
                                            }`}>
                                                {isDeceased ? <Skull size={10} /> : <Cake size={10} className="text-pink-400" />}
                                                <span className="truncate">{m.firstName}</span>
                                                {isDeceased && <span className="opacity-75 transform scale-90 ml-auto">殁</span>}
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
    );
};
