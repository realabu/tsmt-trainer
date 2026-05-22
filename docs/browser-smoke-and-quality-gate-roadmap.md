# Browser Smoke And Quality Gate Roadmap

## Purpose
This document defines the browser-smoke and quality-gate target state after the API smoke completion checkpoint.

The goal is production-readiness, not broad end-to-end coverage for its own sake. Browser smoke should protect a few critical integrated user journeys that unit tests and API smoke cannot see: rendered auth behavior, browser storage, web/API wiring, dashboard hydration, routine visibility, and the training runner interaction path.

Current baseline:
- API smoke is DB-backed and runs in CI with real Postgres.
- API smoke covers auth, parent-owned children, parent-owned routines, minimal session lifecycle, and post-finish session history.
- Web tests cover pure helpers and view-model logic, not rendered app flows.
- No browser tooling has been selected or installed.
- No Playwright/Cypress/browser smoke has started.
- Routines and sessions backend refactoring are paused by default.

Hard rule: do not turn this into a broad e2e suite. Each browser smoke must name the product risk it protects.

## Current Quality-Gate Baseline

### Unit And Service Coverage
Current useful coverage includes:
- API service/domain safety tests for routines, sessions, delete-impact previews, progress, task catalog search, and badge orchestration.
- Web pure helper and view-model tests under `apps/web/lib/__tests__`.
- Auth storage and API fetch helper tests.
- Generated artifact guard through `pnpm check:generated`.

These gates are good at protecting business rules and pure decisions. They do not prove that a real browser can log in, keep tokens, hydrate the parent dashboard, navigate to a routine, or run a session through the UI.

### API Smoke Coverage
Current DB-backed API smoke covers:
- `POST /api/auth/login` -> `GET /api/auth/me`
- `GET /api/children` parent ownership visibility and unrelated-child non-leak
- `GET /api/routines?childId=...` parent routine visibility and unrelated-routine non-leak
- `POST /api/routines/:routineId/sessions/start`
- `POST /api/sessions/:id/tasks/complete`
- `POST /api/sessions/:id/finish`
- `GET /api/sessions?routineId=...` finished session visible afterward

This is enough backend foundation for browser-smoke planning. Browser tests should not become the first place where auth, ownership, session lifecycle, or post-finish persistence are debugged.

### CI Baseline
The current CI quality gate runs:
- generated artifact check
- dependency install
- Prisma generate
- Prisma migrate deploy against Postgres
- typecheck
- unit tests
- API smoke tests
- API build
- web build

No browser process, web server, or browser automation gate runs in CI yet.

### Browser-Level Gaps
Unprotected at browser/application-flow level:
- unauthenticated landing page and login panel rendering
- login form storing tokens and reloading into authenticated state
- parent dashboard data hydration from `/api/children`, `/api/routines`, `/api/sessions`, badges, and progress
- child/routine selection in the rendered UI
- navigation from routines to training runner
- training runner start, task complete, finish, and post-finish UI state
- destructive preview/confirmation UI behavior
- admin/catalog rendered workflows

## Browser-Smoke Target State

Good browser smoke for this app should be small, stable, and product-led:
- It starts real web and API processes against an isolated DB.
- It seeds deterministic smoke data directly through Prisma or a tiny smoke fixture helper.
- It logs in through the UI for at least one parent user.
- It asserts user-visible text and critical state, not large DOM snapshots.
- It avoids exact timestamp/timer assertions.
- It runs locally with one documented command.
- It enters CI only after local and PR stability are proven.
- It remains clearly below "full e2e" scope.

Recommended target set:

