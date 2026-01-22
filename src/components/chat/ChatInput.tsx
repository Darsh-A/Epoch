import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendPrompt, isLoading, currentVault, isApiKeySet, currentNode } = useAppStore();

  // Check if we're at a branch point (not at the end of a branch)
  const isAtBranchPoint = currentNode && currentNode.childIds.length > 0;
  const willCreateBranch = isAtBranchPoint;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const prompt = input;
    setInput('');
    await sendPrompt(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = !currentVault || !isApiKeySet || isLoading;
  const placeholder = !currentVault
    ? 'Select or create a vault first...'
    : !isApiKeySet
    ? 'Set your API key first...'
    : willCreateBranch
    ? 'Type to create a new branch from this point...'
    : 'Send a message...';

  return (
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        {/* Branch indicator */}
        {willCreateBranch && (
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Creating new branch • {currentNode?.childIds.length} existing branch{currentNode?.childIds.length !== 1 ? 'es' : ''} from this point</span>
          </div>
        )}
        
        <div className="relative flex items-center gap-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-2xl px-4 py-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="flex-1 bg-transparent resize-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none min-h-[24px] max-h-[200px] leading-6"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isDisabled}
            className="flex-shrink-0 p-2 rounded-xl bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border-hover)] border border-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : willCreateBranch ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-center text-[var(--color-text-muted)]">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
