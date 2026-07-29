# Project: Knowledge Vault

## Overview
Production-grade Personal Knowledge Management (PKM) workspace combining MarkText, Obsidian, AFFiNE, and Notesnook features into a zero-defect React/TypeScript desktop web application.

## Architecture
- **Frontend Framework**: React 18, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Core Editor**: CodeMirror 6 markdown editor with real-time AST parsing, live syntax folding, slash command palette (/), formatting toolbar, inline WikiLink autocompletion (`[[...]]`), visual GFM table editing.
- **Visualization & Whiteboard**: D3.js interactive Knowledge Graph (link physics simulation, tag node colors, degree scaling), 2D Edgeless Canvas (infinite pan/zoom, SVG arrow connectors, multi-color sticky notes), Agile Kanban board, Calendar planner view.
- **Query Engine**: Obsidian Dataview DQL query parser & evaluator (TABLE, LIST, TASK, FROM #tag, SORT, LIMIT) with dynamic field extraction & interactive table rendering.
- **UI/UX Infrastructure**: Responsive multi-theme engine (Dark, Light, Cyberpunk, Sepia), Zen Focus mode (F11), side-by-side split screen dual note editor, nested folder tree navigation, zero-defect accessibility (ARIA labels, keyboard focus states).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Editor & Parsing Engine (R1) | CodeMirror 6 Markdown AST editor, live folding, slash palette `/`, floating formatting toolbar, WikiLink `[[...]]` autocomplete, visual GFM table editor | None | DONE |
| M2 | Advanced Data Visualization & Whiteboard (R2) | D3 Knowledge Graph (node degree scaling, tag colors, physics), Infinite 2D Edgeless Canvas (SVG connector arrows, sticky notes), Kanban Board, Calendar View | M1 | DONE |
| M3 | Dynamic Querying & Data Engines (R3) | Dataview DQL parser & execution engine (TABLE, LIST, TASK, FROM #tag, SORT, LIMIT), dynamic metadata extraction, interactive rendering | M1 | DONE |
| M4 | UI/UX Polish, Accessibility & Dual-View Split (R4) | Multi-theme manager (Dark, Light, Cyberpunk, Sepia), Zen focus mode (F11), side-by-side dual note editor, folder tree nav, ARIA accessibility & keyboard focus | M1, M2, M3 | PLANNED |
| M5 | Final E2E Build Verification | 0 TypeScript compilation errors, 0 Vite warnings/failures in `npm run build`, zero-defect quality gate, full test pass | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
- **Editor Contract**: `src/components/Editor/` provides `MarkdownEditor` component supporting WikiLinks, Slash commands, AST parsing callbacks, GFM table controls.
- **Graph Contract**: `src/components/Graph/` provides `KnowledgeGraph` component receiving note nodes, tag metadata, and link relations.
- **Canvas Contract**: `src/components/Canvas/` provides `EdgelessCanvas` component supporting sticky notes, shapes, SVG connectors.
- **Dataview Engine Contract**: `src/engine/dataview/` provides `parseDQL(query: string)` and `executeDQL(query: string, notes: Note[])`.
- **Theme & Layout Contract**: `src/context/ThemeContext.tsx` and `src/components/Layout/` supporting split views, theme switching, Zen mode.

## Code Layout
- `src/components/`: Core UI components (Editor, Graph, Canvas, Kanban, Calendar, Query, Layout, Theme, SplitView)
- `src/engine/`: Markdown parser, WikiLink resolver, DQL query parser & execution engine
- `src/types/`: TypeScript definitions for Notes, Tags, Graph, Canvas, DQL, Themes
- `src/context/`: React context providers (WorkspaceContext, ThemeContext, SplitViewContext)
- `src/utils/`: Helper functions, sample vault data generator
