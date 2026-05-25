# Quality Gate Strategy

## Purpose
This document defines a practical quality-gate strategy for `tsmt-trainer`.

It is intentionally forward-looking, but not an implementation plan for a specific tool. The goal is to protect production-critical behavior and future AI-assisted changes with the smallest reliable gates that add real confidence.

Current posture:
- routines backend refactoring is paused by default after `RoutineDeleteImpactService`
- sessions backend refactoring is paused by default after `SessionBadgeAwardService`
- generated artifacts are guarded by `pnpm check:generated`
- DB-backed API smoke is established through auth, children ownership, routine ownership, minimal session lifecycle, and post-finish session history paths
- API smoke is sufficient as a backend foundation for browser smoke
- browser smoke has completed a controlled local-first experiment in PR `#95`
- `pnpm --filter @tsmt/web test:smoke` now covers app-load/auth-panel, real UI login, parent dashboard, owned child/routine visibility, runner standby, and minimal one-task runner completion
- `pnpm --filter @tsmt/web test:smoke:app` runs only the DB-free app-load/auth-panel smoke
- `pnpm --filter @tsmt/web test:smoke:auth` runs the DB-backed authenticated browser smoke and requires `DATABASE_URL`, reachable Postgres, and applied migrations
- browser smoke is not wired into required CI yet; CI promotion remains a separate inspection/implementation decision

Hard rule: do not add a broad browser e2e suite just because e2e is fashionable. Start with the smallest gate that protects a real product journey without becoming brittle.

## Current Quality Gate Map

