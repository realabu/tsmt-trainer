# Routines Backend Refactor Plan

## Purpose
This is a behavior-preserving execution plan for the routines backend refactor.

It follows the current repository audit and the existing engineering guidance.

It is intentionally:
- small-step
- execution-oriented
- conservative
- focused on backend routines only

It does **not** define the final architecture.

## Why Routines Backend Is the Next Focus

The routines backend is the next recommended refactor domain because it is both:
- high-risk structurally
- high-value product-wise

Facts visible in the repository:
- [apps/api/src/routines/routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts) is still the largest backend hotspot at roughly 870 lines
- the architecture audit classifies routines as `Risky`
- the service remains responsible for multiple distinct workflows
- the routines domain connects directly to:
  - parent routine management
  - training runner/session execution
  - progress reporting
  - trainer assignment workflows
  - future subscription/entitlement pressure

The repo is already showing a stable extraction pattern:
- pure helper modules in `apps/api/src/routines/domain`
- targeted unit tests for extracted logic
- behavior-preserving refactor sequencing in sessions and admin

That makes routines the best next domain for continued cleanup without broad redesign.

## Current State

`RoutinesService` currently combines several responsibility clusters:

### 1. Routine CRUD
- list routines by child
- create routine
- get routine detail
- update routine
- remove routine

### 2. Task CRUD
- create routine task
- update routine task
- remove routine task
- task include shaping
- task input resolution and validation

### 3. Period Logic / Period CRUD
- create period
- update period
- remove period
- owned period lookup

### 4. Delete Impact
- routine delete impact
- task delete impact
- period delete impact

### 5. Progress
- routine progress endpoint orchestration
- progress result assembly from completed sessions and periods

### 6. Catalog Relations
- task catalog lookup
- difficulty level validation
- song resolution
- task catalog search
- song catalog lookup

### Current Refactor Progress Already Visible
Several pure extractions already exist:
- `routine-progress.ts`
- `routine-delete-impact.ts`
- `routine-task-input.ts`
- `routine-task-display.ts`
- `routine-task-song.ts`
- `routine-period-input.ts`
- `routine-scalar-data.ts`
- `repetition-label.ts`
- `media-kind.ts`

This means the next work should continue from the existing extraction pattern, not restart the design.

## Checkpoint After #44–#73

Completed PRs:
- `#44` routine create/update service-level safety-net tests
- `#45` routine scalar data helper extraction
- `#46` routine task data shaping extraction
- `#47` period CRUD service-level safety-net tests
- `#48` period create/update data helper extraction
- `#49` task CRUD minimal service-level safety-net tests
- `#51` catalog-connected `createTask(...)` service-level safety-net test
- `#52` `createTask(...)` final Prisma data payload helper extraction
- `#53` catalog-connected `updateTask(...)` service-level safety-net test
- `#54` `updateTask(...)` final Prisma data payload helper extraction
- `#55` task custom image and media service-level safety coverage
- `#56` routines task CRUD checkpoint documentation
- `#57` difficulty/catalog mismatch service-level safety coverage
- `#58` pure task difficulty compatibility helper extraction
- `#59` explicit `songId` override service-level safety coverage
- `#60` missing explicit `songId` service-level safety coverage
- `#61` routines resolveTaskInput checkpoint documentation
- `#62` missing catalog task service-level safety coverage
- `#63` missing difficulty level service-level safety coverage
- `#64` missing title after fallback service-level safety coverage
- `#65` pure task title usability helper extraction
- `#66` routines resolveTaskInput checkpoint documentation
- `#67` pure task song lookup guard helper extraction
- `#68` routines checkpoint documentation through the task song lookup guard
- `#69` `searchTaskCatalog(...)` service-level safety coverage
- `#70` pure task catalog search `where` builder extraction
- `#71` routines checkpoint documentation through task catalog search
- `#72` `getProgress(...)` service-level safety coverage
- `#73` pure progress response helper extraction

