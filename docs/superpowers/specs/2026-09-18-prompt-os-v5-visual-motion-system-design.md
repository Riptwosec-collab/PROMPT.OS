# Prompt.OS V5 Visual, Motion & Interaction System Design

Date: 2026-09-18
Status: Approved design draft awaiting final user review
Base: `main` @ `65742553b7b06519a4811785dcbb5b45b4b0717c`

## 1. Purpose

Upgrade Prompt.OS from a functional dark/glass prompt manager into a premium AI operating environment with a coherent visual system, motion language, interaction model, and responsive behavior.

The goal is not to add decorative animation everywhere. The goal is to make the product feel spatially consistent, fast, premium, and intentional while preserving productivity, accessibility, and performance.

## 2. Locked Design Direction

The following decisions were approved during design review:

- Visual direction: **Hybrid Premium Tech**
- Motion intensity: **Dynamic Premium**
- Platform priority: **Desktop + Mobile equally important**
- Density: **Spacious Showcase**
- Prompt opening interaction: **Shared Card Expansion**
- Accent palette: **Ice Blue + Electric Purple**
- Background: **Aurora Glass**
- Typography: **Premium Tech**
- Icons/graphics: **Glass Glyph + Tech Micrographics**
- Prompt cards: **Premium Intelligence Card**
- Home: **Mission Control**
- Run experience: **Immersive Run Experience**
- Implementation architecture: **Motion System + CSS Effects**

## 3. Design Principles

1. **Premium, not flashy.** Motion and glow should clarify hierarchy and state, not compete with content.
2. **Spatial continuity.** Elements should appear to move between states rather than disappear and respawn where practical.
3. **Fast first.** No animation should delay the user from taking the next action.
4. **Technical identity in moderation.** Mono labels, telemetry, micrographics, and status indicators provide Prompt.OS identity without turning the product into a gaming HUD.
5. **Progressive enhancement.** High-end pointer effects exist only where hardware/input supports them. Core workflows remain complete without them.
6. **Accessibility is part of the design system.** Reduced motion, keyboard access, visible focus, and sufficient contrast are mandatory.
7. **One motion language.** Shared timing, easing, spring, and state transitions must be centralized rather than hand-authored independently in every component.

## 4. Visual System

### 4.1 Layer Model

The application should visually read in this order:

1. Deep black base
2. Aurora ambient layer
3. Glass surfaces
4. Ice Blue / Electric Purple accents
5. Content
6. Interactive light, edge highlight, and state glow

### 4.2 Color Direction

Primary surfaces remain very dark and neutral. Ice Blue and Electric Purple are accents, not full-surface fills.

Required semantic families:

- Background / elevated background
- Glass surface / stronger glass surface
- Border / active border
- Ice Blue accent
- Electric Purple accent
- Text primary / secondary / muted
- Success
- Warning
- Error
- Focus

Existing semantic success/warning/error behavior should be preserved where already implemented.

### 4.3 Glass

Glass is a hierarchy system, not one universal blur class.

Define at least three levels:

- `glass-subtle`: navigation, secondary surfaces
- `glass-panel`: cards, search, panels
- `glass-focus`: command palette, expanded prompt, active run surface

Each level defines:

- opacity
- blur
- border opacity
- edge highlight
- shadow/elevation
- optional accent tint

Avoid continuously animating blur. Blur may change only during discrete state transitions if performance remains acceptable.

### 4.4 Aurora Background

Use CSS-based layered radial/linear gradients rather than video, WebGL, or particle engines.

Behavior:

- slow 8–20 second ambient transform cycle
- subtle Ice Blue / Purple movement
- pointer-based drift only on fine-pointer desktop devices
- no cursor tracking dependency on mobile
- static fallback under `prefers-reduced-motion`
- reduce or suspend ambient animation when the document is hidden

### 4.5 Typography

Use two roles:

**Sans**
- page titles
- prompt titles
- body text
- buttons
- forms
- navigation

**Mono**
- model/provider
- tokens
- cost
- latency
- status
- keyboard shortcuts
- IDs / technical metadata

Do not overuse uppercase or wide letter spacing. Technical typography is an accent layer rather than the dominant reading style.

## 5. Motion System

### 5.1 Architecture

Use a dedicated motion orchestration layer for layout/shared-element/enter-exit/gesture behavior, paired with CSS/Tailwind for glass, aurora, and static visual effects.

The implementation should favor a React-compatible motion library that supports:

