import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const VirtualNode = memo(() => {
    return (
        <div style={{ width: 1, height: 1, opacity: 1, overflow: 'visible', visibility: 'visible' }}>
            {/* Target Handle for Spouses (Horizontal lines arrive here) - Top */}
            <Handle
                type="target"
                id="t"
                position={Position.Top}
                style={{ top: 0, left: 0, width: 1, height: 1, background: 'transparent', border: 0 }}
                isConnectable={true}
            />
            {/* Source Handle for Children (Vertical line leaves here) - Bottom */}
            <Handle
                type="source"
                id="s"
                position={Position.Bottom}
                style={{ top: 0, left: 0, width: 1, height: 1, background: 'transparent', border: 0 }}
                isConnectable={true}
            />
        </div>
    );
});
