# TrainingRunner Foundation Experiment

## Purpose
This document records Checkpoint 0 for the controlled `TrainingRunner` foundation experiment.

The goal is not a visual redesign and not a broad frontend rewrite. The goal is to make the core training runner safer for future feature work by isolating the smallest high-risk seams around session control, timing, and derived runner state while preserving behavior.

Experiment branch: `experiment/training-runner-foundation`

Draft PR title: `refactor(web): training runner foundation experiment`

Baseline main SHA: `164ffeea0b4ebf1e58c476349adef9fafcfcd5d0`

## Current Evidence
Inspected files:
- `apps/web/components/training-runner.tsx`
- `apps/web/app/(app)/routines/[id]/train/page.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/use-auth-user.ts`
- `apps/web/lib/training-runner-helpers.ts`
- `apps/web/lib/training-runner-view-model.ts`
- `apps/web/lib/training-runner-task-images.ts`
- `apps/web/lib/__tests__/training-runner-*.test.ts`
- `apps/web/test/smoke/auth-dashboard-smoke.spec.ts`
- `apps/api/src/sessions/sessions.controller.ts`
- `apps/api/src/sessions/sessions.service.ts`
- `apps/api/src/sessions/dto.ts`
- `packages/db/prisma/schema.prisma`
- `packages/types/src/index.ts`

Current route:
- `apps/web/app/(app)/routines/[id]/train/page.tsx` only reads the route id and renders `TrainingRunner`.

Current component size:
- `apps/web/components/training-runner.tsx` is about 719 lines and acts as a mini-application.

## Current Responsibility Map
`TrainingRunner` currently owns:
- routine loading through `GET /api/routines/:id`
- auth-token lookup from local storage
- parent/trainer role-aware control visibility through `useAuthUser`
- local session state
- current status copy
- active image selection state
- celebration animation state
- a live `now` timer tick
- current task start timestamp via `taskStartedAtRef`
- best total-session time derivation from prior routine sessions
- best per-task time derivation from prior completed sessions
- session elapsed-time calculation
- current task elapsed-time calculation
- current task timer scale derivation
- start session mutation through `POST /api/routines/:routineId/sessions/start`
- complete task mutation through `POST /api/sessions/:id/tasks/complete`
- automatic finish mutation for the last task through `POST /api/sessions/:id/finish`
- cancel mutation through `POST /api/sessions/:id/cancel`
- routine snapshot refresh after task completion/finish
- standby rendering
- active runner rendering
- finished runner rendering
- image gallery rendering
- song/demo/equipment rendering
- timer ring rendering
- progress/sidebar rendering
- cancel confirmation flow

## State Owned Today
React state:
- `routine`
- `session`
- `status`
- `now`
- `activeImageIndex`
- `celebrationBurst`

Mutable ref:
- `taskStartedAtRef`

Derived state:
- `completedCount`
- `activeTasks`
- `totalTaskCount`
- `isFinished`
- `isRunning`
- `bestSeconds`
- `bestTaskSecondsById`
- view-model values from `buildTrainingRunnerViewModel(...)`
- `currentTaskBestSeconds`
- `sessionElapsedSeconds`
- `currentTaskElapsedSeconds`
- `currentTaskScaleSeconds`
- `celebrationPieces`

## Current API Orchestration
The runner directly orchestrates:
- `GET /api/routines/:routineId`
- `POST /api/routines/:routineId/sessions/start`
- `POST /api/sessions/:sessionId/tasks/complete`
- `POST /api/sessions/:sessionId/finish`
- `POST /api/sessions/:sessionId/cancel`

The risky behavior is not the endpoint list itself. The risk is the sequencing:
1. load routine
2. start session
3. set first task start ref
4. complete current task with seconds/timestamps
5. show celebration
6. if last task, call finish
7. reset task start ref
8. refresh routine snapshot
9. set status copy

This sequence is product-critical and easy for future AI-assisted changes to break.

## Existing Coverage
Already protected:
- Pure duration/ring/initials helpers have unit tests.
- Current task image selection has unit tests.
- Runner view-model task/next/progress/label fallbacks have unit tests.
- API smoke covers real backend session lifecycle: login, start session, complete task, finish session, and post-finish session listing.
- Local-first browser smoke covers real UI login, dashboard, owned child/routine visibility, runner standby, one-task session start, task completion, and completed runner state.

Not sufficiently protected:
- direct unit-level characterization of `TrainingRunner` session action sequencing
- cancel confirmation and cancel API behavior
- trainer read-only runner behavior beyond visible control differences
- multi-task advancement behavior in the browser
- API error-to-status-copy behavior
- stale/double-click risks around in-flight mutations
- no dedicated component/hook tests for runner action orchestration

