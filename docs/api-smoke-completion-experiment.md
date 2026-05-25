# API Smoke Completion Experiment

## Purpose
This document plans a controlled API smoke completion experiment before the project moves to browser smoke.

The goal is not exhaustive API coverage. The goal is a small, stable, DB-backed smoke layer that proves the backend foundations needed by a future browser smoke: real auth, parent-owned data access, routine visibility, and one minimal training-session lifecycle path.

## Part A: Current API Smoke Baseline

Historical note: this section records the baseline at planning time before the
experiment PRs were implemented. The final outcome section later in this
document records the completed API smoke state after `#91` and `#92`.

Baseline main commit at planning time: `9796ed88330b0ea6bb4fccd5a5b583c2058473f9`

Current merged smoke milestones:
- `#87` added the DB-backed API smoke foundation.
- `#88` added parent-owned children smoke coverage.
- `#89` added parent-owned routine list smoke coverage.

Current smoke setup:
- `apps/api/test/smoke/smoke-helpers.ts` bootstraps the real Nest `AppModule` in-process.
- Smoke tests require a real `DATABASE_URL`.
- The app listens on a random local port with the same `api` global prefix as production bootstrap.
- Smoke helpers set local JWT test secrets when not already provided.
- Test users are seeded directly through Prisma with hashed passwords and a free subscription.
- Tests authenticate through `POST /api/auth/login`.
- Cleanup currently deletes deterministic smoke users by email, relying on Prisma cascades for owned child/routine records.

Current scripts and CI:
- Root `pnpm test:smoke` delegates to `pnpm --filter @tsmt/api test:smoke`.
- API `test:smoke` compiles test TypeScript and runs only files under `.test-dist/test/smoke`.
- CI runs Postgres 16, `pnpm db:migrate:deploy`, and the API smoke suite.
- Unit tests remain separate and do not require a database.

Current protected smoke coverage:
- Auth path: login through `/api/auth/login`, then access `/api/auth/me`.
- Children ownership path: login, call `/api/children`, verify owned child appears and unrelated child does not.
- Routine ownership path: login, call `/api/routines?childId=...`, verify owned child routine appears and unrelated routine does not.

Current limitations at planning time:
- No API smoke covers session start, task completion, or finish.
- No API smoke verifies a post-finish observable consequence such as session history or progress.
- No API smoke covers badge behavior; this is currently protected by service/domain tests.
- No API smoke covers destructive preview endpoints.
- API shape assertions are intentionally minimal and do not snapshot large raw responses.
- No browser smoke exists yet.

## Part B: Desired Target State Before Browser Smoke

Good enough API smoke coverage before browser smoke means:
- CI remains fast and stable.
- Failures point to backend setup, auth, ownership, or lifecycle wiring clearly.
- The suite protects one real parent training path without becoming a broad e2e suite.
- Smoke fixture data is deterministic, isolated, and does not depend on broad demo seed state.
- No external paid services are required.
- Browser smoke can later assume that backend auth/data/session basics already work.

Target criteria:
- Auth works through the real login endpoint.
- Parent-owned children and routines can be fetched without leaking unrelated parent data.
- A parent can start a session for their routine, complete one task, and finish the session through real API endpoints.
- At least one observable completion consequence is checked through API, preferably session history or progress, without deep badge permutations.
- Critical response fields are asserted, but tests avoid huge raw response snapshots.
- Smoke helpers remain small and readable.
- CI can run the smoke suite on every PR without unacceptable runtime or flakiness.

## Part C: Critical API Smoke Candidates

### 1. Session Lifecycle Happy Path
- User/product value: proves the core torna backend path works through real API.
- Production risk protected: broken session start, timing write, finish update, or protected routing.
- Fixture complexity: medium; needs parent, child, routine, and one ordered task.
- Flakiness risk: low if dates are explicit where possible and assertions are narrow.
- Implementation size: small-medium.
- Include before browser smoke: yes.
- Priority: highest.
- Stop conditions: requires production behavior changes, timing becomes flaky, or test needs broad badge setup.

