import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Heart } from 'lucide-react';

interface HeartAnchorNodeProps {
    data: {
        variant: 'active' | 'widowed' | 'deceased'; // 'active' (both living), 'widowed' (one deceased), 'deceased' (both deceased)
    };
}

export const HeartAnchorNode = memo(({ data }: HeartAnchorNodeProps) => {
    const { variant = 'active' } = data;

    // Visual Styling Mapping
    const styles = {
        active: {
            color: '#F59E0B', // Amber-500 (Gold/Warm Yellow) or Red-500
            fill: 'currentColor',
            className: 'text-amber-500 drop-shadow-sm',
        },
        widowed: {
            color: '#EC4899', // Pink-500
            fill: 'none', // Hollow or semi-transparent
            className: 'text-pink-400 opacity-80',
        },
        deceased: {
            color: '#78716C', // Stone-500 (Warm Grey)
            fill: 'none',
            className: 'text-stone-500 opacity-60 dashed-connection', // Dashed handled by Edge, but node styling here
        }
    };

    const currentStyle = styles[variant];

    return (
        <div className="relative flex items-center justify-center w-8 h-8">
            {/* Visual Heart */}
            <Heart
                size={20}
                color={currentStyle.color}
                fill={variant === 'active' ? currentStyle.color : (variant === 'widowed' ? '#FCE7F3' : 'none')}
                className={` ${currentStyle.className}`}
                strokeWidth={2}
            />

            {/* Target Handle (Top) - Optional, for lineage coming IN to the marriage */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                className="!w-1 !h-1 !bg-transparent !border-none"
                style={{ top: '20%' }}
            />

            {/* Source Handle (Bottom) - For Children */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                className="!w-1 !h-1 !bg-transparent !border-none"
                style={{ bottom: '20%' }}
            />
        </div>
    );
});
