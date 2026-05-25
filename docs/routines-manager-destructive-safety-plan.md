# RoutinesManager Destructive Safety Experiment

## Purpose
This document records Checkpoint 0 for the controlled `RoutinesManager` destructive safety experiment.

The goal is to reduce routine editor destructive-flow risk before upcoming routine-editor or UX work. This is not backend routines refactoring, not a broad UI rewrite, not TaskBuilder redesign, and not browser-smoke expansion by momentum.

Future work touching routine, period, or task deletion must inspect `docs/foundation-risk-register.md`, `docs/routines-manager-foundation-plan.md`, `docs/task-builder-foundation-plan.md`, and this plan before implementation.

## Experiment Setup
- Baseline main SHA: `c2c7a1a259356250c5668cb2d72ff437ae18129e`
- Experiment branch: `experiment/routines-manager-destructive-safety`
- Draft PR title: `refactor(web): routines manager destructive safety experiment`
- Current checkpoint: Checkpoint 0, inspection and safety plan only

## Current Context
Recent foundation work:
- `#99` reduced routine editor save orchestration risk with `buildRoutineEditorSavePlan(...)` and focused tests.
- `#101` reduced TaskBuilder draft-operation risk with `task-builder-draft` helpers and focused tests.
- Backend routine delete-impact preview orchestration is already behind `RoutineDeleteImpactService`.
- Routines backend refactoring remains paused by default.

Decision from the joint TrainingRunner + RoutinesManager pre-feature audit:
- `TrainingRunner` remains acceptable but inspect first.
- `RoutinesManager` remains acceptable generally, but should be treated as needing targeted safety before routine-editor/destructive UX work.
- The selected next target is destructive preview and confirmation safety.