### 2. Progress Or Session History Observable Consequence
- User/product value: proves finishing a session leaves visible persisted data for dashboard/browser flows.
- Production risk protected: finish succeeds but follow-up reads do not show expected state.
- Fixture complexity: low if attached to the lifecycle smoke fixture.
- Flakiness risk: low for session history, medium for progress if periods/date ranges are involved.
- Implementation size: small if it verifies `/api/sessions?routineId=...` after finish.
- Include before browser smoke: yes, but keep it minimal.
- Priority: high.
- Stop conditions: progress period setup becomes broad or assertion drifts into calculating business rules already covered by unit/service tests.

### 3. Minimal Badge Observable Consequence
- User/product value: badges matter to product trust and motivation.
- Production risk protected: badge orchestration not triggered by finish.
- Fixture complexity: medium-high because badge definitions and trigger conditions must be controlled.
- Flakiness risk: medium due date/time and trigger setup.
- Implementation size: medium.
- Include before browser smoke: probably defer; service tests already cover duplicate prevention and `PERIOD_TARGET_COMPLETED`.
- Priority: later unless badge UI becomes the next browser smoke target.
- Stop conditions: test duplicates `SessionBadgeAwardService` unit/service coverage or needs many badge fixtures.

### 4. Destructive Preview Smoke
- User/product value: protects confirmation data before destructive routine/task/period deletes.
- Production risk protected: UI might show wrong delete impact before a destructive action.
- Fixture complexity: medium.
- Flakiness risk: low.
- Implementation size: small-medium.
- Include before browser smoke: optional, not required before first browser smoke unless destructive UI is the chosen browser flow.
- Priority: medium.
- Stop conditions: starts testing actual delete semantics or cascades instead of preview only.

### 5. Negative Ownership Smoke
- User/product value: protects parent data isolation.
- Production risk protected: cross-family data leak.
- Fixture complexity: low.
- Flakiness risk: low.
- Implementation size: small.
- Include before browser smoke: only if tied to session lifecycle; children/routine ownership is already covered by `#88` and `#89`.
- Priority: medium.
- Stop conditions: repeats existing ownership checks without protecting a new product path.

### 6. Admin/Catalog API Smoke
- User/product value: protects operational catalog flows.
- Production risk protected: admin catalog breaks before UI/admin work.
- Fixture complexity: medium due admin user and catalog relations.
- Flakiness risk: low-medium.
- Implementation size: medium.
- Include before browser smoke: defer unless admin/catalog becomes active product work.
- Priority: later.
- Stop conditions: broad catalog CRUD coverage begins replacing focused service tests.

### 7. Contract/API Shape Smoke
- User/product value: protects frontend assumptions around critical raw response shapes.
- Production risk protected: backend raw include shape drifts unnoticed.
- Fixture complexity: low if folded into existing smoke assertions.
- Flakiness risk: low.
- Implementation size: small.
- Include before browser smoke: yes, but only for critical fields in the selected lifecycle/history paths.
- Priority: high as part of session lifecycle smoke.
- Stop conditions: assertions become broad snapshots.

## Part D: Stories

### Story 1: Parent Can Execute A Minimal Training Session Through Real API
- Value: proves the core parent training backend path works before browser automation depends on it.
- Why it matters before browser smoke: browser runner tests should not be used to debug basic backend lifecycle wiring.
- Acceptance criteria:
  - deterministic parent/child/routine/task fixture is seeded
  - parent logs in through `/api/auth/login`
  - parent starts a session through `POST /api/routines/:routineId/sessions/start`
  - parent completes the seeded task through `POST /api/sessions/:id/tasks/complete`
  - parent finishes the session through `POST /api/sessions/:id/finish`
  - response assertions cover only critical fields
- Out of scope:
  - multiple tasks
  - badge permutations
  - frontend/browser tooling
  - transaction behavior changes
