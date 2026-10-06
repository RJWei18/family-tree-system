import React from 'react';
import { ReactFlowProvider, useReactFlow } from 'reactflow';

// Mock implementation for Phase 3 Read-only view
const HourglassGraph = () => {
    const { fitView } = useReactFlow();

    // just an empty container to not crash and show something
    React.useEffect(() => {
        fitView({ padding: 0.2, duration: 300 });
    }, [fitView]);

    return (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
            Hourglass View (Read-only)
        </div>
    );
};

export const HourglassView: React.FC = () => {
    return (
        <ReactFlowProvider>
            <HourglassGraph />
        </ReactFlowProvider>
    );
};
