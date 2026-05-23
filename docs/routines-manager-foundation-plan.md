# RoutinesManager Foundation Experiment

## Purpose
This document records Checkpoint 0 for the controlled `RoutinesManager` foundation experiment.

The goal is not backend routines refactoring, not a broad UI rewrite, and not momentum-driven cleanup. The goal is to inspect the next frontend hotspot after the completed `TrainingRunner` foundation work in #98, then define the smallest safe sequence that lowers routine editor and destructive-preview risk before serious routine editor feature work.

Experiment branch: `experiment/routines-manager-foundation`

Draft PR title: `refactor(web): routines manager foundation experiment`

Baseline main SHA: `e6b32999e5c2b7c252acc4240d739ce6139505e2`

## Current Context
Completed immediately before this experiment:
- #98 completed the `TrainingRunner` session-control foundation.
- The planned TrainingRunner hook/helper outcome was fulfilled with a smaller pure helper and focused tests.
- TrainingRunner refactoring should not continue by momentum.

Current posture:
- API smoke is DB-backed and runs in CI.
- Browser smoke is local-first and not CI-required.
- Routines backend refactoring remains paused by default.
- This experiment concerns the frontend `RoutinesManager` hotspot only.

## Inspected Files
- `apps/web/components/routines-manager.tsx`
- `apps/web/components/task-builder.tsx`
- `apps/web/lib/routines-manager-helpers.ts`
- `apps/web/lib/routines-manager-payloads.ts`
- `apps/web/lib/__tests__/routines-manager-helpers.test.ts`
- `apps/web/lib/__tests__/routines-manager-payloads.test.ts`
- `apps/web/test/smoke/auth-dashboard-smoke.spec.ts`
- `apps/api/src/routines/routines.controller.ts`
- `apps/api/src/routines/dto.ts`
- `apps/api/src/routines/routine-delete-impact.service.ts`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`
- `docs/training-runner-foundation-plan.md`
- `docs/routines-refactor-plan.md`

Current component size:
- `apps/web/components/routines-manager.tsx`: about 664 lines
- `apps/web/components/task-builder.tsx`: about 430 lines

## Current Responsibility Map
`RoutinesManager` currently owns:
- initial parent data loading for children and routines
- parent-only routine management UI
- trainer read-only routing hint
- create-routine form state
- edit-routine form state
- task draft list state for create and edit flows
- period draft list state for edit flow
- original task id tracking for deleted persisted tasks
- original period id tracking for deleted persisted periods
- routine delete-impact preview state
- period delete-impact preview state
- task delete-impact preview state
- status, loading, and error copy
- create routine mutation
- open editor state hydration
- add/update/remove unsaved period drafts
- routine delete-impact preview request
- routine delete confirmation mutation
- period delete-impact preview request
- period delete confirmation mutation
- task delete-impact preview request
- task delete confirmation mutation
- multi-step routine editor save orchestration
- routine list rendering
- routine editor rendering
- period editor rendering
- routine delete-impact rendering

`TaskBuilder` currently owns the detailed task draft editing UI, catalog search, song loading, custom/catalog task composition, and task-level delete-impact panel rendering. `RoutinesManager` still owns task delete-impact state and destructive callbacks.

## State And API Orchestration Map
Primary state clusters:
- list data: `children`, `routines`
- create form: `childId`, `name`, `description`, `tasks`
- edit form: `editingRoutineId`, `editingName`, `editingDescription`, `editingTasks`, `editingPeriods`
- persisted-id baselines: `originalTaskIds`, `originalPeriodIds`
- destructive previews: `routineDeleteImpact`, `periodDeleteImpact`, `taskDeleteImpact`
- global message: `status`

Derived state:
- `isTrainer`
- `childLabel`
- `selectedRoutine`

Frontend API calls orchestrated by `RoutinesManager`:
- `GET /api/children`
- `GET /api/routines`
- `POST /api/routines`
- `GET /api/routines/:routineId/delete-impact`
- `DELETE /api/routines/:routineId`
- `GET /api/routines/periods/:periodId/delete-impact`
- `DELETE /api/routines/periods/:periodId`
- `GET /api/routines/tasks/:taskId/delete-impact`
- `DELETE /api/routines/tasks/:taskId`
- `PATCH /api/routines/:routineId`
- `PATCH /api/routines/tasks/:taskId`
- `POST /api/routines/:routineId/tasks`
- `PATCH /api/routines/periods/:periodId`
- `POST /api/routines/:routineId/periods`

The riskiest orchestration is `saveRoutineEditor(...)`:
1. patch routine scalar fields
2. compute removed persisted task ids from `originalTaskIds`
3. delete removed tasks
4. patch existing tasks or create new tasks in current editor order
5. compute removed persisted period ids from `originalPeriodIds`
6. delete removed periods
7. patch existing periods or create new periods
8. reload parent data

This sequence is user-visible and production-relevant because a partial failure can leave the backend in a partially updated state. This experiment should not change that behavior, but it should make the current behavior easier to see and protect.

## Existing Coverage
Already guarded:
- `routineTaskToDraft(...)`
- `routinePeriodToDraft(...)`
- `defaultPeriods`
- `parseOptionalInt(...)`
- `buildRoutineTaskPayload(...)`
- `buildRoutinePeriodPayload(...)`
- `buildCreateRoutinePayload(...)`
- backend routine CRUD and task/period CRUD behavior
- backend delete-impact previews for routine, task, and period
- API smoke for parent-owned routine listing and non-leakage
- browser smoke for owned routine visibility and opening the training runner path

Coverage gaps:
- no frontend unit coverage for edit-save operation ordering
- no frontend unit coverage for removed task/period id planning
- no frontend characterization of delete-impact preview state transitions
- no rendered component coverage for routine create/edit/delete flows
- no browser smoke for routine editor save or destructive previews
- no coverage for duplicate save/delete clicks or in-flight mutation behavior

## Production-Risk Findings
Production-risky, not merely ugly:
- The edit-save path performs many sequential mutations without a frontend transaction boundary.
- Removed task and period ids are derived from local original-id snapshots.
- Task and period update/create ordering must preserve current sort and payload semantics.
- Delete-impact previews feed destructive confirmations for routine, task, and period deletes.
- Task delete confirmation mutates local editor state and reorders remaining tasks.
- Period delete confirmation mutates local editor state and original-id baselines.
- Stale preview state could be confusing if future changes alter editor switching or clearing behavior.

AI-maintainability risks:
- A 664-line component mixes data loading, editor state, destructive previews, save orchestration, and rendering.
- Future Codex changes could accidentally reorder API mutations while trying to simplify JSX.
- `TaskBuilder` is another hotspot, so broad changes across both files would become hard to review.
- Existing helper coverage protects payload shape, but not the higher-level operation plan that chooses which endpoint/method is used.

Risks already reasonably guarded:
- backend ownership checks for routines and delete-impact previews
- backend API response and count/query shape for delete-impact previews
- low-level frontend payload conversion
- parent routine list visibility through API and browser smoke

## Target-State Architecture
Target direction if implementation checkpoints confirm value:

```text
apps/web/components/routines-manager.tsx
  Screen/container composition.
  Owns React state wiring, user-triggered API calls, and high-level rendering.

