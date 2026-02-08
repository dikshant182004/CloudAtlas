# CloudAtlas

CloudAtlas is an AI-powered cloud intelligence assistant that helps you **explore cloud infrastructure**, **visualize relationships**, and **surface security risks** with explainable, structured outputs.

It is built with **Next.js + Tambo AI** and combines:

- **Tool-calling** (typed with Zod schemas)
- **MCP (Model Context Protocol)** for external tools/resources
- **Neo4j AuraDB** for graph-backed cloud context
- **NVL graph visualization** for interactive exploration

## Highlights

- **TamboProvider-based assistant** powering both `/chat` and `/interactables`
- **Custom system prompt** (agent instructions) to steer the assistant toward:
  - clear security analysis
  - explainability (“why”, not just “what”)
  - consistent structure (summary → analysis → implications → recommendations)
  - visualization-first behavior (graph output when the user asks to “show/visualize/explore”)
- **Generative UI components** rendered directly from tool outputs:
  - `NVLGraphExplorer` (infrastructure graph)
  - `ResourceTable` (inventory views)
  - `RiskCard` (risk summaries)
- **Production hardening** for streaming + rendering:
  - automatic fallback when streaming JSON parsing fails
  - error boundary around chat shell to prevent full-page crashes
  - graceful handling of WebGL failures for graph rendering

## Tech Stack

- **Next.js (App Router)**
- **Tambo AI** (`@tambo-ai/react`, MCP hooks)
- **Neo4j Driver** (AuraDB)
- **@neo4j-nvl/base** (graph visualization)
- **Tailwind CSS**

## Architecture 
<img width="4193" height="2048" alt="image" src="https://github.com/user-attachments/assets/90cb229f-bd6d-46cc-9257-609513b03008" />


## Project Structure (high level)

- `src/lib/tambo.ts`
  - registers Tambo **tools** + **components**
  - includes the **custom agent/system prompt**
  - routes tool calls to `/api/cloudatlas/tools`
- `src/app/api/cloudatlas/tools/route.ts`
  - Next.js API route that executes tool requests
- `src/app/chat/page.tsx`
  - chat experience powered by `TamboProvider`
- `src/app/interactables/page.tsx`
  - workspace-style UI where the assistant can render interactables
- `src/lib/neo4j-helper.ts`
  - Neo4j connection helper (AuraDB via env vars)

## Prerequisites

- Node.js 18+
- npm
- A **Tambo API key**
- Neo4j **AuraDB** instance (URI/username/password)

## Environment Variables

Create `.env.local` (you can start from `example.env.local`) and set:

### Required

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key

NEO4J_URI=neo4j+s://<your-auradb-hostname>:7687
NEO4J_USERNAME=<username>
NEO4J_PASSWORD=<password>
```

### Optional

```bash
# Only set if you want to override Tambo's default API base URL.
# If unset/empty, the app does not pass tamboUrl to the SDK.
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
```

## Local Development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/chat`
- `http://localhost:3000/interactables`

## Deployment (Vercel)

1. Import the repo into Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_TAMBO_API_KEY`
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
   - (optional) `NEXT_PUBLIC_TAMBO_URL`
3. Redeploy.

## Troubleshooting

- **Streaming error: “Failed to parse JSON after multiple chunks”**
  - The app retries once without streaming to keep the UX functional.
  - Confirm your `NEXT_PUBLIC_TAMBO_API_KEY` is set for the correct Vercel environment (Production/Preview).

- **Graph error: “Could not create shader object”**
  - This is a WebGL issue on some devices/browsers.
  - CloudAtlas shows a graceful fallback UI when WebGL/NVL cannot initialize.

## Notes for Judges

CloudAtlas is designed as a **tool-using AI system**, not a static chatbot:

- Tools are **schema-validated** (Zod) for reliability.
- Outputs render as **interactive UI** (graph/table/risk cards).
- The assistant behavior is intentionally shaped with a **custom system prompt** to produce explainable security reasoning and visualization-first outputs.