- Regression risk protected: broken auth, routine access, task timing write, finish update, or response flow.
- Failure diagnosis expectation: a failed assertion should name the exact API step that broke.

### Story 2: Finished Session Has One Observable Persisted Consequence
- Value: proves session completion is visible to downstream dashboard/browser flows.
- Why it matters before browser smoke: the frontend needs persisted completed-session data after finishing a training session.
- Acceptance criteria:
  - after finishing, one protected read endpoint shows the completed session state
  - preferred first read is `/api/sessions?routineId=...`
  - optional later read is progress if fixture setup stays tiny and deterministic
- Out of scope:
  - deep progress calculations
  - badge UI assertions
  - broad raw response snapshots
- Regression risk protected: finish endpoint appears successful but persisted read models are broken.
- Failure diagnosis expectation: output should distinguish finish write failure from follow-up read shape failure.

### Story 3: API Smoke Remains Deterministic, Fast, And Isolated
- Value: protects CI reliability and developer trust.
- Why it matters before browser smoke: browser smoke adds more moving parts, so API smoke must be boring first.
- Acceptance criteria:
  - deterministic smoke IDs/emails are used
  - cleanup remains scoped to smoke-owned users/data
  - helper additions are tiny and local to smoke needs
  - smoke suite stays suitable for every PR CI
- Out of scope:
  - generic fixture framework
  - broad demo seed dependency
  - external services
- Regression risk protected: flaky CI and hard-to-debug shared test state.
- Failure diagnosis expectation: setup failures should be obvious as fixture/auth/DB failures.

### Story 4: Optional Destructive Preview Or Ownership Smoke Is Added Only For Concrete Risk
- Value: prevents coverage momentum from bloating smoke tests.
- Why it matters before browser smoke: destructive confirmation UI may be important, but API smoke should not expand without need.
- Acceptance criteria:
  - architect decides whether destructive preview is needed before browser smoke
  - if included, it covers one preview endpoint and high-level counts only
- Out of scope:
  - actual destructive deletes
  - Prisma cascade behavior
  - broad delete-impact permutations
- Regression risk protected: wrong preview data before destructive confirmation.
- Failure diagnosis expectation: preview count failure should be easy to trace to endpoint/query setup.

### Story 5: API Smoke Reaches A Browser-Ready Checkpoint
- Value: makes the handoff to browser smoke deliberate.
- Why it matters before browser smoke: browser tests should begin only when backend basics are pinned and stable.
- Acceptance criteria:
  - final review lists covered smoke paths
  - CI runtime and flakiness observations are recorded
  - decision is made: move to browser smoke, continue API smoke, partially merge, or discard
- Out of scope:
  - implementing browser smoke in this experiment
  - choosing Playwright/Cypress here
- Regression risk protected: premature browser automation on an unstable backend foundation.
- Failure diagnosis expectation: final doc should explain exactly what is safe to assume in browser tests.

## Part E: Developer Subtasks

### Step 1: Planning Document
- Type: docs-only.
- Intended files: `docs/api-smoke-completion-experiment.md`.
- Prerequisites: `#87`, `#88`, and `#89` merged.
- Scope: document baseline, desired target, candidate paths, stories, sequence, gates, and stop conditions.
- Validation:
  - `git diff --check`
  - confirm docs-only diff
- Acceptance criteria: plan is complete enough for architect review.
- Rollback/stop condition: if inspection shows API smoke should stop now and move directly to browser smoke.
- Must not change: production code, tests, CI.

### Step 2: Minimal Session Lifecycle API Smoke
- Type: test-only, with tiny smoke-helper extension only if readability requires it.
- Intended files:
  - `apps/api/test/smoke/session-lifecycle-smoke.test.ts`
  - optionally `apps/api/test/smoke/smoke-helpers.ts`
- Prerequisites: Step 1 approved.
- Scope:
  - seed parent, child, routine, one task
  - login
  - start session
  - complete task
  - finish session
  - assert critical response fields only
