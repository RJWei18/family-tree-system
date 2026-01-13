import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Panel, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyStore } from '../../store/useFamilyStore';
import { CustomNode } from './CustomNode';
import { buildGraph, getLayoutedElements } from '../../utils/layout';
import { TreeSearch } from './TreeSearch';
import { ExportButton } from './ExportButton';

export const FamilyGraph: React.FC = () => {
    const members = useFamilyStore(s => s.members);
    const relationships = useFamilyStore(s => s.relationships);
    const isDarkMode = useFamilyStore((state) => state.isDarkMode);

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
        <div style={{ width: '100vw', height: '100vh' }} className="relative bg-[#F9F4E8] dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
            {/* Background Image with Opacity */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: 'url(./tree-background.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.3
                }}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable={true}
                snapToGrid={true}
                snapGrid={[20, 20]}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#8D6E63', strokeWidth: 2 },
                    // startMarker: undefined,
                    // endMarker: undefined, // No search arrows
                    pathOptions: { borderRadius: 20 }
                }}
            >
                <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 fill-slate-600 dark:fill-slate-400" />
                <MiniMap
                    style={{
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.8)',
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                    }}
                    nodeStrokeColor={isDarkMode ? '#64748b' : '#94a3b8'}
                    nodeColor={isDarkMode ? '#334155' : '#e2e8f0'}
                    maskColor={isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.6)'}
                />
                <Panel position="top-left" className="!m-4">
                    <TreeSearch />
                </Panel>
                <Panel position="top-right" className="!m-4">
                    <ExportButton />
                </Panel>
            </ReactFlow>
        </div>
    );
};
