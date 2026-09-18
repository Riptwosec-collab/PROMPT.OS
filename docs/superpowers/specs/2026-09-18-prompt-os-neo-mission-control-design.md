# Prompt.OS Neo Mission Control Interaction Profile

Date: 2026-09-18
Status: Approved direction, awaiting written-spec review
Base: `main` @ `83021ad5173ecce135d30e1cd4f2a320ff822286`
Extends: `2026-09-18-prompt-os-v5-visual-motion-system-design.md`
Primary implementation phases: Phase 2 Mission Control + Navigation, Phase 3 Premium Prompt Experience

## 1. Purpose

This spec sharpens the existing Hybrid Premium Tech direction into a more distinctive **Neo Mission Control** experience.

The goal is to make Prompt.OS feel more advanced, responsive, spatial, and premium without turning it into a game UI or sacrificing speed, readability, accessibility, or maintainability.

The interaction character is:

- deep black spatial base
- restrained cyan + electric-purple energy accents
- glass depth with crisp illuminated edges
- pointer-reactive light on capable devices
- morphing navigation and shared geometry
- fast micro-feedback around user actions
- ambient motion that never blocks work

This profile does not replace the existing Phase 2/3 architecture. It defines how those features should feel and how interaction effects are bounded.

## 2. Locked Visual Direction

Approved profile: **Neo Mission Control**.

Visual priorities:

1. Professional AI command center first.
2. Futuristic visual identity second.
3. Decorative spectacle last.

The product should resemble a polished professional desktop/mobile application with a high-end technical interface, not a cyberpunk game HUD.

### 2.1 Color behavior

Keep surfaces predominantly neutral and dark. Cyan and purple are energy accents, not background fills.

Use cyan primarily for:

- focus
- current selection
- direct manipulation
- active command affordances
- pointer-responsive edge light

Use purple primarily for:

- secondary energy glow
- ambient aurora
- premium depth accents
- shared-transition continuity

Do not use rainbow gradients, saturated full-card fills, or neon borders around every element.

### 2.2 Depth hierarchy

Use four spatial levels:

- **Base** — deep black workspace
- **Ambient** — slow aurora / soft radial light
- **Surface** — glass panels and cards
- **Focus** — active prompt, command palette, action sheet, run surface

A user should be able to infer interaction priority from depth before reading text.

## 3. Interaction Architecture

Interactions are divided into three layers so visual effects do not leak into business logic.

### Layer A — Ambient interaction

Examples:

- aurora drift
- slow gradient movement
- subtle environmental light response

Rules:

- never changes application state
- never blocks navigation
- pauses or reduces when document is hidden
- static under reduced motion

### Layer B — Direct manipulation feedback

Examples:

- card pointer glow
- magnetic button shift
- active navigation indicator
- pressed / copied / pinned feedback

Rules:

- driven by pointer/focus/press state only
- no continuous React state updates for pointer position
- transform/opacity/CSS custom properties preferred
- disabled on coarse pointer where inappropriate

### Layer C — Spatial continuity

Examples:

- prompt card expanding into detail
- sidebar active indicator morphing between destinations
- command palette spring entry
- page content enter/exit

Rules:

- Motion for React owns coordinated layout/presence transitions
- application correctness cannot depend on animation callbacks
- reduced-motion falls back to short fades
- navigation remains available while content transitions

## 4. Signature Interactions

### 4.1 Reactive Aurora

The Phase 1 aurora becomes a responsive ambient system rather than a static background effect.

Desktop fine-pointer behavior:

- pointer contributes a low-intensity radial highlight
- ambient layers drift independently beneath it
- pointer response should feel delayed/smoothed rather than attached directly to the cursor
- no visible trail

Mobile/coarse-pointer behavior:

- no pointer tracking
- retain slow ambient gradient movement only

Performance:

- pointer coordinates update CSS custom properties inside requestAnimationFrame
- do not use React state for every pointer event
- root viewport coordinates remain aligned with the fixed aurora container

### 4.2 Magnetic Action Controls

Primary CTA and selected compact actions may move toward the pointer by approximately 1–2 px.

Eligible controls:

- Run
- primary command CTA
- command palette selected action
- selected card quick action

Ineligible controls:

- every navigation icon
- destructive confirmation buttons
- dense utility controls
- touch interfaces

The control must remain inside its original hit target. Magnetic movement is visual only and must never shift layout.

### 4.3 Reactive Card Edge Light

Premium cards use a two-layer effect:

1. stable glass edge
2. pointer-responsive local light around the closest card edge

The effect may brighten the category glyph and quick actions, but must not rotate the card.

Maximum hover lift: 4 px.

No heavy perspective tilt.

### 4.4 Shared Card-to-Detail Morph

This remains the primary Prompt.OS signature transition.

Sequence:

