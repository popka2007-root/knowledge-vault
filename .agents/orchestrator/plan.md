# Knowledge Vault Implementation Plan

## Phase 1: Exploration & Diagnostics
- [ ] Task 1.1: Explore existing codebase, packages, dependencies, and layout.
- [ ] Task 1.2: Verify baseline build and identify any pre-existing issues or missing dependencies.

## Phase 2: Milestone Execution
- [ ] Task 2.1: Milestone M1 — Core Editor & Parsing Engine (R1)
  - CodeMirror 6 / MarkText AST parsing
  - Live syntax folding
  - Slash command palette `/`
  - Floating text formatting toolbar
  - Inline WikiLink autocompletion `[[...]]`
  - Visual GFM table editor
- [ ] Task 2.2: Milestone M2 — Advanced Data Visualization & Whiteboard (R2)
  - Interactive D3 Knowledge Graph (tag node colors, degree scaling, force simulation)
  - Infinite 2D Edgeless Canvas (AFFiNE style, SVG arrow connectors, multi-color sticky notes)
  - Agile Kanban board
  - Calendar planner view
- [ ] Task 2.3: Milestone M3 — Dynamic Querying & Data Engines (R3)
  - Obsidian Dataview DQL parser & evaluator (TABLE, LIST, TASK, FROM #tag, SORT, LIMIT)
  - Dynamic field extraction & interactive table rendering
- [ ] Task 2.4: Milestone M4 — UI/UX Polish, Accessibility & Dual-View Split (R4)
  - Multi-theme interface (Dark, Light, Cyberpunk, Sepia)
  - Zen Focus mode (F11)
  - Side-by-side split screen dual note editing
  - Nested folder tree navigation
  - Zero-defect accessibility (ARIA labels, keyboard focus states)

## Phase 3: Verification & Build Guardrails
- [ ] Task 3.1: Run unit tests, build validation (`npm run build`), zero TypeScript compilation errors, zero Vite bundle errors/warnings.
- [ ] Task 3.2: Verification by Reviewer, Challenger, and Forensic Auditor.
- [ ] Task 3.3: Final victory report.
