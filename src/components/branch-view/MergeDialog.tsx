import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';
import { getNode, createMergeNode, getNodesByVault, getNodePath } from '../../lib/db';
import { isGeminiInitialized, getCurrentModelId } from '../../lib/gemini';
import { executeMerge, MERGE_STRATEGIES, type MergeStrategy } from '../../lib/merge-strategies';
import type { Node } from '../../types';

interface MergeDialogProps {
  onClose: () => void;
}

interface BranchContext {
  node: Node;
  path: Node[];
  preview: string;
}

export function MergeDialog({ onClose }: MergeDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [branchContexts, setBranchContexts] = useState<BranchContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<MergeStrategy>('xml-context');
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);
  
  const { selectedNodesForMerge, currentVault } = useAppStore();

  useEffect(() => {
    async function loadBranches() {
      const contexts: BranchContext[] = [];
      
      for (const nodeId of selectedNodesForMerge) {
        const node = await getNode(nodeId);
        if (node) {
          const path = await getNodePath(nodeId);
          const preview = path
            .slice(-3)
            .map((n) => `Q: ${n.prompt.substring(0, 50)}...`)
            .join('\n');
          contexts.push({ node, path, preview });
        }
      }
      
      setBranchContexts(contexts);
    }
    
    loadBranches();
  }, [selectedNodesForMerge]);

  const handleMerge = async () => {
    if (!prompt.trim() || !currentVault || !isGeminiInitialized()) return;
    
    setIsLoading(true);
    
    try {
      // Prepare branch data for merge strategies
      const branches = branchContexts.map((ctx, index) => ({
        id: ctx.node.id,
        name: `Branch ${index + 1}`,
        path: ctx.path,
      }));

      // Execute the selected merge strategy
      let response = '';
      await executeMerge(
        selectedStrategy,
        branches,
        prompt,
        (chunk) => {
          response = chunk;
        }
      );

      // Create merge node
      await createMergeNode(
        currentVault.id,
        selectedNodesForMerge,
        prompt,
        response,
        getCurrentModelId()
      );

      // Reload nodes
      const nodes = await getNodesByVault(currentVault.id);
      useAppStore.setState({ nodes });

      onClose();
    } catch (error) {
      console.error('Failed to merge branches:', error);
      useAppStore.setState({
        error: error instanceof Error ? error.message : 'Failed to merge branches',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalMessages = () => {
    return branchContexts.reduce((sum, ctx) => sum + ctx.path.length, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const currentStrategyInfo = MERGE_STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Merge Branches
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Combine insights from {branchContexts.length} branches ({getTotalMessages()} messages total)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Merge Strategy Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Merge Strategy
              </label>
              <button
                onClick={() => setShowStrategyInfo(!showStrategyInfo)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showStrategyInfo ? 'Hide details' : 'Show details'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {MERGE_STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedStrategy === strategy.id
                      ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-hover)] ring-1 ring-[var(--color-border-hover)]'
                      : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedStrategy === strategy.id 
                        ? 'bg-[var(--color-text-primary)]' 
                        : 'bg-[var(--color-text-muted)]'
                    }`} />
                    <span className={`text-sm font-medium ${
                      selectedStrategy === strategy.id 
                        ? 'text-[var(--color-text-primary)]' 
                        : 'text-[var(--color-text-secondary)]'
                    }`}>
                      {strategy.name}
                    </span>
                  </div>
                  {showStrategyInfo && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {strategy.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Strategy description */}
            <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg">
              <p className="text-xs text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text-secondary)]">{currentStrategyInfo?.name}:</span>{' '}
                {currentStrategyInfo?.description}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                <span className="text-[var(--color-text-muted)]">Best for:</span> {currentStrategyInfo?.bestFor}
              </p>
            </div>
          </div>

          {/* Branch previews */}
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Selected Branches
            </p>
            <div className="grid gap-2">
              {branchContexts.map((ctx, index) => (
                <div
                  key={ctx.node.id}
                  className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-primary)] text-xs font-bold flex-shrink-0 bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">
                      {ctx.path[0]?.prompt || 'Empty branch'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {ctx.path.length} messages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge prompt */}
          <div>
            <label
              htmlFor="merge-prompt"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
            >
              Your Question
            </label>
            <textarea
              id="merge-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedStrategy === 'comparative'
                  ? "e.g., Compare the approaches and recommend which one to use..."
                  : selectedStrategy === 'summary'
                  ? "e.g., What are the main takeaways from these explorations?"
                  : "e.g., Based on all the options explored, which approach would you recommend and why?"
              }
              rows={3}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none resize-none transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!prompt.trim() || isLoading || !isGeminiInitialized()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {selectedStrategy === 'summary' ? 'Summarizing...' : 'Merging...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Merge with {currentStrategyInfo?.name}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