apps/web/lib/routines-manager-payloads.ts
  Continue to own create/task/period payload shape.

apps/web/lib/routines-manager-helpers.ts
  Continue to own draft hydration and scalar helpers.

apps/web/lib/routines-manager-save-plan.ts
  Pure operation planning for routine editor saves.
  No API calls, no React state, no side effects.

apps/web/lib/routines-manager-delete-impact.ts
  Optional later pure helpers for destructive-preview state decisions.

apps/web/components/routines-manager/
  Optional later presentational pieces only if reviewability demands it.
```

This target is intentionally modest. The first useful boundary should protect the save/update operation plan before any broad visual split.

## Extraction Epics

### Epic 1: Routine Editor Save Plan
Why needed:
- The save path has the highest production risk in the component because it determines which tasks/periods are deleted, patched, or created and in what order.

Production risk protected:
- accidental deletion planning changes
- accidental task sort-order changes
- accidental period update/create/delete ordering changes
- accidental endpoint/method changes while editing UI code

AI-maintainability benefit:
- Future changes can reason about editor persistence without reading the whole component.

Behavior that must remain unchanged:
- API endpoints
- HTTP methods
- payload shapes
- operation ordering
- status copy
- reload behavior
- partial-failure behavior

Coverage to rely on:
- existing payload helper tests
- backend routine task/period service tests
- API smoke for parent routine visibility

New tests needed:
- focused pure tests for removed task ids
- focused pure tests for task update/create operation order
- focused pure tests for removed period ids
- focused pure tests for period update/create operation order
- tests should not snapshot full component output

Implementation risk:
- low if kept pure and small

Must-have before serious routine editor feature work:
- yes

### Epic 2: Delete-Impact Preview State Boundary
Why needed:
- Routine, task, and period delete previews are destructive-action adjacent and currently share state inside the large component.

Production risk protected:
- preview-to-confirm pairing drift
- stale competing previews
- accidental destructive action without the intended preview state

AI-maintainability benefit:
- Future delete UX work can inspect preview state transitions separately from the full editor.

Behavior that must remain unchanged:
- preview endpoints
- delete endpoints
- API payloads
- delete semantics
- UI wording
- current preview card behavior

Coverage to rely on:
- backend service-level delete-impact tests
- pure delete-impact builder tests

New tests needed:
- only small pure state-decision tests if a helper is extracted
- no rendered component test tooling unless a later architect decision approves it

Implementation risk:
- medium because it is close to destructive UI behavior

Must-have before serious routine editor feature work:
- only if the feature touches delete/preview behavior

### Epic 3: Editor Open/Hydration Bundle
Why needed:
- Opening the editor populates multiple related state values from a routine record.

Production risk protected:
- stale original task/period id baselines
- accidental loss of draft hydration behavior

AI-maintainability benefit:
- Gives future editor changes a named state bundle.

Behavior that must remain unchanged:
- draft hydration helpers
- original id capture
- delete-impact clearing

New tests needed:
- optional pure tests only if a bundle helper is extracted

Implementation risk:
- low

Must-have before serious routine editor feature work:
- optional unless the feature changes editor initialization

### Epic 4: Presentational Split
Why needed:
- The component is large and visually dense.

Production risk protected:
- low by itself; this is mostly reviewability unless paired with a risky behavior seam.

AI-maintainability benefit:
- Smaller files may reduce future edit risk, but only if the split is cohesive.

Behavior that must remain unchanged:
- UI wording
- routes
- event sequencing
- styling classes

New tests needed:
- none by default; rely on existing smoke only if behavior is untouched

Implementation risk:
- medium because broad JSX moves are noisy and easy to overdo

Must-have before serious routine editor feature work:
- no; defer unless file size blocks a concrete feature

### Epic 5: TaskBuilder Follow-Up
Why needed:
- `TaskBuilder` is also a large stateful hotspot with catalog search and song-loading responsibilities.

Production risk protected:
- task catalog search and media/song draft behavior if future product work touches it

AI-maintainability benefit:
- Could isolate task catalog selection from routine editor persistence.

Behavior that must remain unchanged:
- catalog search API calls
- draft behavior
- delete-impact callbacks

Implementation risk:
- medium-to-high because it crosses component boundaries

Must-have before serious routine editor feature work:
- only if the feature touches task builder/catalog behavior

## User Stories

### Story 1: Parent Saves Routine Edits Safely
Value:
- A parent can edit routine details, tasks, and periods without accidental task/period loss.

Production-readiness reason:
- Routine editor saves are multi-step and partially destructive.

Acceptance criteria:
- Current save operation ordering is documented by tests.
- Removed persisted tasks and periods are planned deterministically.
- Existing task/period payload builders remain the source of payload shape.
- No API behavior changes.

Out of scope:
- backend transaction changes
- UI redesign
- browser smoke expansion

Regression risks:
- task reorder drift
- deleting the wrong persisted task or period
- creating duplicate tasks after save
- changing period weekly target fallback behavior

### Story 2: Parent Deletes Only After Current Preview Behavior
Value:
- A parent can understand routine/task/period delete impact before confirming destructive actions.

Production-readiness reason:
- Delete-impact previews guard destructive deletes but the frontend preview state is not separately characterized.

Acceptance criteria:
- Current preview request and confirm behavior remain unchanged.
- Competing preview-clearing behavior is explicit if extracted.
- Actual delete semantics remain backend-owned and unchanged.

Out of scope:
- changing delete semantics
- changing confirmation wording
- adding browser destructive-flow smoke by default

Regression risks:
- stale preview shown for another entity
- confirm button targeting the wrong entity
- accidental delete without current preview state

### Story 3: Future Codex Changes Can Touch Routine Editor Deliberately
Value:
- Future AI-assisted changes can improve the routine editor without re-learning a 664-line component each time.

Production-readiness reason:
- Large mixed-responsibility frontend files are the main remaining foundation risk.

Acceptance criteria:
- High-risk deterministic editor decisions live behind small named helpers.
- The component still owns user events and side effects unless a later checkpoint explicitly moves them.
- Checkpoints stay small and reviewable.

Out of scope:
- broad component rewrite
- generic form framework
- frontend routing changes

Regression risks:
- abstraction that hides side effects
- tests that overfit current JSX instead of protecting behavior

## Proposed Checkpoints

### Checkpoint 0: Inspection And Plan
Type:
- docs-only

Intended files:
- `docs/routines-manager-foundation-plan.md`

Scope:
- Inspect current `RoutinesManager`, helpers, tests, smoke coverage, and backend API context.
- Decide the smallest next checkpoint.

Validation:
- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:
- Plan identifies production risks, coverage gaps, and recommended checkpoint order.
- No source/test/CI behavior changes.

### Checkpoint 1: Characterize Routine Editor Save Plan
Type:
- small helper plus unit tests, if architect approves after this plan

Intended files:
- `apps/web/lib/routines-manager-save-plan.ts`
- `apps/web/lib/__tests__/routines-manager-save-plan.test.ts`

Scope:
- Add a pure helper that produces the current editor save operation plan.
- It should use existing payload helpers instead of duplicating payload logic.
- It should not perform API calls.
- It should not own React state.
- It should not change `RoutinesManager` yet unless a tiny usage is necessary and approved.

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Acceptance criteria:
- Tests pin current removed task/period id behavior.
- Tests pin current task and period update/create order.
- Helper stays small and useful for Checkpoint 2.

Stop conditions:
- Helper becomes a hidden framework.
- Tests require rendered component tooling.
- The helper must duplicate large parts of `RoutinesManager`.
- Any API payload or UI behavior change appears necessary.

### Checkpoint 2: Use Save Plan In RoutinesManager
Type:
- refactor-only plus existing tests

Intended files:
- `apps/web/components/routines-manager.tsx`
- `apps/web/lib/routines-manager-save-plan.ts`
- `apps/web/lib/__tests__/routines-manager-save-plan.test.ts`

Scope:
- Replace inline save-plan decisions with the pure helper.
- Keep API calls in `RoutinesManager`.
- Keep status, reload, and partial-failure behavior unchanged.
- Keep rendering unchanged.

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm check:generated`
- `git diff --check`
- optional `pnpm --filter @tsmt/web test:smoke:app`