### Existing Scripts
- Root `pnpm typecheck` runs Turbo typecheck across packages.
- Root `pnpm test` runs API and web unit suites:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/web test:unit`
- Root `pnpm build` runs Turbo build.
- Root `pnpm check:generated` fails if generated output is tracked under blocked paths.
- Root DB helpers:
  - `pnpm db:generate`
  - `pnpm db:migrate`
  - `pnpm db:seed`
  - `pnpm db:import:tsmt-catalog`

### Existing CI
CI currently runs one `quality-gate` job:
- checkout
- generated artifact check
- pnpm setup
- Node 20 setup
- dependency install with frozen lockfile
- Prisma generate
- database migration deploy against a Postgres service
- typecheck
- unit tests
- API smoke tests
- API build
- web build

CI starts a Postgres service, runs `pnpm db:migrate:deploy`, then runs `pnpm --filter @tsmt/api test:smoke` as a separate API smoke step.

### Existing Test Shape
- API tests use TypeScript compilation to `.test-dist` and Node's built-in test runner.
- Web tests use TypeScript compilation to `.test-dist` and Node's built-in test runner.
- API coverage is strongest around extracted domain helpers and service-level safety tests for admin, routines, and sessions.
- Web coverage is strongest around pure helper/view-model modules, not rendered component flows.

### Current Gaps
- Browser smoke is local-first and not yet part of required CI.
- Local authenticated/full browser smoke requires a developer-provided migrated Postgres database; this is intentional until CI promotion or local DB orchestration is planned separately.
- No contract/API-shape gate beyond the current focused smoke assertions protects frontend assumptions around raw Prisma response shapes.
- No browser smoke covers destructive previews, badges, admin/catalog flows, multi-child edge cases, or broader full e2e journeys.
- No lint/format gate beyond `tsc`-based `lint` scripts.
- Docker/local dev orchestration is still deferred until serious feature, deployability, onboarding, or browser-smoke CI work needs it.

## Critical Product Journeys

### 1. Auth / Login / Session Persistence
- User/product value: users must be able to enter the product and keep a valid session.
- Risk if broken: complete product lockout or confusing auth refresh failures.
- Current coverage: frontend `apiFetch` and auth storage helper tests, DB-backed API smoke for login -> `/api/auth/me`, and local-first browser smoke for real UI login.
- Best gate type: keep current API/browser smoke narrow; add more only if auth feature work creates a concrete risk.
- Data setup needed: seeded parent/admin users or test-created users.
- Flakiness risk: low for API smoke, medium for browser because redirects and storage are involved.
- Recommended priority: high.

### 2. Parent Dashboard Loads Child/Routine Data
- User/product value: parent home is the primary overview surface.
- Risk if broken: user logs in but cannot see children, routines, progress, badges, or recent sessions.
- Current coverage: pure parent dashboard helper/view-model tests, API smoke for children/routines/sessions, and local-first browser smoke for dashboard plus owned child/routine visibility.
- Best gate type: feature-specific component/helper tests or scoped browser smoke only if dashboard behavior changes.
- Data setup needed: parent, child, routine, completed session, badge definitions.
- Flakiness risk: low for API smoke, medium for browser.
- Recommended priority: high.

### 3. Child Selection
- User/product value: parents with multiple children must see the right routine/session/progress context.
- Risk if broken: wrong child context, misleading progress, or unsafe edits.
- Current coverage: frontend view-model tests for selection/fallback behavior.
- Best gate type: component/view-model tests remain enough for now; browser smoke only after a stable data foundation exists.
- Data setup needed: two children with different routines/sessions.
- Flakiness risk: low in helper tests, medium in browser.
- Recommended priority: medium.

### 4. Routine Management / Task Catalog Usage
- User/product value: parents create and edit feladatsor structure.
- Risk if broken: task/period payload drift, catalog relation mistakes, or destructive edit regressions.
- Current coverage: strong routines service safety tests and frontend payload helper tests; no UI smoke.
- Best gate type: API smoke for routine/task/period CRUD; component/browser coverage later for editor workflows.
- Data setup needed: parent child, catalog task, difficulty, default song.
- Flakiness risk: low for API smoke, high for full browser editor flow if started too early.
- Recommended priority: medium-high.

### 5. Training Runner Starts And Progresses A Session
- User/product value: this is the core torna execution flow.
- Risk if broken: users cannot start, complete tasks, finish, or record results.
- Current coverage: sessions service lifecycle tests, frontend view-model/helper tests, DB-backed API smoke for start -> complete task -> finish, and local-first browser smoke for one-task runner completion.
- Best gate type: keep the current smoke paths stable; inspect before expanding into multi-task/progress/badge flows.
- Data setup needed: routine with ordered tasks and a valid parent/child.
- Flakiness risk: low for API smoke, medium-high for browser because timers/UI state are involved.
- Recommended priority: highest.

### 6. Finish Session And Badge/Progress Outcome
- User/product value: completion should update stats and award achievements correctly.
- Risk if broken: missed/duplicate badges, wrong progress, trust loss.
- Current coverage: sessions service safety tests, badge helper tests, routines progress service tests, API smoke for finish and post-finish session listing, and browser smoke for completed runner state.
- Best gate type: keep deeper badge/progress permutations in unit/service tests unless a product-visible badge/progress feature needs browser coverage.
- Data setup needed: badge definitions, routine periods, completed session conditions.
- Flakiness risk: medium if dates/timezones are not controlled.
- Recommended priority: high.

### 7. Destructive Preview / Confirmation Flows
- User/product value: users should understand what deletion affects before destructive actions.
- Risk if broken: data-loss surprise or incorrect confirmation copy.
- Current coverage: routines delete-impact service tests; child delete-impact coverage appears lighter.
- Best gate type: API smoke for delete-impact endpoints; frontend destructive confirmation component/browser coverage later.
- Data setup needed: child/routine/task/period with sessions and badges.
- Flakiness risk: low for API smoke.
- Recommended priority: medium-high.

### 8. Admin Catalog Management
- User/product value: catalog data supports task building and future operational workflows.
- Risk if broken: parents cannot find usable catalog tasks/songs/equipment.
- Current coverage: admin backend helper/facade tests; admin UI is a known frontend hotspot.
- Best gate type: API smoke for catalog list/create/update only if admin work resumes; browser smoke later.
- Data setup needed: admin user and isolated catalog records.
- Flakiness risk: low for API smoke, medium for UI.
- Recommended priority: medium unless admin catalog is active product work.

## Candidate Quality Gate Types

### API Smoke Tests
- Value: high. Protects auth, ownership, session lifecycle, routines, and badge/progress paths with lower flake risk than browser tests.
- Cost: medium. Requires a real test database and app bootstrap.
- Flakiness risk: low-medium if DB isolation is clear.
- Maintenance cost: moderate.
- Implementation complexity: medium.
- First useful PR size: small if it only adds DB/test-data foundation and one health/auth smoke.
- CI cadence: every PR after stable.
- Recommendation: adopt first.

### Browser Smoke Tests
- Value: high for user confidence and frontend/API wiring.
- Cost: medium-high. Requires web + API startup, auth/data setup, and browser tooling.
- Flakiness risk: medium; current local-first smoke passed the controlled experiment, but authenticated/full smoke still depends on a reachable migrated Postgres database.
- Maintenance cost: medium-high.
- Implementation complexity: high relative to current repo.
- First useful PR size: complete via PR `#95`.
- CI cadence: local-first for now; inspect CI promotion separately before making it required.
- Recommendation: keep, but do not expand or promote by momentum.

