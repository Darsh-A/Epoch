import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Node } from '../types';

let genAI: GoogleGenerativeAI | null = null;

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    description: 'Our most balanced model built for speed, scale, and frontier intelligence.',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    description: 'The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity, all built on a foundation of state-of-the-art reasoning. ',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Our best model in terms of price-performance, offering well-rounded capabilities.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Our state-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context. ',
  },
];

const DEFAULT_MODEL = 'gemini-3-flash-preview';

export function initializeGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
  localStorage.setItem('gemini_api_key', apiKey);
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem('gemini_api_key');
}

export function getStoredModel(): string {
  return localStorage.getItem('gemini_model') || DEFAULT_MODEL;
}

export function setStoredModel(model: string): void {
  localStorage.setItem('gemini_model', model);
}

export function isGeminiInitialized(): boolean {
  return genAI !== null;
}

export function clearApiKey(): void {
  localStorage.removeItem('gemini_api_key');
  localStorage.removeItem('gemini_model');
  genAI = null;
}

// Initialize from stored key on load
const storedKey = getStoredApiKey();
if (storedKey) {
  initializeGemini(storedKey);
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function nodesToChatHistory(nodes: Node[]): ChatMessage[] {
  const history: ChatMessage[] = [];
  
  for (const node of nodes) {
    if (node.prompt) {
      history.push({
        role: 'user',
        parts: [{ text: node.prompt }],
      });
    }
    if (node.response) {
      history.push({
        role: 'model',
        parts: [{ text: node.response }],
      });
    }
  }
  
  return history;
}

export async function sendMessage(
  prompt: string,
  history: ChatMessage[] = [],
  onStream?: (chunk: string) => void
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please set your API key.');
  }

  const modelId = getStoredModel();
  const model = genAI.getGenerativeModel({ model: modelId });
  
  const chat = model.startChat({
    history,
  });

  if (onStream) {
    const result = await chat.sendMessageStream(prompt);
    let fullResponse = '';
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onStream(fullResponse);
    }
    
    return fullResponse;
  } else {
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }
}

export function getCurrentModelId(): string {
  return getStoredModel();
}

export async function generateMergeSummary(
  branchContexts: { branchName: string; content: string }[],
  userPrompt: string
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please set your API key.');
  }

  const modelId = getStoredModel();
  const model = genAI.getGenerativeModel({ model: modelId });
  
  const contextText = branchContexts
    .map((ctx) => `## Branch: ${ctx.branchName}\n${ctx.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are helping merge multiple conversation branches into a cohesive understanding. 

Here are the different branches being merged:

${contextText}

---

User's merge request: ${userPrompt}

Please synthesize the key insights from these branches and provide a unified response that:
1. Identifies common themes and agreements
2. Notes any contradictions or different perspectives
3. Provides a clear conclusion or recommendation based on the merged context`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
