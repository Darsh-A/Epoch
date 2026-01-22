import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node } from '../../types';
import { useAppStore } from '../../stores/app-store';

export interface BranchNodeData extends Record<string, unknown> {
  node: Node;
  isCurrentNode: boolean;
  isMergeNode: boolean;
}

interface BranchNodeProps {
  data: BranchNodeData;
}

export const BranchNode = memo(function BranchNode({ data }: BranchNodeProps) {
  const { selectNode, setViewMode, selectedNodesForMerge, toggleNodeForMerge, deleteNode } = useAppStore();
  const { node, isCurrentNode, isMergeNode } = data;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSelectedForMerge = selectedNodesForMerge.includes(node.id);

  const handleClick = () => {
    if (showDeleteConfirm) return;
    selectNode(node.id);
    setViewMode('chat');
  };

  const handleMergeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeForMerge(node.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNode(node.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length - 3) + '...';
  };

  const getBorderColor = () => {
    if (showDeleteConfirm) return 'var(--color-error)';
    if (isSelectedForMerge) return 'var(--color-node-merge)';
    if (isCurrentNode) return 'var(--color-text-secondary)';
    return 'var(--color-border)';
  };

  const getNodeColor = () => {
    if (isMergeNode) return 'var(--color-node-merge)';
    return 'var(--color-node-ai)';
  };

  const hasDescendants = node.childIds.length > 0;

  return (
    <div
      onClick={handleClick}
      className={`relative group cursor-pointer transition-all ${
        isCurrentNode ? 'scale-105' : 'hover:scale-102'
      }`}
      style={{
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '12px',
        background: 'var(--color-bg-secondary)',
        width: '220px',
        padding: '12px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'var(--color-border)',
          border: 'none',
          width: '8px',
          height: '8px',
        }}
      />

      {/* Node type indicator */}
      <div
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: getNodeColor() }}
      >
        {isMergeNode ? 'M' : 'N'}
      </div>

      {/* Action buttons - top right */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 opacity-0 group-hover:opacity-100 transition-all"
          title={hasDescendants ? `Delete node and ${node.childIds.length} descendant(s)` : 'Delete node'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Merge selection button */}
        <button
          onClick={handleMergeToggle}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelectedForMerge
              ? 'bg-[var(--color-node-merge)] text-white'
              : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:border-[var(--color-node-merge)] hover:text-[var(--color-node-merge)]'
          }`}
          title="Select for merge"
        >
          {isSelectedForMerge ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-[var(--color-bg-secondary)] rounded-[10px] flex flex-col items-center justify-center z-10 p-3">
          <p className="text-xs text-[var(--color-text-primary)] text-center mb-1">
            Delete this node?
          </p>
          {hasDescendants && (
            <p className="text-xs text-red-400 text-center mb-3">
              This will also delete {node.childIds.length} branch{node.childIds.length !== 1 ? 'es' : ''}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleDeleteCancel}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Prompt preview */}
      <div className="mb-2">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">Prompt</p>
        <p className="text-sm text-[var(--color-text-primary)] leading-tight">
          {truncate(node.prompt, 60)}
        </p>
      </div>

      {/* Response preview */}
      <div className="pt-2 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">Response</p>
        <p className="text-xs text-[var(--color-text-secondary)] leading-tight">
          {truncate(node.response, 80)}
        </p>
      </div>

      {/* Branch count indicator */}
      {node.childIds.length > 0 && !showDeleteConfirm && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded-full text-xs text-[var(--color-text-muted)]">
          {node.childIds.length} branch{node.childIds.length !== 1 ? 'es' : ''}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--color-border)',
          border: 'none',
          width: '8px',
          height: '8px',
        }}
      />
    </div>
  );
});
