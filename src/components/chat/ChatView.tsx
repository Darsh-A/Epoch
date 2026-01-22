import { useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/app-store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Markdown } from './Markdown';

export function ChatView() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentPath, currentNode, isLoading, streamingResponse, currentVault } = useAppStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentPath, streamingResponse]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {currentPath.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              {currentVault ? (
                <>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    Send a message to begin exploring ideas in "{currentVault.name}"
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    Welcome to Epoch
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    Create or select a vault to start branching your ideas
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 pl-6">
              {currentPath.map((node) => (
                <ChatMessage
                  key={node.id}
                  node={node}
                  isCurrentNode={node.id === currentNode?.id}
                  hasBranches={node.childIds.length > 1}
                />
              ))}
            </div>
          )}

          {/* Streaming response */}
          {isLoading && streamingResponse && (
            <div className="pl-6 mt-2">
              <div className="flex gap-3 py-4 bg-[var(--color-bg-secondary)] rounded-lg px-4 -mx-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-node-ai)] flex items-center justify-center text-white text-sm font-medium">
                  AI
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <Markdown content={streamingResponse} />
                  <span className="inline-block w-2 h-4 bg-[var(--color-text-muted)] animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingResponse && (
            <div className="pl-6 mt-2">
              <div className="flex gap-3 py-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-node-ai)] flex items-center justify-center text-white text-sm font-medium animate-pulse">
                  AI
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput />
    </div>
  );
}
