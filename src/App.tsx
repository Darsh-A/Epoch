import { useAppStore } from './stores/app-store';
import { VaultSidebar } from './components/vault/VaultSidebar';
import { ChatView } from './components/chat/ChatView';
import { BranchView } from './components/branch-view/BranchView';

function App() {
  const { viewMode, error, setError, currentVault } = useAppStore();

  return (
    <div className="h-screen flex bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <VaultSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {currentVault && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {currentVault.name}
              </h2>
              {currentVault.description && (
                <span className="text-sm text-[var(--color-text-muted)]">
                  — {currentVault.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-xs font-medium text-[var(--color-text-secondary)]">
                {viewMode === 'chat' ? 'Chat View' : 'Branch View'}
              </span>
            </div>
          </header>
        )}

        {/* Main view */}
        <main className="flex-1 min-h-0">
          {viewMode === 'chat' ? <ChatView /> : <BranchView />}
        </main>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg shadow-lg">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
