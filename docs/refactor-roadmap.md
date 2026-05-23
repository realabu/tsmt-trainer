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
  - still sizable, but the routines backend has reached a checkpoint: task/period/progress/search/delete-impact preview paths have safety coverage and `RoutineDeleteImpactService` now owns delete-impact preview orchestration
  - pause further routines refactoring by default unless product work or inspection identifies a concrete risk
- `apps/api/src/sessions/sessions.service.ts`
  - still a central lifecycle hotspot, but #84 extracted `SessionBadgeAwardService` as the first sessions workflow service boundary
  - pause further sessions service-boundary extraction by default unless inspection identifies a concrete production risk
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
- critical smoke coverage now exists, but it is intentionally thin:
  - DB-backed API smoke runs in CI with Postgres and covers auth, parent-owned children, parent-owned routines, minimal session lifecycle, and post-finish session listing
  - local-first browser smoke covers app-load/auth-panel, real UI login, parent dashboard, owned child/routine visibility, runner standby, and one-task runner completion
- browser smoke is not required in CI yet; CI promotion remains a separate inspection decision
- session lifecycle and badge orchestration now have stronger guardrails, but transaction/idempotency and raw response-shape risks remain inspection candidates
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

### Current checkpoint
- #84 added finish lifecycle service safety tests
- #84 added task timing lifecycle service safety tests
- #84 added badge duplicate-prevention and `PERIOD_TARGET_COMPLETED` badge safety coverage
- #84 extracted `SessionBadgeAwardService` as the first sessions workflow service boundary
- badge award orchestration, duplicate-prevention lookup/write behavior, weekly streak orchestration, and badge-only Prisma reads/writes moved to `SessionBadgeAwardService`

### What stays in `SessionsService`
- public controller-facing lifecycle methods:
  - `start(...)`
  - `getById(...)`
  - `listByRoutine(...)`
  - `completeTask(...)`
  - `finish(...)`
  - `cancel(...)`
- finish active-session lookup, completion update, and `getById(...)` response flow
- task timing lifecycle behavior in `completeTask(...)`
- session lifecycle semantics and transaction behavior

### Behavior-preserving refactor scope
- keep current session behavior unchanged
- preserve badge award outcomes
- preserve completion/cancel semantics

### Entry criteria
- auth/session platform behavior stabilized enough to trust session tests

### Exit criteria
- `SessionBadgeAwardService` owns badge orchestration behind the `SessionsService` facade
- badge rule evaluation and badge award orchestration are separable and tested at service/domain level
- session completion path remains functionally unchanged

### Risks
- transaction/data-integrity questions in `completeTask(...)` and `finish(...)`
- idempotency questions around repeated finish or timing calls
- raw response-shape coupling in `start(...)` and `getById(...)`
- uncovered badge trigger paths

### Mitigation
- pause further sessions extraction by default
- start future sessions work with inspection only
- add targeted tests before moving lifecycle or transaction-sensitive code
- manual verification of:
  - start session
  - complete task
  - finish session
  - cancel session

### Suggested tests in this phase
- future tests should be selected by inspection, not coverage momentum
- likely candidates:
  - `completeTask(...)` transaction/data-integrity behavior
  - `finish(...)` transaction/idempotency behavior
  - `start(...)` and `getById(...)` raw response shape
  - uncovered badge trigger paths

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
- checkpoint reached for task/period payload shaping, progress response assembly, task catalog search where-building, and delete-impact preview service extraction
- future routines work should be selected by inspection, not continued automatically
- possible future inspection candidates only: `listSongCatalog(...)`, `listByChild(...)`, `getById(...)`, or specific product-driven CRUD/change paths

### Behavior-preserving refactor scope
- preserve current routine/task/period behavior
- preserve current delete previews and semantics
- preserve current progress math

### Entry criteria
- a concrete product need or production risk justifies returning to routines

### Exit criteria
- no further routines extraction proceeds without scoped inspection
- controller/API/delete semantics remain stable
- the routines plan remains the authoritative domain-specific reference

### Risks
- regressions in progress numbers
- regressions in delete impact preview
- regressions in task/period editing flows

### Mitigation
- keep CRUD handler changes small
- avoid moving Prisma reads or delete semantics without explicit approval
- prefer safety tests before any future routines boundary extraction

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

## Admin Backend Checkpoint