- Validation:
  - `pnpm db:generate`
  - `pnpm --filter @tsmt/api test:smoke`
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
  - `pnpm typecheck`
  - `git diff --check`
- Acceptance criteria: one real API lifecycle path passes in CI/local smoke.
- Rollback/stop condition: requires production code changes, broad fixtures, flaky time assertions, or browser tooling.
- Must not change: session semantics, badge semantics, Prisma schema, controller/DTO/API shape.

### Step 3: Minimal Post-Finish Observable Consequence Smoke
- Type: test-only.
- Intended files:
  - likely `apps/api/test/smoke/session-lifecycle-smoke.test.ts`
  - optionally `apps/api/test/smoke/smoke-helpers.ts`
- Prerequisites: Step 2 is stable.
- Scope:
  - after finish, call `GET /api/sessions?routineId=...`
  - verify the completed session appears with critical fields
  - optionally verify task timing count/shape if already in response
- Validation:
  - same as Step 2
- Acceptance criteria: completed session is visible through a protected read path without broad snapshots.
- Rollback/stop condition: assertion becomes a deep response snapshot or duplicates service unit coverage.
- Must not change: response shape, session lifecycle, query semantics.

### Step 4: Gate Review For Optional Extra API Smoke
- Type: inspection-only or docs-only if a short note is useful.
- Intended files: none by default.
- Prerequisites: Steps 2 and 3 pass.
- Scope:
  - decide whether destructive preview, progress, badge observable, or additional ownership smoke is needed before browser smoke
  - prefer stopping if session lifecycle and history are enough
- Validation: none unless a docs note is added.
- Acceptance criteria: architect decision selects one of:
  - add one more API smoke
  - stop API smoke phase and prepare browser smoke
  - update quality strategy
- Rollback/stop condition: candidates feel like coverage momentum rather than production-risk protection.
- Must not change: code/tests unless a later step is approved.

### Step 5: Optional Targeted API Smoke Or Skip
- Type: test-only if approved; otherwise no-op.
- Intended files:
  - one smoke test file under `apps/api/test/smoke`
  - optional tiny helper extension
- Prerequisites: Step 4 approval.
- Scope options:
  - one delete-impact preview endpoint with high-level count assertions
  - one minimal progress read if deterministic setup is tiny
  - one additional session ownership negative path if not already protected by the lifecycle test
- Validation: same as Step 2.
- Acceptance criteria: protects a named production risk and remains small.
- Rollback/stop condition: needs actual delete behavior, broad badge setup, or brittle date math.
- Must not change: production behavior, delete semantics, schema, frontend.

### Step 6: Final Outcome Review And Browser-Readiness Decision
- Type: docs-only.
- Intended files:
  - `docs/api-smoke-completion-experiment.md`
  - possibly `docs/quality-gate-strategy.md` after merge if the strategy should mark API smoke phase complete
- Prerequisites: implemented steps are complete and validated.
- Scope:
  - record baseline/final commits, changed files, covered paths, runtime/flakiness observations, and recommendation
  - decide move to browser smoke, continue API smoke, partial merge, or discard
- Validation:
  - `git diff --check`
  - confirm docs-only diff for final review update
- Acceptance criteria: explicit browser-readiness decision.
- Rollback/stop condition: experiment result is inconclusive or CI is flaky.
- Must not change: source code/tests in the final review commit.

## Part F: Branch / PR Strategy

Recommended baseline/reference/experiment branches:
- Baseline commit: capture current `main` SHA before execution.
- Reference branch: `checkpoint/api-smoke-before-completion-experiment`
- Experiment branch: `experiment/api-smoke-completion`

Recommended PR strategy:
- Use one draft PR from `experiment/api-smoke-completion` to `main`.
- Group execution into small commits:
  - Step 1 planning document
  - Step 2 session lifecycle smoke
  - Step 3 post-finish observable consequence smoke
  - optional Step 5 targeted smoke only if approved
  - Step 6 final outcome review