- layout animation
- shared layout IDs
- enter/exit presence
- spring transitions
- drag/swipe gestures
- reduced-motion awareness

The implementation plan should validate exact package compatibility with Next.js 16 / React 19 before adoption.

### 5.2 Motion Tokens

Centralize durations and spring behavior.

Target ranges:

- Instant: ~120 ms — icon state, copy, favorite
- Fast: ~180 ms — hover, tooltip, button feedback
- Standard: ~280 ms — filters, menus, card reflow
- Spring: ~350–500 ms — shared expansion, sheets, large spatial change
- Ambient: 8–20 s — background aurora only

Exact values belong in one token/config module and may be tuned during implementation testing.

### 5.3 Performance Rules

- Prefer `transform` and `opacity` for animated properties.
- Avoid continuous animation of width, height, box-shadow blur, or backdrop blur.
- Pointer tracking must not cause React state updates every frame.
- Fine-pointer effects should use CSS custom properties or requestAnimationFrame-managed DOM updates.
- Reduce pointer/parallax effects on mobile/tablet.
- Never require animation completion before the next action is available.

## 6. UI Foundation Components

Create a reusable UI foundation rather than embedding bespoke effects into feature components.

Proposed structure:

```text
components/ui/
├── GlassSurface
├── MotionSurface
├── GlowButton
├── GlassGlyph
├── StatusPill
├── MetricChip
├── AuroraBackground
├── AnimatedNumber
└── MotionPresence

lib/ui/
├── visual-tokens
├── motion-tokens
└── interaction-config
```

These are conceptual boundaries. Final file naming may follow existing repository conventions, but responsibilities should remain isolated.

## 7. Mission Control Home

Home becomes an AI Prompt Command Center rather than a dense administration dashboard.

Primary sections:

1. Hero Command Bar
2. Continue Working
3. AI Usage Pulse
4. Featured Prompt Packs
5. Cloud / Sync Status
6. Prompt Health Summary
7. Activity Timeline
8. Smart Collections

### 7.1 Hero Command Bar

Desktop target height: roughly 64–72 px.

Capabilities:

- search prompts
- search commands
- search workflows
- search packs
- `Ctrl/⌘ + K`
- focused state expands into a command/result surface instead of instantly opening a disconnected modal

On mobile, focus becomes a full-width/full-screen command sheet optimized around the software keyboard.

### 7.2 Continue Working

Show one or two large recent work cards rather than a dense row.

Possible data:

- recent prompt
- workflow
- evaluation
- draft
- last-used timestamp
- model/provider
- activity state

Hide the section entirely when empty.

### 7.3 AI Usage Pulse

Use a telemetry strip rather than a large analytics dashboard.

Metrics may include:

- Runs
- Tokens
- Estimated Cost
- Average Latency
- Success Rate

Changes use subtle number interpolation and micro pulse feedback.

### 7.4 Featured Prompt Packs

Large showcase cards with CSS/SVG micrographics.

Examples:

- Network: nodes/links
- Research: connected points
- Developer: bracket/code grid
- Security: shield/scanner ring

No heavyweight background illustrations are required.

## 8. Prompt Library

### 8.1 Spacious Showcase Layout

Responsive targets:

- Large desktop: 2 primary cards per row
- Laptop: 2 cards per row
- Mobile: 1 card per row

Horizontal scrolling is reserved for targeted discovery rows such as Recent, Packs, or Smart Collections.

### 8.2 Premium Intelligence Card

Each main prompt card should support:

- category glass glyph
- category label
- large prompt title
- 2–3 line description
- variable count
- Prompt Health mini indicator
- model/usage metadata in mono type
- Favorite / Pin / Run quick actions
- cursor-responsive highlight on fine-pointer devices
- shared-element transition entry into Prompt Detail

### 8.3 Desktop Card Interaction

On hover/focus:

- lift ~3–5 px visually
- increase depth/shadow modestly
- reveal low-intensity cursor-responsive light
- activate glyph
- reveal quick actions
- optionally reveal a small amount of extra metadata

Do not use large 3D tilt or dramatic rotation.

### 8.4 Mobile Card Interaction

- Tap opens Prompt Detail.
- Long press opens Quick Actions in a bottom sheet.
- Do not emulate hover.
- Avoid destructive swipe gestures.

Quick Actions may include:

- Run
- Favorite
- Pin
- Add to Pack
- Copy

## 9. Shared Card Expansion

This is the main spatial interaction between Library and Prompt Detail.

Sequence:

