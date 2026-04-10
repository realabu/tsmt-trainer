# Refactor Roadmap

## Purpose
This roadmap defines a safe, repository-specific refactor sequence for `tsmt-trainer` based on:
- `ENGINEERING_GUIDE.md`
- `AGENTS.md`
- `apps/api/AGENTS.md`
- `apps/web/AGENTS.md`

It is intentionally:
- phased
- low-risk
- behavior-preserving first
- compatible with ongoing product delivery
- structured for AI-assisted execution in small, reviewable tasks

This roadmap does **not** authorize broad rewrites. It exists to guide future work.

## Guiding Rules
- Behavior-preserving refactors come first.
- Architecture changes and behavior changes must not be mixed silently.
- Do not refactor multiple domains at once unless the task is truly blocked by cross-domain coupling.
- Prefer extracting one responsibility at a time from hotspot files.
- Prefer tests around critical rules before or during major extractions.

## Current Pain Points

### Backend hotspots
- `apps/api/src/routines/routines.service.ts`
  - too many responsibilities: routine CRUD, task CRUD, period CRUD, progress-related behavior, catalog integration
- `apps/api/src/sessions/sessions.service.ts`
  - session lifecycle + timing + completion + badge/progress behavior are too coupled
- `apps/api/src/admin/admin.service.ts`
  - admin orchestration and domain logic are too mixed
- `apps/api/src/auth/auth.service.ts`
  - still small enough to work, but auth/profile/token concerns should be treated as a stability-first domain

### Frontend hotspots
- `apps/web/components/parent-dashboard.tsx`
  - selection state, data fetching, derived state, and rendering are mixed
- `apps/web/components/training-runner.tsx`
  - standby, active session, completion, timers, media gallery, controls, and preview logic are mixed
- `apps/web/components/routines-manager.tsx`
  - listing, editing, destructive flows, task/period editing, and network orchestration are mixed
- `apps/web/components/admin-catalog-manager.tsx`
  - multiple catalog domains are managed in a single component

### Cross-cutting pain points
- very limited test coverage for critical business logic
- no durable CI quality ladder yet
- delete impact, badge awarding, and progress calculations are important but not yet isolated enough
- auth/session logic is partly centralized, but still needs clearer stability rules before deeper refactors

## Target End-State

### Backend end-state
- thin controllers
- explicit application services or focused use-case modules
- pure domain calculation modules for:
  - progress
  - badge awarding
  - deletion impact
  - catalog matching/import derivation
- Prisma access isolated from calculation-heavy logic where practical
- auth and authorization explicit and centralized

### Frontend end-state
- route files mainly compose screens
- data fetching and mutation orchestration in dedicated hooks/client modules
- large screen components decomposed into smaller sections
- display calculations moved into helpers/view-model modules
- auth/session behavior centralized in shared client modules

### Operational end-state
- critical rule modules covered by tests
- schema changes always reviewed with migration sanity
- CI gradually enforces typecheck, build, and targeted tests

## Refactor Philosophy

### Behavior-preserving refactors
These are allowed first and preferred:
- extraction of pure functions
- splitting large files by responsibility
- moving side-effect-free logic into dedicated modules
- introducing hooks/helpers without changing UX behavior
- replacing inline logic with named modules

### Later behavior-changing work
This comes only after the stabilizing phases:
- auth model behavior changes
- session/badge rule changes
- workflow redesigns
- major dashboard UX behavior changes
- new entitlement/security behavior

## Recommended AI Task Granularity
Preferred unit of work:
- one domain
- one file hotspot
- one extraction
- one migration at a time
- one testable rule at a time

Ideal AI task size:
- touches 2-6 files
- one primary behavior or structural concern
- can be verified with a small set of checks

Good task examples:
- extract weekly progress calculator from `routines.service.ts`
- extract badge context key builder from `sessions.service.ts`
- extract parent dashboard selection hook from `parent-dashboard.tsx`
- extract training image gallery from `training-runner.tsx`

Bad task examples:
- refactor routines architecture
- clean up API
- rewrite dashboard
- convert project to clean architecture

## Phase 0: Baseline and Guardrails

### Goal
Establish the minimum guardrails needed before deeper refactors.

### Entry criteria
- `ENGINEERING_GUIDE.md` and `AGENTS.md` files are accepted as current guidance

### Work
- add this roadmap
- ensure `.gitignore` continues to exclude build artifacts
- ensure dev/build/typecheck commands are stable
- ensure root docs point contributors to the guide and roadmap

### Exit criteria
- engineering guide exists
- agents guidance exists
- roadmap exists
- no broad refactor has started yet

### Risks
- teams may skip the guidance and jump into large rewrites

### Mitigation
- require roadmap-guided sequencing for major refactor tasks

## Phase 1: Auth / Session Architecture Stabilization

### Priority
1

### Goal
Stabilize auth/session handling as a platform concern before touching deeper domain decomposition.

