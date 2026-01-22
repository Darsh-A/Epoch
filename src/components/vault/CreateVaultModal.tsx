import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';

interface CreateVaultModalProps {
  onClose: () => void;
}

export function CreateVaultModal({ onClose }: CreateVaultModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createVault } = useAppStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      await createVault(name.trim(), description.trim());
      onClose();
    } catch (error) {
      console.error('Failed to create vault:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
            Create New Vault
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="vault-name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Name
              </label>
              <input
                id="vault-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="My Project"
                className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="vault-description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Description (optional)
              </label>
              <textarea
                id="vault-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What is this vault about?"
                rows={3}
                className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none resize-none transition-colors"
              />
            </div>
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
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