| Browser smoke | Journey protected | First wave? | Notes |
| --- | --- | --- | --- |
| App load and unauthenticated landing | Home page renders and auth panel is usable | Yes | Lowest-risk tooling validation. |
| Login -> parent dashboard visible | Browser auth storage, reload, dashboard hydration | Yes | First meaningful integrated user journey. |
| Login -> children visible | Parent-owned child data renders and unrelated data is absent from UI | Yes | Can be part of dashboard smoke if stable. |
| Login -> routines visible for child | Parent can see routine entry points | Yes | Needed before runner smoke. |
| Training runner visible | Routine train route loads seeded task | Yes, after dashboard smoke | Protects route/API wiring before mutating session state. |
| Start session | Parent starts a session through UI | Later first wave | Product-critical but depends on stable runner selectors. |
| Complete one task | Runner records one task through UI | Later first wave | Avoid brittle timer assertions. |
| Finish session | Runner shows completed state | Later first wave | Reuses API smoke assumptions. |
| Post-finish history/progress visible | Dashboard reflects completion | Later | Valuable, but more async/data-heavy. |
| Badge visibility | Motivational outcome visible | Later | Service/API coverage exists; browser coverage only when badge UI is active risk. |
| Destructive preview confirmation | Delete preview appears before delete action | Later | Important, but not first browser smoke. |
| Admin/catalog routes | Admin UI renders and catalog basics work | Deferred | Only if admin work becomes active. |

## Candidate Journey Evaluation

### App Loads / Unauthenticated Landing
- User/product journey protected: visitor can open the app and see the landing/auth panel.
- Why it matters: validates web server, route rendering, CSS/JS boot, and browser runner setup.
- Backend/API dependencies: none for the minimal check.
- Fixture/data setup needed: none.
- Flakiness risk: low.
- Implementation size: small.
- Placement: first tooling foundation PR.

### Login -> Authenticated Dashboard Visible
- User/product journey protected: parent can log in and reach the authenticated parent dashboard.
- Why it matters: protects auth form, API proxy/fetch behavior, token storage, reload/navigation, and role-based dashboard routing.
- Backend/API dependencies: login, `/api/children`, `/api/routines`, `/api/sessions`; badges/progress may be called after child selection.
- Fixture/data setup needed: parent, free subscription, child, routine; optional completed session if dashboard should show recent activity.
- Flakiness risk: medium because dashboard loads multiple requests.
- Implementation size: medium.
- Placement: first meaningful browser smoke after tooling foundation.

### Login -> Children Visible
- User/product journey protected: parent can see owned children and does not see unrelated children.
- Why it matters: browser-level protection for the first parent dashboard data surface.
- Backend/API dependencies: `/api/children`.
- Fixture/data setup needed: owned child and unrelated parent/child.
- Flakiness risk: low-medium.
- Implementation size: small if combined with dashboard smoke.
- Placement: first wave.

### Login -> Routines Visible For Child
- User/product journey protected: parent can see the routine that can later be trained.
- Why it matters: routine visibility is the bridge between dashboard and training runner.
- Backend/API dependencies: `/api/routines` or `/api/routines?childId=...`.
- Fixture/data setup needed: owned child, routine, unrelated routine.
- Flakiness risk: low-medium.
- Implementation size: small-medium.
- Placement: first wave.

### Login -> Routine Detail / Training Runner Visible
- User/product journey protected: parent can navigate to the training route and see the seeded task.
- Why it matters: validates the route `/routines/:id/train`, auth storage usage, routine detail read, and initial runner state.
- Backend/API dependencies: `/api/routines/:id`.
- Fixture/data setup needed: routine with one ordered task.
- Flakiness risk: medium.
- Implementation size: medium.
- Placement: after login/dashboard smoke is stable.

### Start Training Session
- User/product journey protected: parent starts a session from the runner UI.
- Why it matters: this is the core product action.
- Backend/API dependencies: `POST /api/routines/:routineId/sessions/start`.
- Fixture/data setup needed: parent, child, routine, task.
- Flakiness risk: medium.
- Implementation size: medium.
- Placement: first wave only after runner-visible smoke is stable.

