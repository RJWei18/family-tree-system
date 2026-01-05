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
        <div style={{ width: '100%', height: '100%' }} className="absolute inset-0 text-black bg-slate-900">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
            >
                <Background color="#555" gap={16} />
                <Controls />
                <MiniMap style={{background: '#222'}} nodeStrokeColor="#fff" nodeColor="#555" />
            </ReactFlow>
        </div>
    );
};
