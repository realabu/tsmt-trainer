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

## Checkpoint After #44–#55

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

What is now safer:
- top-level routine create/update behavior has service-level safety coverage
- period create/update/remove behavior has service-level safety coverage
- task create/update/remove behavior has service-level safety-net coverage for the minimal non-catalog path
- task CRUD now has catalog-connected `createTask(...)` and `updateTask(...)` positive-path coverage
- task CRUD now has service-level coverage for custom image creation/update and non-empty media link creation
- routine, task, and period top-level scalar/data shaping are more explicit in the routines domain helper area
- `createTask(...)` and `updateTask(...)` final Prisma data payload shaping now lives in pure helpers

What still remains risky:
- `RoutinesService` is still the main backend hotspot
- task CRUD is now in a stable checkpoint state, but it still depends on `resolveTaskInput(...)`
- `resolveTaskInput(...)` still combines catalog lookup, difficulty validation, song fallback, display fallback, and resolved input assembly
- catalog-connected task flows are better covered, but not every validation or media permutation has service-level coverage

Recommended next decision point:
- inspect `resolveTaskInput(...)` decomposition candidates before making the next behavior-preserving refactor PR
- do not jump directly into `resolveTaskInput(...)` refactoring before that inspection
- do not jump directly to a broad orchestration boundary
- do not mix in progress, delete-impact, or catalog search changes without separate inspection

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

### Next Likely Step: Inspect `resolveTaskInput(...)` Decomposition Candidates
- Goal:
  - identify the smallest safe extraction target inside `resolveTaskInput(...)`
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - `apps/api/src/routines/domain/routine-task-input.ts`
  - `apps/api/src/routines/domain/routine-task-display.ts`
  - `apps/api/src/routines/domain/routine-task-song.ts`
  - routines task CRUD tests for reference
- What is inspected:
  - catalog task lookup behavior
  - difficulty lookup and compatibility validation
  - song fallback and song existence behavior
  - title/display fallback behavior
  - final resolved input assembly
- What is NOT changed:
  - no production behavior
  - no Prisma query semantics
  - no ownership checks
  - no DTO contract changes
- Why it is safe:
  - keeps the next refactor choice evidence-based instead of forcing a broad abstraction

### Likely PR After Inspection: Extract One Small `resolveTaskInput(...)` Helper
- Goal:
  - reduce one deterministic slice of task input resolution while keeping Prisma reads and orchestration in `RoutinesService`
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - one focused helper under `apps/api/src/routines/domain/`
  - related routines tests
- What is extracted:
  - one small deterministic resolution or validation helper only
- What is NOT changed:
  - endpoint signatures
  - ownership checks
  - catalog lookup behavior
  - song fallback behavior
  - Prisma query semantics
- Why it is safe:
  - builds on the stronger task CRUD service-level safety-net before touching the next hotspot

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

All items below are **non-blocking** for the next `resolveTaskInput(...)` inspection.

- DTO/type mismatch around catalog fallback title optionality
  - Next action: type/contract inspection, not an immediate refactor
  - Blocking next inspection: no
- explicit `songId` override path service-level coverage
  - Next action: future targeted test PR
  - Blocking next inspection: no
- difficulty mismatch validation path service-level coverage
  - Next action: future targeted test PR
  - Blocking next inspection: no
- remaining custom image create/update/disconnect permutations
  - Next action: future targeted test PR only if touching media behavior
  - Blocking next inspection: no
- `getDeleteImpact(...)` orchestration
  - Next action: future separate inspection
  - Blocking next inspection: no
- `getProgress(...)` orchestration
  - Next action: future separate inspection
  - Blocking next inspection: no
- `searchTaskCatalog(...)` query shape
  - Next action: future separate inspection
  - Blocking next inspection: no

## Recommended Execution Style

For this domain specifically:
- extract one responsibility at a time
- keep `RoutinesService` behavior stable while shrinking it
- add tests around create/update behavior before deeper orchestration moves
- treat sessions/progress/trainer integration points as sensitive boundaries

The plan should be executed as a sequence of small, reviewable PRs, not as a single routines rewrite.
