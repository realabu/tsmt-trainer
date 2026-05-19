# Architecture / Refactor Audit Draft

## Purpose
This is a factual repository audit draft for architect review.

It is based on:
- current repository code
- existing engineering docs
- currently checked-in tests and CI config

It is **not** a final strategy document.

## Repo Phase Assessment
Current repo state appears to be **between first-wave refactor and cleanup/stabilization**.

Evidence:
- large hotspot files still exist in `sessions`, `routines`, and several frontend components
- multiple behavior-preserving helper extractions already exist in `apps/api/src/sessions/domain`, `apps/api/src/routines/domain`, and `apps/web/lib`
- admin backend has already been split into focused services
- CI, test discovery, auth storage, and generated artifact hygiene have been tightened

Interpretation:
- first-wave structural cleanup is materially underway
- the repository is not yet in “finished architecture” shape
- some domains are stabilizing, while others are still hotspot-heavy

## Backend Domains / Modules

### Auth
- Current state: `Acceptable`
- Evidence from repo:
  - dedicated module: `apps/api/src/auth`
  - centralized JWT issuing, refresh token revocation, register/login/profile flows in [apps/api/src/auth/auth.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/auth/auth.service.ts)
  - frontend auth storage and API retry helpers exist in `apps/web/lib/auth-storage.ts` and `apps/web/lib/api.ts`
  - refresh flow is present and tested on the frontend
- Main risks:
  - `auth.service.ts` is still a single ~225-line service mixing register/login/refresh/profile logic
  - subscriptions are touched here via default free subscription creation, but subscription logic is not otherwise isolated
- Recommended next action:
  - keep auth behavior stable
  - only extract small token/profile helpers if needed
- Suggested PR granularity:
  - one auth helper extraction or one auth test-focused PR at a time

### Sessions
- Current state: `Acceptable`
- Evidence from repo:
  - hotspot service still exists: [apps/api/src/sessions/sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts), but it no longer owns badge award orchestration inline
  - `SessionBadgeAwardService` is the first extracted sessions workflow service boundary
  - badge award orchestration, duplicate-prevention lookup/write behavior, weekly streak orchestration, and badge-only Prisma reads/writes moved to `SessionBadgeAwardService`
  - `SessionsService` remains the public lifecycle facade for `start(...)`, `getById(...)`, `listByRoutine(...)`, `completeTask(...)`, `finish(...)`, and `cancel(...)`
  - finish active-session lookup, completion update, and `getById(...)` response flow remain in `SessionsService`
  - task timing lifecycle behavior remains in `SessionsService`
  - multiple extracted pure helpers exist under `apps/api/src/sessions/domain`
  - service-level tests cover finish lifecycle, task timing lifecycle, badge duplicate prevention, and `PERIOD_TARGET_COMPLETED` badge behavior
  - pure helper tests cover streaks, weekly targets, trigger decisions, identifier building, and threshold parsing
- Main risks:
  - `SessionsService` still owns lifecycle orchestration, task timing writes, raw response flow, and transaction-sensitive sequencing
  - future changes around `completeTask(...)`, `finish(...)`, `start(...)`, or `getById(...)` can still affect production behavior
  - some badge trigger paths remain less directly covered than the paths stabilized in #84
- Recommended next action:
  - pause sessions backend refactoring by default after #84
  - inspect before any further sessions service-boundary extraction
  - likely future sessions inspection candidates: `completeTask(...)` transaction/data integrity, `finish(...)` transaction/idempotency, `start(...)`/`getById(...)` raw response shape, uncovered badge trigger paths, or frontend session runner smoke/e2e coverage
- Suggested PR granularity:
  - one inspection, one safety test, or one explicitly approved boundary extraction per PR

### Routines
- Current state: `Acceptable with caution`
- Evidence from repo:
  - hotspot service still exists: [apps/api/src/routines/routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts) (~564 lines)
  - `RoutineDeleteImpactService` owns delete-impact preview lookup/count orchestration
  - `RoutinesService` remains the public facade for delete-impact preview methods and still owns actual delete methods
  - several pure helpers have already been extracted into `apps/api/src/routines/domain`
  - tests exist for extracted progress, delete impact, repetition label, media kind, task song/display/input, period input logic, task catalog search, and service-level delete-impact previews
  - [docs/routines-refactor-plan.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/docs/routines-refactor-plan.md) is current through the controlled routines experiment and pauses routines refactoring by default