### Complete One Task
- User/product journey protected: parent records the current task from the runner UI.
- Why it matters: validates timer/button state and session task timing API wiring.
- Backend/API dependencies: `POST /api/sessions/:id/tasks/complete`.
- Fixture/data setup needed: active session from the same smoke.
- Flakiness risk: medium-high because the UI computes elapsed time.
- Implementation size: medium.
- Placement: later first wave; assert positive seconds, not exact values.

### Finish Session
- User/product journey protected: final task completion finishes the session and shows completed UI.
- Why it matters: validates the browser path for the highest-value training outcome.
- Backend/API dependencies: finish endpoint and routine refresh.
- Fixture/data setup needed: same runner fixture.
- Flakiness risk: medium-high.
- Implementation size: medium.
- Placement: later first wave after start/task complete are stable.

### Post-Finish Session/History/Progress Visible
- User/product journey protected: dashboard or history reflects that the session finished.
- Why it matters: proves the UI can show the persisted consequence already covered by API smoke.
- Backend/API dependencies: `/api/sessions`, maybe `/api/routines/:id/progress`.
- Fixture/data setup needed: finished session; possibly period if progress is asserted.
- Flakiness risk: medium.
- Implementation size: medium.
- Placement: later; prefer session history before progress calculations.

### Badge Visibility
- User/product journey protected: user sees earned motivational feedback.
- Why it matters: badges are product-facing but already have service coverage.
- Backend/API dependencies: badge definitions and `/api/children/:id/badges`.
- Fixture/data setup needed: badge definition and trigger conditions.
- Flakiness risk: medium due date/trigger setup.
- Implementation size: medium-high.
- Placement: later, only if badge UI is product-active.

### Destructive Delete Confirmation Preview
- User/product journey protected: user sees preview before deleting routine/period/task.
- Why it matters: destructive actions are data-loss adjacent.
- Backend/API dependencies: delete-impact preview endpoints.
- Fixture/data setup needed: routine/period/task plus related counts.
- Flakiness risk: low-medium.
- Implementation size: medium.
- Placement: later; service coverage exists, browser test only if UI confirmation work resumes.

### Admin/Catalog Routes
- User/product journey protected: admin can reach catalog management.
- Why it matters: catalog data underpins task building.
- Backend/API dependencies: admin auth and catalog endpoints.
- Fixture/data setup needed: admin user and catalog fixtures.
- Flakiness risk: medium.
- Implementation size: medium-high.
- Placement: deferred unless admin/catalog product work becomes active.

## Testing Pyramid And Gate Placement

Keep this split:
- Unit/helper tests: pure business rules, frontend view models, payload builders, auth storage, API helper behavior.
- Service tests: backend ownership, Prisma query shape, workflow orchestration, badge/delete-impact/progress semantics.
- API smoke: real backend wiring, auth, ownership, session lifecycle, critical persisted consequences.
- Browser smoke: only user-visible integrated journeys where browser storage, routing, rendering, and API wiring matter.
- Full e2e: deferred. Only consider after the smoke layer is stable and a product release process needs deeper confidence.

Do not use browser smoke to replace service tests. Browser smoke should be a thin top layer that catches integration regressions early.

## AI-Friendly Development Benefits

The proposed gates help future Codex/AI work by:
- catching accidental API response-shape drift through API smoke before UI tests fail mysteriously
- catching auth storage/routing regressions that unit tests cannot see
- keeping browser assertions narrow enough to diagnose quickly
- preventing large "it works locally" frontend changes from merging without a rendered smoke path
- giving agents explicit stop conditions before adding broad e2e scope
- separating backend lifecycle failures from frontend/browser failures

Failure diagnosis rule: every smoke should make it obvious whether the failure is setup, login, dashboard hydration, route navigation, or runner interaction.

## Good Enough Production-Ready Target