## Production-Risk Findings
Production-risky:
- session-control sequencing: start, complete, auto-finish, refresh, and ref reset must stay in order
- time payload generation: `secondsSpent`, `startedAt`, and `completedAt` are generated in the UI and sent to backend
- last-task behavior: the same button completes the task and finishes the session
- cancel behavior: destructive session cancellation relies on `window.confirm`
- role behavior: trainer view hides mutating controls
- routine snapshot refresh after completion affects best-time and finished-state display

Mostly maintainability risk, not immediate production risk:
- large JSX tree
- equipment/song/media rendering branches
- inline status strings
- inline celebration-piece creation

## Target-State Architecture
Target shape for this experiment:

```text
apps/web/components/training-runner.tsx
  Small container/composition component.
  Owns high-level rendering and wires extracted hooks/components.

apps/web/components/training-runner/
  session-control.ts or use-training-session-control.ts
    Session action orchestration and status transitions.
  timer-state.ts or training-runner-time.ts
    Pure elapsed-time and timer-scale helpers, only if needed.
  training-runner-stage.tsx
    Active/finished stage rendering, optional later.
  training-runner-standby.tsx
    Standby state rendering, optional later.
  training-runner-sidebar.tsx
    Timer/progress/control rendering, optional later.

apps/web/lib/training-runner-view-model.ts
  Continue to own pure derived display state.

apps/web/lib/training-runner-task-images.ts
  Continue to own task image selection.
```

The first implementation should not attempt the full target shape. It should create only the smallest boundary that lowers risk.

## Extraction Epics

### Epic 1: Session-Control Safety And Boundary
Why needed:
- This is the highest-risk seam because it mutates backend session state and mixes UI refs, timestamps, routine refresh, status messages, and auto-finish sequencing.

Production risk protected:
- accidental endpoint/order changes
- accidental omission of routine refresh after completion
- incorrect task timing payload
- broken finished state after the last task

AI-maintainability benefit:
- future changes can reason about runner lifecycle actions without scanning the 719-line render tree.

Behavior that must remain unchanged:
- API endpoints and request payload fields
- status messages
- timestamp behavior except explicitly approved future work
- role behavior
- last-task auto-finish behavior
- routine refresh after completion/finish

Coverage to rely on:
- API smoke for backend lifecycle
- browser smoke for one-task UI happy path
- existing helper tests for display derivation

New tests needed:
- first add characterization around the extracted action helper/hook with mocked dependencies
- pin start success path, complete non-last path, complete last-task auto-finish path, and error status copy
- cancel can be deferred unless the extraction touches it

Implementation risk:
- medium, because it touches live UI mutation flow

Must-have before serious runner feature work:
- yes, if future work changes runner controls, timing, completion, or session lifecycle UX

### Epic 2: Timer / Progress Pure Helpers
Why needed:
- Timer display and scaling are currently derived inline from `now`, session state, previous bests, and current task expectations.

Production risk protected:
- low-to-medium; incorrect time display is user-visible but backend calculations are already protected elsewhere.

AI-maintainability benefit:
- reduces inline derived state and makes timer behavior easier to test.

Behavior that must remain unchanged:
- elapsed-time fallback to `session.totalSeconds`
- current-task elapsed reset behavior
- minimum scale of 20 seconds

Coverage to rely on:
- existing `formatDuration` and ring-style tests
- browser smoke avoids exact timer assertions

New tests needed:
- pure helper tests for elapsed seconds and scale if extracted

Implementation risk:
- low if pure helpers only

Must-have before serious runner feature work:
- optional unless feature work touches timer/progress visuals.

### Epic 3: Runner State / View-Model Expansion
Why needed:
- Some derived data is already extracted, but best-session/best-task calculations and status-state decisions remain inline.

Production risk protected:
- medium for best-time copy and progress display; lower for mutation correctness.

AI-maintainability benefit:
- reduces render component reasoning load.

Behavior that must remain unchanged:
- completed-session filter semantics
- per-task best-time minimum selection
- current/next task semantics

Coverage to rely on:
- existing view-model tests

New tests needed:
- pure tests for best total and per-task time derivation if moved

Implementation risk:
- low-to-medium

Must-have before serious runner feature work:
- optional after session-control seam is safer.

### Epic 4: Media / Stage Rendering Components
Why needed:
- Image, song, demo video, equipment, and active/finished stage markup are large and visually complex.

Production risk protected:
- mostly low. This reduces accidental rendering regressions, but less important than session-control sequencing.

AI-maintainability benefit:
- improves readability and makes the component less intimidating.

Behavior that must remain unchanged:
- image source ordering
- selected image behavior
- fallback initials
- song/default-song/demo-video fallbacks
- equipment chips