Admin backend stabilization has reached a meaningful checkpoint:
- `AdminService` is now a thin authorization facade
- `AdminCatalogService` owns catalog admin logic
- `AdminUserService` owns user/family admin logic
- `AdminActivityService` owns routine/session admin activity logic
- `AdminActivityService` now has small include/where helpers for query readability
- basic `AdminActivityService` tests exist
- basic `AdminService` facade boundary tests exist

This does not mean the admin backend is “finished”, but it is now in a much safer state for future work than the original single-service hotspot.

## Routines Backend Checkpoint

Routines backend stabilization has reached a meaningful checkpoint:
- routine create/update, period CRUD, task CRUD, task catalog search, progress response assembly, and delete-impact preview paths now have focused safety coverage
- task, period, progress, search, and resolver decisions have small pure helpers where they provide clear value
- `RoutineDeleteImpactService` is the first extracted routines workflow service boundary
- `RoutinesService` remains the public facade for delete-impact preview methods
- actual delete methods and delete semantics remain in `RoutinesService`

Routines are paused by default. Future routines work should start with inspection and should be tied to product work or a concrete production-readiness risk.

## Sessions Backend Checkpoint

The controlled sessions lifecycle / badge orchestration experiment in #84 reached a meaningful checkpoint:
- finish lifecycle, task timing lifecycle, badge duplicate prevention, and `PERIOD_TARGET_COMPLETED` badge behavior now have focused service safety coverage
- `SessionBadgeAwardService` is the first extracted sessions workflow service boundary
- badge award orchestration, duplicate-prevention lookup/write behavior, weekly streak orchestration, and badge-only Prisma reads/writes moved to `SessionBadgeAwardService`
- `SessionsService` remains the public controller-facing lifecycle facade
- `start(...)`, `getById(...)`, `listByRoutine(...)`, `completeTask(...)`, `finish(...)`, and `cancel(...)` stay on `SessionsService`
- finish active-session lookup, completion update, and `getById(...)` response flow remain in `SessionsService`
- task timing lifecycle behavior remains in `SessionsService`
- no controller, DTO, API, schema, frontend, session lifecycle, badge, or transaction behavior changed

Sessions backend refactoring is paused by default after #84. Future sessions work should start with inspection only and should not continue service-boundary extraction automatically.

## Next Recommended Work Selection

Recommended posture:
- do not continue routines by momentum
- do not continue sessions service-boundary extraction by momentum
- feature planning may begin, but only after scoped inspection of the areas the feature will touch
- do not expand API or browser smoke by momentum; add more smoke only when it protects a named production or release risk
- select any next foundation work by production-readiness inspection
- likely future candidates: frontend destructive flows, training runner/session UI behavior, browser-smoke CI promotion, Docker/local dev setup for deployability/onboarding, or scoped backend inspection only when product work touches that domain

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
- keep routines tests current when routines behavior changes
- add further routines tests only for product-driven changes or explicitly inspected risks

### Phase 4
- parent dashboard selection tests
- training runner transition tests
- destructive action confirmation tests

### Phase 5
- small backend integration suite for:
  - session finish -> progress update -> badge award
  - destructive delete preview

## Current And Future CI / Quality Gates

### Already in CI
- `pnpm typecheck`
- `pnpm check:generated`
- unit tests through `pnpm test`
- `pnpm db:generate`
- `pnpm db:migrate:deploy` against CI Postgres
- DB-backed API smoke through `pnpm --filter @tsmt/api test:smoke`
- app build checks:
  - `pnpm --filter @tsmt/api build`
  - `pnpm --filter @tsmt/web build`

### Deferred / Inspect Before Adding
- browser smoke CI promotion
- Docker/local dev orchestration for deployability or onboarding
- additional contract/API-shape gates for raw response shapes
- broader e2e or release-gate automation

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
1. Start feature planning with a scoped inspection of the exact frontend/backend areas the feature will touch.
2. Audit frontend destructive confirmation flows before changing `routines-manager` or dashboard behavior.
3. Inspect frontend training runner/session UI mutation flow before extracting more UI structure.
4. Inspect browser-smoke CI promotion only if the team wants browser smoke to become a required gate.
5. Keep docs and AI guidance current after each domain shift so stale plans do not drive future Codex work.

## Future Sessions Inspection Candidates

Do not start another sessions extraction automatically. If product work touches sessions, inspect the exact path first:
- `completeTask(...)` transaction/data-integrity behavior
- `finish(...)` transaction/idempotency behavior
- `start(...)` and `getById(...)` raw response shape
- uncovered badge trigger paths
- additional frontend session runner coverage only if a future feature needs more than the current local-first one-task runner smoke