### Primary files
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.guard.ts`
- `apps/web/lib/api.ts`
- `apps/web/lib/auth-storage.ts`
- `apps/web/lib/use-auth-user.ts`
- `apps/web/components/auth-panel.tsx`
- `apps/web/components/profile-settings.tsx`

### Behavior-preserving refactor scope
- clarify auth/session responsibilities without changing auth behavior
- keep storage, logout, expiry, and redirect rules centralized
- reduce auth duplication in UI components
- document explicit frontend auth flow boundaries

### Suggested extractions
- client auth session module boundaries
- API auth error handling helpers
- profile update client helper

### Entry criteria
- current login/logout/profile flows work
- mobile access path works

### Exit criteria
- no duplicated auth/session handling across components
- auth redirect/session expiry behavior is centralized
- auth-related UI components depend on shared helpers, not ad hoc local logic

### Risks
- accidental login/logout behavior changes
- redirect regressions

### Mitigation
- behavior-preserving only
- manual smoke tests:
  - login
  - logout
  - expired token redirect
  - profile update

### Suggested tests in this phase
- auth storage helper tests
- session expiry redirect behavior tests

## Phase 2: Sessions Domain Decomposition

### Priority
2

### Goal
Split runtime session execution from badge/progress calculation concerns.

### Primary files
- `apps/api/src/sessions/sessions.service.ts`
- `apps/api/src/sessions/sessions.controller.ts`
- `apps/api/src/sessions/dto.ts`

### Likely extraction targets
- session completion orchestrator
- badge context key builder
- session award evaluation helpers
- timing derivation helpers
- streak / weekly badge calculations

### Behavior-preserving refactor scope
- keep current session behavior unchanged
- preserve badge award outcomes
- preserve completion/cancel semantics

### Entry criteria
- auth/session platform behavior stabilized enough to trust session tests

### Exit criteria
- `sessions.service.ts` no longer contains all calculation-heavy logic inline
- badge rule evaluation is separable and unit-testable
- session completion path remains functionally unchanged

### Risks
- badge regressions
- session completion regressions
- hidden coupling to routine/progress behavior

### Mitigation
- extract one calculator at a time
- snapshot or targeted tests for badge awarding behavior
- manual verification of:
  - start session
  - complete task
  - finish session
  - cancel session

### Suggested tests in this phase
- badge context key tests
- weekly goal award tests
- streak calculation tests
- routine record award tests

## Phase 3: Routines Domain Decomposition

### Priority
3

### Goal
Split routines domain into coherent sub-responsibilities without changing behavior.

### Primary files
- `apps/api/src/routines/routines.service.ts`
- `apps/api/src/routines/routines.controller.ts`
- `apps/api/src/routines/dto.ts`

### Likely extraction targets
- routine CRUD use cases
- task CRUD use cases
- period CRUD use cases
- progress calculation
- delete impact calculation
- task catalog search / import matching

### Behavior-preserving refactor scope
- preserve current routine/task/period behavior
- preserve current delete previews and semantics
- preserve current progress math

### Entry criteria
- sessions badge/progress logic extracted enough to reduce cross-domain coupling

### Exit criteria
- `routines.service.ts` is reduced materially in scope
- progress calculation is testable outside service orchestration
- task and period CRUD are clearer, with less incidental logic sharing

### Risks
- regressions in progress numbers
- regressions in delete impact preview
- regressions in task/period editing flows

### Mitigation
- separate extraction of progress first
- separate extraction of delete impact second
- keep CRUD handler changes small

### Suggested tests in this phase
- period progress calculation tests
- delete impact tests for child/routine/period/task
- repetition label derivation tests if touched

## Phase 4: Frontend Dashboard Decomposition

### Priority
4

### Goal
Reduce risk and cognitive load in major screen components by separating data, derived state, and rendering.

### Primary files
- `apps/web/components/parent-dashboard.tsx`
- `apps/web/components/training-runner.tsx`
- `apps/web/components/routines-manager.tsx`
- `apps/web/components/admin-catalog-manager.tsx`

### Behavior-preserving refactor scope
- preserve current UI behavior and user flows
- only split structure and state ownership
- no silent UX redesigns in this phase

### Suggested decomposition order
1. `parent-dashboard.tsx`
   - extract data/selection hook
   - extract current status panel
   - extract child selector
2. `training-runner.tsx`
   - extract standby state
   - extract image gallery
   - extract active session controls
   - extract completed state
3. `routines-manager.tsx`
   - extract list shell
   - extract editor shell
   - extract delete impact panels
4. `admin-catalog-manager.tsx`
   - split task/song/equipment sections

### Entry criteria
- backend hotspots reduced enough that frontend refactors are not blocked by API instability

### Exit criteria
- major dashboard/manager components no longer own all responsibilities
- fetching and derived state are moved into hooks/helpers where appropriate
- presentational subcomponents are easier for AI and humans to modify safely

### Risks
- state coordination bugs
- selection/loading regressions
- accidental mobile layout behavior changes

### Mitigation
- extract one subcomponent/hook at a time
- preserve prop contracts while splitting
- manual responsive checks after each change

### Suggested tests in this phase
- parent dashboard selection flow
- training runner next-task and cancel flow
- destructive confirmation flows

## Phase 5: Test Harness for Critical Business Logic

### Priority
5

### Goal
Introduce durable test coverage around the most important rule-heavy modules.

### Scope
This phase should follow the extractions in phases 2-4 so the logic is easier to test.

### Suggested first coverage targets
- progress calculators
- badge awarding rules
- delete impact builders
- auth/session helpers
- selection fallback logic in dashboard-related hooks/helpers

### Entry criteria
- enough pure/focused modules exist to test without brittle setup

### Exit criteria
- critical rule modules have stable unit coverage
- at least a small integration harness exists for key backend flows

### Risks
- trying to test giant mixed-responsibility files directly

### Mitigation
- extract before testing where needed
- favor unit tests for pure modules first

## Phase 6: Production-Readiness Hardening

### Priority
6

### Goal
Add operational hardening after architectural risk is reduced.

### Scope
- CI quality gates
- build reliability
- environment validation
- migration sanity checks
- production-safe auth/session hardening
- security review of upload/import paths

### Entry criteria
- core hotspots partially decomposed
- baseline tests exist for critical rules

### Exit criteria
- repository has a practical CI ladder
- production-impacting changes are gated
- schema and auth risks are better controlled

### Risks
- adding hardening too early and slowing product iteration

### Mitigation
- add quality gates gradually
- only enforce checks that the repository can pass consistently

## Files / Modules to Refactor First

### First-wave backend
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/sessions/sessions.service.ts`
- `apps/api/src/routines/routines.service.ts`

