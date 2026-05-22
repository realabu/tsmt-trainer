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

## Experiment Execution Model

Browser smoke should start as a controlled experiment, not as a chain of independently merged test PRs.

Execution rules:
- Create one draft PR from a dedicated experiment branch.
- Keep the PR draft until the final outcome review is complete.
- Implement the roadmap as sequential commits/checkpoints inside that same PR.
- Do not merge intermediate commits or checkpoints separately.
- After each checkpoint, Codex reports validation results, changed files, risk notes, and whether stop conditions were hit.
- Continue to the next checkpoint only after the architect accepts the report.
- If a checkpoint becomes too large, flaky, or risky, stop and ask for architect decision before continuing.
- Final decision happens after the complete experiment:
  - merge all
  - split/partial merge
  - continue experiment
  - discard

Suggested branch and PR strategy:
- Record the current `main` commit SHA before starting.
- Optionally create a reference branch or baseline note from current `main`, for example `checkpoint/browser-smoke-before-quality-gate-experiment`.
- Create experiment branch `experiment/browser-smoke-quality-gate`.
- Open one draft PR titled `test(web): browser smoke quality gate experiment`.
- Use small commits for each checkpoint so the final diff can be reviewed or split cleanly.
- Update this roadmap or `docs/quality-gate-strategy.md` only at the final outcome review unless implementation diverges materially.

## Target State Before Final Merge Decision

The experiment should be judged against this target before any merge decision:
- browser runner selected and documented
- one local command runs browser smoke
- app-load/auth-panel smoke passes
- authenticated parent dashboard smoke passes
- child/routine visibility is browser-covered if stable
- runner standby is browser-covered if stable
- minimal runner interaction is included only if it stays stable and small
- no broad full e2e suite
- no brittle snapshots
- generated browser artifacts are ignored or guarded
- runtime/flakiness observations are recorded
- final docs say whether to merge all, split/partial merge, continue, or discard

## Experiment Checkpoints

### Checkpoint 0: Baseline And Runner/Tooling Inspection
- Purpose: establish the experiment baseline and select the smallest viable browser-smoke approach before installing anything.
- Intended changes/files:
  - ideally docs/PR notes only
  - no source, dependency, or test changes unless recording a tiny experiment log is useful
- User story: as a maintainer, I want the browser-smoke runner choice to be evidence-led before the PR starts adding tooling.
- Developer tasks:
  - record baseline `main` SHA
  - inspect web/API startup requirements
  - inspect candidate browser runner compatibility, scripts, generated artifacts, and CI implications
  - confirm whether the first runnable checkpoint should stay local-only or can safely enter CI later
- Acceptance criteria:
  - runner/tooling approach is selected or a stop recommendation is made
  - expected files for Checkpoint 1 are listed
  - no browser tooling is installed yet unless architect explicitly moves to Checkpoint 1
- Validation commands:
  - `git diff --check` if docs changed
  - no app validation required if inspection-only
- Stop conditions:
  - no small reliable runner path is found
  - tool choice requires broad app/CI restructuring
  - dependency/artifact behavior is unclear
- Must not change:
  - production behavior, frontend behavior, backend behavior, Prisma schema, CI, dependencies
- Expected report back to architect:
  - baseline SHA
  - selected runner recommendation
  - expected files for Checkpoint 1
  - CI/artifact risks
  - proceed/stop recommendation

### Checkpoint 1: Browser Tooling Foundation And App-Load/Auth-Panel Smoke
- Purpose: prove a browser runner can start the web app reliably before authenticated product flows are added.
- Intended changes/files:
  - root and/or web package scripts
  - browser smoke config
  - one tiny browser smoke test
  - generated-artifact guard or ignore updates only if the runner creates local artifacts
  - no CI wiring unless it is clearly stable and small
- User story: as a developer, I want one command that proves the app renders in a browser so future browser smoke has a stable base.
- Developer tasks:
  - add minimal runner config and script
  - add one unauthenticated landing/auth-panel smoke
  - document local command if not obvious from package scripts
  - verify generated artifacts are not tracked
- Acceptance criteria:
  - app loads in a real browser
  - landing headline or auth panel is visible
  - no API DB fixture is required yet
  - no authenticated dashboard, training runner, or full e2e flow is added
- Validation commands:
  - new browser smoke command
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - tooling requires broad app or CI restructuring
  - generated browser artifacts become tracked
  - app-load smoke is flaky locally
  - setup requires external services
- Must not change:
  - frontend behavior, API behavior, Prisma schema, backend refactors, production config semantics
- Expected report back to architect:
  - commit hash
  - files changed
  - selected runner and why
  - validation results
  - artifact/CI risk notes
  - proceed/stop recommendation for Checkpoint 2

### Checkpoint 2: Login To Parent Dashboard Visible
- Purpose: protect the first real integrated user journey after the browser foundation is stable.
- Intended changes/files:
  - browser smoke test file
  - tiny deterministic fixture helper if needed
  - script/config updates only if required by authenticated flow
- User story: as a parent, I can log in through the UI and see my dashboard with my child data.
- Developer tasks:
  - seed parent, free subscription, child, routine, and unrelated records only if needed
  - log in through the rendered UI
  - assert authenticated parent dashboard appears
  - assert owned child is visible and unrelated child is not visible if the UI exposes stable text
- Acceptance criteria:
  - login uses the real UI
  - browser storage/reload/auth state works
  - dashboard visible state is asserted narrowly
  - assertions are user-visible and avoid snapshots
- Validation commands:
  - browser smoke command
  - `pnpm --filter @tsmt/api test:smoke` if fixture/API assumptions changed
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - requires production UI changes
  - dashboard async loading is too flaky
  - fixture setup becomes a broad framework
  - failures are hard to diagnose
