import React from 'react';
import { User } from 'lucide-react';

interface FamilyAvatarProps {
    src?: string;
    gender?: 'male' | 'female' | 'other';
    isDeceased?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-2',
    lg: 'w-[80px] h-[80px] border-[4px]', // Explicit 80px
    xl: 'w-32 h-32 border-4',
};

const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48,
};

export const FamilyAvatar: React.FC<FamilyAvatarProps> = ({
    src,
    gender = 'male',
    isDeceased,
    size = 'lg',
    className = ''
}) => {
    const containerBase = `
        rounded-full 
        overflow-hidden 
        bg-[#E0E0E0] 
        flex items-center justify-center 
        relative 
        transition-all duration-300 ease-in-out
        ${sizeClasses[size]}
    `;

    // Dynamic Border Color
    const borderColor = isDeceased ? 'border-dashed border-slate-400' : 'border-white';

    // Deceased Filter
    const filterClass = isDeceased ? 'grayscale opacity-80' : '';

    return (
        <div className={`family-avatar-component ${containerBase} ${borderColor} ${filterClass} shadow-sm ${className}`}>
            {src ? (
                <img src={src} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${gender === 'male' ? 'bg-[#E3F2FD] text-[#2196F3]' :
                    gender === 'female' ? 'bg-[#FCE4EC] text-[#E91E63]' :
                        'bg-slate-100 text-slate-400'
                    }`}>
                    <User size={iconSizes[size]} strokeWidth={2.5} />
                </div>
            )}
        </div>
    );
};
