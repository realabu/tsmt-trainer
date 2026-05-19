# Quality Gate Strategy

## Purpose
This document defines a practical quality-gate strategy for `tsmt-trainer`.

It is intentionally forward-looking, but not an implementation plan for a specific tool. The goal is to protect production-critical behavior and future AI-assisted changes with the smallest reliable gates that add real confidence.

Current posture:
- routines backend refactoring is paused by default after `RoutineDeleteImpactService`
- sessions backend refactoring is paused by default after `SessionBadgeAwardService`
- generated artifacts are guarded by `pnpm check:generated`
- strategic docs now point to smoke/e2e/quality gates as a high-value production-readiness direction

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
- typecheck
- unit tests
- API build
- web build

CI sets a dummy `DATABASE_URL` so Prisma client generation and typechecking can run. It does not currently start a real database service.

### Existing Test Shape
- API tests use TypeScript compilation to `.test-dist` and Node's built-in test runner.
- Web tests use TypeScript compilation to `.test-dist` and Node's built-in test runner.
- API coverage is strongest around extracted domain helpers and service-level safety tests for admin, routines, and sessions.
- Web coverage is strongest around pure helper/view-model modules, not rendered component flows.

### Current Gaps
- No API smoke test starts the real Nest app against a test database.
- No browser smoke/e2e test starts web + API together.
- No CI database service is configured.
- No contract/API-shape gate protects frontend assumptions around raw Prisma response shapes.
- No automated smoke covers login -> dashboard -> routine -> training runner -> finish.
- No lint/format gate beyond `tsc`-based `lint` scripts.

## Critical Product Journeys

### 1. Auth / Login / Session Persistence
- User/product value: users must be able to enter the product and keep a valid session.
- Risk if broken: complete product lockout or confusing auth refresh failures.
- Current coverage: frontend `apiFetch` and auth storage helper tests; backend auth service has less direct end-to-end coverage.
- Best gate type: API smoke first, browser smoke later.
- Data setup needed: seeded parent/admin users or test-created users.
- Flakiness risk: low for API smoke, medium for browser because redirects and storage are involved.
- Recommended priority: high.

### 2. Parent Dashboard Loads Child/Routine Data
- User/product value: parent home is the primary overview surface.
- Risk if broken: user logs in but cannot see children, routines, progress, badges, or recent sessions.
- Current coverage: pure parent dashboard helper/view-model tests; no rendered/data-flow smoke.
- Best gate type: API smoke for `/children`, `/routines`, `/sessions`; browser smoke later.
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
- Current coverage: sessions service lifecycle tests and frontend view-model/helper tests; no end-to-end flow.
- Best gate type: API smoke first for start -> complete task -> finish, then browser smoke for runner UI.
- Data setup needed: routine with ordered tasks and a valid parent/child.
- Flakiness risk: low for API smoke, medium-high for browser because timers/UI state are involved.
- Recommended priority: highest.

### 6. Finish Session And Badge/Progress Outcome
- User/product value: completion should update stats and award achievements correctly.
- Risk if broken: missed/duplicate badges, wrong progress, trust loss.
- Current coverage: sessions service safety tests, badge helper tests, routines progress service tests.
- Best gate type: API smoke validating finish response plus badge/progress endpoint shape; deeper badge permutations remain unit/service tests.
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
- Flakiness risk: medium-high until selectors and test data stabilize.
- Maintenance cost: medium-high.
- Implementation complexity: high relative to current repo.
- First useful PR size: should be separate from API smoke foundation.
- CI cadence: every PR only after stable; otherwise manual/nightly first.
- Recommendation: later, after API smoke and test data are reliable.

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

This seed is useful for development, but an automated smoke gate should not depend on broad demo seed state forever. A dedicated smoke seed or fixture script is likely safer once API smoke begins.

### Database
Current CI only provides a dummy `DATABASE_URL`; it does not run Postgres. Any DB-backed smoke gate needs:
- a Postgres service in CI
- a dedicated test database URL
- Prisma generate
- migration deploy or migrate reset strategy
- deterministic fixture creation
- cleanup or per-run isolated database

### Auth
Auth should initially be exercised through API login, not browser UI, for API smoke. Browser smoke can later use UI login once the browser runner exists.