- Run gate review after Step 3 before adding optional extra smoke.
- Do not open multiple stacked PRs unless the draft PR becomes too large or CI runtime concerns appear.
- Update `docs/quality-gate-strategy.md` only at the final checkpoint or follow-up docs PR, once the API smoke phase outcome is known.

## Part G: Smoke Helper Strategy

Acceptable helper additions:
- `seedSmokeChild(...)` if repeated child fixture setup becomes noisy.
- `seedSmokeRoutineWithTasks(...)` only if it remains small and explicit.
- `loginSmokeUser(...)` already exists and should remain the auth entrypoint.
- A tiny authenticated fetch helper may be acceptable if it reduces repeated token header boilerplate.

Over-engineering to avoid:
- generic fixture factories with many optional parameters
- hidden scenario builders that obscure the API journey
- broad demo seed wrappers
- helpers that embed product assertions
- helpers that silently clean unrelated data

Fixture rules:
- Use deterministic smoke emails and IDs.
- Prefix fixture IDs/emails with `smoke.` or `smoke-`.
- Cleanup by smoke-owned users/emails when possible.
- Avoid shared mutable state across smoke files.
- Prefer direct Prisma fixture setup over broad seed dependency.
- Keep every smoke test readable without opening five helper files.

## Part H: Browser-Smoke Readiness Criteria

Browser smoke should not start until:
- API smoke passes locally and in CI with real Postgres.
- Auth, children ownership, routine ownership, and session lifecycle API smoke exist.
- A finished session has one observable persisted API consequence.
- Smoke fixtures are deterministic and cleanup is scoped.
- CI runtime remains acceptable after API smoke expansion.
- Failure output is understandable enough that backend basics do not need to be debugged through a browser runner.
- No major flakiness has appeared in CI.
- `docs/quality-gate-strategy.md` or this experiment doc records the API smoke phase as complete or sufficient.

## Part I: Final Outcome Review Criteria

The final review must include:
- baseline commit SHA
- final experiment commit SHA
- changed files
- tests added/changed
- scripts or CI changes, if any
- validation commands and results
- smoke paths now covered
- runtime/flakiness observations
- whether API smoke is sufficient to move to browser smoke
- outcome decision:
  - merge all
  - partial merge
  - continue experiment
  - discard

Evaluation questions:
- Did the experiment improve production-readiness without turning into broad e2e?
- Are future Codex changes safer around auth/data/session lifecycle?
- Did helper additions stay small and understandable?
- Is browser smoke now less likely to hide backend setup problems?
- Would a new contributor understand how to extend the smoke layer safely?

## Part J: Stop Conditions

Codex must stop and ask for architect decision if:
- a smoke test requires production behavior changes
- Prisma schema or migration changes appear necessary
- DB cleanup becomes broad or unsafe
- CI runtime becomes too slow for every PR
- tests become flaky or timing-dependent
- helper layer starts becoming a broad framework
- browser tooling becomes necessary
- full e2e scope creeps into API smoke
- response assertions become broad snapshots
- tests require external or paid services
- implementation starts touching frontend
- the next step looks like coverage momentum rather than production-risk protection

## Recommendation

Start the experiment after architect approval.

Recommended execution sequence:
1. Commit this planning document.
2. Create `checkpoint/api-smoke-before-completion-experiment` from current `main`.
3. Create `experiment/api-smoke-completion` from the same baseline.
4. Add one session lifecycle API smoke.
5. Add one post-finish observable consequence smoke.
6. Run gate review before any optional destructive/progress/badge smoke.
7. Add final outcome review and decide whether to move to browser smoke.

The most likely first implementation PR inside the experiment should be `test(api): add session lifecycle smoke`. It should remain test-only, use the existing in-process Nest smoke setup, and avoid badge/progress/destructive preview expansion until the lifecycle path is stable.

## Final Outcome Review