1. Selected card lifts above the grid.
2. Surrounding content subtly fades/reflows.
3. Card geometry expands toward Prompt Detail.
4. Title, glyph, and accent preserve continuity.
5. Detail content appears progressively after geometry settles enough for reading.

Desktop:

- detail becomes a large centered workspace
- preserve outer margin where practical
- feel like an elevated workspace rather than an unrelated full-screen page

Mobile:

- card expands to the viewport
- border radius reduces during expansion
- detail becomes a full-screen mobile workspace

Closing reverses the transition to the originating card when that card is still present. If the source is no longer available because of filtering/navigation, fall back to a standard detail-exit transition.

Reduced-motion mode replaces the shared expansion with a short fade/dissolve.

## 10. Prompt Detail

Desktop structure:

- Header with back, category, Favorite/Pin, Run
- Title and description
- Inputs / Variables panel
- Live Prompt Preview panel
- Health / Usage / Version sections

Mobile structure:

- Header
- Title / description
- Variables
- Prompt Preview
- Health
- Usage
- Sticky/floating Run action above the safe area

Prompt Detail must retain existing Variables V2 and Prompt Health behavior rather than creating duplicate logic.

## 11. Search & Discovery Motion

Search and filtering should animate layout changes instead of flashing the entire grid.

Expected behavior:

- non-matching cards fade/shift out
- retained cards reflow smoothly
- new matches enter softly
- empty state appears without abrupt layout jumps

Smart Collections should use lightweight collection tiles/capsules with subtle glyph/count interaction.

Examples:

- Favorites
- Recently Used
- Most Used
- Recently Added
- Has Variables

## 12. Immersive Run Experience

### 12.1 Principle

The interface should communicate **the system is working**, not **the page is loading**.

### 12.2 Run State Machine

Required visible states:

- Preparing
- Running
- Streaming
- Completed
- Failed
- Cancelled / Stopped

The state model must be explicit and should not depend on animation callbacks for correctness.

### 12.3 Transition Into Run Mode

1. User presses Run.
2. Run control gives immediate press feedback.
3. Prompt Detail surface focuses/deepens.
4. Input area visually de-emphasizes and locks where required.
5. Execution rail/status appears.
6. Streaming output begins.

### 12.4 Run Header / Telemetry

Show compact technical status:

- state
- prompt name
- provider
- model
- latency
- tokens
- estimated cost

Use mono typography for technical metrics.

### 12.5 AI Pulse

Replace generic spinner behavior with a small Prompt.OS execution signature.

Suggested behavior:

- Preparing: slow pulse
- Streaming: active micro waveform
- Completed: waveform settles
- Error: short warning pulse

Keep this small and informational.

### 12.6 Streaming Output

Do not animate every character.

Prefer:

- chunk fade-in
- paragraph settle
- code block reveal
- heading reveal

Auto-scroll only while the user remains near the latest output. If they scroll upward, suspend auto-scroll and show a `Jump to latest` action.

### 12.7 Desktop Output Layout

Run mode may progressively favor the output panel over the input panel.

Concept:

```text
INPUT | OUTPUT
```

Input remains available for later edit/run-again without losing user values.

### 12.8 Mobile Output Layout

Single column:

Prompt → Variables → Run → Streaming Output → Metrics → Actions

The active Run control becomes a floating status island above the safe area/dock.

### 12.9 Stop / Error / Completion

**Stop**

- preserve streamed output
- preserve variables/input
- mark state as Stopped
- allow Run Again / Continue where supported

**Failure**

- error is isolated to the execution surface
- preserve user input and any existing output
- expose Retry / Edit Prompt

**Completion**

Expose actions such as:

- Copy
- Save Result
- Run Again
- Improve Prompt
- Compare
- Add to Workflow

No confetti or celebratory full-screen effects.

## 13. Cost Guard Interaction

Single prompt runs should remain immediate and should not require a confirmation dialog by default.

The UI may show a pre-run estimate such as estimated tokens/cost.

Multi-call systems such as Evaluation or Workflow should continue to use the stronger Cost Guard approach defined in the broader V5 architecture.

Hard spending limit remains outside the visual redesign scope unless separately approved.

## 14. Navigation System

### 14.1 Desktop Sidebar

Two states:

- Expanded
- Collapsed

Behavior:

- spring-based width/state change
- stable icon alignment
- shared active indicator
- soft glass active fill
- subtle left light rail
- status dots only where meaningful

Avoid strong neon blocks.