- Main risks:
  - routine CRUD, task CRUD, period CRUD, progress, catalog search, and catalog listing still converge into one large service
  - this domain is central to sessions, parent workflows, trainer flows, and future monetization boundaries
- Recommended next action:
  - do not continue routines refactoring by momentum
  - inspect routines again only if product work directly touches the domain or a specific production risk appears
- Suggested PR granularity:
  - one safety test, one small helper, or one explicitly approved service-boundary extraction per PR

### Admin
- Current state: `Good`
- Evidence from repo:
  - `AdminService` is now a thin authorization facade: [apps/api/src/admin/admin.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin.service.ts)
  - catalog logic is separated into [apps/api/src/admin/admin-catalog.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin-catalog.service.ts)
  - user/family logic is separated into [apps/api/src/admin/admin-user.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin-user.service.ts)
  - routine/session activity logic is separated into [apps/api/src/admin/admin-activity.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin-activity.service.ts)
  - small pure catalog shaping helpers exist under `apps/api/src/admin/domain`
  - basic service/facade tests exist for `AdminActivityService` and `AdminService`
- Main risks:
  - catalog and activity services still contain sizable inline Prisma include/select/query structures
  - admin frontend remains large and multi-responsibility
- Recommended next action:
  - keep admin backend stable unless a specific admin use case requires further extraction
  - prefer frontend admin UI cleanup before more backend splitting here
- Suggested PR granularity:
  - one admin query helper extraction or one admin UI split PR at a time

### Children / Family
- Current state: `Acceptable`
- Evidence from repo:
  - dedicated service exists: [apps/api/src/children/children.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/children/children.service.ts)
  - core CRUD is compact
  - delete impact and badge listing are also handled here
- Main risks:
  - `ChildrenService` mixes CRUD with delete impact and badge aggregation concerns
  - “family” is not a separate module; family/ownership logic is spread across `children`, `admin`, and `trainers`
- Recommended next action:
  - leave this mostly stable for now unless delete impact or badge listing needs focused extraction
- Suggested PR granularity:
  - one child delete-impact or badge-list extraction PR if needed

### Trainer Assignments
- Current state: `Acceptable`
- Evidence from repo:
  - dedicated module exists: `apps/api/src/trainers`
  - service handles trainer assignment creation and trainer/parent listing views
  - ownership and role checks are inline in [apps/api/src/trainers/trainers.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/trainers/trainers.service.ts)
- Main risks:
  - assignment creation, ownership checks, and detailed overview queries are mixed in one service
  - role logic is explicit but not yet abstracted into focused policies
- Recommended next action:
  - keep stable unless trainer workflows become a near-term product focus
- Suggested PR granularity:
  - one trainer assignment policy/query extraction per PR

### Subscriptions / Billing
- Current state: `Unknown`
- Evidence from repo:
  - Prisma schema includes `Subscription` and `SubscriptionEvent`
  - shared types include `SubscriptionPlan` and `SubscriptionStatus`
  - auth registration seeds a default free subscription
  - no dedicated backend module or frontend area for subscriptions/billing is present
- Main risks:
  - schema-level concept exists without an application/service boundary in the codebase
  - future monetization work could easily leak into auth, routines, or admin without a clear home
- Recommended next action:
  - do not force a subscription module yet
  - when product work requires it, introduce it as a dedicated domain rather than scattering entitlement checks
- Suggested PR granularity:
  - one subscription read model or one entitlement boundary PR when the feature becomes active

## Frontend Areas

### Auth Flow
- Current state: `Acceptable`
- Evidence from repo:
  - auth storage is centralized in [apps/web/lib/auth-storage.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/lib/auth-storage.ts)
  - API client handles refresh retry in [apps/web/lib/api.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/lib/api.ts)
  - `useAuthUser` centralizes current-user sync
  - `AuthPanel` uses shared storage helpers rather than writing storage directly
  - tests exist for auth storage and API client behavior
- Main risks:
  - `AuthPanel` still mixes UI and auth mutation flow inline
  - redirect behavior is browser-global and imperative
- Recommended next action:
  - keep stable unless profile/auth UX work is planned
- Suggested PR granularity:
  - one auth UI mutation/helper extraction per PR

### Training Runner
- Current state: `Acceptable`
- Evidence from repo:
  - component is still large: [apps/web/components/training-runner.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/training-runner.tsx) (~719 lines)
  - helper/view-model modules exist:
    - `training-runner-helpers.ts`
    - `training-runner-task-images.ts`
    - `training-runner-view-model.ts`
  - focused tests exist for those helper layers
