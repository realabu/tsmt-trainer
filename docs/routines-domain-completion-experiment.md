# Routines Domain Completion Experiment

## 1. Baseline

Baseline main commit SHA: `f7edc20790c4b558a8cdb159eb44a4b1272637ef`

Reference branch: `checkpoint/routines-before-completion-experiment`

Experiment branch: `experiment/routines-domain-completion`

Current routines docs checkpoint:
- `docs/routines-refactor-plan.md` is current through PR `#77`.
- The checkpoint says the next step should be an architect checkpoint before choosing more routines backend code.
- The checkpoint distinguishes delete-impact preview coverage from actual delete/cascade semantics.

Current known stabilized areas:
- Routine create/update service behavior has safety-net coverage.
- Routine scalar data shaping is extracted.
- Task create/update/remove service behavior has safety-net coverage.
- Task create/update Prisma data payload shaping is extracted.
- Task media/custom image behavior has service-level coverage.
- `resolveTaskInput(...)` key branches are covered, including missing catalog task, missing difficulty level, difficulty mismatch, explicit song override, missing explicit song, and missing title after fallback.
- Pure resolver decisions exist for difficulty compatibility, title usability, song lookup guard, display fallback, song fallback, and repetition label normalization.
- Period create/update/remove service behavior has safety-net coverage.
- Period create/update data shaping is extracted.
- `searchTaskCatalog(...)` has service-level coverage and pure `where` building.
- `getProgress(...)` has service-level coverage and pure response assembly.
- Delete-impact preview methods for routine, period, and task have service-level coverage.
- Delete-impact response builders are pure and tested.

Current known remaining risks:
- `RoutinesService` remains a large orchestration class at roughly 750 lines.
- Actual destructive delete methods and Prisma cascade behavior have not been intentionally changed or fully reviewed in this refactor wave.
- `listSongCatalog(...)` still has inline query normalization/search shape and no focused service safety test, but is deferred outside this experiment's main sequence.
- `listByChild(...)` and `getById(...)` still return raw Prisma include shapes consumed by frontend flows.
- Service-boundary extraction has not yet been attempted in routines after the safety-net buildup.
- Some edge-path follow-ups remain intentionally non-blocking, including explicit song clear behavior against catalog defaults and remaining custom image permutations.

## 2. Desired Target State

“Good enough / 80% production-ready safe-to-extend routines backend” means:

- Behavior safety:
  - Existing behavior is preserved unless a behavior change is explicitly planned, reviewed, and tested.
  - Destructive-action previews and actual delete paths have clear guardrails.
- API response stability:
  - Public controller responses keep the same shape.
  - Raw Prisma include shapes that frontend code consumes are not silently remapped.
- Prisma query safety:
  - Ownership filters, includes, selects, ordering, `take`, and count query scopes are pinned before movement.
  - Prisma reads remain in service/orchestration layers unless a boundary move is planned and covered.
- Ownership/authorization safety:
  - Parent ownership filters remain explicit and tested for routines, tasks, periods, progress, and delete-impact previews.
  - No helper hides authorization side effects.
- Destructive action safety:
  - Delete-impact previews accurately describe current delete/cascade impact.
  - Delete semantics are not changed in this experiment.
  - Any cascade concern becomes an architect decision, not an incidental refactor.
- AI maintainability:
  - Large methods are not grown further.
  - Pure shaping/calculation logic lives in domain helpers.
  - Service boundaries, if introduced, are narrow and named by workflow.
- Service responsibility clarity:
  - `RoutinesService` remains the public facade and ownership-aware coordinator.
  - A first extracted service, if attempted, owns one cohesive workflow only.
- Test coverage adequacy:
  - The experiment does not aim for 100% coverage.
  - It covers high-risk query and destructive-preview seams before moving them.
- Documentation adequacy:
  - The experiment records what changed, what intentionally did not change, and how to judge mergeability.

## 3. Explicit Non-Goals

- No broad clean architecture rewrite.
- No DTO, controller, or API shape changes unless separately justified.
- No Prisma schema or cascade changes.
- No delete semantics changes.
- No frontend refactor in this experiment.
- No moving Prisma reads unless explicitly planned and justified.
- No cosmetic helper extraction.
- No multi-domain refactor.
- No attempt to make routines “perfect” before product work can continue.

## 4. Current Routines Responsibility Map

### Routine CRUD