## Inspected Files
- `docs/foundation-risk-register.md`
- `docs/routines-manager-foundation-plan.md`
- `docs/task-builder-foundation-plan.md`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`
- `docs/quality-gate-strategy.md`
- `apps/web/components/routines-manager.tsx`
- `apps/web/components/task-builder.tsx`
- `apps/web/lib/routines-manager-save-plan.ts`
- `apps/web/lib/__tests__/routines-manager-save-plan.test.ts`
- `apps/web/lib/routines-manager-payloads.ts`
- `apps/web/lib/__tests__/routines-manager-payloads.test.ts`
- `apps/web/lib/routines-manager-helpers.ts`
- `apps/web/lib/__tests__/routines-manager-helpers.test.ts`
- `apps/web/lib/task-builder-draft.ts`
- `apps/web/lib/__tests__/task-builder-draft.test.ts`
- `apps/web/test/smoke/auth-dashboard-smoke.spec.ts`
- `apps/api/src/routines/routine-delete-impact.service.ts`
- `apps/api/src/routines/routines.service.ts`
- `apps/api/src/routines/routines.controller.ts`
- `apps/api/test/routines/routines-delete-impact-service.test.ts`
- `apps/api/test/routines/routine-delete-impact.test.ts`
- `apps/api/test/routines/routines-task-crud.test.ts`
- `apps/api/test/routines/routines-period-crud.test.ts`
- `packages/db/prisma/schema.prisma`

Current component size:
- `apps/web/components/routines-manager.tsx`: 618 lines
- `apps/web/components/task-builder.tsx`: 393 lines

## Current Destructive-Flow Responsibility Map
`RoutinesManager` currently owns:
- routine delete-impact preview state
- period delete-impact preview state
- task delete-impact preview state
- preview request API calls for routine, period, and task
- delete confirmation API calls for routine, period, and task
- preview cancel/reset handlers
- status copy for preview load, delete success, and delete failure
- local editor cleanup after successful task and period deletes
- parent data reload after successful deletes
- `TaskBuilder` destructive callback wiring for persisted task deletes

`TaskBuilder` currently owns:
- deciding whether the task delete button removes an unsaved draft locally or delegates persisted task deletion to `RoutinesManager`
- rendering the task delete-impact panel when `taskDeleteImpact.entityId` matches the task id
- calling `onConfirmDeleteTask(task.id)` for persisted task deletion
- calling `onCancelDeleteTask()` for task delete-preview cancellation

Backend routines currently own:
- delete-impact preview lookup and count orchestration
- ownership checks for preview endpoints
- actual routine, task, and period delete behavior
- cascade-sensitive delete semantics through Prisma relations

## Current Preview / Target State Map
Three independent preview state slots exist in `RoutinesManager`:

| State | Preview target | Render location | Confirm target |
| --- | --- | --- | --- |
| `routineDeleteImpact` | `routineDeleteImpact.entityId` | routine list item delete card | `routineDeleteImpact.entityId` |
| `periodDeleteImpact` | `periodDeleteImpact.entityId` | matching persisted period row in the open editor | `period.id` from the rendered row |
| `taskDeleteImpact` | `taskDeleteImpact.entityId` | matching persisted task row inside `TaskBuilder` | `task.id` from the rendered row |

Important current behavior:
- Routine preview request sets `routineDeleteImpact`, clears `periodDeleteImpact` and `taskDeleteImpact`, and closes the editor with `setEditingRoutineId("")`.
- Period preview request sets `periodDeleteImpact` and clears `taskDeleteImpact`.
- Task preview request sets `taskDeleteImpact` and clears `periodDeleteImpact`.
- Period and task preview requests do not currently clear `routineDeleteImpact`.
- Opening an editor clears all three preview states.
- Cancelling a specific preview only clears that preview slot.
- Confirm handlers do not require an explicit preview state for task or period deletes; they use the rendered row id and only require an access token.

This plan intentionally documents the current behavior without changing it. Whether period/task preview requests should clear routine preview is a later architect decision, not a hidden Checkpoint 0 behavior change.

## Routine Delete Flow Map
Request:
1. User clicks `Torles` on a routine list item.
2. `requestRoutineDeleteImpact(routine.id)` reads `tsmt.accessToken`.
3. It calls `GET /api/routines/:routineId/delete-impact`.
4. On success it sets `routineDeleteImpact`, clears `periodDeleteImpact` and `taskDeleteImpact`, closes the editor, and sets status copy.
5. On failure it keeps existing preview state and sets error status copy.

Confirm:
1. Confirmation button is rendered only when `routineDeleteImpact.entityId === routine.id`.
2. `confirmRoutineDelete()` requires access token and `routineDeleteImpact`.
3. It calls `DELETE /api/routines/:routineDeleteImpact.entityId`.
4. On success it clears `routineDeleteImpact`, reloads parent data, and sets success status copy.
5. On failure it keeps preview state and sets error status copy.

Cancel:
- The routine cancel button only sets `routineDeleteImpact(null)`.

## Period Delete Flow Map
Request:
1. User clicks `Idoszak torlese` in the open editor.
2. Unsaved periods are removed locally with `removePeriodDraft(index)`.
3. Persisted periods call `requestPeriodDeleteImpact(period.id)`.
4. The preview request calls `GET /api/routines/periods/:periodId/delete-impact`.
5. On success it sets `periodDeleteImpact`, clears `taskDeleteImpact`, and sets status copy.
6. On failure it keeps existing preview state and sets error status copy.

Confirm:
1. Confirmation card is rendered only when `period.id && periodDeleteImpact.entityId === period.id`.
2. Confirm calls `confirmPeriodDelete(period.id)`.
3. The function requires access token but does not require `periodDeleteImpact`.
4. It calls `DELETE /api/routines/periods/:periodId`.
5. On success it removes the period from local editor state, removes the id from `originalPeriodIds`, clears `periodDeleteImpact`, reloads parent data, and sets status copy.
6. On failure it keeps local editor state and preview state, and sets error status copy.

Cancel:
- The period cancel button only sets `periodDeleteImpact(null)`.

## Task Delete Flow Map
Request:
1. User clicks `Torles` for a task in `TaskBuilder`.
2. Unsaved tasks are removed locally inside `TaskBuilder`.
3. Persisted tasks delegate to `RoutinesManager` through `onRequestRemoveTask`.
4. `requestTaskDeleteImpact(task.id)` calls `GET /api/routines/tasks/:taskId/delete-impact`.
5. On success it sets `taskDeleteImpact`, clears `periodDeleteImpact`, and sets status copy.
6. On failure it keeps existing preview state and sets error status copy.

Confirm:
1. TaskBuilder renders the confirmation panel only when `task.id && taskDeleteImpact.entityId === task.id`.
2. Confirm calls `onConfirmDeleteTask(task.id)`, which is `confirmTaskDelete(taskId)` from `RoutinesManager`.
3. The function requires access token but does not require `taskDeleteImpact`.
4. It calls `DELETE /api/routines/tasks/:taskId`.
5. On success it removes the task from local editor state, normalizes remaining task `sortOrder`, removes the id from `originalTaskIds`, clears `taskDeleteImpact`, reloads parent data, and sets status copy.
6. On failure it keeps local editor state and preview state, and sets error status copy.

Cancel:
- The task cancel button calls `onCancelDeleteTask`, which only sets `taskDeleteImpact(null)`.

## TaskBuilder Callback Boundary Map
TaskBuilder receives:
- `tasks`
- `onChange`
- optional `onRequestRemoveTask`
- optional `taskDeleteImpact`
- optional `onConfirmDeleteTask`
- optional `onCancelDeleteTask`

Current boundary rules:
- TaskBuilder may remove unsaved tasks locally.
- TaskBuilder must not fetch delete-impact previews.
- TaskBuilder must not call delete endpoints.
- TaskBuilder renders the task-level preview panel based on parent-owned `taskDeleteImpact`.
- RoutinesManager remains responsible for persisted task preview, confirmation, status, reload, and local editor cleanup.

This boundary is simple enough to keep, but any future TaskBuilder or routine editor destructive-flow work must treat it as a shared seam rather than editing either component blindly.

## Backend Delete-Impact API Assumption Map
Frontend assumptions:
- `GET /api/routines/:routineId/delete-impact` returns `DeleteImpactRecord` for an owned routine.
- `GET /api/routines/periods/:periodId/delete-impact` returns `DeleteImpactRecord` for an owned period.
- `GET /api/routines/tasks/:taskId/delete-impact` returns `DeleteImpactRecord` for an owned task.
- Returned `entityId` identifies the entity the confirmation panel should match.
- Returned `entityLabel`, `parentLabel`, `deletes`, `detaches`, and `notes` are display-ready.
- Delete endpoints return success or throw through `apiFetch`; frontend does not parse a detailed success body.

Backend protections already exist:
- `RoutineDeleteImpactService` checks ownership through routine child ownership for routine, period, and task previews.
- Service tests assert lookup and count query shapes for routine, period, and task previews.
- Pure delete-impact builder tests assert current impact shapes.
- CRUD tests cover current actual delete calls for routine, task, and period.

Schema/delete facts relevant to destructive UX:
- Deleting a routine cascades routine tasks, periods, sessions, task timings, and trainer assignments through Prisma relations.
- Routine badge awards detach through nullable routine/period links rather than deleting the award row.
- Deleting a task cascades task media links and session task timings.
- Deleting a period detaches related badge awards through nullable period links.

## Existing Coverage Map
Strong existing coverage:
- `routines-manager-save-plan.test.ts` protects removed task/period id detection and save operation order.
- `routines-manager-payloads.test.ts` protects task/period/create payload shape.
- `routines-manager-helpers.test.ts` protects routine response to editor draft mapping.
- `task-builder-draft.test.ts` protects custom/catalog draft defaults, duplicate catalog prevention, and sort normalization.
- Backend delete-impact service and builder tests protect preview shape and count/ownership assumptions.
- Backend routine CRUD tests protect current actual delete call behavior.
- API smoke protects parent-owned routine listing and non-leakage.
- Browser smoke protects owned routine visibility and runner navigation, not routine editor destructive flows.

Missing coverage:
- no frontend unit coverage for delete-impact preview state transitions
- no frontend unit coverage for preview-to-confirm target matching decisions
- no frontend characterization of which competing preview slots are cleared by each request
- no rendered component coverage for routine, period, or task delete previews
- no browser smoke for routine editor destructive previews
- no guard for duplicate/in-flight delete clicks
- no guard for duplicate/in-flight save clicks

## Production Risks
Production-risky, not merely ugly:
- A stale or competing preview can confuse which destructive action is currently being confirmed.
- Period/task confirm functions do not require preview state, so UI rendering is the current practical guard against unpreviewed confirmation.
- Routine preview and editor state interact: routine preview closes the editor, while period/task previews happen inside the editor.
- Task delete preview crosses the `RoutinesManager` and `TaskBuilder` boundary.
- Successful period/task deletes mutate local editor state and baseline id arrays before reloading data.
- Delete behavior is cascade-sensitive; accidental target drift can delete session timings or detach badge relationships.
- Partial save and duplicate/in-flight mutation behavior remain separate risks, but this checkpoint focuses on destructive preview/confirm safety.

## AI-Maintainability Risks
- Future AI changes could alter preview-clearing behavior while moving JSX or simplifying state.
- The current behavior is spread across state declarations, request functions, confirm functions, inline render checks, and TaskBuilder callbacks.
- The UI has three preview state slots but no named model for active destructive target state.
- It is easy to accidentally change destructive behavior while making routine editor UX changes.

## Target-State Options

### Option A: Documentation Guard Only
Keep the current implementation unchanged and rely on this plan plus existing tests.

Use when:
- upcoming product work does not touch deletion, confirmation, or destructive preview state.

Pros:
- zero behavior risk
- no new abstraction

Cons:
- preview-state decisions remain untested and inline

Current recommendation:
- insufficient if routine editor/destructive UX is likely to be touched soon.

### Option B: Pure Delete-Preview State Helper
Add a tiny pure helper that models current preview slot transitions and target matching.

Potential file:
- `apps/web/lib/routines-manager-delete-impact.ts`

Potential tests:
- `apps/web/lib/__tests__/routines-manager-delete-impact.test.ts`

The helper should model deterministic state decisions only:
- initial empty preview state
- request routine preview success transition
- request period preview success transition
- request task preview success transition
- cancel routine/period/task preview transition
- matching a preview by type/id for rendering

It should not:
- perform API calls
- own React state
- change UI copy
- change delete semantics
- hide destructive side effects
- become a generic reducer/state machine broader than delete-impact preview state

Current recommendation:
- best first implementation candidate if Checkpoint 1 is approved.

### Option C: Direct Component Usage Of Preview Helper
Use the pure helper inside `RoutinesManager` after Checkpoint 1 characterization proves it fits naturally.

Use when:
- the helper makes current behavior easier to read without changing request/confirm sequencing.

Pros:
- reduces inline destructive state manipulation
- makes future UX work inspectable

Cons:
- closer to behavior-sensitive code; must preserve exact current clearing behavior unless architect approves a behavior change

Current recommendation:
- possible Checkpoint 2 only after Checkpoint 1 review.

### Option D: Rendered Component Tests
Add rendered tests for destructive preview panels.

Use when:
- pure state characterization is insufficient because the risk is DOM/event wiring rather than state decisions.

Pros:
- closer to user behavior

Cons:
- introduces test tooling or a new testing pattern
- higher maintenance and setup cost

Current recommendation:
- defer. Do not introduce rendered test tooling in this experiment unless a later checkpoint proves it is necessary and architect-approved.

### Option E: Behavior Change To Clear All Competing Previews
Change period/task preview requests so they also clear routine preview, or unify active preview into a single slot.

Use when:
- architect explicitly decides stale competing previews are a current bug, not just an uncharacterized risk.

Pros:
- may simplify mental model

Cons:
- visible behavior change
- must be reviewed as product/UX behavior, not a refactor

Current recommendation:
- defer. First characterize current behavior; do not change it silently.

## Extraction / Test Epics

### Epic 1: Preview State Characterization
Why needed:
- Current destructive preview behavior is target-sensitive and spread across request, cancel, and render logic.

Production risk protected:
- stale preview drift
- wrong preview target
- accidental clearing/retention changes during UX work

AI-maintainability benefit:
- Future changes can inspect preview transition tests instead of reverse-engineering a large component.

Behavior that must remain unchanged:
- which preview slots are set or cleared
- preview entity matching
- status copy
- API endpoints
- delete semantics

Current coverage to rely on:
- backend delete-impact tests
- routine save-plan and TaskBuilder draft tests

New tests needed:
- pure tests for routine, period, and task preview success transitions
- pure tests for cancel transitions
- pure tests for preview-target matching
- tests should explicitly pin the current fact that period/task preview requests do not clear routine preview unless a later architect decision changes it

Implementation risk:
- low to medium if kept pure and small

Must-have before routine editor/destructive UX work:
- yes

### Epic 2: Helper Usage In RoutinesManager
Why needed:
- Characterization alone helps, but component usage prevents inline state edits from drifting.

Production risk protected:
- accidental future edits to preview-clearing behavior
- inconsistent cancel/reset behavior

AI-maintainability benefit:
- Destructive preview state gets a named local model while API side effects remain visible.

Behavior that must remain unchanged:
- all request, confirm, cancel, reload, and status behavior unless architect explicitly approves behavior changes

Current coverage to rely on:
- Epic 1 tests
- existing web unit tests
- backend delete-impact tests

New tests needed:
- no rendered tests by default
- update helper tests only if usage reveals a missing pure case

Implementation risk:
- medium because it touches destructive UI state

Must-have before routine editor/destructive UX work:
- recommended if Epic 1 lands naturally

### Epic 3: Confirm Target Guard Helper
Why needed:
- Confirm rendering checks and confirm functions use related but separate target information.

Production risk protected:
- wrong-target confirmation after editor/routine state changes

AI-maintainability benefit:
- A future UI split can use a named predicate for "does this preview belong to this row?"

Behavior that must remain unchanged:
- cards render only when preview `entityId` matches the current routine/period/task id

Current coverage to rely on:
- backend delete-impact shape tests

New tests needed:
- small pure target-match tests

Implementation risk:
- low if included inside Epic 1 helper

Must-have before routine editor/destructive UX work:
- yes, but only as part of the tiny preview-state helper, not as a separate framework.

### Epic 4: TaskBuilder Callback Boundary Characterization
Why needed:
- Persisted task deletion is initiated in TaskBuilder but preview/fetch/delete side effects live in RoutinesManager.

Production risk protected:
- accidental TaskBuilder change that directly deletes or bypasses preview

AI-maintainability benefit:
- Clarifies the boundary for future task editor UX work.

Behavior that must remain unchanged:
- unsaved task deletion remains local
- persisted task deletion requests preview through the parent callback
- TaskBuilder does not fetch or delete persisted tasks directly

Current coverage to rely on:
- `task-builder-draft.test.ts`
- backend delete-impact tests

New tests needed:
- likely none in Checkpoint 1 unless a pure helper emerges naturally
- rendered tests only if future UX work makes callback wiring the concrete risk

Implementation risk:
- medium if it crosses component props

Must-have before routine editor/destructive UX work:
- inspect first; implementation optional unless task deletion UX changes.

### Epic 5: In-Flight Mutation Guards
Why needed:
- Duplicate delete/save clicks can issue repeated mutations.

Production risk protected:
- duplicate delete or save requests
- confusing status/reload races

AI-maintainability benefit:
- A named pending state can make UX behavior clearer.

Behavior that must remain unchanged:
- currently no explicit in-flight guard exists; adding one is a behavior change

Current coverage to rely on:
- backend ownership and duplicate handling where present

New tests needed:
- likely rendered/component or browser-level coverage if behavior changes

Implementation risk:
- medium to high because it changes UX behavior and disabled/pending state

Must-have before routine editor/destructive UX work:
- not for this experiment. Revisit if product work explicitly includes pending/disabled UX.

## User Stories

### Story 1: Parent Confirms The Intended Delete Target
Value:
- A parent should only confirm deletion for the routine, period, or task whose preview is visible.

Acceptance criteria:
- current preview target matching is documented and, if implemented, unit-tested
- no delete endpoint or delete semantics change
- no confirmation wording changes

### Story 2: Routine Editor UX Can Change Without Losing Delete Safety
Value:
- Future UX work can move panels or restructure the editor while preserving destructive preview behavior.

Acceptance criteria:
- current preview slot transitions are named and testable
- TaskBuilder remains a callback boundary, not a destructive side-effect owner
- no rendered test tooling is introduced unless a later checkpoint approves it

### Story 3: Codex Can Distinguish Refactor From Product Behavior Change
Value:
- Future AI work should not "clean up" preview clearing into a behavior change accidentally.

Acceptance criteria:
- this plan clearly marks current clearing behavior
- any change to clearing all competing previews, single active preview, pending buttons, or confirmation UX requires architect review

## Proposed Checkpoints

### Checkpoint 0: RoutinesManager Destructive-Flow Inspection And Safety Plan
Type:
- docs-only

Intended files:
- `docs/routines-manager-destructive-safety-plan.md`

Scope:
- Inspect current destructive preview/confirm flows.
- Map TaskBuilder callback boundary and backend assumptions.
- Decide the smallest next checkpoint.

Acceptance criteria:
- no production/test/CI behavior changes
- current preview and target behavior documented
- next checkpoint remains small and behavior-preserving

Validation:
- `git diff --check`
- `pnpm typecheck`

### Checkpoint 1: Characterize Delete-Impact Preview State
Type:
- tiny pure helper plus focused unit tests, if architect approves

Intended files:
- `apps/web/lib/routines-manager-delete-impact.ts`
- `apps/web/lib/__tests__/routines-manager-delete-impact.test.ts`

Scope:
- Add pure helpers for current delete-preview state transitions and target matching.
- Do not use the helper in `RoutinesManager` yet unless it is absolutely tiny and explicitly approved.
- Do not change preview clearing behavior.
- Do not perform API calls.
- Do not use React.

Acceptance criteria:
- tests pin routine preview request behavior
- tests pin period preview request behavior
- tests pin task preview request behavior
- tests pin cancel/reset behavior
- tests pin preview-target matching
- tests explicitly preserve current competing-preview behavior

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`
- optional `pnpm check:generated`