Acceptance criteria:
- Save path is easier to review.
- Operation order remains unchanged.
- Component has less inline deletion/update/create planning logic.

Stop conditions:
- API sequencing becomes less clear.
- Diff grows beyond a small reviewable checkpoint.
- Any endpoint/method/payload/status-copy behavior changes.

### Checkpoint 2.5: Gate Review Before Delete-Impact Work
Type:
- inspection/docs-only

Scope:
- Decide whether the experiment should continue into delete-impact state extraction or stop for final review.
- Prefer stopping if save-plan extraction already addresses the highest concrete risk.

Gate result after Checkpoints 1-2:
- Checkpoints 1-2 addressed the highest production-risk frontend concern identified in Checkpoint 0: routine editor save operation planning.
- The save path now has a named pure plan helper with focused tests for removed task/period ids, task/period operation order, endpoint/method descriptors, and payload helper reuse.
- `RoutinesManager` still owns API side effects, status copy, reload behavior, and partial-failure behavior.
- Backend delete-impact previews already have service-level and pure helper coverage for routine, task, and period previews.
- Frontend delete-impact preview state remains a real risk, but it is not a must-have foundation item before general routine editor work unless the next product task touches destructive flows.
- Continuing immediately into delete-impact extraction would reduce some AI-maintainability risk, but it would also broaden the experiment toward destructive UI state and `TaskBuilder` coupling.
- Recommendation: stop implementation now and proceed to final outcome review. Do not start Checkpoint 3 unless a concrete destructive-flow feature or architect decision makes it necessary.

