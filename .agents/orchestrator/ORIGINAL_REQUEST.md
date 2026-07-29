# Original User Request

## 2026-07-29T08:22:50Z

Refine and elevate **Knowledge Vault** into a production-grade, zero-defect Personal Knowledge Management (PKM) workspace combining the best capabilities of MarkText, Obsidian, AFFiNE, and Notesnook.

Working directory: C:\Users\User\.gemini\antigravity\scratch\knowledge-vault
Integrity mode: development

## Requirements

### R1. Core Editor & Parsing Engine
The application must provide a real-time Markdown AST editor (powered by CodeMirror 6 / MarkText architecture) with live syntax folding, slash command palette (/), floating text formatting toolbar, inline WikiLink autocompletion ([[...]]), and visual GFM table editing.

### R2. Advanced Data Visualization & Whiteboard
The application must provide an interactive D3 Knowledge Graph with tag-based node color rules and degree scaling, an infinite 2D Edgeless Canvas (AFFiNE style) with SVG arrow connectors and multi-color sticky notes, an Agile Kanban board, and a Calendar planner view.

### R3. Dynamic Querying & Data Engines
The application must execute Obsidian Dataview DQL queries (TABLE, LIST, TASK, FROM #tag, SORT, LIMIT) with dynamic field extraction and interactive table rendering.

### R4. UI/UX Polish, Accessibility & Dual-View Split
The application must provide a responsive multi-theme interface (Dark, Light, Cyberpunk, Sepia), Zen Focus mode (F11), split-screen dual note editing, nested folder tree navigation, and zero-defect accessibility (ARIA labels, keyboard focus states).

## Acceptance Criteria

### Verification & Build Guardrails
- [ ] `npm run build` executes synchronously with 0 TypeScript compilation errors and 0 Vite bundle warnings/failures.
- [ ] CodeMirror 6 editor parses markdown syntax without crashing or losing selection focus.
- [ ] Dataview query engine executes queries and returns correct table/task schemas.
- [ ] Side-by-side split screen view toggles seamlessly between single and dual note editors.
- [ ] D3 Graph View renders nodes with proper color palette and link physics simulation.
- [ ] Edgeless Canvas renders SVG connector arrowheads and supports sticky note creation.