Current owner: `RoutinesService`

Responsibilities:
- `listByChild(...)` lists owned routines with tasks, periods, and session counts.
- `create(...)` validates child ownership, resolves tasks, builds scalar/task/period data, creates routine, and returns task/period include shape.
- `getById(...)` validates ownership and returns full routine detail with child, ordered tasks, ordered periods, recent sessions, and session count.
- `update(...)` validates ownership via `getById(...)` and updates scalar fields.
- `remove(...)` validates ownership via `getById(...)`, deletes routine, and returns `{ success: true }`.

Coverage:
- Create/update safety-net tests exist.
- Routine scalar helper tests exist.
- Routine delete service behavior appears less directly covered than task/period deletes.

### Task CRUD

Current owner: `RoutinesService` plus domain helpers.

Responsibilities:
- `createTask(...)` validates owned routine, resolves task input, computes max sort order, creates the task, and returns task include shape.
- `updateTask(...)` validates owned task, resolves input, deletes existing media links, updates task, and returns task include shape.
- `removeTask(...)` validates owned task, deletes task, and returns `{ success: true }`.

Coverage:
- Minimal create/update/remove task CRUD paths are covered.
- Catalog-connected create/update paths are covered.
- Custom image/media paths are covered.
- Final create/update payload helpers are tested.

### `resolveTaskInput(...)`

Current owner: `RoutinesService` for orchestration; pure decisions live in helpers.

Responsibilities:
- Catalog task lookup.
- Missing catalog task error.
- Difficulty lookup.
- Missing difficulty error.
- Difficulty/catalog compatibility validation.
- Song fallback and explicit song handling.
- Song existence lookup.
- Display fallback and title validation.
- Final resolved input assembly.

Coverage:
- Service-level tests cover high-risk branches.
- Helper tests cover pure decisions.

### Period CRUD

Current owner: `RoutinesService` plus period data helpers.

Responsibilities:
- `createPeriod(...)`, `updatePeriod(...)`, `removePeriod(...)`.
- Owned routine/period validation.
- Prisma create/update/delete.

Coverage:
- Period CRUD service tests exist.
- Period data helper tests exist.

### `searchTaskCatalog(...)`

Current owner: `RoutinesService` plus pure `where` helper.

Responsibilities:
- Missing-user guard.
- Prisma search execution.
- Include/order/take/raw result passthrough.

Coverage:
- Service safety tests pin query shape and include/order/take.
- Pure `where` helper tests exist.

### `listSongCatalog(...)`

Current owner: `RoutinesService`

Responsibilities:
- Missing-user guard.
- Query trimming and OR search shape.
- Prisma include and raw result passthrough.

Coverage:
- No focused routines service safety test found for this method.

### `getProgress(...)`

Current owner: `RoutinesService` plus progress helpers.

Responsibilities:
- Ownership query.
- Period/session include/select/order.
- Missing routine error.
- Progress calculation orchestration.
- Response assembly.

Coverage:
- Service safety tests exist.
- Pure progress calculation and response helper tests exist.

### Delete-Impact Previews

Current owner: `RoutinesService` plus delete-impact builders.

Responsibilities:
- Routine delete-impact ownership lookup, dependent count queries, period-id badge detachment scope, response assembly.
- Task delete-impact ownership lookup, task-scoped count queries, response assembly.
- Period delete-impact ownership lookup, badge count, completed-session date-boundary count, response assembly.

Coverage:
- Routine, period, and task preview service safety tests exist.
- Pure delete-impact builders are tested.

### Actual Delete Methods

Current owner: `RoutinesService`

Responsibilities:
- Routine delete uses `getById(...)`, deletes routine, returns `{ success: true }`.
- Task delete uses `getOwnedRoutineTask(...)`, deletes task, returns `{ success: true }`.
- Period delete uses `getOwnedRoutinePeriod(...)`, deletes period, returns `{ success: true }`.

Coverage:
- Task and period delete safety tests exist.
- Routine delete behavior should be treated as a remaining safety gap before changing delete-related structure.

### Helper / Domain Modules

Current helper modules:
- `media-kind.ts`
- `repetition-label.ts`
- `routine-delete-impact.ts`
- `routine-period-input.ts`
- `routine-progress.ts`
- `routine-scalar-data.ts`
- `routine-task-catalog-search.ts`
- `routine-task-display.ts`
- `routine-task-input.ts`
- `routine-task-song.ts`

