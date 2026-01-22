export interface Vault {
  id: string;
  name: string;
  description: string;
  rootNodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Node {
  id: string;
  vaultId: string;
  parentId: string | null;
  prompt: string;
  response: string;
  model: string;
  createdAt: Date;
  childIds: string[];
  mergedFromIds: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  nodeId: string;
  timestamp: Date;
}

export interface BranchPath {
  nodeIds: string[];
  currentIndex: number;
}

export type ViewMode = 'chat' | 'branch';