Stop conditions:
- helper becomes a generic state machine
- helper hides API side effects
- useful characterization requires rendered component tooling
- implementation pressure appears to change delete semantics or visible behavior

### Checkpoint 2: Use Preview Helper In RoutinesManager, Only If Natural
Type:
- behavior-preserving refactor

Intended files:
- `apps/web/components/routines-manager.tsx`
- `apps/web/lib/routines-manager-delete-impact.ts`
- `apps/web/lib/__tests__/routines-manager-delete-impact.test.ts`

Scope:
- Replace only inline preview state transition decisions with the helper.
- Keep API calls, status copy, confirm functions, reload timing, and rendering in `RoutinesManager`.
- Keep TaskBuilder public props unchanged unless a later architect decision approves a tiny adjustment.

Acceptance criteria:
- destructive preview state behavior is easier to inspect
- current UI behavior is preserved
- existing web unit tests pass
- no rendered test tooling is introduced

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm check:generated`
- `git diff --check`
- optional `pnpm --filter @tsmt/web test:smoke:app`

Stop conditions:
- helper usage feels forced
- clearing behavior would change
- confirm target behavior would change
- component diff becomes broad/noisy
- TaskBuilder rewrite starts

### Checkpoint 2.5: Gate Review Before UX Behavior Changes
Type:
- inspection/docs-only

Scope:
- Decide whether pure characterization and helper usage are enough.
- Decide whether a behavior-changing UX improvement is needed.
- Explicitly choose stop, continue, split, or discard.

Decision options:
- stop implementation and proceed to final outcome review
- continue to a narrowly approved behavior-changing preview-clearing UX change
- continue to a rendered coverage/tooling inspection
- split/partial merge
- revise plan
- discard

### Checkpoint 3: Optional Behavior Change Or Rendered Coverage, Only If Approved
Type:
- to be defined after Checkpoint 2.5

Possible scopes:
- unify active preview into one slot
- clear all competing previews when period/task preview opens
- add explicit pending/disabled state for destructive actions
- inspect/add rendered coverage

Constraints:
- requires explicit architect approval
- must name behavior change clearly
- must not be framed as refactor-only

### Checkpoint 5: Final Outcome Review
Type:
- docs-only

Intended files:
- `docs/routines-manager-destructive-safety-plan.md`
- PR body if useful

Scope:
- Record final state, files changed, validation, behavior preserved, risks reduced, deferred risks, and merge/split/continue/discard recommendation.

## Must-Not-Change Constraints
- no backend routines changes
- no DTO changes
- no Prisma schema changes
- no API endpoint path changes
- no delete semantics changes
- no preview API payload changes
- no UI copy changes
- no visible behavior changes unless a later behavior checkpoint is explicitly approved
- no browser smoke scope changes
- no CI wiring
- no Docker/local dev setup
- no TaskBuilder rewrite
- no rendered test tooling in Checkpoint 0 or Checkpoint 1
- no broad routine editor rewrite

## Validation Commands
For Checkpoint 0:
- `git diff --check`
- `pnpm typecheck`

For implementation checkpoints:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm check:generated`
- `git diff --check`

