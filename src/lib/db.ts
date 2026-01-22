import Dexie, { type EntityTable } from 'dexie';
import type { Vault, Node } from '../types';

const db = new Dexie('EpochDB') as Dexie & {
  vaults: EntityTable<Vault, 'id'>;
  nodes: EntityTable<Node, 'id'>;
};

db.version(1).stores({
  vaults: 'id, name, createdAt, updatedAt',
  nodes: 'id, vaultId, parentId, createdAt',
});

export { db };

// Vault operations
export async function createVault(name: string, description: string): Promise<Vault> {
  const vault: Vault = {
    id: crypto.randomUUID(),
    name,
    description,
    rootNodeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.vaults.add(vault);
  return vault;
}

export async function getVault(id: string): Promise<Vault | undefined> {
  return db.vaults.get(id);
}

export async function getAllVaults(): Promise<Vault[]> {
  return db.vaults.orderBy('updatedAt').reverse().toArray();
}

export async function updateVault(id: string, updates: Partial<Vault>): Promise<void> {
  await db.vaults.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteVault(id: string): Promise<void> {
  await db.transaction('rw', [db.vaults, db.nodes], async () => {
    await db.nodes.where('vaultId').equals(id).delete();
    await db.vaults.delete(id);
  });
}

// Node operations
export async function createNode(
  vaultId: string,
  parentId: string | null,
  prompt: string,
  response: string,
  model: string
): Promise<Node> {
  const newNode: Node = {
    id: crypto.randomUUID(),
    vaultId,
    parentId,
    prompt,
    response,
    model,
    createdAt: new Date(),
    childIds: [],
    mergedFromIds: [],
  };

  await db.transaction('rw', [db.nodes, db.vaults], async () => {
    await db.nodes.add(newNode);

    // Update parent's childIds
    if (parentId) {
      const parent = await db.nodes.get(parentId);
      if (parent) {
        await db.nodes.update(parentId, {
          childIds: [...parent.childIds, newNode.id],
        });
      }
    } else {
      // This is a root node, update vault
      await db.vaults.update(vaultId, {
        rootNodeId: newNode.id,
        updatedAt: new Date(),
      });
    }
  });

  return newNode;
}

export async function getNode(id: string): Promise<Node | undefined> {
  return db.nodes.get(id);
}

export async function getNodesByVault(vaultId: string): Promise<Node[]> {
  return db.nodes.where('vaultId').equals(vaultId).toArray();
}

export async function getNodeChildren(nodeId: string): Promise<Node[]> {
  const node = await db.nodes.get(nodeId);
  if (!node) return [];
  
  const children = await db.nodes.bulkGet(node.childIds);
  return children.filter((n): n is Node => n !== undefined);
}

export async function getNodePath(nodeId: string): Promise<Node[]> {
  const path: Node[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const foundNode: Node | undefined = await db.nodes.get(currentId);
    if (!foundNode) break;
    path.unshift(foundNode);
    currentId = foundNode.parentId;
  }

  return path;
}

export async function updateNode(id: string, updates: Partial<Node>): Promise<void> {
  await db.nodes.update(id, updates);
}

// Branch operations
export async function createBranch(
  sourceNodeId: string,
  prompt: string,
  response: string,
  model: string
): Promise<Node> {
  const sourceNode = await db.nodes.get(sourceNodeId);
  if (!sourceNode) throw new Error('Source node not found');

  return createNode(sourceNode.vaultId, sourceNodeId, prompt, response, model);
}

// Merge operations
export async function createMergeNode(
  vaultId: string,
  sourceNodeIds: string[],
  prompt: string,
  response: string,
  model: string
): Promise<Node> {
  const mergeNode: Node = {
    id: crypto.randomUUID(),
    vaultId,
    parentId: null, // Merge nodes don't have a single parent
    prompt,
    response,
    model,
    createdAt: new Date(),
    childIds: [],
    mergedFromIds: sourceNodeIds,
  };

  await db.nodes.add(mergeNode);
  return mergeNode;
}

// Delete node with cascade delete of all descendants
export async function deleteNode(nodeId: string): Promise<{
  deletedIds: string[];
  newCurrentNodeId: string | null;
}> {
  const node = await db.nodes.get(nodeId);
  if (!node) throw new Error('Node not found');

  const deletedIds: string[] = [];
  
  // Collect all descendant IDs (BFS)
  async function collectDescendants(id: string): Promise<void> {
    deletedIds.push(id);
    const current = await db.nodes.get(id);
    if (current) {
      for (const childId of current.childIds) {
        await collectDescendants(childId);
      }
    }
  }
  
  await collectDescendants(nodeId);

  await db.transaction('rw', [db.nodes, db.vaults], async () => {
    // 1. Remove node from parent's childIds
    if (node.parentId) {
      const parent = await db.nodes.get(node.parentId);
      if (parent) {
        await db.nodes.update(node.parentId, {
          childIds: parent.childIds.filter(id => id !== nodeId),
        });
      }
    }

    // 2. If this is a root node, update vault
    if (!node.parentId) {
      const vault = await db.vaults.get(node.vaultId);
      if (vault && vault.rootNodeId === nodeId) {
        await db.vaults.update(vault.id, {
          rootNodeId: null,
          updatedAt: new Date(),
        });
      }
    }

    // 3. Clean up mergedFromIds references in other nodes
    const allNodes = await db.nodes.where('vaultId').equals(node.vaultId).toArray();
    for (const otherNode of allNodes) {
      if (otherNode.mergedFromIds.some(id => deletedIds.includes(id))) {
        const cleanedMergedFromIds = otherNode.mergedFromIds.filter(
          id => !deletedIds.includes(id)
        );
        await db.nodes.update(otherNode.id, {
          mergedFromIds: cleanedMergedFromIds,
        });
      }
    }

    // 4. Delete all collected nodes
    await db.nodes.bulkDelete(deletedIds);
  });

  // Return the parent node ID as the new current node (or null if root was deleted)
  return {
    deletedIds,
    newCurrentNodeId: node.parentId,
  };
}

// Delete a single node and re-parent its children to the grandparent
export async function deleteNodePreserveChildren(nodeId: string): Promise<{
  deletedId: string;
  newCurrentNodeId: string | null;
}> {
  const node = await db.nodes.get(nodeId);
  if (!node) throw new Error('Node not found');

  await db.transaction('rw', [db.nodes, db.vaults], async () => {
    // 1. Re-parent children to this node's parent
    for (const childId of node.childIds) {
      await db.nodes.update(childId, {
        parentId: node.parentId,
      });
    }

    // 2. Update parent's childIds (remove this node, add this node's children)
    if (node.parentId) {
      const parent = await db.nodes.get(node.parentId);
      if (parent) {
        const newChildIds = parent.childIds
          .filter(id => id !== nodeId)
          .concat(node.childIds);
        await db.nodes.update(node.parentId, {
          childIds: newChildIds,
        });
      }
    } else {
      // This was a root node - if it had exactly one child, that becomes the new root
      const vault = await db.vaults.get(node.vaultId);
      if (vault && vault.rootNodeId === nodeId) {
        if (node.childIds.length === 1) {
          await db.vaults.update(vault.id, {
            rootNodeId: node.childIds[0],
            updatedAt: new Date(),
          });
        } else {
          // No children or multiple children - clear the root
          await db.vaults.update(vault.id, {
            rootNodeId: null,
            updatedAt: new Date(),
          });
        }
      }
    }

    // 3. Clean up mergedFromIds references
    const allNodes = await db.nodes.where('vaultId').equals(node.vaultId).toArray();
    for (const otherNode of allNodes) {
      if (otherNode.mergedFromIds.includes(nodeId)) {
        await db.nodes.update(otherNode.id, {
          mergedFromIds: otherNode.mergedFromIds.filter(id => id !== nodeId),
        });
      }
    }

    // 4. Delete the node
    await db.nodes.delete(nodeId);
  });

  return {
    deletedId: nodeId,
    newCurrentNodeId: node.parentId || (node.childIds.length > 0 ? node.childIds[0] : null),
  };
}