### First-wave frontend
- `apps/web/components/parent-dashboard.tsx`
- `apps/web/components/training-runner.tsx`
- `apps/web/components/routines-manager.tsx`

### First-wave shared helpers
- `apps/web/lib/api.ts`
- `apps/web/lib/auth-storage.ts`
- `apps/web/lib/use-auth-user.ts`

## Files / Modules to Defer
Leave these mostly untouched until earlier phases reduce risk:
- broad redesign of `apps/web/app/globals.css`
- broad reorganization of `packages/types`
- broad repository pattern rollout across all backend domains
- full admin module rewrite
- full trainer module rewrite
- sweeping route/file renames
- any UI redesign disguised as architectural cleanup

## Suggested Test Coverage Additions by Phase

### Phase 1
- auth storage tests
- session expiry redirect tests

### Phase 2
- badge context key tests
- weekly goal tests
- streak tests
- routine record award tests

### Phase 3
- progress calculation tests
- delete impact tests
- task/period update rule tests

### Phase 4
- parent dashboard selection tests
- training runner transition tests
- destructive action confirmation tests

### Phase 5
- small backend integration suite for:
  - session finish -> progress update -> badge award
  - destructive delete preview

## Suggested CI / Quality Gates to Introduce Gradually

### Stage 1
- `pnpm typecheck`

### Stage 2
- app build checks:
  - `pnpm --filter @tsmt/api build`
  - `pnpm --filter @tsmt/web build`

### Stage 3
- targeted test jobs for extracted critical rule modules

### Stage 4
- schema change gate:
  - prisma generate
  - migration sanity

### Stage 5
- required checks for critical domains:
  - auth
  - sessions
  - routines
  - badges/progress

## Risks Across the Roadmap
- hidden behavior drift during “structural” refactors
- hotspot files attracting more logic before extraction happens
- AI agents making broad incidental edits
- brittle tests added too early around mixed-responsibility files
- schema changes landing without delete-impact review

## Mitigations Across the Roadmap
- behavior-preserving phases first
- small task granularity
- explicit plan before each task
- explicit statement of intended behavior change, if any
- tests added around extracted logic, not giant mixed files
- docs updated when architectural expectations change

## Top 5 Immediate Next Tasks
1. Extract frontend auth/session responsibilities into a clearly documented client boundary without changing behavior.
2. Extract badge context key generation and related pure helpers from `apps/api/src/sessions/sessions.service.ts`.
3. Extract period/weekly progress calculation from `apps/api/src/routines/routines.service.ts`.
4. Extract parent dashboard selection and loading logic into a dedicated hook from `apps/web/components/parent-dashboard.tsx`.
5. Add initial unit tests for one extracted critical rule module.

## Recommended First Refactor Task
Extract auth/session client behavior boundaries from:
- `apps/web/lib/api.ts`
- `apps/web/lib/auth-storage.ts`
- `apps/web/lib/use-auth-user.ts`
- `apps/web/components/auth-panel.tsx`

Reason:
- small enough to review
- low-risk if behavior-preserving
- reduces cross-cutting instability before touching deeper domains

## Recommended First Test Task
Add unit tests for a first extracted pure backend rule module:
- badge context key generation

Reason:
- very small surface area
- deterministic
- high leverage for later session/badge refactors
