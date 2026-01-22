import { create } from 'zustand';
import type { Vault, Node, ViewMode } from '../types';
import {
  getAllVaults,
  getVault,
  createVault as dbCreateVault,
  deleteVault as dbDeleteVault,
  getNodesByVault,
  getNodePath,
  createNode,
  getNode,
  deleteNode as dbDeleteNode,
} from '../lib/db';
import { sendMessage, nodesToChatHistory, isGeminiInitialized, getCurrentModelId } from '../lib/gemini';

interface AppState {
  // Vaults
  vaults: Vault[];
  currentVault: Vault | null;
  
  // Nodes
  nodes: Node[];
  currentNode: Node | null;
  currentPath: Node[];
  
  // UI State
  viewMode: ViewMode;
  isLoading: boolean;
  streamingResponse: string;
  error: string | null;
  
  // API State
  isApiKeySet: boolean;
  
  // Actions
  loadVaults: () => Promise<void>;
  selectVault: (vaultId: string) => Promise<void>;
  createVault: (name: string, description: string) => Promise<Vault>;
  deleteVault: (vaultId: string) => Promise<void>;
  
  selectNode: (nodeId: string) => Promise<void>;
  sendPrompt: (prompt: string) => Promise<void>;
  branchFromNode: (nodeId: string, prompt: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  
  setViewMode: (mode: ViewMode) => void;
  setError: (error: string | null) => void;
  setApiKeyStatus: (isSet: boolean) => void;
  
  // For merge feature
  selectedNodesForMerge: string[];
  toggleNodeForMerge: (nodeId: string) => void;
  clearMergeSelection: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  vaults: [],
  currentVault: null,
  nodes: [],
  currentNode: null,
  currentPath: [],
  viewMode: 'chat',
  isLoading: false,
  streamingResponse: '',
  error: null,
  isApiKeySet: isGeminiInitialized(),
  selectedNodesForMerge: [],

  loadVaults: async () => {
    try {
      const vaults = await getAllVaults();
      set({ vaults });
    } catch (error) {
      set({ error: 'Failed to load vaults' });
    }
  },

  selectVault: async (vaultId: string) => {
    try {
      const vault = await getVault(vaultId);
      if (!vault) {
        set({ error: 'Vault not found' });
        return;
      }

      const nodes = await getNodesByVault(vaultId);
      
      let currentNode: Node | null = null;
      let currentPath: Node[] = [];
      
      if (vault.rootNodeId) {
        // Find the last node in the main branch
        const rootNode = await getNode(vault.rootNodeId);
        if (rootNode) {
          currentNode = rootNode;
          // Traverse to the last node in the first branch
          while (currentNode && currentNode.childIds.length > 0) {
            const lastChild = await getNode(currentNode.childIds[0]);
            if (lastChild) {
              currentNode = lastChild;
            } else {
              break;
            }
          }
          if (currentNode) {
            currentPath = await getNodePath(currentNode.id);
          }
        }
      }

      set({
        currentVault: vault,
        nodes,
        currentNode,
        currentPath,
        error: null,
      });
    } catch (error) {
      set({ error: 'Failed to load vault' });
    }
  },

  createVault: async (name: string, description: string) => {
    try {
      const vault = await dbCreateVault(name, description);
      const vaults = await getAllVaults();
      set({ vaults, currentVault: vault, nodes: [], currentNode: null, currentPath: [] });
      return vault;
    } catch (error) {
      set({ error: 'Failed to create vault' });
      throw error;
    }
  },

  deleteVault: async (vaultId: string) => {
    try {
      await dbDeleteVault(vaultId);
      const vaults = await getAllVaults();
      const { currentVault } = get();
      
      if (currentVault?.id === vaultId) {
        set({ vaults, currentVault: null, nodes: [], currentNode: null, currentPath: [] });
      } else {
        set({ vaults });
      }
    } catch (error) {
      set({ error: 'Failed to delete vault' });
    }
  },

  selectNode: async (nodeId: string) => {
    try {
      const node = await getNode(nodeId);
      if (!node) {
        set({ error: 'Node not found' });
        return;
      }

      const currentPath = await getNodePath(nodeId);
      set({ currentNode: node, currentPath, error: null });
    } catch (error) {
      set({ error: 'Failed to select node' });
    }
  },

  sendPrompt: async (prompt: string) => {
    const { currentVault, currentNode, currentPath } = get();
    
    if (!currentVault) {
      set({ error: 'No vault selected' });
      return;
    }

    if (!isGeminiInitialized()) {
      set({ error: 'Please set your Gemini API key first' });
      return;
    }

    set({ isLoading: true, streamingResponse: '', error: null });

    try {
      const history = nodesToChatHistory(currentPath);
      
      let response = '';
      await sendMessage(prompt, history, (chunk) => {
        response = chunk;
        set({ streamingResponse: chunk });
      });

      const parentId = currentNode?.id || null;
      const newNode = await createNode(
        currentVault.id,
        parentId,
        prompt,
        response,
        getCurrentModelId()
      );

      const nodes = await getNodesByVault(currentVault.id);
      const newPath = await getNodePath(newNode.id);
      
      // Update vault if this was the first node
      if (!currentVault.rootNodeId) {
        const updatedVault = await getVault(currentVault.id);
        set({ currentVault: updatedVault || currentVault });
      }

      set({
        nodes,
        currentNode: newNode,
        currentPath: newPath,
        isLoading: false,
        streamingResponse: '',
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        streamingResponse: '',
      });
    }
  },

  branchFromNode: async (nodeId: string, prompt: string) => {
    const { currentVault } = get();
    
    if (!currentVault) {
      set({ error: 'No vault selected' });
      return;
    }

    if (!isGeminiInitialized()) {
      set({ error: 'Please set your Gemini API key first' });
      return;
    }

    // First, select the node to branch from
    await get().selectNode(nodeId);
    
    // Then send the new prompt
    await get().sendPrompt(prompt);
  },

  deleteNode: async (nodeId: string) => {
    const { currentVault, currentNode, selectedNodesForMerge } = get();
    
    if (!currentVault) {
      set({ error: 'No vault selected' });
      return;
    }

    try {
      const result = await dbDeleteNode(nodeId);
      
      // Reload nodes
      const nodes = await getNodesByVault(currentVault.id);
      
      // Update current node if it was deleted
      let newCurrentNode: Node | null = null;
      let newCurrentPath: Node[] = [];
      
      if (result.deletedIds.includes(currentNode?.id || '')) {
        // Current node was deleted, navigate to parent or clear
        if (result.newCurrentNodeId) {
          newCurrentNode = await getNode(result.newCurrentNodeId) || null;
          if (newCurrentNode) {
            newCurrentPath = await getNodePath(newCurrentNode.id);
          }
        }
      } else if (currentNode) {
        // Current node still exists, refresh it
        newCurrentNode = await getNode(currentNode.id) || null;
        if (newCurrentNode) {
          newCurrentPath = await getNodePath(newCurrentNode.id);
        }
      }
      
      // Clean up merge selection if any deleted nodes were selected
      const cleanedMergeSelection = selectedNodesForMerge.filter(
        id => !result.deletedIds.includes(id)
      );
      
      // Reload vault in case rootNodeId changed
      const updatedVault = await getVault(currentVault.id);
      
      set({
        currentVault: updatedVault || currentVault,
        nodes,
        currentNode: newCurrentNode,
        currentPath: newCurrentPath,
        selectedNodesForMerge: cleanedMergeSelection,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete node' });
    }
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setApiKeyStatus: (isSet: boolean) => {
    set({ isApiKeySet: isSet });
  },

  toggleNodeForMerge: (nodeId: string) => {
    const { selectedNodesForMerge } = get();
    if (selectedNodesForMerge.includes(nodeId)) {
      set({ selectedNodesForMerge: selectedNodesForMerge.filter((id) => id !== nodeId) });
    } else {
      set({ selectedNodesForMerge: [...selectedNodesForMerge, nodeId] });
    }
  },

  clearMergeSelection: () => {
    set({ selectedNodesForMerge: [] });
  },
}));