### Full E2E Tests
- Value: very high for release confidence.
- Cost: high.
- Flakiness risk: high if introduced broadly.
- Maintenance cost: high.
- Implementation complexity: high.
- First useful PR size: too large for immediate next step.
- CI cadence: initially manual/nightly; promote only stable subset to every PR.
- Recommendation: later; do not start here.

### Contract / API Shape Tests
- Value: high where frontend consumes raw Prisma include shapes.
- Cost: low-medium.
- Flakiness risk: low.
- Maintenance cost: low-medium.
- Implementation complexity: low if implemented as focused API smoke or service response assertions.
- First useful PR size: small for one route.
- CI cadence: every PR.
- Recommendation: adopt alongside API smoke for high-risk raw shapes.

### Component / Integration Tests
- Value: medium-high for large frontend components and destructive confirmations.
- Cost: medium, but the repo does not currently have a rendered component test stack.
- Flakiness risk: medium.
- Maintenance cost: medium.
- Implementation complexity: medium-high due to new tooling choices.
- First useful PR size: not ideal until a concrete UI flow is selected.
- CI cadence: every PR once stable.
- Recommendation: later, after inspecting frontend test-tool options.

### CI-Only Gates
- Value: already high for generated artifacts, typecheck, unit tests, and builds.
- Cost: low once scripts exist.
- Flakiness risk: low.
- Maintenance cost: low.
- Implementation complexity: low.
- First useful PR size: small.
- CI cadence: every PR.
- Recommendation: keep; add only gates that are stable and meaningful.

### Manual Release Checklist
- Value: medium as a bridge before browser automation.
- Cost: low.
- Flakiness risk: none, but human-dependent.
- Maintenance cost: low.
- Implementation complexity: low.
- First useful PR size: docs-only.
- CI cadence: not automated.
- Recommendation: adopt temporarily for flows not yet automated.

## Data And Environment Strategy

### Test Data
The existing `packages/db/prisma/seed.ts` creates useful demo data:
- parent user
- admin user
- child
- routine with tasks and periods
- completed session and timings
- badge definitions
- catalog songs/tasks/equipment later in the seed

This seed is useful for development, but automated smoke gates should not depend on broad demo seed state. Current API and browser smoke paths use deterministic smoke fixtures instead.

### Database
Current CI runs a Postgres service for API smoke, applies migrations with `pnpm db:migrate:deploy`, then runs `pnpm --filter @tsmt/api test:smoke`.

Authenticated browser smoke is still local-first. Running `pnpm --filter @tsmt/web test:smoke:auth` or the full `pnpm --filter @tsmt/web test:smoke` requires:
- a reachable Postgres database through `DATABASE_URL`
- applied migrations for that database
- deterministic smoke fixture creation and cleanup through the browser-smoke helpers

Browser-smoke CI promotion or local Docker orchestration remains a separate future inspection decision.

### Auth
Auth is now exercised in both API smoke and local-first browser smoke.

Current auth strategy:
- API smoke creates deterministic parent users and logs in through `/api/auth/login`
- browser smoke seeds deterministic data and logs in through the real UI
- future auth expansion should stay narrow and should not replace service/unit tests

### External Services
Smoke tests must not depend on paid or external services. Media/S3-like config should remain stubbed or use URL-only data where current app behavior permits.