### Baseline And Implemented Steps
Planning baseline:
- `#90` added this API smoke completion experiment plan.
- Planning baseline commit recorded at the time: `9796ed88330b0ea6bb4fccd5a5b583c2058473f9`.

Implemented PRs:
- `#91` `test(api): add session lifecycle smoke`
- `#92` `test(api): assert finished session is listed`

Final merged state after `#92`:
- API smoke now covers the minimal parent training-session lifecycle through real API endpoints.
- API smoke now verifies one post-finish persisted read consequence through `GET /api/sessions?routineId=...`.
- Browser smoke has not started.
- No Playwright/Cypress tooling has been added.
- No production behavior, Prisma schema, frontend, CI, controller, DTO, or service behavior changed as part of this experiment.

Changed smoke test files:
- `apps/api/test/smoke/session-lifecycle-smoke.test.ts`

### API Smoke Paths Now Covered
- `POST /api/auth/login` -> `GET /api/auth/me`
- `GET /api/children` parent ownership visibility and unrelated-child non-leak
- `GET /api/routines?childId=...` parent routine visibility and unrelated-routine non-leak
- `POST /api/routines/:routineId/sessions/start`
- `POST /api/sessions/:id/tasks/complete`
- `POST /api/sessions/:id/finish`
- `GET /api/sessions?routineId=...` verifies the finished session is visible afterward

### Validation Status
Validation reported for `#91`:
- `pnpm db:generate`
- `DATABASE_URL=postgresql://postgres@127.0.0.1:55435/tsmt_trainer_session_smoke pnpm db:migrate:deploy`
- `DATABASE_URL=postgresql://postgres@127.0.0.1:55435/tsmt_trainer_session_smoke pnpm --filter @tsmt/api test:smoke`
- `pnpm --filter @tsmt/api test:unit`
- `pnpm --filter @tsmt/api typecheck`
- `pnpm typecheck`
- `git diff --check`

Validation reported for `#92`:
- `pnpm db:generate`
- `DATABASE_URL=postgresql://postgres@127.0.0.1:55436/tsmt_trainer_session_history_smoke pnpm db:migrate:deploy`
- `DATABASE_URL=postgresql://postgres@127.0.0.1:55436/tsmt_trainer_session_history_smoke pnpm --filter @tsmt/api test:smoke`
- `pnpm --filter @tsmt/api test:unit`
- `pnpm --filter @tsmt/api typecheck`
- `pnpm typecheck`
- `git diff --check`

### Step 4 Gate Review Conclusion
The Step 4 gate review concluded that no further optional API smoke is needed before first browser-smoke planning.

Deferred unless a concrete browser-smoke or product risk later justifies them:
- destructive delete-impact preview smoke
- progress read smoke
- minimal badge observable consequence smoke
- additional negative session ownership smoke
- admin/catalog smoke

Rationale:
- The current smoke layer already proves backend auth, parent-owned data access, routine visibility, session lifecycle, and post-finish session history visibility.
- Additional API smoke candidates would currently add more coverage momentum than production-risk reduction.
- Badge, progress, delete-impact, and ownership edge cases already have stronger service/domain-level coverage and should not be duplicated in smoke unless a specific browser or product flow needs it.

### Outcome Decision
Outcome: `merge all` for the API smoke completion experiment.

The API smoke phase is sufficient as a backend foundation for browser-smoke planning and inspection. Browser-smoke planning is now justified, but browser tooling is intentionally not implemented here.

This does not mean API smoke is exhaustive. It means the backend basics needed by a first browser smoke are stable enough that browser tests should not become the place where auth, ownership, session lifecycle, or post-finish persistence are first debugged.

### Follow-Up Recommendations
- Watch API smoke runtime and flakiness over future CI runs.
- Start browser-smoke work with planning/inspection only.
- Do not add Playwright, Cypress, or another browser tool until the browser-smoke plan chooses the smallest reliable first path.
- If browser inspection identifies a concrete backend/API gap, add one targeted API smoke only after a gate review.
