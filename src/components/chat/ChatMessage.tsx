import type { Node } from '../../types';
import { useAppStore } from '../../stores/app-store';
import { Markdown } from './Markdown';

interface ChatMessageProps {
  node: Node;
  isCurrentNode: boolean;
  hasBranches: boolean;
}

export function ChatMessage({ node, isCurrentNode, hasBranches }: ChatMessageProps) {
  const { setViewMode, selectNode } = useAppStore();

  const handleBranchHere = () => {
    // Just navigate to this node - user can then type in the chat input
    selectNode(node.id);
  };

  return (
    <div className="group relative">
      {/* User prompt */}
      <div className="flex gap-3 py-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-node-user)] flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
            {node.prompt}
          </p>
        </div>
      </div>

      {/* AI response */}
      <div className="flex gap-3 py-4 bg-[var(--color-bg-secondary)] rounded-lg px-4 -mx-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-node-ai)] flex items-center justify-center text-white text-sm font-medium">
          AI
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <Markdown content={node.response} />
          
          {/* Branch indicator and actions */}
          <div className="mt-3 flex items-center gap-2">
            {hasBranches && (
              <button
                onClick={() => {
                  selectNode(node.id);
                  setViewMode('branch');
                }}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {node.childIds.length} branch{node.childIds.length !== 1 ? 'es' : ''}
              </button>
            )}
            
            <button
              onClick={handleBranchHere}
              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Branch here
            </button>
          </div>
        </div>
      </div>

      {/* Current node indicator */}
      {isCurrentNode && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-text-primary)]" />
      )}
    </div>
  );
}