Pattern:
- Pure shaping and deterministic decisions are extracted and tested.
- Prisma orchestration remains in `RoutinesService`.

### Test Coverage

Current routines tests include:
- Pure helper tests for task input, display, song, media kind, repetition labels, scalar data, period input, progress, delete impact, and catalog search where.
- Service-level tests for create/update, task CRUD, period CRUD, task catalog search, progress, and delete-impact previews.

## 5. Remaining Risk Map

| Area | Classification | Reason |
| --- | --- | --- |
| Actual routine delete behavior | Production-critical | Destructive path, less directly covered than task/period delete. |
| Prisma cascade/delete semantics | Production-critical | Schema cascades drive what actually disappears; experiment must not change this casually. |
| First service-boundary extraction | Medium | Could improve maintainability, but moving Prisma reads can regress query/ownership behavior. |
| `listSongCatalog(...)` query shape | Medium | Similar to task catalog search, but smaller and less destructive. |
| `listByChild(...)` / `getById(...)` raw include shapes | Medium | Frontend likely depends on raw Prisma shapes. |
| Remaining resolver edge paths | Low | Key branches are covered; follow-ups are non-blocking. |
| Additional helper extraction without boundary | Not worth touching now | High cosmetic-loop risk. |
| Existing pure helper modules | Already sufficiently guarded | Broad helper churn is not needed. |

## 6. User Stories

### Story A: Protect Actual Delete Behavior Before Moving Delete Logic

Value:
- Users need destructive actions to delete exactly what the app currently deletes, no more and no less.
- Developers need confidence that preview and delete behavior remain aligned.

Why it matters:
- Delete-impact previews are covered, but actual routine delete behavior and cascade expectations still need a safety checkpoint before any boundary move.

Acceptance criteria:
- Routine delete service behavior is pinned with a focused test.
- The test verifies ownership lookup, Prisma delete call, and `{ success: true }`.
- No delete semantics or schema behavior changes.

Out of scope:
- Changing Prisma cascade rules.
- Adding soft delete.
- Frontend delete flow changes.

Regression risks:
- Accidentally changing ownership validation path.
- Accidentally changing response shape.
- Accidentally assuming cascade behavior not encoded in tests.

### Story B: Evaluate A Narrow Delete-Impact Service Boundary

Value:
- Delete-impact preview is a cohesive workflow and now has the strongest service-level coverage among remaining boundary candidates.
- Moving it can reduce `RoutinesService` size and improve AI readability.

Why it matters:
- This is the first realistic test of whether routines can safely move from helper extraction to service-boundary extraction.

Acceptance criteria:
- `RoutinesService` keeps the controller-facing public methods:
  - `getDeleteImpact(...)`
  - `getTaskDeleteImpact(...)`
  - `getPeriodDeleteImpact(...)`
- Those public methods delegate to `RoutineDeleteImpactService`.
- The preview implementation/query/count orchestration may move into `RoutineDeleteImpactService`.
- Controller signatures and API shapes remain unchanged.
- Existing service tests pass with minimal or no expectation changes.

Out of scope:
- Moving actual delete methods.
- Changing delete semantics.
- Moving unrelated progress, catalog, task CRUD, or period CRUD logic.

Regression risks:
- Moving Prisma reads could subtly change query shape.
- Provider wiring mistakes could break Nest injection.
- Tests may need brittle constructor setup if the boundary is awkward.

### Story C: Decide Whether To Pause Routines Backend Refactor

Value:
- Avoids continuing to refactor after the highest-risk seams are guarded.

Why it matters:
- Production readiness may now be better served by another hotspot or quality gate work.

Acceptance criteria:
- Architect review compares the experiment result against baseline.
- Decision is one of: merge all, merge selected commits, continue experiment, pause routines, or discard.

Out of scope:
- Making a final architecture declaration for all domains.
- Starting another domain in this experiment branch.

Regression risks:
- Continuing out of momentum instead of product risk.

## 7. Developer Subtasks

### Subtask A1: Add Routine Delete Service Safety Test

- Intended files:
  - `apps/api/test/routines/routines-create-update.test.ts` or a new focused routines delete test file.
- Type:
  - test-only.
- Prerequisites:
  - This planning document reviewed.
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Rollback / stop condition:
  - Stop if testing routine delete requires changing production code or Prisma schema.
