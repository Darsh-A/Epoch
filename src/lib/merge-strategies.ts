import type { Node } from '../types';
import { sendMessage } from './gemini';

export type MergeStrategy = 'xml-context' | 'rag' | 'summary' | 'comparative';

export interface MergeStrategyInfo {
  id: MergeStrategy;
  name: string;
  description: string;
  bestFor: string;
}

export const MERGE_STRATEGIES: MergeStrategyInfo[] = [
  {
    id: 'xml-context',
    name: 'XML Context',
    description: 'Wraps each branch in XML tags for clear separation. Best accuracy.',
    bestFor: 'Complex decisions requiring full context understanding',
  },
  {
    id: 'rag',
    name: 'RAG (Plain)',
    description: 'Simple text concatenation with delimiters. Lightweight.',
    bestFor: 'Quick queries across branches',
  },
  {
    id: 'summary',
    name: 'Summary First',
    description: 'Summarizes each branch first, then answers. Saves tokens.',
    bestFor: 'Very long branches or simple questions',
  },
  {
    id: 'comparative',
    name: 'Comparative Analysis',
    description: 'Explicitly compares and contrasts branches. Structured output.',
    bestFor: 'Decision making between explored options',
  },
];

interface BranchData {
  id: string;
  name: string;
  path: Node[];
}

function formatBranchAsXML(branch: BranchData): string {
  const messages = branch.path.map((node, idx) => `    <turn index="${idx + 1}">
      <user>${escapeXML(node.prompt)}</user>
      <assistant>${escapeXML(node.response)}</assistant>
    </turn>`).join('\n');

  return `<branch id="${branch.id}" name="${branch.name}" message_count="${branch.path.length}">
${messages}
  </branch>`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatBranchAsPlainText(branch: BranchData): string {
  const messages = branch.path
    .map((node) => `User: ${node.prompt}\n\nAssistant: ${node.response}`)
    .join('\n\n---\n\n');

  return `=== ${branch.name.toUpperCase()} ===\n\n${messages}`;
}

// Strategy 1: XML Context Merge
export async function mergeWithXMLContext(
  branches: BranchData[],
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const xmlBranches = branches.map(formatBranchAsXML).join('\n\n');

  const prompt = `You are analyzing multiple conversation branches that explored different aspects of a topic. Each branch is wrapped in XML tags with metadata.

<context>
${xmlBranches}
</context>

<instructions>
The user has selected these ${branches.length} branches to merge their insights. Each branch represents a different line of exploration from the same starting point.

When answering:
1. Consider ALL information from ALL branches
2. Reference specific branches by name when drawing conclusions
3. Identify agreements and contradictions between branches
4. Synthesize a comprehensive answer that leverages the full exploration
</instructions>

<user_query>${escapeXML(userPrompt)}</user_query>

Please provide a thorough response based on the combined context from all branches:`;

  return sendMessage(prompt, [], onStream);
}

// Strategy 2: RAG (Plain text delimiters)
export async function mergeWithRAG(
  branches: BranchData[],
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const plainTextBranches = branches.map(formatBranchAsPlainText).join('\n\n========================================\n\n');

  const prompt = `You have access to multiple conversation branches exploring different aspects of a topic. Use this context to answer the user's question.

CONTEXT FROM BRANCHES:
${plainTextBranches}

========================================

USER'S QUESTION: ${userPrompt}

Based on the context from the different branches above, please provide a comprehensive answer that draws from all relevant information explored in these conversations.`;

  return sendMessage(prompt, [], onStream);
}

// Strategy 3: Summary First
export async function mergeWithSummary(
  branches: BranchData[],
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  // First, generate summaries for each branch
  const summaries: string[] = [];
  
  for (const branch of branches) {
    const branchText = branch.path
      .map((node) => `User: ${node.prompt}\nAssistant: ${node.response}`)
      .join('\n\n');

    const summaryPrompt = `Summarize the key points, decisions, and insights from this conversation in 3-5 bullet points:

${branchText}

Provide a concise summary:`;

    const summary = await sendMessage(summaryPrompt, []);
    summaries.push(`**${branch.name}:**\n${summary}`);
  }

  // Now answer using the summaries
  const finalPrompt = `You have summaries from ${branches.length} different conversation branches that explored various aspects of a topic.

BRANCH SUMMARIES:
${summaries.join('\n\n---\n\n')}

========================================

Based on these summaries, please answer the following question:
${userPrompt}

Provide a comprehensive response that synthesizes insights from all branches:`;

  return sendMessage(finalPrompt, [], onStream);
}

// Strategy 4: Comparative Analysis
export async function mergeWithComparative(
  branches: BranchData[],
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const xmlBranches = branches.map(formatBranchAsXML).join('\n\n');

  const prompt = `You are performing a comparative analysis of ${branches.length} conversation branches that explored different approaches to a topic.

<branches>
${xmlBranches}
</branches>

<analysis_task>
The user wants to understand: ${escapeXML(userPrompt)}

Please provide your response in this structured format:

## Common Ground
What ideas, facts, or conclusions appear consistently across all branches?

## Key Differences
What are the main points where the branches diverged or explored different directions?

## Branch-by-Branch Highlights
For each branch, what is its unique contribution or perspective?

## Synthesis & Recommendation
Based on the comparative analysis, provide your answer to the user's question with clear reasoning about which branch insights contributed to your conclusion.
</analysis_task>

Begin your comparative analysis:`;

  return sendMessage(prompt, [], onStream);
}

// Main merge function that dispatches to the appropriate strategy
export async function executeMerge(
  strategy: MergeStrategy,
  branches: BranchData[],
  userPrompt: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  switch (strategy) {
    case 'xml-context':
      return mergeWithXMLContext(branches, userPrompt, onStream);
    case 'rag':
      return mergeWithRAG(branches, userPrompt, onStream);
    case 'summary':
      return mergeWithSummary(branches, userPrompt, onStream);
    case 'comparative':
      return mergeWithComparative(branches, userPrompt, onStream);
    default:
      return mergeWithXMLContext(branches, userPrompt, onStream);
  }
}
