## 2026-07-29T04:41:04Z
You are worker_m4 for the Knowledge Vault project.
Working directory: C:\Users\User\.gemini\antigravity\scratch\knowledge-vault

Your task is to implement Milestone M4 (UI/UX Polish, Accessibility & Dual-View Split R4):

1. **F11 Zen Focus Mode**:
   - Add global keydown listener for `F11` in `src/App.tsx` (and handle toggling `isZenMode`).
   - When Zen mode is active, hide sidebar, note list, and unnecessary toolbars to provide a distraction-free editing workspace. Provide an exit toggle or key hint (Esc/F11) to exit Zen mode.

2. **Multi-theme Switching**:
   - Enhance theme management in `src/components/Sidebar.tsx` and CSS (`src/index.css`) to support 4 themes (`dark`, `light`, `cyberpunk`, `sepia`) + 4 color accent presets (`blue`, `purple`, `emerald`, `amber`).
   - Set `data-theme` and `data-accent` on `document.documentElement`.

3. **Side-by-side Split Screen Dual Note Editor**:
   - Ensure `App.tsx` allows toggling split screen view (`isSplitView`), picking independent notes for Left and Right panes, and synchronizing note edits across both panes in real-time.

4. **Nested Folder Tree Navigation & ARIA Accessibility**:
   - Enhance folder navigation in `Sidebar.tsx` or dedicated `FolderTree` component to support arbitrary nested folder trees recursively.
   - Implement proper WAI-ARIA tree structure: `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-label`, keyboard navigation support (Enter/Space/Arrows), and CSS `:focus-visible` styling for zero-defect focus accessibility.

5. **Unit & Accessibility Tests**:
   - Create unit tests in `src/__tests__/ui_accessibility.test.ts` testing:
     - Zen Focus mode toggle & key listener.
     - Multi-theme switching (`dark`, `light`, `cyberpunk`, `sepia` + accents).
     - Split screen dual editor view note sync.
     - Nested folder tree ARIA attributes and focus navigation.

6. **Build & Test Verification**:
   - Run `npx vitest run src/__tests__/ui_accessibility.test.ts`.
   - Run `npx tsc --noEmit`.
   - Verify that all unit tests pass and there are 0 TypeScript errors.