Recommended first auth strategy:
- create or seed a parent user with known credentials
- login through `/api/auth/login`
- use the returned access token for protected endpoints

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
- the first smoke tests protect auth, parent data, routine/session lifecycle, and finish/badge/progress wiring
- tests use deterministic fixture data and avoid external services
- browser smoke is small and stable before it is required on every PR
- API shape assumptions consumed by frontend are protected for critical raw responses
- the test setup is documented and owned by scripts, not tribal memory
- future Codex runs can see which gate to add next and which gates are intentionally deferred

## Phased Roadmap

### Phase 1: Strategy Document
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
- Goal: establish the smallest DB-backed API smoke harness.
- Scope: add a script and one minimal smoke path, likely health/auth/me or auth/children.
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
- Stop conditions:
  - requires broad app refactor
  - requires external paid services
  - fixture setup is brittle or too slow
- Rollback plan: remove smoke script/test without affecting unit tests.
- Must not change: production API behavior, Prisma schema unless explicitly planned.

### Phase 3: Core API Journey Smoke
- Goal: cover the first high-value product journey through API.
- Scope: login -> list children/routines -> start session -> complete first task -> finish session -> verify response/progress/badge shape.
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
- Stop conditions:
  - time/date logic becomes flaky
  - test starts duplicating service unit tests instead of journey behavior
- Rollback plan: keep Phase 2 foundation and remove the brittle journey.
- Must not change: session lifecycle, badge semantics, API shape.

### Phase 4: First Browser Smoke
- Goal: prove web + API can support one stable user journey.
- Scope: choose tooling only after inspecting local compatibility; cover login and landing/dashboard visibility first.
- Likely files:
  - new browser smoke config
  - package scripts
  - possibly CI workflow
- Expected scripts:
  - `pnpm --filter @tsmt/web test:smoke` or root `pnpm test:smoke:web`
- CI placement: manual/nightly first unless fast and stable.
- Validation:
  - API smoke
  - web build
  - browser smoke locally
- Acceptance criteria:
  - deterministic login works
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

## First Recommended Implementation PR

Title: `test(api): add smoke test foundation`

Branch: `test/api-smoke-foundation`

Scope:
- add the smallest DB-backed API smoke harness
- prefer one auth/protected endpoint smoke over a full journey
- do not add browser tooling yet
- do not change production behavior

Likely files:
- `apps/api/package.json`
- root `package.json`
- `apps/api/test` or `apps/api/smoke` smoke test file
- possibly a small smoke fixture helper
- possibly `.github/workflows/ci.yml` if the same PR includes a Postgres service; otherwise leave CI wiring for the next PR

Exact implementation tasks:
1. Inspect Nest app bootstrap testability and Prisma service lifecycle.
2. Decide whether to instantiate the real Nest module or start the compiled API process.
3. Add deterministic DB fixture creation for one parent user and one child.
4. Log in through `/api/auth/login`.
5. Call one protected endpoint such as `/api/auth/me` or `/api/children`.
6. Add a smoke script.
7. Run locally against a dedicated test `DATABASE_URL`.
8. Decide whether CI wiring is safe in the same PR or should be a second PR.

Validation commands:
- `pnpm db:generate`
- `pnpm --filter @tsmt/api test:smoke`
- `pnpm --filter @tsmt/api test:unit`
- `pnpm typecheck`

CI impact:
- none if first PR is local-script only
- if CI wiring is included, add a Postgres service and keep the smoke step separate from unit tests

Acceptance criteria:
- smoke test uses real auth and a real protected endpoint
- test data is deterministic
- no external services are required
- no broad product journey is attempted yet
- failure output is understandable

Risks:
- DB lifecycle setup may be more costly than expected
- Nest app bootstrap may need careful teardown
- running migrations in CI may add time

Uncertainties:
- whether the first smoke should run the Nest app in-process or as a child process
- whether CI wiring should be immediate or follow after local stability
- whether a dedicated smoke seed belongs under `packages/db` or `apps/api/test`

Why this is the best first step:
- it protects real backend wiring without browser flake
- it creates the data/auth foundation required by later browser smoke
- it is smaller and more reversible than adopting Playwright/Cypress immediately

## Maintenance Rules
- Update this document after each quality-gate milestone.
- Mark phases completed, superseded, or rejected instead of letting stale strategy guide future Codex work.
- Future quality-gate PRs should reference this document in their PR body.
- If implementation diverges from this strategy, update this document in the same PR or a follow-up docs PR.
- Do not expand smoke/e2e coverage by momentum; every new gate should name the production risk it protects.