The 80% target for quality gates is:
- CI runs generated artifact check, typecheck, unit tests, API smoke, and builds on every PR.
- API smoke remains stable with real Postgres and deterministic fixtures.
- Browser smoke starts with a tiny local/CI candidate and only graduates to every PR after stability is proven.
- The first browser smoke proves app load and parent login/dashboard hydration.
- The next browser smoke proves routine visibility and runner standby state.
- A later browser smoke proves the minimal runner start -> complete -> finish UI path.
- Smoke runtime remains short enough for PR feedback.
- Browser data setup is deterministic and isolated.
- Tests use user-facing text/roles or stable semantic selectors, not brittle DOM snapshots.
- No paid or external services are required.
- Docs state which journeys are protected and which are intentionally deferred.

## Ordered Implementation Roadmap

### Step 1: Browser Smoke Roadmap
- Type: docs-only.
- Purpose: choose browser-smoke target state before installing tooling.
- Intended files:
  - `docs/browser-smoke-and-quality-gate-roadmap.md`
  - `docs/quality-gate-strategy.md`
- User story: as a maintainer, I want browser smoke to start with a narrow plan so it protects product risk without becoming a brittle e2e suite.
- Developer tasks:
  - inspect current gates, web routes, auth flow, dashboard, routines, training runner, scripts, and CI
  - record target journeys and stop conditions
  - update strategy docs to point here
- Acceptance criteria:
  - roadmap names first-wave and deferred browser-smoke journeys
  - no tooling or tests are added
- Validation:
  - `git diff --check`
  - `pnpm typecheck` if cheap
- Stop conditions:
  - doc starts prescribing broad full e2e
  - doc chooses a browser tool without implementation inspection
- Must not change:
  - source code, tests, CI, dependencies, production behavior

### Step 2: Browser Tooling Foundation And App-Load Smoke
- Type: test/tooling, no production behavior change.
- Purpose: prove a browser runner can start the web app reliably before adding authenticated flows.
- Intended files:
  - root and/or web package scripts
  - browser smoke config
  - one tiny browser smoke test
  - optional CI workflow only if stable and fast
- User story: as a developer, I want one command that proves the app renders in a browser so future browser smoke has a stable base.
- Developer tasks:
  - inspect compatible browser tooling options
  - choose the smallest reliable runner
  - add one unauthenticated landing/auth-panel smoke
  - document local env/start commands
- Acceptance criteria:
  - app loads
  - login panel or landing headline is visible
  - no API DB fixture is required yet
  - no broad product journey is included
- Validation commands:
  - `pnpm --filter @tsmt/web build`
  - new browser smoke command
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - tooling requires broad app or CI restructuring
  - generated browser artifacts become tracked
  - test is flaky locally
- Must not change:
  - frontend behavior, API behavior, Prisma schema, backend refactors

### Step 3: Login To Parent Dashboard Browser Smoke
- Type: browser smoke, with tiny deterministic fixture setup.
- Purpose: protect the first real integrated user journey.
- Intended files:
  - browser smoke test file
  - tiny smoke fixture helper if needed
  - scripts/CI only if Step 2 is stable
- User story: as a parent, I can log in and see my dashboard with my child data.
- Developer tasks:
  - seed parent, subscription, child, routine, and unrelated child/routine as needed
  - log in through UI
  - assert authenticated dashboard appears
  - assert owned child is visible and unrelated child is not visible if the UI exposes enough stable text
- Acceptance criteria:
  - login uses the real UI
  - dashboard visible state is asserted
  - assertions are narrow and user-visible
- Validation commands:
  - API smoke
  - browser smoke command
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - requires production UI changes
  - dashboard async loading is too flaky
  - fixture setup becomes a broad framework
- Must not change:
  - auth behavior, API response shape, frontend behavior

### Step 4: Routine Visibility And Runner Standby Smoke
- Type: browser smoke.
- Purpose: prove the browser can navigate from parent context to a trainable routine.
- Intended files:
  - browser smoke tests
  - small fixture extension if needed
- User story: as a parent, I can see a routine and open the training runner before starting a session.
- Developer tasks:
  - reuse parent/child/routine fixture
  - navigate to routine/training route
  - assert runner standby state and seeded task title
