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
  - hotspot service still exists: [apps/api/src/sessions/sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts) (~685 lines)
  - multiple extracted pure helpers exist under `apps/api/src/sessions/domain`
  - service-level badge award tests exist: `apps/api/test/sessions/sessions-badge-awards.test.ts`
  - pure helper tests cover streaks, weekly targets, trigger decisions, identifier building, and threshold parsing
- Main risks:
  - main service still owns session lifecycle orchestration plus a lot of badge/progress coordination
  - behavior is better isolated than before, but still concentrated in one service
- Recommended next action:
  - continue behavior-preserving extractions around session completion orchestration and badge/progress coordination boundaries
- Suggested PR granularity:
  - one calculator/helper or one small orchestration boundary extraction per PR

### Routines
- Current state: `Risky`
- Evidence from repo:
  - hotspot service still exists: [apps/api/src/routines/routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts) (~874 lines)
  - several pure helpers have already been extracted into `apps/api/src/routines/domain`
  - tests exist for extracted progress, delete impact, repetition label, media kind, task song/display/input, and period input logic
- Main risks:
  - routine CRUD, task CRUD, period CRUD, delete impact, progress, and catalog-related logic still converge into one large service
  - this domain is central to sessions, parent workflows, trainer flows, and future monetization boundaries
- Recommended next action:
  - focus next on routine creation/update domain shaping and orchestration, not broad routines rewrite
- Suggested PR granularity:
  - one create/update helper or one CRUD branch extraction per PR

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
  - continue extracting by real responsibility, especially in routines and sessions
- Suggested PR granularity:
  - one domain boundary extraction at a time

### Service Responsibilities
- Current state: `Acceptable`
- Evidence from repo:
  - `AdminService` has been reduced to a facade
  - `SessionsService` and `RoutinesService` remain large hotspots
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
  - service-level tests now exist for sessions badge awarding and admin facades/activity
  - frontend coverage is helper-heavy rather than component-integration-heavy
  - root `pnpm test` runs both API and web unit suites
- Main risks:
  - hotspot UI components still rely more on helper tests than behavior/integration tests
  - some domain areas (children, trainers, auth service internals) have lighter direct coverage
- Recommended next action:
  - add tests where new boundaries are introduced, especially service facades and create/update routines flows
- Suggested PR granularity:
  - one service/helper test PR or one focused integration-like behavior PR

### CI / Build Hygiene
- Current state: `Good`
- Evidence from repo:
  - CI workflow exists at `.github/workflows/ci.yml`
  - CI runs:
    - install with frozen lockfile
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
  - `.gitignore` excludes:
    - `.next`
    - `dist`
    - `.turbo`
    - `apps/api/.test-dist`
    - `apps/web/.test-dist`
    - `packages/db/generated`
  - previous test-discovery/build-output issues appear to have been cleaned up
- Main risks:
  - helper/test compile outputs can regress into version control if scripts or CI discovery change carelessly
- Recommended next action:
  - keep generated-output hygiene explicit in docs and scripts
- Suggested PR granularity:
  - one build/test hygiene fix PR if regressions appear

## Candidate Next PRs
These are candidate next PRs, not final strategy decisions.

1. Extract routines create/update scalar and relation orchestration into smaller backend use-case helpers.
2. Add service-level tests for critical routines create/update flows.
3. Extract a small routines creation/update orchestration boundary from `apps/api/src/routines/routines.service.ts`.
4. Split `apps/web/components/admin-catalog-manager.tsx` into task/song/equipment sub-sections without changing behavior.
5. Extract ParentDashboard data-loading/selection orchestration into a focused hook or client helper.
6. Extract TrainingRunner session-control/mutation orchestration into a focused helper or hook.
7. Add focused tests around `ChildrenService` delete-impact and badge aggregation behavior.
8. Add focused tests or small policy helpers around trainer assignment ownership/role checks.
9. Introduce a first routines backend integration-style test harness for create/update + progress-adjacent behavior.
10. Add a minimal repo note linking this audit from the engineering docs after architect review, if accepted.

## Uncertain / Not Fully Inspected
- No dedicated subscription/billing application module was found, but schema/types support exists.
- No end-to-end browser automation or API integration harness was inspected; this draft only reflects repository code and checked-in tests.
- Trainer module was inspected at service level, but not exhaustively audited line-by-line beyond visible ownership/query patterns.
