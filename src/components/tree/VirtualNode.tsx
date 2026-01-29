import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const VirtualNode = memo(() => {
    return (
        <div className="relative group flex items-center justify-center" style={{ width: 24, height: 24, pointerEvents: 'all' }}>
            {/* Visual Dot (Visible on functionality) */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#8D6E63] group-hover:scale-150 transition-transform shadow-sm" />

            {/* Extended Hit Area/Drag Handle overlay */}
            <div className="absolute inset-0 rounded-full bg-[#8D6E63]/0 hover:bg-[#8D6E63]/10 transition-colors cursor-move" />

            {/* Target Handle for Spouses (Horizontal lines arrive here) - Top */}
            <Handle
                type="target"
                id="t"
                position={Position.Top}
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1, height: 1, opacity: 0, border: 0 }}
                isConnectable={true}
            />
            {/* Source Handle for Children (Vertical line leaves here) - Bottom */}
            <Handle
                type="source"
                id="s"
                position={Position.Bottom}
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1, height: 1, opacity: 0, border: 0 }}
                isConnectable={true}
            />
        </div>
    );
});
