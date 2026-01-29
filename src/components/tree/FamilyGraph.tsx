import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Controls, MiniMap, Panel, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyStore } from '../../store/useFamilyStore';
import { CustomNode } from './CustomNode';
import { VirtualNode } from './VirtualNode';
import { FamilyGroupNode } from './FamilyGroupNode';
import { HeartAnchorNode } from './HeartAnchorNode';
import { buildGraph, getLayoutedElements } from '../../utils/layout';
import { TreeSearch } from './TreeSearch';
import { ExportButton } from './ExportButton';

const FamilyGraphContent: React.FC = () => {
    const members = useFamilyStore(s => s.members);
    const relationships = useFamilyStore(s => s.relationships);
    const isDarkMode = useFamilyStore((state) => state.isDarkMode);
    const { fitView } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
        virtual: VirtualNode,
        FamilyGroup: FamilyGroupNode,
        heart: HeartAnchorNode
    }), []);

    const onLayout = useCallback(() => {
        const { nodes: builtNodes, edges: builtEdges } = buildGraph(members, relationships);

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            builtNodes,
            builtEdges
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        // Force fit view after small delay to allow render
        window.requestAnimationFrame(() => {
            fitView({ padding: 0.2 });
        });
    }, [members, relationships, setNodes, setEdges, fitView]);

    useEffect(() => {
        // Only run layout if we have members
        // Debounce slightly to prevent flicker on rapid updates
        const timer = setTimeout(() => {
            if (Object.keys(members).length > 0) {
                onLayout();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [onLayout, members]);

    const onNodeDrag = useCallback((_event: React.MouseEvent, node: any) => {
        // Dynamic Heart Centering & Axis Locking Logic
        // 1. Check if dragged node is a Member and has a parent (FamilyGroup)
        if (node.type === 'custom' && node.parentNode) {
            setNodes((nds) => {
                // Find relationships in the current state
                const groupMembers = nds.filter(n => n.parentNode === node.parentNode && n.type === 'custom');
                const heartNode = nds.find(n => n.parentNode === node.parentNode && n.type === 'heart');

                if (groupMembers.length === 2 && heartNode) {
                    const otherSpouse = groupMembers.find(n => n.id !== node.id);
                    if (!otherSpouse) return nds;

                    // STRICT Y-AXIS LOCKING:
                    const lockedY = 50;

                    // Force the dragged node's internal position in state (Pseudo-constraint)
                    if (node.position.y !== lockedY) {
                        node.position.y = lockedY;
                    }

                    // Calculate Heart Metrics
                    // Use the latest interactive X from 'node' (the dragged one)
                    const draggedX = node.position.x;
                    const otherX = otherSpouse.position.x;

                    // CONSTANTS derived from layout
                    const MEMBER_WIDTH = 120; // 120px matches .family-node-container width
                    const HEART_WIDTH = 32;   // w-8 = 32px

                    // Geometric Center Calculation (User Requested):
                    // Formula: (x1 + x2)/2 + (MEMBER_WIDTH - HEART_WIDTH)/2
                    const midX = (draggedX + otherX) / 2 + (MEMBER_WIDTH - HEART_WIDTH) / 2;

                    // Heart Y alignment (ABSOLUTE LOCK):
                    // Handle Absolute Y = 50 + 40 = 90.
                    // Heart Center Y = 90.
                    // Heart Node Top-Left = Center Y - 16 = 90 - 16 = 74.
                    const fixedHeartY = 74;

                    return nds.map(n => {
                        // Synchronous Heart Position Update
                        if (n.id === heartNode.id) {
                            return {
                                ...n,
                                position: { x: midX, y: fixedHeartY },
                                draggable: false // Ensure heart is static
                            };
                        }
                        // Enforce Dragged Node Y-Lock
                        if (n.id === node.id) {
                            return {
                                ...n,
                                position: { ...n.position, y: lockedY }
                            };
                        }
                        return n;
                    });
                }
                return nds;
            });
        }
    }, [setNodes]);

    return (
        <div className="w-full h-full flex-1 relative bg-[#F9F4E8] dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
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
                onNodeDrag={onNodeDrag} // Add Drag Handler
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable={true}
                snapToGrid={true}
                snapGrid={[10, 10]} // Finer grid for smoother drag
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#8D6E63', strokeWidth: 2 },
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

export const FamilyGraph: React.FC = () => {
    return (
        <ReactFlowProvider>
            <FamilyGraphContent />
        </ReactFlowProvider>
    );
};