### Environment Variables
Likely minimum for smoke:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_API_URL` only for browser/web smoke

### Isolation
Preferred isolation order:
1. dedicated CI test database recreated per job
2. smoke-specific seed creates deterministic IDs
3. tests clean their own records when practical

Avoid tests that rely on wall-clock-sensitive badge/progress behavior unless dates are controlled.

## Desired Target State

“Good enough / 80% production-ready quality gates” means:
- local developers can run a short smoke gate before risky changes
- CI catches generated artifacts, type errors, unit regressions, and one or two core journey regressions
- the first smoke tests protect auth, parent data, routine/session lifecycle, and post-finish session-read wiring
- tests use deterministic fixture data and avoid external services
- browser smoke is small and stable before it is required on every PR
- API shape assumptions consumed by frontend are protected for critical raw responses
- the test setup is documented and owned by scripts, not tribal memory
- future Codex runs can see which gate to add next and which gates are intentionally deferred

## Phased Roadmap

### Phase 1: Strategy Document
- Status: complete via `#86`.
- Goal: create this quality-gate strategy.
- Scope: docs only.
- Likely files: `docs/quality-gate-strategy.md`.
- Expected scripts: none.
- CI placement: none.
- Validation: `git diff --check`; confirm docs-only diff.
- Acceptance criteria: strategy identifies current gates, gaps, candidate approaches, and first implementation PR.
- Stop conditions: strategy starts prescribing a browser framework without inspection.
- Rollback plan: revert docs PR.
- Must not change: source code, tests, CI, dependencies.

### Phase 2: API Smoke Foundation
- Status: complete via `#87`, with follow-up parent/routine smoke coverage in `#88` and `#89`.
- Goal: establish the smallest DB-backed API smoke harness.
- Scope: add a script and one minimal smoke path, then extend to parent-owned data paths.
- Likely files:
  - root `package.json`
  - `apps/api/package.json`
  - new API smoke test location under `apps/api/test` or `apps/api/smoke`
  - possibly `.github/workflows/ci.yml` only after local stability
- Expected scripts:
  - `pnpm --filter @tsmt/api test:smoke`
  - optional root `pnpm test:smoke`
- CI placement: start as manual/local or separate CI step after it is stable; if added to CI immediately, include Postgres service in the same PR.
- Validation:
  - `pnpm db:generate`
  - `pnpm --filter @tsmt/api test:smoke`
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm typecheck`
- Acceptance criteria:
  - real Nest app can run against test DB
  - deterministic test user/data exists
  - one protected endpoint is verified through real auth
  - auth/me smoke exists
  - parent-owned children smoke exists
  - routine list ownership smoke exists
- Stop conditions:
  - requires broad app refactor
  - requires external paid services
  - fixture setup is brittle or too slow
- Rollback plan: remove smoke script/test without affecting unit tests.
- Must not change: production API behavior, Prisma schema unless explicitly planned.

### Phase 3: Core API Journey Smoke
- Status: complete through `#90`, `#91`, and `#92`.
- Goal: cover the first high-value product journey through API.
- Scope: login -> list children/routines -> start session -> complete first task -> finish session -> verify one minimal post-finish observable consequence.
- Likely files:
  - API smoke tests
  - smoke fixture builder
  - possibly CI workflow
- Expected scripts:
  - `pnpm --filter @tsmt/api test:smoke`
- CI placement: every PR only if stable under Postgres service.
- Validation:
  - smoke script
  - API unit tests
  - typecheck
- Acceptance criteria:
  - catches broken auth/session/routine wiring
  - avoids checking every badge permutation
  - session lifecycle smoke exists
  - post-finish session history/read consequence smoke exists
- Stop conditions:
  - time/date logic becomes flaky
  - test starts duplicating service unit tests instead of journey behavior
- Rollback plan: keep Phase 2 foundation and remove the brittle journey.
- Must not change: session lifecycle, badge semantics, API shape.

### Phase 4: First Browser Smoke
- Status: controlled local-first experiment completed in PR `#95`; final docs recommend merge all after architect review.
- Goal: prove web + API can support one stable user journey.
- Scope: Playwright local smoke now covers app-load/auth-panel, UI login, parent dashboard, owned child/routine visibility, runner standby, and one-task runner completion.
- Likely files:
  - `apps/web/package.json`
  - `apps/web/playwright.smoke.config.ts`
  - `apps/web/playwright.auth-smoke.config.ts`
  - `apps/web/test/smoke/*`
- Expected scripts:
  - `pnpm --filter @tsmt/web test:smoke:app`
  - `pnpm --filter @tsmt/web test:smoke:auth`
  - `pnpm --filter @tsmt/web test:smoke`
- CI placement: local-first for now; inspect CI promotion separately.
- Validation:
  - web build
  - browser smoke locally
  - typecheck
  - generated artifact check
- Acceptance criteria:
  - app-load/auth-panel visibility works
  - deterministic parent UI login works
  - parent dashboard and owned child/routine visibility are covered
  - runner standby and one-task completion are covered
  - stable selectors or user-facing text checks are used
  - no broad brittle e2e suite is introduced
