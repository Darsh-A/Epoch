import type { Node } from '../types';
import { getNode, getNodesByVault } from './db';

export interface BranchInfo {
  id: string;
  name: string;
  nodeCount: number;
  lastNode: Node;
  depth: number;
}

export async function getBranchesFromNode(nodeId: string): Promise<Node[][]> {
  const node = await getNode(nodeId);
  if (!node) return [];

  const branches: Node[][] = [];
  
  async function traverseBranch(currentNode: Node, path: Node[]): Promise<void> {
    const newPath = [...path, currentNode];
    
    if (currentNode.childIds.length === 0) {
      branches.push(newPath);
      return;
    }
    
    for (const childId of currentNode.childIds) {
      const child = await getNode(childId);
      if (child) {
        await traverseBranch(child, newPath);
      }
    }
  }
  
  await traverseBranch(node, []);
  return branches;
}

export async function getVaultBranchStructure(vaultId: string): Promise<{
  nodes: Node[];
  edges: { source: string; target: string }[];
}> {
  const nodes = await getNodesByVault(vaultId);
  const edges: { source: string; target: string }[] = [];
  
  for (const node of nodes) {
    for (const childId of node.childIds) {
      edges.push({ source: node.id, target: childId });
    }
    
    // Add edges for merge relationships
    for (const mergeSourceId of node.mergedFromIds) {
      edges.push({ source: mergeSourceId, target: node.id });
    }
  }
  
  return { nodes, edges };
}

export function getNodeDepth(node: Node, allNodes: Map<string, Node>): number {
  let depth = 0;
  let currentId = node.parentId;
  
  while (currentId) {
    depth++;
    const parent = allNodes.get(currentId);
    if (!parent) break;
    currentId = parent.parentId;
  }
  
  return depth;
}

export function findCommonAncestor(
  nodeA: Node,
  nodeB: Node,
  allNodes: Map<string, Node>
): Node | null {
  const ancestorsA = new Set<string>();
  let currentId: string | null = nodeA.id;
  
  while (currentId) {
    ancestorsA.add(currentId);
    const node = allNodes.get(currentId);
    if (!node) break;
    currentId = node.parentId;
  }
  
  currentId = nodeB.id;
  while (currentId) {
    if (ancestorsA.has(currentId)) {
      return allNodes.get(currentId) || null;
    }
    const node = allNodes.get(currentId);
    if (!node) break;
    currentId = node.parentId;
  }
  
  return null;
}

export function summarizeNodeContent(node: Node, maxLength: number = 100): string {
  const content = node.prompt || node.response;
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

export function generateBranchName(node: Node, index: number): string {
  const preview = summarizeNodeContent(node, 30);
  return `Branch ${index + 1}: ${preview}`;
}