- Must not change:
  - Delete semantics.
  - Controller/DTO/API shape.

### Subtask B1: Inspect Delete-Impact Boundary Feasibility

- Intended files:
  - Read-only inspection of `apps/api/src/routines/routines.service.ts`, `apps/api/src/routines/routines.module.ts`, and delete-impact tests.
- Type:
  - docs-only or inspection-only.
- Prerequisites:
  - Subtask A1 complete.
- Validation:
  - No test run required if inspection-only.
- Rollback / stop condition:
  - Stop if a boundary requires moving actual delete semantics.
- Must not change:
  - Prisma query semantics.
  - API shape.

### Subtask B2: Extract `RoutineDeleteImpactService`

- Intended files:
  - `apps/api/src/routines/routine-delete-impact.service.ts`
  - `apps/api/src/routines/routines.service.ts`
  - `apps/api/src/routines/routines.module.ts`
  - Existing delete-impact service tests if constructor/provider setup requires adjustment.
- Type:
  - refactor-only with existing tests.
- Prerequisites:
  - Subtask A1 and B1 complete.
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Rollback / stop condition:
  - Stop if more than the three preview methods need to move.
  - Stop if tests require broad rewriting or brittle overfitting.
  - Stop if API shape or query shape changes.
- Must not change:
  - Controller methods.
  - DTOs.
  - Delete semantics.
  - Actual delete methods.

### Subtask C1: Final Experiment Review

- Intended files:
  - `docs/routines-domain-completion-experiment.md`
  - optional review note if requested.
- Type:
  - docs-only.
- Prerequisites:
  - Any executed experiment steps complete.
- Validation:
  - `git diff checkpoint/routines-before-completion-experiment...experiment/routines-domain-completion`
  - targeted tests from executed steps.
- Rollback / stop condition:
  - Stop if branch diff is too broad to review as a coherent experiment.
- Must not change:
  - Production code during review.

## 8. Execution Gates

- Gate 1:
  - Architect approves this plan before any implementation starts.
- Gate 2:
  - After the routine delete service safety test, architect reviews whether the `RoutineDeleteImpactService` extraction is still justified.
- Gate 3:
  - Before extraction, Codex confirms expected files, moved responsibilities, and unchanged API/DTO/controller behavior.
- Gate 4:
  - After extraction, architect performs the final outcome review before any merge to main.

## 9. Proposed PR / Commit Sequence Inside The Experiment

### Step 1: Plan Domain Completion

- Purpose:
  - Establish baseline, target state, risks, stories, and stop conditions.
- Expected changed files:
  - `docs/routines-domain-completion-experiment.md`
- Risk level:
  - Low.
- Validation:
  - Confirm docs-only diff.
- Acceptance criteria:
  - Architect can approve, modify, or reject the experiment before code starts.

Gate:
- Gate 1 must pass before Step 2 starts.

### Step 2: Add Routine Delete Service Safety Test

- Purpose:
  - Pin actual routine delete behavior before moving delete-adjacent code.
- Expected changed files:
  - routines backend tests only.
- Risk level:
  - Low.
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Acceptance criteria:
  - Ownership lookup, delete call, and success response are covered.

Gate:
- Gate 2 decides whether Step 3 still has enough value.

### Step 3: Extract `RoutineDeleteImpactService`

- Purpose:
  - Test one real service-boundary extraction with strong coverage.
- Expected changed files:
  - new delete-impact service
  - routines service delegation
  - routines module provider wiring
  - minimal test constructor/provider updates if required
- Risk level:
  - Medium.
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
  - `pnpm --filter @tsmt/api build`
- Acceptance criteria:
  - Controller-facing preview methods stay on `RoutinesService` and delegate.
  - Preview implementation/query/count orchestration moves only if still justified.
  - RoutinesService remains API facade.
  - Query shapes and response shapes remain unchanged.

Gate:
- Gate 3 must pass before Step 3 begins.
- Gate 4 must pass after Step 3 before merge to main.

### Step 4: Final Experiment Review

- Purpose:
  - Decide whether the experiment branch should be merged, partially merged, continued, or discarded.
- Expected changed files:
  - docs/review note only if needed.
- Risk level:
  - Low.
- Validation:
  - Compare branch diff against baseline.
  - Run validation commands from executed code steps.
- Acceptance criteria:
  - Architect can make a merge decision with clear tradeoffs.