Validation:
- `git diff --check`
- `pnpm typecheck`

Decision options:
- proceed to delete-impact characterization
- stop and final-review
- split/partial merge
- revise plan
- discard

### Checkpoint 3: Delete-Impact Preview Seam, Only If Justified
Type:
- test-only or tiny pure helper plus tests

Intended files:
- `apps/web/lib/routines-manager-delete-impact.ts`
- `apps/web/lib/__tests__/routines-manager-delete-impact.test.ts`
- `apps/web/components/routines-manager.tsx` only if helper usage is approved

Scope:
- Characterize current preview-clearing and confirm-target decisions.
- Do not move API calls unless a later gate explicitly approves it.
- Do not change delete semantics.

Validation:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Stop conditions:
- Tests become brittle JSX snapshots.
- Helper hides destructive side effects.
- UI wording or backend delete behavior would need to change.

### Checkpoint 4: Final Outcome Review
Type:
- docs-only

Intended files:
- `docs/routines-manager-foundation-plan.md`

Scope:
- Record final state, changed files, validation, behavior preserved, and merge recommendation.

Decision options:
- merge all
- split/partial merge
- continue experiment
- discard

## Must Not Change
- backend routines code
- API routes
- DTOs
- Prisma schema
- delete semantics
- routine/task/period payload shape
- UI wording
- browser smoke scope
- CI wiring
- Docker/local dev setup
- TaskBuilder internals unless a later checkpoint explicitly selects that hotspot