Coverage to rely on:
- current image helper tests
- browser smoke sees seeded task title, not all media branches

New tests needed:
- none required if purely presentational and behavior-preserving, unless new helper logic is introduced

Implementation risk:
- low-to-medium due to markup/class churn

Must-have before serious runner feature work:
- deferred unless feature work touches media/stage rendering.

### Epic 5: Completion / Finished View Component
Why needed:
- Finished-state rendering mixes result copy with best-time comparison and action button behavior.

Production risk protected:
- medium if future work changes completion outcome UX.

AI-maintainability benefit:
- makes completed-state behavior easier to locate.

Behavior that must remain unchanged:
- best-time comparison copy
- "Uj torna inditasa" action
- displayed total duration

Coverage to rely on:
- browser smoke verifies visible finished state

New tests needed:
- likely not first; consider only if completion UX changes

Implementation risk:
- low

Must-have before serious runner feature work:
- optional.

## Deferred Extractions
Defer by default:
- broad visual component split
- generic API client abstraction
- global runner state machine
- moving auth-token storage behavior
- adding rendered component test tooling
- adding more browser smoke
- changing timer semantics
- changing cancellation UX

These may become useful later, but they are not the first production-risk-reducing move.

## User Stories

### Story 1: Parent Can Complete A Runner Session Reliably
Value:
- The core product promise depends on parents starting, completing, and finishing tornák safely.

Acceptance criteria:
- current one-task browser smoke remains passing
- session-control behavior is isolated enough that start/complete/finish sequencing is readable in one small module
- no API endpoint, DTO, response shape, or UI behavior changes

Out of scope:
- badges, progress, destructive flows, multi-task e2e expansion

Regression risks:
- incorrect task timing payload
- failure to finish last task
- losing completed state
- stale routine snapshot

### Story 2: Future AI Changes Can Touch Runner Features Without Relearning The Whole Component
Value:
- The runner is a core UI hotspot; future Codex changes should not need to scan a 719-line file to adjust session controls.

Acceptance criteria:
- session action orchestration has a named boundary
- tests pin the boundary enough to catch endpoint/order regressions
- `TrainingRunner` gets smaller without hidden behavior changes

Out of scope:
- broad component redesign
- full state-machine rewrite

Regression risks:
- over-abstracting state into a hook that hides side effects
- brittle mocks that merely mirror implementation

### Story 3: Timer And Display Derivation Stay Predictable
Value:
- Time/progress display must remain understandable and testable as runner UX evolves.

Acceptance criteria:
- if touched, elapsed-time and timer-scale derivation move to pure helpers with tests
- no exact browser-time assertions are introduced

Out of scope:
- changing backend total-second calculation
- changing timer UI design

Regression risks:
- flaky timer tests
- mismatched UI/backend duration semantics

## Proposed Experiment Checkpoints

### Checkpoint 0: Deep Inspection And Extraction Plan
Type: docs-only

Intended files:
- `docs/training-runner-foundation-plan.md`

Validation:
- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:
- responsibilities, risks, target architecture, checkpoint sequence, and stop conditions are documented
- draft PR exists for architect review

### Checkpoint 1: Characterize Session-Control Seam
Type: test-only or tiny test-support-only if possible

Purpose:
- pin the current session-control decisions before moving them out of the component.

Likely files:
- `apps/web/lib/training-runner-session-control.ts`
- `apps/web/lib/__tests__/training-runner-session-control.test.ts`
- or a temporary pure helper only if direct hook testing would require new tooling

Developer tasks:
- identify the smallest pure extraction point for action payload/transition decisions
- add focused tests for:
  - start success status/ref expectations if expressible without React tooling
  - complete-task payload shape
  - last-task finish decision
  - status-message mapping for success/error

Acceptance criteria:
- tests protect real session-control behavior without rendered component tooling
- no production behavior changes
- no broad test framework introduced

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Stop conditions:
- tests require a broad React component test setup
- pure seam is artificial or duplicates too much implementation
- assertions become brittle snapshots of internal objects without production-risk value

### Checkpoint 2: Extract Session-Control Boundary
Type: refactor-only plus tests

Purpose:
- move the highest-risk mutation/session action flow behind a named boundary while preserving UI behavior.

Likely files:
- `apps/web/components/training-runner.tsx`
- `apps/web/lib/training-runner-session-control.ts` or `apps/web/components/training-runner/use-training-session-control.ts`
- `apps/web/lib/__tests__/training-runner-session-control.test.ts`

Developer tasks:
- extract only session-control action orchestration or the smallest helper boundary proven in Checkpoint 1
- keep rendering in `TrainingRunner`
- keep `apiFetch` semantics unchanged
- keep auth storage behavior unchanged
- keep browser smoke scope unchanged

