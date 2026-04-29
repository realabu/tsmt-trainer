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
- [apps/api/src/routines/routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts) is still the largest backend hotspot at roughly 874 lines
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
- `repetition-label.ts`
- `media-kind.ts`

This means the next work should continue from the existing extraction pattern, not restart the design.

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

### PR 1: Extract Routine Create/Update Scalar Shaping
- Goal:
  - reduce inline routine create/update data shaping inside `RoutinesService`
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - one new small helper file under `apps/api/src/routines/domain/`
  - one focused test file under `apps/api/test/routines/`
- What is extracted:
  - pure shaping of top-level routine create/update scalar data
  - for example: `name`, `description`, and other non-relation routine fields
- What is NOT changed:
  - Prisma query structure
  - API response shape
  - task/period handling
  - progress logic
- Why it is safe:
  - scalar mapping is deterministic
  - no query rewrite required
  - follows the same helper pattern already used in admin and routines helpers

### PR 2: Extract Routine Task Create/Update Orchestration Inputs Further
- Goal:
  - reduce how much task create/update mapping and relation shaping still lives inline in the service
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - `apps/api/src/routines/domain/routine-task-input.ts`
  - related routines tests
- What is extracted:
  - additional pure shaping around task create/update payload assembly
  - especially the parts already downstream of `resolveTaskInput(...)`
- What is NOT changed:
  - `resolveTaskInput(...)` validation semantics
  - catalog lookup behavior
  - song fallback behavior
  - media ordering behavior
- Why it is safe:
  - this builds on existing helpers instead of introducing a new abstraction style
  - behavior can be locked with small unit tests

### PR 3: Extract Period CRUD Data / Validation Helpers
- Goal:
  - make period create/update paths easier to reason about without touching progress math
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - `apps/api/src/routines/domain/routine-period-input.ts`
  - related routines tests
- What is extracted:
  - any remaining pure period input/data shaping and normalization still embedded in the service
- What is NOT changed:
  - period ownership lookup
  - progress endpoint behavior
  - delete impact behavior
- Why it is safe:
  - period shaping is narrow and deterministic
  - this does not require cross-domain movement

### PR 4: Introduce a Focused Routine Create/Update Test Harness
- Goal:
  - increase confidence before deeper orchestration cleanup
- Files affected:
  - new or expanded test files under `apps/api/test/routines/`
- What is extracted:
  - no production extraction required in this PR unless a tiny type/helper adjustment is needed
  - this PR primarily adds coverage around create/update routine behavior
- What is NOT changed:
  - runtime behavior
  - API shape
  - Prisma orchestration
- Why it is safe:
  - test-focused PR
  - supports later refactors with low regression risk

### PR 5: Extract One Small Routines Orchestration Boundary
- Goal:
  - begin shrinking `RoutinesService` orchestration clusters after helper/test groundwork is stronger
- Files affected:
  - `apps/api/src/routines/routines.service.ts`
  - one new backend helper/module under `apps/api/src/routines/`
  - targeted tests
- What is extracted:
  - one cohesive orchestration boundary only
  - preferred target: routine create/update branch, not delete impact or progress
- What is NOT changed:
  - controller
  - DTOs
  - Prisma query semantics
  - sessions domain behavior
- Why it is safe:
  - by this point, scalar shaping and key helper logic should already be isolated
  - this keeps the first orchestration split narrow and reviewable

## Constraints

The following constraints apply to all routines refactor PRs in this plan:
- API response shape must not change
- Prisma queries must not be rewritten broadly
- no large rewrites
- no cross-domain refactors
- no silent behavior change
- prefer one extraction or one test harness step per PR

## Recommended Execution Style

For this domain specifically:
- extract one responsibility at a time
- keep `RoutinesService` behavior stable while shrinking it
- add tests around create/update behavior before deeper orchestration moves
- treat sessions/progress/trainer integration points as sensitive boundaries

The plan should be executed as a sequence of small, reviewable PRs, not as a single routines rewrite.
