# Epoch

A branching LLM interface for exploring ideas through conversation trees. Branch from any point, merge insights from multiple explorations, and visualize your thought process.



## Features

- **Branching Conversations** - Create branches from any message to explore alternative directions
- **Visual Branch View** - Interactive graph visualization of your conversation tree
- **Branch Merging** - Combine insights from multiple branches using different strategies:
  - XML Context (structured, best accuracy)
  - RAG (lightweight)
  - Summary First (saves tokens)
  - Comparative Analysis (decision-making)
- **Standalone Explorations** - Start fresh threads with no context for independent research
- **Vault System** - Organize conversations into separate projects
- **Markdown Rendering** - Full markdown support in AI responses
- **Local Storage** - All data stored locally in IndexedDB
- **Multiple Gemini Models** - Switch between Gemini 2.5, 3.0, and other models

## Setup

### Prerequisites

- Node.js 18+
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd epoch

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Usage

1. Click **Settings** to add your Gemini API key and select a model
2. Create a **New Vault** for your project
3. Start chatting - each message creates a node
4. Hover over any message and click **Branch here** to explore alternatives
5. Switch to **Branch View** to visualize and manage your conversation tree
6. Select multiple nodes and **Merge** to combine insights

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand (state management)
- Dexie.js (IndexedDB)
- React Flow (graph visualization)
- Google Gemini API
