# ENGINEERING GUIDE

## Product Engineering Objective
This repository should evolve into a long-lived, production-capable TSMT product that is safe to change, easy to understand, and resilient to regression while functionality and UX are still moving quickly.

The engineering objective is not premature elegance. It is:
- safe iteration on a changing product
- clear domain boundaries
- easy onboarding for both humans and AI agents
- small, reviewable changes with low regression risk
- gradual movement toward clean architecture without stopping delivery

This guide is intentionally pragmatic and reflects the current codebase reality as of April 2026.

## Current Codebase Reality
The repository already has a good high-level monorepo shape:
- `apps/api`: NestJS REST API
- `apps/web`: Next.js application
- `packages/db`: Prisma schema, migrations, seed, import scripts
- `packages/types`: shared contracts/types

The main maintainability risk today is not the folder structure. It is that too much logic has accumulated in a few large files.

Current high-risk files include:
- [routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts)
- [sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts)
- [admin.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin.service.ts)
- [routines-manager.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/routines-manager.tsx)
- [training-runner.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/training-runner.tsx)
- [parent-dashboard.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/parent-dashboard.tsx)
- [admin-catalog-manager.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/admin-catalog-manager.tsx)

Assumption:
- functionality and product concepts will continue changing materially
- broad UI/behavior rewrites are expected
- AI agents will continue making a significant percentage of changes

## Architectural Principles
1. Organize by feature/domain first, not by technical layer first.
2. Keep controllers thin.
3. Keep React page components thin.
4. Put business rules into focused modules, not transport/UI layers.
5. Prefer pure functions for calculations and state derivation.
6. Isolate side effects.
7. Centralize contracts and shared types.
8. Split large files only when the split maps to a real responsibility.
9. Optimize for local reasoning: a contributor should understand a change by reading a small set of files.
10. Refactor incrementally, never by sweeping architectural churn unless the system is blocked.

## Target Architecture

### Monorepo
- `apps/api`
  - feature-first backend modules
  - HTTP transport + application orchestration
- `apps/web`
  - feature-first frontend composition
  - page shells, feature hooks, presentational components
- `packages/db`
  - schema, migrations, seed, import scripts
- `packages/types`
  - shared cross-app contracts and stable domain DTOs

### Backend Target Shape
Each backend domain should gradually move toward:

```text
feature/
  controller.ts
  dto.ts
  application/
    use-case.ts
  domain/
    rules.ts
    calculators.ts
    policy.ts
  infrastructure/
    repository.ts
    prisma-mapper.ts
```

This does not need to be introduced all at once. For small features, a lighter version is acceptable:

```text
feature/
  controller.ts
  dto.ts
  service.ts
  rules.ts
```

The rule is: do not keep growing giant service files when the domain clearly has separable use cases or pure calculations.

### Frontend Target Shape
Each frontend feature should gradually move toward:

```text
feature/
  components/
  hooks/
  api/
  view-model/
  utils/
```

For example:
- page file: route composition only
- data hook: fetching, mutation, loading/error state
- component: rendering only
- utils/view-model: display calculations, derived state, formatting

## Domain Boundaries
Primary domain modules for this product:
- auth
- children
- routines
- sessions
- badges/progress
- media
- trainers
- admin
- subscriptions

Boundary rules:
- `auth` owns identity, token issuing, current-user access, authorization primitives
- `children` owns child lifecycle and child-level aggregates
- `routines` owns feladatsor structure, tasks, periods, catalog matching
- `sessions` owns runtime execution of tornák and session completion data
- `badges/progress` owns achievement awarding and progress calculation logic
- `media` owns media metadata, upload references, linking rules
- `trainers` owns sharing/access relationships, not core routine structure
- `admin` owns cross-domain operational workflows, not domain rules themselves
- `subscriptions` owns entitlement and billing direction

Domain boundary rule:
- a domain may depend on stable outputs from another domain
- a domain must not reach across and silently own another domain's business rules

Example:
- `sessions` may trigger badge evaluation
- but badge awarding logic should live in `badges/progress`, not become embedded procedural logic inside session transport code long-term

## Rules for Business Logic Placement
Business logic must not live in:
- Nest controllers
- React pages
- large JSX trees
- ad hoc API response mappers mixed into UI

Business logic should live in:
- pure calculation modules
- focused domain services
- application services that coordinate use cases

Examples for this repo:
- weekly/period progress calculation should be pure and unit-testable
- repetition label generation should be a small pure helper
- badge context key generation should be pure and deterministic
- deletion impact computation should be explicit domain/application logic, not duplicated in UI

## Rules for Side Effect Isolation
Side effects include:
- Prisma reads/writes
- network requests
- localStorage access
- timers
- file import/export
- image/PDF upload processing
- AI API calls

Rules:
1. Keep pure logic separate from side effects.
2. Hide localStorage behind dedicated auth/session helpers.
3. Keep API request details in dedicated client modules or hooks.
4. Keep Prisma access out of pure calculators.
5. AI extraction and OCR must live behind a dedicated service boundary, not inside controllers.

Example direction:
- progress calculation should accept plain data and return plain results
- a repository/service fetches data from Prisma
- an application service coordinates fetch -> calculate -> persist/respond

## Auth / Session / Security Architecture Direction
Direction:
- authentication and authorization should remain centralized and explicit
- role handling should not be duplicated in many UI components and service methods
- token storage and auth state transitions should be owned by a dedicated client auth module

Backend direction:
- keep guards explicit
- keep role checks centralized
- avoid scattered inline authorization conditions
- move toward clear policies for:
  - parent-owned resources
  - trainer read-only access
  - admin override capabilities