- Main risks:
  - session lifecycle, timers, API mutations, and render flow still live in one component
  - further feature work could easily re-grow inline conditional logic
- Recommended next action:
  - next extraction should target mutation/session control flow or a small hook boundary, not visual redesign
- Suggested PR granularity:
  - one view-model or one session-control extraction PR

### Parent Dashboard
- Current state: `Acceptable`
- Evidence from repo:
  - component is still moderate-sized: [apps/web/components/parent-dashboard.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/parent-dashboard.tsx) (~466 lines)
  - helper/view-model modules exist:
    - `parent-dashboard-helpers.ts`
    - `parent-dashboard-view-model.ts`
  - tests exist for both helper layers
- Main risks:
  - fetch/effect orchestration is still inside the component
  - selection state, dependent loading, and badge/progress fetches still converge in one place
- Recommended next action:
  - if this screen changes again, prefer extracting load/selection orchestration before changing UI behavior
- Suggested PR granularity:
  - one dashboard loading/selection extraction PR

### Admin UI
- Current state: `Risky`
- Evidence from repo:
  - admin UI is present:
    - `admin-dashboard.tsx`
    - `admin-catalog-manager.tsx`
    - `admin-routine-detail.tsx`
    - `admin-session-detail.tsx`
  - `admin-catalog-manager.tsx` remains large (~744 lines) and handles multiple catalog domains in one component
  - `admin-dashboard.tsx` combines scoped admin data loading, user editing, and navigation/detail orchestration
- Main risks:
  - multi-domain admin UI flows are still coupled
  - likely friction point for future feature work and regression risk
- Recommended next action:
  - split admin catalog UI by catalog domain or by shell/form sections before adding more behavior
- Suggested PR granularity:
  - one admin catalog sub-section extraction or one admin dashboard load-state extraction PR

### API Client / Data Access Patterns
- Current state: `Acceptable`
- Evidence from repo:
  - `apiFetch` is a single shared client entrypoint
  - auth storage and refresh behavior are shared
  - most components still call `apiFetch` directly inside component effects and event handlers
- Main risks:
  - component-level data fetching remains ad hoc
  - no dedicated query/mutation layer beyond helpers
- Recommended next action:
  - introduce small feature-specific client helpers or hooks only where screens are changing
- Suggested PR granularity:
  - one feature client helper or one screen-specific fetching hook per PR

## Cross-Cutting Architecture

### Domain Boundaries
- Current state: `Acceptable`
- Evidence from repo:
  - backend modules are separated by domain folder (`auth`, `children`, `routines`, `sessions`, `trainers`, `admin`)
  - shared guidance exists in [ENGINEERING_GUIDE.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/ENGINEERING_GUIDE.md) and [docs/refactor-roadmap.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/docs/refactor-roadmap.md)
  - admin split now shows clearer boundary intent
- Main risks:
  - routines and sessions still carry cross-cutting business weight inside hotspot services
  - subscriptions exist in schema but not as an application boundary
- Recommended next action:
  - select the next domain by production-readiness inspection, not by continuing the last refactor thread
  - sessions and routines backend refactoring are both paused by default after their checkpoints
  - frontend destructive flows and quality gates are strong next candidates; return to backend sessions only with a scoped inspection tied to product work or a concrete risk
- Suggested PR granularity:
  - one domain boundary extraction at a time

### Service Responsibilities
- Current state: `Acceptable`
- Evidence from repo:
  - `AdminService` has been reduced to a facade
  - `SessionsService` remains a lifecycle hotspot, but badge award orchestration now lives in `SessionBadgeAwardService`
  - `RoutinesService` remains sizable, but delete-impact preview orchestration now lives in `RoutineDeleteImpactService`
  - `AuthService`, `ChildrenService`, and `TrainersService` are more cohesive but still mix orchestration with some business rules
- Main risks:
  - hotspot services still attract new behavior unless guarded
- Recommended next action:
  - bias future work toward helper/use-case extraction instead of adding new inline logic
- Suggested PR granularity:
  - one service responsibility slice per PR

### Prisma / Query Placement
- Current state: `Acceptable`
- Evidence from repo:
  - Prisma queries remain inside services, not mixed into controllers
  - pure helpers generally avoid Prisma access
  - new admin service splits preserved existing Prisma orchestration without repository churn