### 14.2 Top Bar

Keep the top bar visually light.

Suggested contents:

- breadcrumb
- current workspace
- sync status
- command/search shortcut
- profile/settings

When sticky content passes beneath it, stronger glass/blur may be applied discretely.

### 14.3 Mobile Dock

Use a floating glass dock rather than a compressed desktop sidebar.

Suggested primary items:

- Library
- Workspace
- Create
- Activity
- More

Create may open:

- New Prompt
- New Workflow
- Import Prompt

Dock behavior:

- active tab morph/highlight
- respects safe area
- small press feedback
- may compact slightly during fast downward scrolling, but navigation must never become undiscoverable

## 15. Command Palette

Shortcut: `Ctrl/⌘ + K`

Search domains:

- Prompts
- Packs
- Workflows
- Navigation
- Actions

Desktop:

- centered focus glass surface
- keyboard navigation
- active row soft-light state
- optional preview panel

Mobile:

- full-screen command sheet
- software-keyboard aware
- swipe/down close may supplement, not replace, an explicit close action

## 16. Global Micro-interactions

### Favorite

- small press scale
- fill transition
- single tiny sparkle at most

### Pin

- subtle icon settle/rotation
- smooth metadata update

### Copy

State sequence:

`Copy → Copied → Copy`

No toast is required if the local button state provides sufficient confirmation.

### Save

Prefer local `Saving → Saved` status rather than a toast on every autosave.

### Delete

- explicit confirmation
- collapse/fade only after confirmation
- no dramatic motion

### Toasts

Use a floating glass island.

- Desktop: top-right
- Mobile: above bottom dock
- maximum visible stack: 3

## 17. Keyboard & Focus UX

Required shortcuts where they do not conflict with existing behavior:

- `Ctrl/⌘ + K`: command palette
- `/`: focus library search
- `Esc`: close detail/palette/sheet where safe
- `Enter`: open selected item
- arrow keys: navigate command palette
- `Ctrl/⌘ + Enter`: Run Prompt

All interactive elements must remain keyboard reachable.

Focus states use a thin Ice Blue halo with sufficient contrast and must not rely on browser-default styling being disabled without a replacement.

## 18. Pointer Effects

Enable only on devices matching fine pointer / hover capability.

Allowed effects:

- card cursor glow
- 1–2 px magnetic button shift
- glyph reactive light
- subtle aurora drift

Disable these on coarse pointer devices.

No core capability may depend on pointer effects.

## 19. Page Transitions

The application shell should remain stable while page content changes.

Target behavior:

- old content fades ~100–140 ms
- new content enters with ~8–12 px movement and ~180–240 ms fade
- navigation remains persistent

Do not use full-screen wipes.

## 20. Responsive Behavior

### Desktop

- sidebar
- hover/fine-pointer enhancements
- split layouts
- keyboard-first productivity

### Tablet

- collapsible sidebar
- 2-column cards where space permits
- reduced hover dependence

### Mobile

- floating dock
- bottom sheets
- single-column showcase
- sticky Run action
- long-press quick actions
- no cursor or pointer-parallax dependency

## 21. Accessibility & Reduced Motion

Under `prefers-reduced-motion`:

- shared card expansion becomes fade/dissolve
- aurora becomes static
- spring movement becomes short fade/transition
- animated numbers update immediately
- parallax/pointer drift is disabled

Additional requirements:

- sufficient contrast for text and focus states
- touch targets appropriate for mobile
- status not communicated by color alone
- keyboard operation for all primary flows
- no focus loss during shared expansion or command palette transitions
- ARIA/live-region handling for run state changes where appropriate

## 22. Feature Flag & Rollout Strategy

The redesign should remain compatible with the repository's granular default-off V5 flag strategy.

Recommended new rollout boundaries:

- `V5_VISUAL_SYSTEM` — tokens, aurora, new reusable surfaces
- `V5_MISSION_CONTROL` — new Home experience
- `V5_PREMIUM_CARDS` — new Prompt Library cards and search reflow motion
- `V5_SHARED_PROMPT_TRANSITION` — shared card expansion/detail transition
- `V5_IMMERSIVE_RUN` — immersive execution presentation
- `V5_COMMAND_PALETTE_UI` — new palette presentation/interaction, reusing existing command capability flag where appropriate

The implementation plan should decide whether some of these should map onto existing V5 flags instead of adding redundant flags. The principle is staged, reversible rollout with default-safe behavior.

Legacy PromptOS must remain available until V5 visual acceptance and a separate removal decision.

