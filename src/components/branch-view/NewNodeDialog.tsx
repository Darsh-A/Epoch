import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import { createNode, getNodesByVault } from '../../lib/db';
import { sendMessage, isGeminiInitialized, getCurrentModelId } from '../../lib/gemini';

interface NewNodeDialogProps {
  onClose: () => void;
}

export function NewNodeDialog({ onClose }: NewNodeDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentVault } = useAppStore();

  const handleCreate = async () => {
    if (!prompt.trim() || !currentVault || !isGeminiInitialized()) return;
    
    setIsLoading(true);
    
    try {
      // Send to LLM with no history (standalone context)
      let response = '';
      await sendMessage(prompt, [], (chunk) => {
        response = chunk;
      });

      // Create standalone node (no parent)
      await createNode(
        currentVault.id,
        null, // No parent - standalone node
        prompt,
        response,
        getCurrentModelId()
      );

      // Reload nodes
      const nodes = await getNodesByVault(currentVault.id);
      useAppStore.setState({ nodes });

      onClose();
    } catch (error) {
      console.error('Failed to create node:', error);
      useAppStore.setState({
        error: error instanceof Error ? error.message : 'Failed to create node',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                New Exploration
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Start a fresh thread with no prior context
              </p>
            </div>
          </div>
          
          <div className="p-3 mb-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text-secondary)]">Standalone Node:</span>{' '}
              This creates an independent exploration that can later be merged with other branches to combine insights.
            </p>
          </div>

          <div>
            <label
              htmlFor="new-node-prompt"
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
            >
              What would you like to explore?
            </label>
            <textarea
              id="new-node-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your question or topic to explore..."
              rows={4}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none resize-none transition-colors"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!prompt.trim() || isLoading || !isGeminiInitialized()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Node
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