## Validation Commands
For this planning checkpoint:
- `git diff --check`
- `pnpm typecheck`

For future implementation checkpoints:
- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm check:generated`
- `git diff --check`

Optional, environment-dependent:
- `pnpm --filter @tsmt/web test:smoke:app`
- `pnpm --filter @tsmt/web test:smoke:auth` only with reachable migrated Postgres

## Rollback And Split Strategy
- Checkpoint 0 can be merged or discarded independently because it is docs-only.
- Checkpoint 1 can be split if the pure helper/tests are useful even before component usage.
- Checkpoint 2 should only merge with Checkpoint 1 because it depends on the helper.
- Checkpoint 3 should remain optional and should be split out if it expands beyond a small destructive-preview seam.
- Any checkpoint that requires production behavior changes should stop for architect review.

## Recommended Next Checkpoint
Final outcome review is the recommended next checkpoint.

Do not start Checkpoint 3 by momentum. Delete-impact preview extraction should only restart after scoped inspection tied to a concrete destructive-flow feature, bug, or architect decision.

## Open Risks And Uncertainties
- Partial save failure behavior is unchanged and remains a product/architecture decision.
- There is still no rendered component coverage for routine editor save/delete flows.
- Double-click and in-flight mutation behavior is not currently guarded.
- `TaskBuilder` remains a separate frontend hotspot.
- Delete-impact preview state may deserve a later seam, but only after save-plan risk is addressed or if product work touches destructive flows.

## Final Outcome Review

PR: `#99 refactor(web): routines manager foundation experiment`