Acceptance criteria:
- one-task browser smoke remains passing locally when DB is available
- unit tests pass
- no endpoint, DTO, schema, API response, or visual behavior changes
- `TrainingRunner` has less mutation orchestration inline

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm --filter @tsmt/web test:smoke:app`
- `pnpm --filter @tsmt/web test:smoke:auth` if local DB is available
- `pnpm check:generated`
- `git diff --check`

Stop conditions:
- extraction changes session lifecycle behavior
- hook/helper hides side effects behind a generic abstraction
- local browser smoke becomes flaky
- auth/full browser smoke cannot be run and no lower-level validation compensates

### Checkpoint 3: Timer / Best-Time Helper, Only If Still Justified
Type: pure helper extraction

Purpose:
- reduce remaining inline derived time logic only if Checkpoint 2 leaves a clear, valuable seam.

Likely files:
- `apps/web/lib/training-runner-time.ts`
- `apps/web/lib/__tests__/training-runner-time.test.ts`
- `apps/web/components/training-runner.tsx`

Acceptance criteria:
- elapsed-time and scale semantics are pinned by pure tests
- no timer UX changes
- no exact browser-time assertions are introduced

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm typecheck`
- `git diff --check`

Stop conditions:
- extraction is cosmetic only
- timer tests become brittle or fake too much time machinery

### Checkpoint 4: Optional Presentational Split, Only If Reviewability Needs It
Type: refactor-only

Purpose:
- split one visual section only if the component remains hard to review after session-control and timer seams are addressed.

Likely candidates:
- standby state
- image/stage column
- sidebar controls/progress

Acceptance criteria:
- one cohesive visual section moves
- no behavior or class-name changes unless unavoidable and explicitly called out
- no new business logic in presentational components

Validation:
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm --filter @tsmt/web test:smoke:app`
- `pnpm --filter @tsmt/web test:smoke:auth` if local DB is available
- `git diff --check`

Stop conditions:
- markup churn becomes large
- CSS changes are needed
- diff becomes hard to review

### Checkpoint 5: Final Outcome Review
Type: docs-only

Purpose:
- decide whether the experiment should merge, split, continue, or discard.

Likely files:
- `docs/training-runner-foundation-plan.md`
- possibly `docs/refactor-roadmap.md` or `docs/architecture-refactor-audit.md` after merge, not before

Final review checklist:
- baseline main SHA
- final experiment commit SHA
- changed files
- public API/controller/DTO/schema unchanged confirmation
- frontend behavior unchanged confirmation
- browser smoke scope unchanged confirmation
- tests added/changed
- validation commands and results
- `TrainingRunner` responsibility/LOC before-after summary
- remaining risks
- outcome decision:
  - merge all
  - split/partial merge
  - continue experiment
  - discard

## Recommended Next Checkpoint
Proceed to Checkpoint 1: characterize the session-control seam.

Recommended first implementation target:
- build a tiny session-control helper around deterministic decisions that currently sit inside `completeCurrentTask(...)`, especially:
  - complete-task payload construction
  - last-task finish decision
  - success status message selection

Reason:
- It protects the highest production-risk behavior without immediately moving React state, API calls, or rendering.
- It gives us evidence before deciding whether a hook extraction is genuinely useful or merely rearranges complexity.

## Must-Not-Change Constraints
- Do not change API endpoints.
- Do not change DTOs.
- Do not change Prisma schema.
- Do not change session lifecycle semantics.
- Do not change badge/progress semantics.
- Do not change browser smoke scope by momentum.
- Do not wire browser smoke into CI.
- Do not add Docker/local DB orchestration.
- Do not introduce a broad frontend test framework without architect approval.
- Do not duplicate auth/session logic across components.
- Do not add new business logic to the route file or presentational components.

## Stop Conditions
Codex must stop and ask for architect review if:
- extraction requires frontend behavior changes
- production API behavior needs to change
- a new React/component test stack appears necessary
- browser smoke becomes flaky
- the helper/hook becomes a hidden state machine broader than session control
- timer behavior needs semantic changes
- cancellation UX needs to change
- CI/browser smoke promotion becomes necessary
- diff grows beyond a small reviewable checkpoint
- the next step looks cosmetic rather than risk-reducing

## Rollback / Split Strategy
- The experiment stays in one draft PR until final review.
- Intermediate commits should be independently understandable.
- If Checkpoint 2 is valuable but later presentational splits are too noisy, split/merge only Checkpoints 0-2.
- If session-control extraction adds complexity without reducing risk, discard implementation commits and keep only the plan as historical reference if useful.
