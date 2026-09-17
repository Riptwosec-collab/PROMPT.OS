# Prompt.OS V5 Phase 3 Power UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Command Palette, keyboard shortcuts, full Workspace/Folder UX, and prompt pack integration without duplicating prompt data or breaking Legacy Library behavior.

**Architecture:** Reuse Phase 1 search/workspace services. The Command Palette is a thin action dispatcher over the same prompt/workspace indexes rather than a second search implementation. Keyboard shortcuts are registered centrally and gated by feature flags.

**Tech Stack:** Next 16.3.5, React 19.3.0, Node test runner, Tailwind 4.3.3.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- No duplicated prompt store.
- Command Palette must work with keyboard only.
- Do not override critical browser shortcuts beyond the approved set.
- Legacy Library remains reachable.
- No production DB changes.

---

## File Structure

**Create**
- `lib/ui/command-registry.mjs`
- `lib/ui/keyboard-shortcuts.mjs`
- `components/command/CommandPalette.jsx`
- `components/workspace/FolderTree.jsx`
- `components/workspace/WorkspaceManager.jsx`
- `tests/command-palette-v2.test.mjs`
- `tests/keyboard-shortcuts.test.mjs`
- `tests/workspace-ui-contract.test.mjs`

**Modify**
- `components/PromptOS.jsx`
- `components/shell/*` only where navigation hooks are required.
- `tests/command-palette.test.mjs`
- `tests/i18n-complete.test.mjs`

## Task 1: Command Registry

**Interfaces:**
- `buildCommandRegistry(context)` -> command objects with `id`, `label`, `keywords`, `kind`, `run`.
- Kinds: `prompt`, `workspace`, `folder`, `pack`, `workflow`, `navigation`, `setting`, `action`.

- [ ] Write failing tests proving prompt, navigation, workspace, pack, and action commands use one registry and preserve stable IDs.
- [ ] Run `node --test tests/command-palette-v2.test.mjs` and confirm RED.
- [ ] Implement registry composition in `lib/ui/command-registry.mjs`.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add v5 command registry`.

## Task 2: Keyboard Shortcut Policy

**Interfaces:**
- `normalizeShortcut(event)`.
- `resolveShortcut(event, context)` for `Ctrl/Cmd+K`, `Ctrl/Cmd+Enter`, `Ctrl/Cmd+S`, `Ctrl/Cmd+Shift+C`, `Escape`.

- [ ] Write failing platform-neutral tests for Windows/Linux control key and macOS meta key.
- [ ] Confirm RED.
- [ ] Implement shortcut resolver with guards for editable fields where appropriate.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add keyboard shortcut policy`.

## Task 3: Command Palette UI

**Files:**
- Create: `components/command/CommandPalette.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Extend tests for open/close, fuzzy results, recent/frequent groups, arrow-key navigation, Enter open, Ctrl/Cmd+Enter run, Escape close, and visible focus.
- [ ] Confirm RED.
- [ ] Implement palette using Phase 1 search results plus command registry actions.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add command palette v2`.

## Task 4: Folder Tree UX

**Files:**
- Create: `components/workspace/FolderTree.jsx`, `components/workspace/WorkspaceManager.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Write UI-contract tests for create/rename/archive folder, move prompt, prompt remains globally visible, and deleting folder does not delete prompt.
- [ ] Confirm RED.
- [ ] Implement folder tree and workspace management against Phase 1 pure model.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add workspace folder ux`.

## Task 5: Prompt Pack Integration

- [ ] Extend tests proving a prompt can belong to multiple packs and that pack removal does not modify prompt identity.
- [ ] Confirm RED.
- [ ] Add pack browsing and Add to Pack action to Prompt Detail and Command Palette.
- [ ] Confirm GREEN.
- [ ] Commit `feat: integrate prompt packs across v5`.

## Task 6: Localization and Accessibility Verification

- [ ] Extend `tests/i18n-complete.test.mjs` with TH/EN labels for commands, workspaces, folders, and packs.
- [ ] Add assertions for dialog semantics, focus return, and keyboard-only completion of palette actions.
- [ ] Run targeted tests and fix failures.
- [ ] Commit `test: verify v5 power ux accessibility`.

## Task 7: Full Phase Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify V5 command/workspace flags default off.
- [ ] Verify Legacy navigation remains reachable when V5 flags are enabled and disabled.
- [ ] Open Phase 3 PR and stop before merge until explicit authorization.
