# WEB AGENTS

Frontend-specific operating rules for `apps/web`.

## Primary Goal
Move the frontend toward:
- thin route files
- domain-oriented page composition
- dedicated data-fetching hooks/modules
- small presentational components
- low-risk UI iteration

The product UI is still evolving. Optimize for maintainability, not final polish.

## Stability Before Sophistication
Prefer stable UI behavior over ambitious restructuring.

Rules:
- preserve behavior by default during refactors
- do not silently combine structural cleanup with UX behavior changes
- if a UX change is intentional, state it explicitly

## Current Reality
The frontend already has useful domain components, but several are too large and mix:
- fetching
- selection state
- mutations
- view-model logic
- rendering

Main hotspots:
- `apps/web/components/parent-dashboard.tsx`
- `apps/web/components/routines-manager.tsx`
- `apps/web/components/training-runner.tsx`
- `apps/web/components/admin-catalog-manager.tsx`

## Desired Frontend Direction

### Route Files
Route files should mainly compose features.

Example direction:
- route page imports a feature container
- feature container uses hooks and child components

Avoid putting significant logic directly in route files.

### Components
Prefer splitting into:
- container component
- presentational sections
- small leaf components

Presentational components should not own:
- API calls
- auth storage logic
- unrelated mutation orchestration
- new business rules

No new business logic should be added to React pages or presentational components.

Not every feature needs every layer.
For a small frontend feature, this is enough:

```text
feature/
  component.tsx
  api.ts
  utils.ts
```

Use more structure only when complexity justifies it.

### Hooks / Client Modules
Move toward dedicated hooks or client modules for:
- auth/session state
- parent dashboard data loading
- training runner state transitions
- routine editor data/mutation flow
- admin catalog management flow

Do not duplicate auth/session handling logic across components.

### View-Model / Derived State
Put formatting and derived UI logic into helpers:
- status labels
- progress tile derivation
- repetition display
- badge grouping/display metadata
- selection fallback logic

Do not keep complex view derivation inline in huge JSX components.

## Styling Rules
- keep CSS pragmatic
- prefer stable semantic class names
- avoid one-off inline styles for reusable behaviors
- if a screen has complex states, give those states named classes or subcomponents

Do not start a design-system rewrite yet.

## Auth / Session Rules
- keep auth storage and redirect logic centralized
- do not duplicate token/session handling in many components
- prefer shared helpers/hooks for auth-aware loading

Current central pieces:
- `apps/web/lib/api.ts`
- `apps/web/lib/auth-storage.ts`
- `apps/web/lib/use-auth-user.ts`

Keep moving in this direction.

## Domain-Specific Guidance

### Parent Dashboard
Target split:
- data/selection hook
- current status panel
- child selector
- recent tornák
- badge section
- quick actions

### Training Runner
Target split:
- standby state
- active session state
- completed state
- timer/rings
- image gallery
- next-task panel
- controls

### Routines Manager
Target split:
- routine list
- routine editor shell
- task editor
- period editor
- delete impact dialogs/panels

### Admin Catalog
Target split:
- task catalog section
- song catalog section
- equipment catalog section
- shared catalog form pieces where useful

## Testing Expectations
Frontend tests should focus on interaction-critical logic.

Priority candidates:
- parent dashboard selection and loading transitions
- training runner task advancement and cancellation
- destructive action confirmations
- auth/session redirect behavior

## Frontend Quality Gates
Use as relevant:
- `pnpm --filter @tsmt/web typecheck`
- `pnpm --filter @tsmt/web build`
- manual responsive sanity for screens touched
- tests for critical interaction logic when it changes

## Safe Frontend Increment Examples
Good:
- extract `useParentDashboardState`
- extract `TrainingImageGallery`
- extract `RoutineDeleteImpactPanel`
- extract `TrainingStandbyList`

Bad:
- “rewrite all components to hooks”
- “convert whole app to a design system”
- “replace all CSS”

## Final Rule
If a component is becoming a mini-application by itself, stop growing it and split by responsibility before adding more behavior.