Frontend direction:
- centralize auth storage, session expiry handling, and redirect rules
- avoid each component making its own ad hoc assumptions about logged-in state

Security direction:
- prefer server-enforced authorization over UI hiding
- keep input validation at boundaries
- review all schema changes for delete cascade implications
- review file upload and AI ingestion paths as untrusted input flows

## Testing Strategy
Current reality:
- there is little or no effective automated test coverage
- typecheck catches some issues, but not domain regressions

Target strategy:

### Unit tests first for critical pure logic
Priority modules to test first:
- progress calculation
- badge awarding rules
- repetition display helpers
- routine import matching logic
- delete impact calculation

### Integration tests next for backend use cases
Examples:
- complete session -> progress update -> badge award
- delete child -> expected cascade impact preview
- create routine from catalog task -> expected overrides

### Frontend tests selectively
Use them for critical interaction logic, not every rendering detail.
Examples:
- parent dashboard selection flow
- training runner navigation logic
- destructive action confirmation flows

Testing rule:
- when changing business rules, add or update tests
- when changing only layout/text, tests are optional unless a critical interaction changes

## AI-Safe Modification Rules
These rules are mandatory for future AI-assisted work.

1. Do not modify multiple domains in one task unless necessary.
2. Before making changes, write a short plan.
3. Prefer adding focused modules over growing already-large files.
4. When changing business rules, add or update tests.
5. Do not duplicate business logic across API and web.
6. Keep functions small and named around behavior.
7. Avoid broad incidental edits.
8. Make side effects obvious.
9. When a file becomes too large or mixes concerns, split it.
10. Keep new abstractions concrete and close to current use cases.

Additional AI-specific guidance:
- if touching a file already above ~400-500 lines, first ask whether a local extraction is possible
- if a task only needs one domain, do not refactor neighboring domains “while here”
- if a change needs a new concept, name it in domain language, not generic helper language
- prefer safe adapters over hidden magic

## Quality Gates
Minimum quality gates for merged work:
- `typecheck`
- `lint` when configured
- `build`
- tests for affected critical logic
- migration sanity if schema changes
- docs update if architecture or workflow changes

Practical repository-specific gates:
1. `pnpm typecheck`
2. `pnpm build` for touched apps when feasible
3. if Prisma schema changed:
   - `pnpm db:generate`
   - migration reviewed
   - migration applied locally
   - seed/import scripts sanity checked if affected
4. if auth, badges, progress, deletion impact, or import logic changed:
   - targeted tests must exist or be added in that same workstream

## Definition of Done
Work is done when:
- the change is scoped to a clear outcome
- the relevant quality gates pass
- business rules are encoded in the right place
- no duplicated logic was introduced
- docs/contracts were updated if needed
- destructive flows remain explicit and understandable
- the change is small enough to review safely

It is not done if:
- it only “works manually” but leaves hidden coupling
- it grows already-large files without necessity
- it duplicates API logic in the frontend
- it introduces silent schema/delete behavior without surfacing it

## Refactor Priorities in Recommended Order
Do not refactor everything at once. Use this order.

1. Extract pure progress and badge logic from large backend services
   - target: [sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts)
   - target: [routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts)

2. Split routine backend into clearer use cases
   - routine CRUD
   - task CRUD
   - period CRUD
   - catalog search/import logic

3. Split large frontend dashboard and manager components
   - [parent-dashboard.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/parent-dashboard.tsx)
   - [routines-manager.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/routines-manager.tsx)
   - [training-runner.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/training-runner.tsx)

4. Introduce backend repository/calculator separation where logic is unstable but important
   - especially badges, progress, delete impact, catalog matching

5. Introduce test coverage for critical domain rules before any broad architectural rewrite

6. After the above, clean up admin and trainer flows

## What Should NOT Be Refactored Yet
Do not do these yet:
- do not rewrite the whole backend into a heavy hexagonal architecture
- do not replace Prisma access everywhere at once
- do not introduce generic abstractions with no immediate use
- do not redesign the entire frontend component tree in one pass
- do not build a massive shared utility layer
- do not optimize for final UI polish
- do not move everything into `packages/*` prematurely
- do not build a full event bus or plugin system yet

## How to Break Work into Safe, Reviewable Increments
Preferred increment size:
- one domain
- one use case cluster
- one migration at a time
- one UI surface at a time

Recommended pattern:
1. identify one pain point
2. isolate one behavior
3. extract one module
4. add tests for that behavior
5. switch callers
6. verify no behavioral regression

Good examples:
- extract badge context key builder
- extract weekly progress calculator
- extract session completion awarding flow
- extract parent dashboard selection state hook
- extract training runner image gallery component

Bad examples:
- “refactor routines architecture”
- “clean up dashboard”
- “move all services to clean architecture”

## Immediate Next Refactor Candidates
These are the best next candidates given the current code:
- backend:
  - split routine progress calculation from [routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts)
  - split badge awarding from [sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts)
  - split delete impact calculation from children/routines services
- frontend:
  - split selection/fetch logic out of [parent-dashboard.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/parent-dashboard.tsx)
  - split standby, active, and completed states out of [training-runner.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/training-runner.tsx)
  - split editor state and destructive flows out of [routines-manager.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/routines-manager.tsx)

## Engineering Workflow Expectations
- prefer feature branches or focused commits
- keep commits scoped to one theme
- update guides when the architecture direction changes
- document assumptions in PR descriptions or task summaries
- do not silently change domain language

This guide is the repository-level source of truth for engineering direction until replaced by a more specific architecture decision record.
