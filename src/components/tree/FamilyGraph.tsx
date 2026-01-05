import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyStore } from '../../store/useFamilyStore';
import { CustomNode } from './CustomNode';
import { buildGraph, getLayoutedElements } from '../../utils/layout';

export const FamilyGraph: React.FC = () => {
    const members = useFamilyStore(s => s.members);
    const relationships = useFamilyStore(s => s.relationships);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
    }), []);

    const onLayout = useCallback(() => {
        const { nodes: initialNodes, edges: initialEdges } = buildGraph(members, relationships);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [members, relationships, setNodes, setEdges]);

    useEffect(() => {
        onLayout();
    }, [onLayout]);

    return (
        <div style={{ width: '100%', height: '100%' }} className="absolute inset-0 text-slate-900 bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }}
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls className="bg-white border border-slate-200 shadow-sm text-slate-600 fill-slate-600" />
                <MiniMap 
                    style={{background: 'rgba(255,255,255,0.8)', border: '1px solid #e2e8f0'}} 
                    nodeStrokeColor="#94a3b8" 
                    nodeColor="#e2e8f0" 
                    maskColor="rgba(241, 245, 249, 0.6)"
                />
            </ReactFlow>
        </div>
    );
};