1. User activates a prompt card.
2. Card receives immediate focus/press feedback.
3. Surface/title/glyph preserve shared layout identity.
4. Card geometry expands toward the existing Prompt Detail surface.
5. Detail body fades in after spatial movement begins.
6. Background content de-emphasizes but remains structurally stable.

Close behavior reverses toward the source card when available. If filtering/navigation removed the source, fall back to a fade exit and restore focus to the Library search/heading.

### 4.5 Morphing Sidebar Active State

Sidebar collapse/expand remains a layout transition, but active state gains stronger continuity.

Use one shared active indicator that moves between destinations rather than separate highlights appearing/disappearing.

Expanded state:

- label visible
- soft glass active fill
- small cyan light rail

Collapsed state:

- icon alignment must remain stable
- active indicator morphs to icon-sized capsule
- tooltip provides destination label

The shell remains mounted during page changes.

### 4.6 Command Palette Spotlight

The command palette should feel like the product's control core.

Entry:

- backdrop darkens subtly
- local cyan/purple glow concentrates behind the palette
- focus surface springs in with small scale/y movement
- search input is immediately usable; animation never delays focus

Selected row:

- soft moving light field
- small directional glyph motion where appropriate
- keyboard and pointer selection share the same visual state

Desktop: centered focus glass.
Mobile: full-screen command sheet with explicit close control.

No particle field or scanning-line overlay.

### 4.7 Animated Metrics

Mission Control counters may interpolate only when values come from real application data.

Allowed examples:

- total runs
- copy count
- prompt health average
- visible real activity counts

Unsupported tokens/cost/latency remain omitted rather than displayed as zero or estimated fixtures.

Animation should be short and one-shot when the value appears/changes, not constantly pulsing.

### 4.8 Micro-feedback

Copy:

- icon compresses slightly
- label switches `Copy → Copied`
- optional one-shot edge flash

Favorite:

- press scale
- fill transition
- at most one tiny sparkle event

Pin:

- slight icon settle
- local accent flash

Run:

- immediate press feedback
- action surface visually deepens before execution presentation begins

Save:

- use local `Saving → Saved` state where available

Feedback must remain local when the triggering control can explain the result. Toasts are for broader cross-surface events.

## 5. Mission Control Composition

Mission Control remains command-first and spacious.

### Hero Command Surface

The hero is a large glass command surface with:

- primary search/command affordance
- keyboard shortcut hint
- low-intensity local spotlight
- optional subtle prompt-context micrographic

Pointer hover may brighten the edge and move the primary CTA magnetically. Do not turn the whole hero into a 3D card.

### Continue Working

Use at most two large work cards.

Cards should feel more alive through:

- recent-state chip
- last-used metadata
- reactive glyph light
- shared surface motion

Hide the section when no real recent data exists.

### Featured Prompt Packs

Each pack may use one lightweight CSS/SVG micrographic tied to its category.

Examples:

- Network: connected nodes
- Research: orbit/point graph
- Developer: bracket/grid motif

Graphics may animate once on hover/focus but should not continuously loop.

### Usage / Health / Activity

Use compact technical strips or small panels, not large dashboard charts unless the underlying data supports them.

Every metric must be sourced from real records.

## 6. Premium Prompt Library Interaction Profile

The spacious 1-column mobile / 2-column desktop structure remains.

Each Premium Intelligence Card should communicate three things immediately:

1. what the prompt is
2. why it is useful / what category it belongs to
3. what action can be taken next

Interaction behavior:

- hover: lift <= 4 px, local edge light, quick actions reveal
- focus-visible: same hierarchy as hover without requiring pointer
- press: quick scale/depth compression
- long press on mobile: Quick Actions sheet
- tap/click: open detail

No destructive swipe action.

Search/filter reflow remains immediate. Motion decorates the already-computed result set rather than delaying filtering.

## 7. Mobile Interaction Profile

Mobile is not a reduced desktop implementation.

### Floating Dock

Use a glass dock above safe area with:

- Library
- Workspaces
- central Create action
- Activity
- More

Active state morphs between items.

Create action may rise slightly above the dock visually, but must preserve a clear hit target and not obscure content.

### Action Sheets

Use bottom sheets for:

- create actions
- quick prompt actions
- More navigation

Sheets use:

- short spring entry
- explicit close
- backdrop close when safe
- Escape support where hardware keyboard exists

### Motion limits

Disable:

- magnetic pointer controls
- pointer glow
- cursor-reactive aurora
- hover-only dependencies

Keep:

- press feedback
- shared prompt expansion
- dock active morph
- short sheet motion

## 8. Reduced Motion

`prefers-reduced-motion` is a complete interaction mode, not merely a slower animation setting.

Replace:

