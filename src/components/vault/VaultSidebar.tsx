import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';
import { CreateVaultModal } from './CreateVaultModal';
import { ApiKeyModal } from './ApiKeyModal';
import { getStoredModel, AVAILABLE_MODELS } from '../../lib/gemini';

export function VaultSidebar() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentModel, setCurrentModel] = useState(getStoredModel());
  
  const {
    vaults,
    currentVault,
    loadVaults,
    selectVault,
    deleteVault,
    isApiKeySet,
    viewMode,
    setViewMode,
  } = useAppStore();

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  // Update current model display when modal closes
  useEffect(() => {
    if (!showApiKeyModal) {
      setCurrentModel(getStoredModel());
    }
  }, [showApiKeyModal]);

  const handleDeleteVault = async (e: React.MouseEvent, vaultId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this vault? This cannot be undone.')) {
      await deleteVault(vaultId);
    }
  };

  const getModelName = () => {
    const model = AVAILABLE_MODELS.find(m => m.id === currentModel);
    return model?.name || currentModel;
  };

  return (
    <>
      <div className="w-64 h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Epoch</h1>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Vault
          </button>
        </div>

        {/* Vault list */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Vaults
          </p>
          
          {vaults.length === 0 ? (
            <p className="px-2 py-4 text-sm text-[var(--color-text-muted)] text-center">
              No vaults yet. Create one to get started!
            </p>
          ) : (
            <ul className="space-y-1 mt-2">
              {vaults.map((vault) => (
                <li key={vault.id}>
                  <button
                    onClick={() => selectVault(vault.id)}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      currentVault?.id === vault.id
                        ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium">{vault.name}</span>
                    <button
                      onClick={(e) => handleDeleteVault(e, vault.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-md transition-all"
                      title="Delete vault"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* View mode toggle (when vault selected) */}
        {currentVault && (
          <div className="p-3 border-t border-[var(--color-border)]">
            <div className="relative flex rounded-xl bg-[var(--color-bg-tertiary)] p-1">
              {/* Sliding background */}
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] transition-transform duration-200 ease-out"
                style={{
                  transform: viewMode === 'branch' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                }}
              />
              
              <button
                onClick={() => setViewMode('chat')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  viewMode === 'chat'
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
              <button
                onClick={() => setViewMode('branch')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  viewMode === 'branch'
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Branches
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-2">
          {/* Current model display */}
          {isApiKeySet && (
            <div className="px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-xs">
              <span className="text-[var(--color-text-muted)]">Model: </span>
              <span className="text-[var(--color-text-secondary)]">{getModelName()}</span>
            </div>
          )}
          
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isApiKeySet
                ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isApiKeySet ? 'Settings' : 'Set API Key'}
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateVaultModal onClose={() => setShowCreateModal(false)} />
      )}
      
      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}
    </>
  );
}
