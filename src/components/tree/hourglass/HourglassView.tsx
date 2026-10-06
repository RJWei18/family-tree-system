import React, { useMemo, useEffect, useRef } from 'react';
import ReactFlow, { ReactFlowProvider, useReactFlow, Controls, MiniMap } from 'reactflow';
import type { NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

import { useFamilyStore } from '../../../store/useFamilyStore';
import { useHourglassStore } from '../../../store/useHourglassStore';
import { buildFamilyIndex } from '../../../utils/hourglass/familyIndex';
import { buildHourglassModel } from '../../../utils/hourglass/hourglassModel';
import { layoutHourglass } from '../../../utils/hourglass/hourglassLayout';
import { toFlow } from '../../../utils/hourglass/toFlow';

import { CustomNode } from '../CustomNode';
import { HeartAnchorNode } from '../HeartAnchorNode';
import { GhostMemberNode } from './GhostMemberNode';
import { HgBadgeNode } from './HgBadgeNode';
import { TreeSearch } from '../TreeSearch';
import { ExportButton } from '../ExportButton';
import { HourglassToolbar } from './HourglassToolbar';
import { SelectionActionBar } from './SelectionActionBar';
import { HourglassEmptyState } from './HourglassEmptyState';
import { familyConfig } from '../../../config/familyConfig';

const nodeTypes: NodeTypes = { 
    custom: CustomNode as any, 
    heart: HeartAnchorNode as any, 
    ghost: GhostMemberNode as any, 
    hgBadge: HgBadgeNode as any 
};

const HourglassGraph = () => {
    const { fitView } = useReactFlow();
    const members = useFamilyStore(s => s.members);
    const relationships = useFamilyStore(s => s.relationships);
    const highlightedMemberId = useFamilyStore(s => s.highlightedMemberId);
    const setHighlightedMemberId = useFamilyStore(s => s.setHighlightedMemberId);

    const { 
        focusId, ancestorDepth, descendantDepth, 
        collapsedOverride, expandedOverride,
        resolveInitial, validateFocus, setFocus
    } = useHourglassStore();

    // Data init and sync
    useEffect(() => {
        resolveInitial(members, familyConfig.homeMemberName);
    }, [members, resolveInitial]);

    useEffect(() => {
        validateFocus(members);
    }, [members, validateFocus]);

    const index = useMemo(() => buildFamilyIndex(members, relationships), [members, relationships]);

    const { nodes, edges } = useMemo(() => {
        if (!focusId || !members[focusId]) return { nodes: [], edges: [] };
        
        // ensure overrides are sets
        const collapsedSet = new Set(Object.keys(collapsedOverride));
        const expandedSet = new Set(Object.keys(expandedOverride));

        const model = buildHourglassModel(index, {
            focusId,
            ancestorDepth,
            descendantDepth,
            collapsedOverride: collapsedSet,
            expandedOverride: expandedSet
        });

        const layout = layoutHourglass(model, index);
        const flowData = toFlow(layout);

        // Map node types to React Flow types
        const reactFlowNodes = flowData.nodes.map(n => {
            let type = 'custom';
            if (n.type === 'heart') type = 'heart';
            else if (n.type === 'ghost') type = 'ghost';
            else if (n.type === 'badge') type = 'hgBadge';

            return {
                ...n,
                type,
                // Add highlight state for member and ghost nodes
                data: {
                    ...n.data,
                    highlighted: (n.type === 'custom' || n.type === 'ghost') && 
                                 n.data?.id === highlightedMemberId
                }
            };
        });

        return { nodes: reactFlowNodes, edges: flowData.edges };
    }, [index, focusId, ancestorDepth, descendantDepth, collapsedOverride, expandedOverride, highlightedMemberId]);

    const prevFocusIdRef = useRef(focusId);

    useEffect(() => {
        if (nodes.length > 0) {
            // Fit view when layout completely changes (focus changes)
            if (prevFocusIdRef.current !== focusId) {
                requestAnimationFrame(() => {
                    fitView({ padding: 0.2, duration: 300 });
                });
                prevFocusIdRef.current = focusId;
            } else {
                // Also fit view smoothly on other layout changes (expand/collapse)
                requestAnimationFrame(() => {
                    fitView({ padding: 0.2, duration: 300 });
                });
            }
        }
    }, [nodes, fitView, focusId]);

    if (!focusId || !members[focusId]) {
        return <HourglassEmptyState />;
    }

    const handleNodeClick = (_: React.MouseEvent, node: any) => {
        if (node.type === 'custom' || node.type === 'ghost') {
            if (node.data?.id) {
                setHighlightedMemberId(node.data.id);
            }
        } else if (node.type === 'hgBadge') {
            // Badges are handled by their own component
        }
    };
    
    const handleNodeDoubleClick = (_: React.MouseEvent, node: any) => {
        if ((node.type === 'custom' || node.type === 'ghost') && node.data?.id) {
            setFocus(node.data.id);
        }
    };

    const handlePaneClick = () => {
        setHighlightedMemberId(null);
    };

    const handleSearchPick = (memberId: string) => {
        const isVisible = nodes.some(n => (n.type === 'custom' || n.type === 'ghost') && n.data?.id === memberId);
        if (isVisible) {
            setHighlightedMemberId(memberId);
            fitView({ nodes: [{ id: memberId }], duration: 800, padding: 0.5 });
        } else {
            setFocus(memberId);
            setHighlightedMemberId(memberId);
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative bg-slate-50">
            <HourglassToolbar />
            
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onPaneClick={handlePaneClick}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    minZoom={0.1}
                    maxZoom={1.5}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls className="!bottom-20 !left-4" />
                    <MiniMap className="!bottom-20 !right-4" />
                </ReactFlow>

                <div className="absolute top-4 left-4 z-10 w-64">
                    <TreeSearch onPick={handleSearchPick} />
                </div>
                
                <div className="absolute top-4 right-4 z-10">
                    <ExportButton />
                </div>

                <SelectionActionBar />
            </div>
        </div>
    );
};

export const HourglassView: React.FC = () => {
    return (
        <ReactFlowProvider>
            <HourglassViewInner />
        </ReactFlowProvider>
    );
};

const HourglassViewInner: React.FC = () => {
    return <HourglassGraph />;
};