- shared expansion → short fade
- sidebar spring → short crossfade/state switch
- command palette spring → fade + minimal translation
- animated counters → immediate value
- aurora movement → static gradients
- magnetic effects → disabled
- pointer glow → disabled

Focus, selection, status, and action feedback remain visually explicit without relying on movement.

## 9. Performance Budgets and Implementation Rules

The Neo profile is rejected if it makes ordinary interaction feel slower.

Rules:

- no WebGL
- no video backgrounds
- no continuously animated blur
- no continuous box-shadow animation
- no full-screen particle engine
- no React state per pointer frame
- no animation-gated navigation
- no event listener duplication across page transitions
- no hidden background loops after document visibility changes

Prefer:

- transform
- opacity
- CSS variables
- requestAnimationFrame
- Motion layout/presence for coordinated geometry only

Pointer-reactive effects should be scoped to the smallest relevant DOM subtree.

## 10. Component Boundaries

Phase 2 should own:

- Mission Control
- Command Palette V5
- morphing Sidebar / Top Bar
- floating Mobile Dock
- Create Action Sheet
- PageTransition
- ToastViewport

Phase 3 should own:

- PromptCardV5
- prompt card pointer light
- prompt long-press sheet
- shared prompt transition IDs
- premium search reflow
- Prompt Detail transition wrappers

Shared visual primitives remain in the Phase 1 UI foundation.

Business/data models must not be moved into visual components solely to support animation.

## 11. Rollout and Feature Gates

Reuse the existing gate strategy.

Primary gates:

- `V5_VISUAL_SYSTEM`
- `V5_MISSION_CONTROL`
- `V5_COMMAND_PALETTE`
- `V5_PREMIUM_CARDS`
- `V5_SHARED_PROMPT_TRANSITION`

All new/related visual behavior must remain default-off until its phase is intentionally enabled.

Do not add a separate `NEO_MODE` flag. Neo Mission Control is the visual profile for the already-approved Phase 2/3 surfaces, not a parallel implementation path.

Legacy PromptOS remains available.

## 12. Testing Strategy

Use TDD for each behavioral interaction.

Required tests include:

### Pure/model

- command item generation
- toast queue limits/deduplication
- shared prompt layout IDs
- reduced-motion transition selection
- Mission Control data selectors

### Source/component contracts

- root feature gating
- sidebar shared active indicator
- command palette keyboard behavior
- page shell remains outside transition boundary
- premium card fine/coarse-pointer behavior
- no card rotation requirement
- long-press threshold/cancellation
- reduced-motion fallback
- local action feedback and bounded toasts

### Regression

- exactly 80 built-in prompts
- prompt catalog persistence semantics unchanged
- Prompt Packs remain references
- Prompt Health remains deterministic/local
- Variables V2 unchanged
- Legacy fallback remains intact

### Build safety

- full `npm test`
- Next/OpenNext build
- required OpenNext artifacts
- Wrangler dry-run

No production deploy follows automatically from passing validation.

## 13. Acceptance Criteria

Neo Mission Control is accepted when:

- the interface feels more advanced than Phase 1 without becoming visually noisy
- Mission Control reads as a coherent command center rather than a collection of dashboard widgets
- pointer-reactive light feels subtle and remains aligned to the pointer
- primary CTA magnetic motion is perceptible but does not shift layout or hit targets
- premium cards gain depth without 3D rotation
- prompt card → detail movement feels spatially continuous
- sidebar active state visibly morphs instead of blinking between items
- command palette feels like a focused control core and remains keyboard-first
- mobile interactions feel native to touch rather than simulated desktop hover
- reduced-motion mode preserves every core workflow
- no fabricated telemetry appears
- ordinary navigation/search interactions remain immediate
- full regression/build/dry-run verification passes before merge

## 14. Non-Goals

Do not add:

- scan-line overlays across the application
- long cursor trails
- heavy 3D card tilt
- animated particle fields
- persistent rotating HUD rings
- glitch text effects
- rainbow neon gradients
- autoplay visual loops on every card
- fabricated system metrics
- new provider/execution logic
- production database changes
- automatic production deployment

## 15. Relationship to Existing Plans

The existing Phase 2 and Phase 3 implementation plans remain structurally valid.

Before implementation, their task details should be revised only where necessary to include this interaction profile:

- Phase 2: reactive hero spotlight, bounded magnetic CTA, stronger sidebar active morph, command-palette spotlight behavior, mobile dock morphing
- Phase 3: reactive card edge light, press-depth feedback, shared transition polish, mobile touch-specific interaction limits

The implementation should not create duplicate components or a parallel Neo-specific route tree.

## 16. Final Design Summary

Prompt.OS should feel like a **Neo Mission Control for AI prompts**: black glass, cyan/purple energy, subtle environmental movement, precise spatial transitions, and responsive micro-feedback.

The product should feel alive because the interface reacts to intent—not because everything is constantly moving.