Optional, environment-dependent:
- `pnpm --filter @tsmt/web test:smoke:app`
- `pnpm --filter @tsmt/web test:smoke:auth` only if a reachable migrated Postgres DB is available

## Rollback And Split Strategy
- Checkpoint 0 is docs-only and can be discarded independently.
- Checkpoint 1 can be merged as characterization if the helper is useful even before component usage.
- Checkpoint 2 should only merge with Checkpoint 1 if helper usage is natural and behavior-preserving.
- Any behavior-changing Checkpoint 3 should be split unless the architect explicitly decides it belongs in this experiment.
- If characterization reveals current behavior is unsafe enough to require product/UX decision, stop and ask for architect review before implementation.

## Recommended Next Checkpoint
Proceed to Checkpoint 1: characterize delete-impact preview state with a tiny pure helper and focused unit tests.

This is the smallest safety step because it protects the current destructive-flow decisions without changing behavior, moving API calls, adding rendered test tooling, or rewriting the editor.

## Risks And Uncertainties
- The current period/task preview request behavior does not clear `routineDeleteImpact`; this may be acceptable current behavior or a future UX cleanup candidate.
- Period and task confirm functions rely on rendered target matching rather than requiring preview state inside the confirm function.
- Duplicate/in-flight delete and save clicks remain unguarded and should not be changed without a product UX decision.
- There is no rendered routine editor destructive-flow coverage today.
- Backend delete-impact previews are well characterized, but frontend preview state is not yet.