What is now safer:
- top-level routine create/update behavior has service-level safety coverage
- period create/update/remove behavior has service-level safety coverage
- task create/update/remove behavior has service-level safety-net coverage for the minimal non-catalog path
- task CRUD now has catalog-connected `createTask(...)` and `updateTask(...)` positive-path coverage
- task CRUD now has service-level coverage for custom image creation/update and non-empty media link creation
- difficulty/catalog mismatch behavior now has service-level coverage
- the difficulty compatibility decision now lives in a pure routines domain helper
- explicit `songId` override now has service-level coverage proving it wins over catalog default song fallback
- missing explicit `songId` behavior now has service-level coverage proving the current `NotFoundException` path stops before max sort aggregation and task creation
- missing catalog task behavior now has service-level coverage
- missing difficulty level behavior now has service-level coverage
- missing title after display/catalog fallback behavior now has service-level coverage
- the task title usability decision now lives in a pure routines domain helper
- the task song lookup guard now lives in a pure routines domain helper while `songCatalogItem.findFirst(...)` remains in `RoutinesService`
- `searchTaskCatalog(...)` now has service-level safety coverage for the missing-user guard, blank query behavior, trimmed search query shape, include/order/take shape, and raw Prisma result passthrough
- task catalog search `where` building now lives in the pure `buildRoutineTaskCatalogSearchWhere(...)` routines domain helper
- `getProgress(...)` now has service-level safety coverage for the ownership query, periods/sessions include/select/order shape, missing-routine exception, and current response structure
- final progress response assembly now lives in the pure `buildRoutineProgressResponse(...)` routines domain helper
- routine, task, and period top-level scalar/data shaping are more explicit in the routines domain helper area
- `createTask(...)` and `updateTask(...)` final Prisma data payload shaping now lives in pure helpers

What still remains risky:
- `RoutinesService` is still the main backend hotspot
- task CRUD is now in a stable checkpoint state, but it still depends on `resolveTaskInput(...)`
- `resolveTaskInput(...)` still owns Prisma reads, validation branching, fallback sequencing, and final resolved input assembly
- catalog-connected task flows are much better covered, but resolver orchestration and fallback rules still live together in one method
- `searchTaskCatalog(...)` still returns a raw Prisma include shape consumed directly by the frontend `TaskBuilder`
- `searchTaskCatalog(...)` include shape, `orderBy`, `take`, Prisma execution, and result passthrough intentionally remain in `RoutinesService`
- extracting task catalog search include/order/take should be avoided unless future inspection finds real value beyond cosmetic movement
- `getProgress(...)` still intentionally owns the Prisma read, ownership query, periods/sessions include/select/order shape, missing-routine exception behavior, and progress calculation orchestration
- broader progress service extraction should be avoided unless future inspection finds real value beyond cosmetic movement

Recommended next decision point:
- do not automatically continue `getProgress(...)` refactoring after the response helper extraction
- inspect the next routines hotspot before writing code
- likely next candidate may be delete impact, but implementation should not be chosen without inspection
- reject changes that move Prisma reads, exception creation, lookup order, raw response shape, or broad orchestration

### Current Task CRUD State

Task CRUD is now a stable checkpoint:
- `createTask(...)` final Prisma data payload shaping is extracted into `buildRoutineTaskCrudCreateData(...)`
- `updateTask(...)` final Prisma data payload shaping is extracted into `buildRoutineTaskCrudUpdateData(...)`
- ownership checks remain in `RoutinesService`
- `resolveTaskInput(...)` remains in `RoutinesService`
- Prisma create, update, and delete calls remain in `RoutinesService`
- `taskMediaLink.deleteMany(...)` remains in `RoutinesService`
- `removeTask(...)` remains small and unchanged

This means the next work should treat task CRUD payload shaping as complete for now.

## Target Shape (High-Level Only)

At a high level, `RoutinesService` should increasingly act as:
- ownership/auth-aware backend orchestrator
- Prisma coordination layer
- public API facade for routines endpoints

Logic that should continue moving out over time:
- create/update payload shaping
- catalog-related task input resolution rules
- progress-related calculations and summaries
- delete impact builders
- task/period-specific validation and mapping helpers

What should remain in `RoutinesService` for now:
- endpoint-facing method signatures
- ownership checks
- Prisma reads/writes
- transaction/orchestration flow

This plan does **not** define final sub-services or a final architecture split.

## Concrete PR Plan