This sequence intentionally excludes optional song catalog helper work. The main code goal is to test one real service-boundary extraction, not to continue small catalog helper extraction.

## 10. Deferred Follow-Up Candidates

These are outside the main experiment sequence:

- `listSongCatalog(...)` service safety test:
  - Useful later if task-building catalog search becomes a focus.
  - Should pin missing-user behavior, trimmed query shape, include shape, and raw passthrough.
- Optional song catalog `where` helper:
  - Only worth considering after a safety test proves the inline query shaping is a real readability issue.
  - Must not move Prisma execution, include/order shape, or result passthrough.

## 11. Service-Boundary Decision

The experiment should attempt one first real service-boundary extraction only if Steps 1 and 2 are accepted.

Proposed boundary:
- `RoutineDeleteImpactService`

Why this boundary:
- Delete-impact preview is cohesive.
- It has routine, period, and task service safety coverage.
- It is destructive-action adjacent and therefore valuable to isolate.
- It does not require controller or DTO changes.

Why now:
- The preview query/response behavior is now pinned.
- This boundary is narrower than moving all task CRUD or all progress logic.
- It tests whether routines can safely move from pure helper extraction to workflow service extraction.

What remains in `RoutinesService`:
- Controller-facing public methods:
  - `getDeleteImpact(...)`
  - `getTaskDeleteImpact(...)`
  - `getPeriodDeleteImpact(...)`
- Controller-facing API facade.
- Actual delete methods.
- Routine/task/period CRUD.
- `resolveTaskInput(...)`.
- Progress and catalog methods.

What moves:
- Preview implementation/query/count orchestration used by:
  - `getDeleteImpact(...)`
  - `getTaskDeleteImpact(...)`
  - `getPeriodDeleteImpact(...)`
- Only private logic needed for preview calculation.

Tests that make it safe:
- `routines-delete-impact-service.test.ts`
- pure `routine-delete-impact.test.ts`

Rollback plan:
- Revert the service extraction commit.
- Keep safety tests if they remain useful and pass.
- If provider wiring or constructor mocking gets noisy, stop and ask for architect decision rather than forcing the boundary.

## 12. Final Outcome Review Criteria

Judge the final experiment branch against baseline main and this target state:

- Baseline main:
  - Does the final diff preserve API behavior?
  - Are changes scoped and reviewable?
  - Did the branch avoid unrelated domains?
- Desired target state:
  - Did it improve production safety, not just line count?
  - Did it reduce routines service cognitive load?
  - Did it keep ownership and Prisma semantics explicit?
- Production-readiness:
  - Are destructive paths safer to modify?
  - Are tests meaningful rather than brittle snapshots?
- AI maintainability:
  - Would a future coding agent find responsibilities faster?
  - Are side effects still visible?
- Complexity reduction:
  - Did the service boundary reduce cohesion problems?
  - Did it avoid new indirection without value?
- Regression risk:
  - Were all moved query shapes already pinned?
  - Did validation pass?
- Merge decision:
  - Merge if the branch is small, behavior-preserving, and improves workflow clarity.
  - Partially merge if tests are valuable but service extraction is too noisy.
  - Discard if the boundary adds more complexity than it removes.

Final branch comparison checklist:
- Baseline commit SHA.
- Final experiment commit SHA.
- Files changed.
- Public API/controller/DTO unchanged confirmation.
- Prisma schema unchanged confirmation.
- Actual delete semantics unchanged confirmation.
- List of Prisma reads moved, if any.
- `RoutinesService` responsibility and LOC before/after summary.
- Tests added or changed.
- Validation commands and results.
- Outcome decision:
  - merge all
  - partial merge
  - continue experiment
  - discard

## 13. Stop Conditions

Codex must stop and ask for architect decision if:

- An API shape change appears necessary.
- A DTO or controller change appears necessary.
- A Prisma schema or cascade change appears necessary.
- Delete semantics would change.
- Ownership/security behavior becomes uncertain.
- A Prisma read move requires broad query restructuring.
- The branch diff grows too large to review comfortably.
- Tests require brittle overfitting to implementation details without production-risk value.
- The service-boundary extraction expands beyond delete-impact previews.
- The experiment starts touching frontend code.
- The experiment starts touching sessions, children, admin, auth, subscriptions, or trainer domains.
- The next step looks cosmetic rather than production-readiness driven.