- Main risks:
  - query shape and business decisions are still intertwined in large services/components
  - repeated include/select/where structures can grow noisy
- Recommended next action:
  - continue local query readability cleanups only where a hotspot is actively changing
- Suggested PR granularity:
  - one query helper/readability PR at a time

### Pure Helper / Domain Extraction
- Current state: `Good`
- Evidence from repo:
  - strong extraction pattern in:
    - `apps/api/src/sessions/domain`
    - `apps/api/src/routines/domain`
    - `apps/api/src/admin/domain`
    - `apps/web/lib`
  - corresponding focused tests exist for most extracted helpers
- Main risks:
  - helpers can still remain underused if new logic is added directly to hotspot files
- Recommended next action:
  - preserve the current extraction-and-test pattern as the default change shape
- Suggested PR granularity:
  - one helper extraction plus one targeted test PR

### Test Coverage / Test Quality
- Current state: `Acceptable`
- Evidence from repo:
  - backend unit coverage is strongest around extracted sessions/routines/admin helpers
  - service-level tests now exist for sessions lifecycle/timing/badge awarding and admin facades/activity
  - frontend coverage is helper-heavy rather than component-integration-heavy
  - root `pnpm test` runs both API and web unit suites
- Main risks:
  - hotspot UI components still rely more on helper tests than behavior/integration tests
  - some domain areas (children, trainers, auth service internals) have lighter direct coverage
- Recommended next action:
  - add tests where new boundaries are introduced, especially sessions lifecycle, destructive flows, and ownership-sensitive paths
- Suggested PR granularity:
  - one service/helper test PR or one focused integration-like behavior PR

### CI / Build Hygiene
- Current state: `Good`
- Evidence from repo:
  - CI workflow exists at `.github/workflows/ci.yml`
  - CI runs:
    - install with frozen lockfile
    - `pnpm check:generated`
    - `pnpm db:generate`
    - `pnpm typecheck`
    - `pnpm test`
    - API build
    - web build
  - dummy `DATABASE_URL` is set for CI quality gate usage
- Main risks:
  - no database-backed integration job exists yet
  - current quality gate is strong for unit/build hygiene, weaker for end-to-end behavior
- Recommended next action:
  - keep CI stable; only add heavier checks when they can pass reliably
- Suggested PR granularity:
  - one CI check addition per PR

### Generated / Build Artifact Hygiene
- Current state: `Good`
- Evidence from repo:
  - `pnpm check:generated` guards against tracked generated output in CI
  - `.gitignore` excludes:
    - `.next`
    - `dist`
    - `.turbo`
    - `apps/api/.test-dist`
    - `apps/web/.test-dist`
    - `packages/db/generated`
  - previous test-discovery/build-output issues appear to have been cleaned up
- Main risks:
  - helper/test compile outputs can still regress if the guard is removed or narrowed carelessly
- Recommended next action:
  - keep generated-output hygiene explicit in docs and scripts
- Suggested PR granularity:
  - one build/test hygiene fix PR if regressions appear

## Candidate Next PRs
These are candidate next PRs, not final strategy decisions.

1. Plan a minimal smoke/e2e quality gate for auth -> routine -> session runner happy path.
2. Audit frontend destructive confirmation flows before changing `routines-manager` or dashboard behavior.
3. Inspect `TrainingRunner` session lifecycle mutation flow before extracting a hook or helper.
4. If product work touches sessions, inspect `completeTask(...)`, `finish(...)`, `start(...)`, `getById(...)`, or uncovered badge trigger paths before code.
5. Keep sessions and routines backend refactoring paused by default unless inspection identifies a concrete production risk.
6. Split `apps/web/components/admin-catalog-manager.tsx` only if admin catalog product work resumes.
7. Add focused tests or small policy helpers around trainer assignment ownership/role checks if trainer workflows resume.
8. Inspect `ChildrenService` delete-impact and badge aggregation only if child deletion/badge work resumes.
9. Keep docs freshness checks as a recurring AI-maintainability task after domain shifts.
10. Return to routines only with a scoped inspection tied to product work or a concrete production risk.

## Uncertain / Not Fully Inspected
- No dedicated subscription/billing application module was found, but schema/types support exists.
- No end-to-end browser automation or API integration harness was inspected; this draft only reflects repository code and checked-in tests.
- Trainer module was inspected at service level, but not exhaustively audited line-by-line beyond visible ownership/query patterns.