### Completed So Far
- routine create/update service safety-net
- routine scalar data helper extraction
- routine task data shaping extraction
- period CRUD service safety-net
- period create/update data helper extraction
- task CRUD minimal service safety-net
- catalog-connected `createTask(...)` service safety-net
- `createTask(...)` final Prisma data payload helper extraction
- catalog-connected `updateTask(...)` service safety-net
- `updateTask(...)` final Prisma data payload helper extraction
- task custom image and media service safety-net
- difficulty/catalog mismatch service safety-net
- pure difficulty compatibility helper extraction
- explicit `songId` override service safety-net
- missing explicit `songId` service safety-net
- missing catalog task service safety-net
- missing difficulty level service safety-net
- missing title after fallback service safety-net
- pure task title usability helper extraction
- pure task song lookup guard helper extraction
- `searchTaskCatalog(...)` service safety-net
- pure task catalog search `where` builder extraction
- `getProgress(...)` service safety-net
- pure progress response helper extraction

### Next Likely Step: Inspect The Next Routines Hotspot
- Goal:
  - choose the next behavior-preserving routines step based on inspection, not momentum
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - relevant routines domain helper tests for reference
- What is inspected:
  - whether delete-impact methods or another documented follow-up has a small safe next step
  - whether the candidate needs safety coverage before extraction
  - whether a candidate risks moving Prisma reads, exceptions, lookup order, raw API shape, or broad orchestration
- What is NOT changed:
  - no production behavior
  - no Prisma query semantics
  - no ownership checks
  - no DTO contract changes
- Why it is safe:
  - it prevents the refactor from sliding into low-value micro-extractions or broad orchestration moves

### Possible PR After Inspection: Add Coverage Or Extract One Small Helper
- Goal:
  - reduce one deterministic slice of a selected hotspot only when coverage and inspection justify it
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - one focused helper under `apps/api/src/routines/domain/`
  - related routines tests
- What is extracted:
  - one small deterministic helper only, or one service-level safety test if coverage should come first
- What is NOT changed:
  - endpoint signatures
  - ownership checks
  - raw response shape
  - Prisma query semantics
- Why it is safe:
  - keeps the current one-step-at-a-time pattern and avoids speculative structure

### Still Later: Consider a Small Orchestration Boundary
- Goal:
  - shrink one remaining routines hotspot only after task CRUD payload shaping and coverage are stronger
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - possibly one new focused helper/module under `apps/api/src/routines/`
  - targeted tests
- What is extracted:
  - one cohesive orchestration boundary only
- What is NOT changed:
  - controller
  - DTOs
  - Prisma query semantics
  - progress/delete-impact/catalog search behavior
- Why it is safe:
  - only appropriate after the current task CRUD hotspot is better isolated and better covered

## Constraints

The following constraints apply to all routines refactor PRs in this plan:
- API response shape must not change
- Prisma queries must not be rewritten broadly
- no large rewrites
- no cross-domain refactors
- no silent behavior change
- prefer one extraction or one test harness step per PR

## Follow-up Register

All items below are **non-blocking** for the next routines hotspot inspection.

- DTO/type mismatch around catalog fallback title optionality
  - Next action: type/contract inspection, not an immediate refactor
  - Blocking next step: no
- explicit `songId` clear paths against catalog defaults
  - Next action: future targeted test PR if song resolution work is touched
  - Blocking next step: no
- remaining custom image create/update/disconnect permutations
  - Next action: future targeted test PR only if touching media behavior
  - Blocking next step: no
- `getDeleteImpact(...)` orchestration
  - Next action: future separate inspection
  - Blocking next step: no
- `getProgress(...)` orchestration
  - Next action: leave Prisma read, ownership query, include/select/order shape, exception behavior, and calculation orchestration in `RoutinesService` unless future inspection finds real value
  - Blocking next step: no
- `searchTaskCatalog(...)` include/order/take/result passthrough
  - Next action: leave in `RoutinesService` unless future inspection finds real value
  - Blocking next step: no

## Recommended Execution Style

For this domain specifically:
- extract one responsibility at a time
- keep `RoutinesService` behavior stable while shrinking it
- add tests around create/update behavior before deeper orchestration moves
- treat sessions/progress/trainer integration points as sensitive boundaries

The plan should be executed as a sequence of small, reviewable PRs, not as a single routines rewrite.