- Stop conditions:
  - requires large UI refactor
  - flakiness exceeds confidence value
  - runtime is too slow for PR feedback
- Rollback plan: keep API smoke, remove browser gate.
- Must not change: UI behavior, auth behavior.

### Phase 5: Targeted Expansion
- Goal: add coverage only where production risk justifies it.
- Scope candidates:
  - destructive preview/confirmation browser or API smoke
  - training runner task progression browser smoke
  - admin catalog API smoke if admin work resumes
  - contract/API shape tests for raw response shapes
- Expected scripts: reuse smoke scripts from prior phases.
- CI placement: promote only stable subset to every PR.
- Validation: smoke plus normal CI gates.
- Acceptance criteria: each new test protects a named production risk.
- Stop conditions: tests become broad snapshots or duplicate unit tests.
- Rollback plan: remove the specific flaky expansion without removing foundation.
- Must not change: product behavior.

## Current Recommended Next Work

Title: focused frontend hotspot foundation phase

Recommended posture:
- the backend foundation and quality gates are much improved, but the app is not broadly ready for serious feature work anywhere
- the largest remaining AI-maintainability risk is concentrated in large stateful frontend components
- use feature-triggered scoped inspection before serious feature implementation
- if future runner/routine editor UX work is selected, start with a joint TrainingRunner/RoutinesManager decision audit
- routines and sessions backend refactoring remain paused by default
- browser smoke remains local-first and should not be promoted to CI without a separate inspection of runtime, DB orchestration, artifact behavior, and flakiness
- Docker/local dev setup remains deferred until deployability, onboarding, serious feature work, or browser-smoke CI promotion needs it

Scope:
- do not continue backend refactoring, smoke expansion, or infrastructure work by momentum
- do not treat smoke coverage as proof that all feature surfaces are ready
- inspect the target frontend hotspot before implementation
- add tests, docs, or small extractions only when inspection shows concrete production-readiness value

Likely files:
- `apps/web/components/training-runner.tsx`
- `apps/web/components/routines-manager.tsx`
- `apps/web/components/task-builder.tsx`
- `apps/web/components/admin-catalog-manager.tsx`
- `apps/web/components/parent-dashboard.tsx`
- strategic docs only when guidance becomes stale
- CI workflow only in a later explicit CI-promotion PR

Exact implementation tasks:
1. Inspect `TrainingRunner` runner-control, cancel, timer, or visual seams only when runner UX/product work selects them.
2. If inspection confirms value, extract or test exactly one runner seam.
3. Inspect `RoutinesManager` editor/delete-impact orchestration before changing routine editor or destructive behavior.
4. If justified by that feature, extract or test exactly one `RoutinesManager` seam.
5. Inspect `TaskBuilder` catalog search/song-loading/media/delete-callback boundaries if a selected feature touches them.
6. If justified by that feature, extract one `TaskBuilder` slice.

Validation commands:
- `git diff --check`
- `pnpm typecheck`
- `pnpm check:generated`
- targeted unit/API/browser smoke commands based on the touched area

CI impact:
- none by default; browser-smoke CI promotion remains deferred

Acceptance criteria:
- frontend hotspot work is evidence-based and scoped
- no old roadmap item drives automatic backend refactor or smoke expansion
- browser smoke remains an optional/local confidence gate unless explicitly promoted
- no broad frontend rewrite is started

Risks:
- starting feature work without hotspot inspection could re-grow already large frontend components
- promoting browser smoke to required CI too quickly could add runtime/flakiness before DB orchestration and local/CI behavior are understood

Uncertainties:
- exact next product feature is not selected in this document
- exact CI promotion shape is still open and should be inspected separately if it becomes a goal

Why this is the best first step:
- the backend foundation is improved enough to pause backend momentum
- the remaining foundation risk is concrete: large user-facing frontend components are still difficult for AI-assisted changes
- a small frontend hotspot phase reduces real feature-change risk without restarting broad architecture work

## Maintenance Rules
- Update this document after each quality-gate milestone.
- Mark phases completed, superseded, or rejected instead of letting stale strategy guide future Codex work.
- Future quality-gate PRs should reference this document in their PR body.
- If implementation diverges from this strategy, update this document in the same PR or a follow-up docs PR.
- Do not expand smoke/e2e coverage by momentum; every new gate should name the production risk it protects.