- Must not change:
  - auth behavior, API response shape, frontend behavior, backend behavior
- Expected report back to architect:
  - commit hash
  - files changed
  - validation results
  - dashboard/auth flakiness notes
  - whether child/routine visibility should continue in Checkpoint 3

### Checkpoint 3: Child/Routine Visibility And Runner Standby
- Purpose: prove the browser can move from parent context toward a trainable routine without mutating session state yet.
- Intended changes/files:
  - browser smoke tests
  - small fixture extension only if needed
- User story: as a parent, I can see my child/routine and open the training runner before starting a session.
- Developer tasks:
  - reuse the Checkpoint 2 fixture where possible
  - assert child and routine visibility with stable user-facing text
  - navigate to the training route
  - assert runner standby state and seeded task title
- Acceptance criteria:
  - owned child/routine is visible
  - unrelated child/routine is not exposed if stable to assert
  - training runner route loads
  - start button and seeded task are visible
- Validation commands:
  - browser smoke command
  - API smoke if fixture assumptions changed
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - navigation requires brittle selectors
  - route depends on broad routine editor setup
  - runner standby is flaky
- Must not change:
  - routines UI behavior, API response shape, frontend behavior, backend behavior
- Expected report back to architect:
  - commit hash
  - files changed
  - validation results
  - selector/navigation risk notes
  - proceed/stop recommendation for Checkpoint 4

### Checkpoint 4: Minimal Runner Interaction, Only If Stable
- Purpose: add the product-critical runner interaction only if prior checkpoints are stable and the test remains small.
- Intended changes/files:
  - browser smoke tests
  - fixture helper extension only if tiny
- User story: as a parent, I can start a session, complete one task, and see the session finish in the browser.
- Developer tasks:
  - start session from runner UI
  - complete the seeded task
  - assert completed state and critical text
  - avoid exact timer assertions and broad snapshots
- Acceptance criteria:
  - start button works
  - one task completion is recorded through UI
  - final completed state is visible
  - test remains stable and diagnosis-friendly
- Validation commands:
  - browser smoke command
  - API smoke
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - timer behavior makes test flaky
  - completing task requires artificial sleeps
  - assertions become broad snapshots
  - test becomes too large for the experiment
- Must not change:
  - session lifecycle semantics, badge semantics, frontend behavior, backend behavior
- Expected report back to architect:
  - commit hash
  - files changed
  - validation results
  - runtime/flakiness notes
  - whether final outcome review should recommend merge all, split, continue, or discard

### Checkpoint 5: Final Outcome Review Docs
- Purpose: decide whether the experiment achieved enough value to merge and how browser smoke should be maintained.
- Intended changes/files:
  - this roadmap
  - `docs/quality-gate-strategy.md`
  - optional experiment review note if the final diff needs a separate section
- User story: as a maintainer, I want the browser-smoke outcome recorded so future AI work does not expand tests by momentum.
- Developer tasks:
  - record baseline and final experiment commit SHAs
  - list changed files and covered browser paths
  - record validation commands/results
  - record runtime/flakiness observations
  - state CI cadence recommendation
  - choose final outcome: merge all, split/partial merge, continue experiment, or discard
- Acceptance criteria:
  - final decision is explicit
  - docs say what is protected and what remains deferred
  - no intermediate checkpoint is treated as already merged
- Validation:
  - `git diff --check`
  - final browser smoke/API smoke/typecheck/build commands as relevant to the experiment state
- Stop conditions:
  - browser smoke is unstable
  - CI/runtime cost is too high
  - final diff is too large to review comfortably
- Must not change:
  - production behavior, tests beyond review docs if this checkpoint is docs-only
- Expected report back to architect:
  - final experiment commit SHA
  - final merge recommendation
  - validations
  - known risks and deferred candidates

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

Recommended next work after this docs PR:

Title: `test(web): browser smoke quality gate experiment`

Suggested branch: `experiment/browser-smoke-quality-gate`

Scope:
- start one draft experiment PR
- record the baseline `main` SHA
- execute Checkpoint 0 first
- execute Checkpoint 1 only after the runner/tooling inspection is accepted
- do not merge after Checkpoint 1
- continue to Checkpoint 2 only after the Checkpoint 1 report is reviewed
- keep all browser-smoke work in the same draft PR until final outcome review

Initial likely files for Checkpoint 1:
- root `package.json` and/or `apps/web/package.json`
- browser smoke config
- one smoke test under a small web smoke test location
- generated-artifact guard update only if the tool creates local artifacts that must be ignored/blocked
- docs note only if the command or artifact policy needs clarification

Initial validation:
- new browser smoke command once Checkpoint 1 exists
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Why this is the best next step:
- it separates browser tooling risk from product-flow risk
- it lets the team judge the whole browser-smoke target state before merging
- it keeps intermediate commits reviewable without pretending each checkpoint is independently production-ready
- it avoids using browser tests to debug backend basics already covered by API smoke

Stop immediately if:
- the runner requires broad app changes
- app-load smoke is flaky locally
- setup requires external services
- generated browser artifacts become tracked
- the PR starts adding full e2e scope
- any checkpoint becomes too large to review comfortably

## Maintenance Rules

- Update this document after browser-smoke milestones.
- Mark steps completed, deferred, rejected, or superseded.
- Do not let this roadmap become stale input for future Codex work.
- If implementation diverges from the roadmap, update this document in the same PR or a follow-up docs PR.
- Every new browser smoke must identify the production risk it protects and the lower-level tests that already cover backend/business logic.
