import { useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Node as FlowNode,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '../../stores/app-store';
import { BranchNode, type BranchNodeData } from './BranchNode';
import { MergeDialog } from './MergeDialog';
import { NewNodeDialog } from './NewNodeDialog';

const nodeTypes: NodeTypes = {
  branchNode: BranchNode as NodeTypes['branchNode'],
};

export function BranchView() {
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showNewNodeDialog, setShowNewNodeDialog] = useState(false);
  const { nodes: storeNodes, currentNode, selectedNodesForMerge, clearMergeSelection, currentVault, isApiKeySet } = useAppStore();

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode<BranchNodeData>>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Convert store nodes to React Flow format
  useEffect(() => {
    if (storeNodes.length === 0) {
      setFlowNodes([]);
      setFlowEdges([]);
      return;
    }

    // Separate regular nodes and merge nodes
    const regularNodes = storeNodes.filter((n) => n.mergedFromIds.length === 0);
    const mergeNodes = storeNodes.filter((n) => n.mergedFromIds.length > 0);

    // Build a map for quick lookups
    const nodeMap = new Map(storeNodes.map((n) => [n.id, n]));

    // Calculate positions using a tree layout for regular nodes
    const positions = new Map<string, { x: number; y: number }>();
    const nodeDepths = new Map<string, number>();
    const levelWidths = new Map<number, number>();

    function calculatePositions(nodeId: string, level: number, parentX?: number): void {
      const node = nodeMap.get(nodeId);
      if (!node || node.mergedFromIds.length > 0) return; // Skip merge nodes in first pass

      const width = levelWidths.get(level) || 0;
      const x = parentX !== undefined ? parentX : width * 280;
      const y = level * 200;

      positions.set(nodeId, { x, y });
      nodeDepths.set(nodeId, level);

      // Update level width for next sibling
      levelWidths.set(level, (levelWidths.get(level) || 0) + 1);

      // Process children (excluding merge nodes)
      const regularChildren = node.childIds.filter(id => {
        const child = nodeMap.get(id);
        return child && child.mergedFromIds.length === 0;
      });
      
      regularChildren.forEach((childId, index) => {
        const childX = x + (index - (regularChildren.length - 1) / 2) * 250;
        calculatePositions(childId, level + 1, childX);
      });
    }

    // Find root nodes (nodes without parents, excluding merge nodes)
    const rootNodes = regularNodes.filter((n) => !n.parentId);
    rootNodes.forEach((root, index) => {
      calculatePositions(root.id, 0, index * 300);
    });

    // Now position merge nodes below their source branches
    mergeNodes.forEach((mergeNode) => {
      const sourcePositions = mergeNode.mergedFromIds
        .map(id => positions.get(id))
        .filter((pos): pos is { x: number; y: number } => pos !== undefined);

      const sourceDepths = mergeNode.mergedFromIds
        .map(id => nodeDepths.get(id))
        .filter((d): d is number => d !== undefined);

      if (sourcePositions.length > 0) {
        // Calculate center X position of all source nodes
        const avgX = sourcePositions.reduce((sum, pos) => sum + pos.x, 0) / sourcePositions.length;
        
        // Place below the deepest source node
        const maxDepth = Math.max(...sourceDepths);
        const y = (maxDepth + 1) * 200 + 50; // Extra offset for visual separation

        positions.set(mergeNode.id, { x: avgX, y });
        nodeDepths.set(mergeNode.id, maxDepth + 1);
      } else {
        // Fallback: place at bottom if no source positions found
        const allYs = Array.from(positions.values()).map(p => p.y);
        const maxY = allYs.length > 0 ? Math.max(...allYs) : 0;
        positions.set(mergeNode.id, { x: 0, y: maxY + 200 });
      }
    });

    // Create React Flow nodes
    const newFlowNodes: FlowNode<BranchNodeData>[] = storeNodes.map((node) => {
      const pos = positions.get(node.id) || { x: 0, y: 0 };
      return {
        id: node.id,
        type: 'branchNode',
        position: pos,
        data: {
          node,
          isCurrentNode: node.id === currentNode?.id,
          isMergeNode: node.mergedFromIds.length > 0,
        },
      };
    });

    // Create React Flow edges
    const newFlowEdges: Edge[] = [];
    storeNodes.forEach((node) => {
      node.childIds.forEach((childId) => {
        newFlowEdges.push({
          id: `${node.id}-${childId}`,
          source: node.id,
          target: childId,
          style: { stroke: 'var(--color-border-hover)', strokeWidth: 2 },
          animated: false,
        });
      });

      // Add edges for merge relationships (dashed, from source to merge node)
      node.mergedFromIds.forEach((sourceId) => {
        newFlowEdges.push({
          id: `merge-${sourceId}-${node.id}`,
          source: sourceId,
          target: node.id,
          style: { 
            stroke: 'var(--color-node-merge)', 
            strokeWidth: 2, 
            strokeDasharray: '8,4' 
          },
          animated: true,
        });
      });
    });

    setFlowNodes(newFlowNodes);
    setFlowEdges(newFlowEdges);
  }, [storeNodes, currentNode, setFlowNodes, setFlowEdges]);

  const handleMerge = () => {
    if (selectedNodesForMerge.length >= 2) {
      setShowMergeDialog(true);
    }
  };

  const handleCloseMergeDialog = () => {
    setShowMergeDialog(false);
    clearMergeSelection();
  };

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border)"
        />
      </ReactFlow>

      {/* Merge button */}
      {selectedNodesForMerge.length >= 2 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleMerge}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium rounded-full shadow-lg transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Merge {selectedNodesForMerge.length} Branches
          </button>
        </div>
      )}

      {/* Empty state */}
      {storeNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              No branches yet
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Start a conversation to create your first branch
            </p>
          </div>
        </div>
      )}

      {showMergeDialog && <MergeDialog onClose={handleCloseMergeDialog} />}
      {showNewNodeDialog && <NewNodeDialog onClose={() => setShowNewNodeDialog(false)} />}

      {/* New exploration button */}
      {currentVault && isApiKeySet && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowNewNodeDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
            title="Start a new exploration with no prior context"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Exploration
          </button>
        </div>
      )}

      {/* Custom styles for React Flow controls */}
      <style>{`
        .react-flow__controls button {
          background-color: var(--color-bg-elevated) !important;
          border: 1px solid var(--color-border) !important;
          color: var(--color-text-muted) !important;
          border-radius: 6px !important;
        }
        .react-flow__controls button:hover {
          background-color: var(--color-border) !important;
          color: var(--color-text-primary) !important;
        }
        .react-flow__controls button svg {
          fill: currentColor !important;
        }
      `}</style>
    </div>
  );
}