- Acceptance criteria:
  - routine is visible
  - training runner route loads
  - start button is visible
- Validation commands:
  - browser smoke command
  - API smoke if backend fixture changed
  - `pnpm typecheck`
- Stop conditions:
  - navigation requires brittle selectors
  - route depends on broad routine editor setup
- Must not change:
  - routines UI behavior, API response shape

### Step 5: Minimal Training Runner Interaction Smoke
- Type: browser smoke.
- Purpose: protect the product-critical runner path through UI interaction.
- Intended files:
  - browser smoke tests
  - fixture helper extension only if tiny
- User story: as a parent, I can start a session, complete one task, and see the session finish.
- Developer tasks:
  - start session from runner UI
  - complete the seeded task
  - assert completed state and critical text
  - avoid exact timer assertions
- Acceptance criteria:
  - start button works
  - one task completion is recorded
  - final completed state is visible
- Validation commands:
  - browser smoke command
  - API smoke
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - timer behavior makes test flaky
  - completing task requires artificial sleeps
  - assertions become broad snapshots
- Must not change:
  - session lifecycle semantics, badge semantics, frontend behavior

### Step 6: Final Browser-Smoke Checkpoint
- Type: docs-only, maybe CI status update.
- Purpose: decide whether browser smoke should run on every PR, remain manual, or expand.
- Intended files:
  - this roadmap
  - `docs/quality-gate-strategy.md`
- User story: as a maintainer, I want the browser-smoke outcome recorded so future AI work does not expand tests by momentum.
- Developer tasks:
  - record covered browser paths
  - record runtime/flakiness observations
  - decide CI cadence
  - list deferred flows
- Acceptance criteria:
  - merge/continue/defer decision is explicit
  - docs reflect current quality-gate state
- Validation:
  - `git diff --check`
- Stop conditions:
  - browser smoke is unstable
  - CI runtime is too high
- Must not change:
  - production behavior, tests beyond docs if this is review-only

## Deferred Candidates

Do not include these in the first browser wave unless product work directly touches them:
- destructive delete confirmation preview
- badge visibility
- progress dashboard calculation UI
- admin catalog create/update flows
- trainer assignment workflows
- full routine editor CRUD through browser
- multi-child selection edge cases
- cancellation flow in training runner

These are legitimate future tests, but starting with them would increase fixture complexity before the basic browser gate is proven.

## First Implementation Recommendation

Recommended first implementation PR after this docs PR:

Title: `test(web): add browser smoke foundation`

Suggested branch: `test/web-browser-smoke-foundation`

Scope:
- choose the smallest reliable browser runner after implementation-time inspection
- add one app-load smoke for the unauthenticated landing/auth panel
- add the minimal script needed to run it locally
- do not add authenticated dashboard or training-runner assertions yet
- do not wire it into required CI until local and PR stability are proven

Likely files:
- root `package.json` and/or `apps/web/package.json`
- browser smoke config
- one smoke test under a small web smoke test location
- generated-artifact guard update only if the tool creates new local artifacts that must be ignored/blocked
- docs note only if the command or artifact policy needs clarification

Validation:
- new browser smoke command
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Why this is the best first step:
- it separates browser tooling risk from product-flow risk
- it keeps the first PR reviewable
- it proves web startup/rendering before adding auth/data fixtures
- it avoids using browser tests to debug backend basics already covered by API smoke

Stop immediately if:
- the runner requires broad app changes
- the app-load smoke is flaky locally
- setup requires external services
- generated browser artifacts become tracked
- the PR starts adding full e2e scope

## Maintenance Rules

- Update this document after browser-smoke milestones.
- Mark steps completed, deferred, rejected, or superseded.
- Do not let this roadmap become stale input for future Codex work.
- If implementation diverges from the roadmap, update this document in the same PR or a follow-up docs PR.
- Every new browser smoke must identify the production risk it protects and the lower-level tests that already cover backend/business logic.
