import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import { initializeGemini, getStoredApiKey, clearApiKey, getStoredModel, setStoredModel, AVAILABLE_MODELS } from '../../lib/gemini';

interface ApiKeyModalProps {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(getStoredApiKey() || '');
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [showKey, setShowKey] = useState(false);
  const { setApiKeyStatus, isApiKeySet } = useAppStore();

  const handleSave = () => {
    if (!apiKey.trim()) return;
    initializeGemini(apiKey.trim());
    setStoredModel(selectedModel);
    setApiKeyStatus(true);
    onClose();
  };

  const handleClear = () => {
    clearApiKey();
    setApiKey('');
    setApiKeyStatus(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && apiKey.trim()) {
      handleSave();
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
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Settings
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Configure your Gemini API settings
          </p>
          
          {/* API Key input */}
          <div className="mb-4">
            <label htmlFor="api-key" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your Gemini API key"
                className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg pl-3 pr-10 py-2.5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:outline-none font-mono text-sm transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Model selector */}
          <div className="mb-4">
            <label htmlFor="model-select" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text-primary)] focus:border-[var(--color-border-hover)] focus:outline-none text-sm transition-colors"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
            </p>
          </div>
          
          <p className="text-xs text-[var(--color-text-muted)]">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline transition-colors"
            >
              Google AI Studio
            </a>
          </p>
        </div>
        
        <div className="flex justify-between px-6 py-4 border-t border-[var(--color-border)]">
          <div>
            {isApiKeySet && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Clear Key
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border)] border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-primary)] text-sm font-medium rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
