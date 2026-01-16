import { memo } from 'react';

export const BreathingHalo = memo(() => {
    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center pointer-events-none z-0"
        >
            {/* Steady Outer Glow - Halo */}
            <div className="absolute inset-0 rounded-full border-[4px] border-[#FAD089]/50 shadow-[0_0_20px_rgba(250,208,137,0.6)]" />

            {/* Expanding Breathing Ripple 1 */}
            <div className="absolute inset-0 rounded-full border-[2px] border-[#FAD089] animate-ripple opacity-80" />

            {/* Expanding Breathing Ripple 2 (Delayed) */}
            <div className="absolute inset-0 rounded-full border-[2px] border-[#FAD089] animate-ripple opacity-60" style={{ animationDelay: '0.6s' }} />
        </div>
    );
});

BreathingHalo.displayName = 'BreathingHalo';