Final state:
- Checkpoint 0 created this RoutinesManager foundation plan.
- Checkpoint 1 added a pure routine editor save-plan helper and focused unit tests.
- Checkpoint 2 wired the helper into `RoutinesManager`.
- Checkpoint 2.5 recorded the gate decision to stop implementation and not continue into delete-impact extraction now.

Files changed:
- `docs/routines-manager-foundation-plan.md`
- `apps/web/lib/routines-manager-save-plan.ts`
- `apps/web/lib/__tests__/routines-manager-save-plan.test.ts`
- `apps/web/components/routines-manager.tsx`

Validation results:
- `pnpm --filter @tsmt/web test:unit` passed.
- `pnpm --filter @tsmt/web build` passed.
- `pnpm typecheck` passed.
- `pnpm check:generated` passed.
- `git diff --check` passed.
- GitHub CI was green during Checkpoint 2 review.
- Optional `pnpm --filter @tsmt/web test:smoke:app` was attempted during Checkpoint 2 but did not start because local port `3000` was already in use.

Behavior preserved:
- endpoint paths unchanged
- HTTP methods unchanged
- payload shapes unchanged
- status copy unchanged
- reload timing unchanged
- partial-failure behavior unchanged
- UI behavior unchanged
- delete-impact state unchanged
- `TaskBuilder` internals unchanged
- backend routines code unchanged

Risk reduced:
- routine editor save operation planning is now named and unit-tested
- removed task and period id detection is pinned
- task and period update/create ordering is pinned
- task `sortOrder` semantics are pinned
- current payload helper behavior is reused instead of duplicated
- future AI-assisted changes can inspect routine save behavior without reading the entire component

Deferred risks not solved:
- frontend delete-impact preview state
- stale or competing delete preview risk
- partial save failure behavior
- duplicate save and in-flight mutation behavior
- rendered routine editor save/delete coverage
- `TaskBuilder` remains a separate hotspot

## Future UX / Destructive-Flow Guard

The deferred delete-impact seam is not forgotten.

Any future UX, refactor, or feature work touching routine/task/period deletion, destructive confirmation, routine editor save/delete UX, `TaskBuilder` delete callbacks, or routine editor flow must inspect this plan first.

Such work must explicitly decide whether to implement the delete-impact preview seam before changing UX.

If a Codex prompt touches `apps/web/components/routines-manager.tsx`, `apps/web/components/task-builder.tsx`, delete-impact UI, or destructive actions, it must list this plan doc as required reading.

Do not proceed directly to UX changes in those areas without a scoped inspection.

Trigger conditions for revisiting delete-impact extraction:
- product work touches routine/task/period delete UX
- product work touches `TaskBuilder` delete callbacks
- destructive confirmation behavior changes
- routine editor UX redesign touches delete/save flows
- bug/risk appears around stale preview, wrong confirm target, or accidental delete
- feature work adds bulk operations, reorder, duplicate, archive, or richer editor states

Final recommendation:
- merge all after final architect review and validation
- do not continue implementation now
- do not start Checkpoint 3 by momentum
- select the next hotspot by product/foundation priority