## 23. Data & Backend Boundaries

This design is primarily a presentation/interaction redesign.

It must not silently introduce:

- Supabase production DDL
- provider changes
- new billing enforcement
- prompt catalog modifications
- prompt record duplication
- production deployment

Existing V5 data/state behavior should be reused wherever possible.

Run telemetry fields that do not yet exist in the execution layer may be visually stubbed only behind a development flag or omitted until the execution engine supplies real values. Production UI must not fabricate metrics.

## 24. Testing Strategy

Implementation should use TDD for behavioral additions and regression contracts.

Required categories:

### Unit / model
- motion token validity
- interaction config behavior
- reduced-motion selection
- run state mapping

### Component contracts
- correct feature-gate fallback
- keyboard navigation
- command palette behavior
- mobile/desktop action availability
- shared transition fallback
- run state preservation after stop/error

### Accessibility
- focus order
- `aria-*` state behavior
- keyboard-only operation
- reduced-motion fallback

### Regression
- exactly 80 built-in prompt catalog entries remain intact unless separately approved
- Legacy PromptOS fallback remains available
- Variables V2 behavior remains intact
- Prompt Health remains local/deterministic
- Smart Collections and Prompt Packs keep reference semantics

### Build / deployment safety
- `npm test`
- Next/OpenNext build
- OpenNext artifact checks
- Wrangler deploy dry-run

No production deploy is implied by passing these checks.

## 25. Performance Acceptance Targets

The design should be implemented with these qualitative requirements:

- no visible frame drops during ordinary card hover and page transitions on modern desktop hardware
- no continuous React rerender loop for pointer glow
- mobile remains usable with aurora and nonessential motion reduced
- no blocking animation before search, navigation, Run, or Close actions
- no heavyweight WebGL/video dependency for ambient graphics

The implementation plan may add measurable bundle/render budgets after inspecting the current production bundle.

## 26. Non-Goals

This design does not include:

- WebGL scene engine
- particle field background
- heavy 3D card rotation
- rainbow gradients
- autoplay carousels
- video backgrounds
- animation on every text node
- full-screen celebration effects
- production database migration
- provider expansion beyond separately approved execution work
- removal of Legacy PromptOS

## 27. Proposed Implementation Phases

The exact task breakdown will be written only after this spec receives final user approval.

Suggested phase boundaries:

1. **Visual + Motion Foundation**
   - tokens
   - reusable glass/motion primitives
   - aurora
   - reduced-motion behavior

2. **Mission Control + Navigation**
   - Home
   - sidebar/top bar
   - mobile dock
   - command palette presentation

3. **Premium Prompt Experience**
   - Premium Intelligence Cards
   - spacious library
   - search/filter layout motion
   - shared card expansion
   - Prompt Detail visual update

4. **Immersive Run Experience**
   - run state presentation
   - streaming presentation
   - telemetry UI
   - stop/error/completion transitions

Each phase should have independent flags, tests, CI verification, and a separate merge gate.

## 28. Acceptance Criteria

The redesign is accepted when:

- Prompt.OS visually matches the approved Hybrid Premium Tech direction.
- Home reads as Mission Control rather than a dense admin dashboard.
- Prompt Library uses Spacious Showcase cards on desktop and one-column showcase on mobile.
- Prompt cards expose useful metadata without appearing crowded.
- Prompt Detail opens with shared spatial continuity where motion is enabled.
- Search/filter changes reflow rather than flash the grid.
- Desktop and mobile both have first-class navigation and action models.
- Run states communicate active execution without a generic loading-page feel.
- Reduced-motion mode remains fully usable.
- Keyboard navigation remains complete for core flows.
- No existing V5 data semantics regress.
- Legacy fallback and default-safe rollout remain intact.
- Test/build/Wrangler dry-run verification passes before any merge.

## 29. Final Design Summary

Prompt.OS V5 should feel like a premium AI workspace: dark, spacious, glass-based, technically precise, and alive only where movement communicates structure or system state.

The signature interactions are:

- Mission Control command-first Home
- Premium Intelligence Cards
- Shared Card Expansion into Prompt Detail
- smooth search/reflow behavior
- Morphing Sidebar + Floating Mobile Dock
- command palette as a first-class navigation surface
- Immersive Run Experience with execution pulse and live telemetry

The system intentionally avoids cinematic excess. The desired result is a product that feels closer to a polished native creative/professional application than a neon dashboard or prompt catalog website.
