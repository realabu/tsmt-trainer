# Sessions Lifecycle / Badge Experiment Plan

## Purpose
This document plans a controlled sessions lifecycle and badge orchestration experiment. It is planning only: no production code, test code, DTOs, controllers, Prisma schema, or frontend files are changed by this document.

The goal is not refactor for its own sake. The goal is to decide whether the sessions backend can be made more production-ready, AI-maintainable, and safe to extend through a small gated experiment.

## Baseline
- Baseline main commit SHA: `f3c8683e38e42e703275906ea8dac0cb2bb3d896`
- Current repository checkpoint: PRs `#44` through `#82` are merged.
- Routines backend refactoring is paused by default.
- `RoutineDeleteImpactService` is extracted and documented as the first routines workflow service boundary.
- Generated-artifact hygiene is guarded by `pnpm check:generated`.
- Current architecture/roadmap docs identify sessions lifecycle and badge orchestration as the likely next backend production-readiness hotspot.

Recommended branch names for the later controlled experiment:
- Reference branch: `checkpoint/sessions-before-lifecycle-badge-experiment`
- Experiment branch: `experiment/sessions-lifecycle-badge-completion`

## Part A - Baseline Inspection

### SessionsService Responsibility Map
Current target file: `apps/api/src/sessions/sessions.service.ts` (~685 lines).

`SessionsService` currently owns these responsibilities:
- Session start/create flow:
  - validates parent ownership through `routine.findFirst(...)`
  - rejects routines without tasks
  - creates `IN_PROGRESS` session
  - returns session with routine/tasks/media and ordered task timings
- Session detail read:
  - validates ownership through `session.findFirst(...)`
  - includes routine tasks/media, top completed routine sessions, and ordered task timings
  - throws `NotFoundException("Session nem talalhato.")`
- Session list:
  - filters by optional `routineId` and `childId`
  - applies parent ownership through child owner
  - includes ordered task timings and routine summary
  - returns raw Prisma result shape
- Task completion flow:
  - validates active session ownership
  - validates task belongs to routine
  - rejects duplicate task timing for the same task/session
  - enforces original task order
  - creates `SessionTaskTiming`
  - increments `completedTaskCount`
  - returns `getById(...)`
- Finish/completion flow:
  - validates active session ownership
  - calculates `completedAt`, fallback `startedAt`, and `totalSeconds`
  - updates session status to `COMPLETED`
  - writes `completedAt`, `totalSeconds`, and notes
  - calls private badge evaluation
  - returns `getById(...)`
- Cancel flow:
  - validates active session ownership
  - updates status to `CANCELED`
  - writes `completedAt` and notes
  - returns `{ success: true }`
- Badge evaluation:
  - loads active badge definitions
  - counts completed sessions, routine sessions, distinct routines, and completed task timings
  - loads previous routine best time
  - loads routine periods
  - builds badge evaluation facts
  - evaluates all trigger types
  - performs additional weekly/period/streak count queries where needed
  - writes badge awards through duplicate-prevention helper
- Duplicate badge prevention:
  - `createBadgeAwardIfMissing(...)` checks existing award by child, badge definition, and either `contextKey` or `reason`
  - creates badge award only when not already found
  - no database unique constraint enforces this beyond an index
- Weekly streak orchestration:
  - loads completed sessions up to `completedAt`
  - delegates pure weekly summaries/streak calculation
- Ownership/access checks:
  - parent ownership checks are inline in service Prisma queries
  - no trainer access path is visible in this service
- Prisma reads/writes:
  - Prisma reads and writes are in `SessionsService`
  - badge orchestration contains many read/count queries and award writes
- Transaction usage:
  - no transaction is currently used around `completeTask(...)`
  - no transaction is currently used around `finish(...)` session update + badge evaluation
  - transaction behavior must not change without explicit approval
- Response assembly:
  - most responses are direct Prisma passthroughs
  - `cancel(...)` returns a small success object
- Exception behavior:
  - current Hungarian messages are part of behavior and must be pinned before movement

### Existing Helper / Domain Map
Current sessions domain helpers:
- `badge-award-identifiers.ts`
  - builds deterministic `contextKey` and `reason` values for badge award variants
  - pure and tested
- `badge-evaluation-facts.ts`
  - maps badge evaluation fact input into a stable facts object
  - pure and tested
- `badge-trigger-config.ts`
  - converts trigger config threshold using current `Number(...)` behavior
  - pure and tested
- `badge-trigger-decisions.ts`
  - contains pure badge trigger decisions for first session, total sessions, routine sessions, distinct routines, task completions, and routine record
  - pure and tested
- `session-week-boundaries.ts`
  - owns week boundaries, inclusive day count, prorated weekly target, and total period target calculations
  - pure and tested
- `weekly-goal-eligibility.ts`
  - owns weekly goal and period target eligibility decisions
  - pure and tested
- `weekly-goal-streak.ts`
  - builds weekly goal summaries and calculates consecutive target streak
  - pure and tested

Important observation:
- Many badge decisions are already pure and tested.
- The orchestration that fetches facts, orders writes, prevents duplicates, and wires finish behavior still lives in `SessionsService`.

### Existing Test Coverage Map
Pure helper coverage:
- `badge-evaluation-facts.test.ts`
- `badge-trigger-config.test.ts`
- `badge-trigger-decisions.test.ts`
- `build-badge-award-identifiers.test.ts`
- `session-week-boundaries.test.ts`
- `weekly-goal-eligibility.test.ts`
- `weekly-goal-streak.test.ts`

Service-level coverage:
- `sessions-badge-awards.test.ts` exercises `finish(...)` through a mocked `SessionsService` harness for selected badge award outcomes.
- Covered service-level badge paths include:
  - first session award
  - total session threshold award and non-award
  - routine record award and non-award
  - task completion count award
  - weekly goal completed award with `periodId`

Integration-like behavior coverage:
- No dedicated database-backed integration test was identified.
- No browser/e2e session lifecycle smoke gate was identified.

Missing / weak coverage:
- `start(...)` query shape and empty-routine failure path.
- `completeTask(...)` ownership lookup, ordering validation, duplicate timing validation, timing create shape, and completed-task increment shape.
- `finish(...)` ownership lookup and session update shape.
- `finish(...)` missing/not-owned active session exception behavior.
- `finish(...)` default `completedAt` and `startedAt ?? createdAt` totalSeconds behavior.
- `finish(...)` lack of transaction behavior is not documented by tests.
- `cancel(...)` ownership lookup, update shape, and response shape.
- `createBadgeAwardIfMissing(...)` duplicate-prevention path where an existing award is found.
- Several badge trigger service paths are not covered at service level:
  - routine session count
  - distinct routine count
  - consecutive weeks completed
  - period target completed
- Partial/invalid task timing data beyond DTO validation is not directly covered.
- API response shapes for start/get/list/complete/finish are mostly raw Prisma passthroughs and not strongly pinned.

### Risk Map
Production-critical risks:
- `finish(...)` updates the session, then evaluates badges without a transaction.
- Badge awards rely on application-level `findFirst` duplicate prevention, not a unique database constraint.
- Badge evaluation reads counts after the session update; reordering this flow would change award outcomes.
- Concurrent or repeated finish calls could create surprising badge behavior if status checks or duplicate-prevention assumptions drift.
- Task timing writes and `completedTaskCount` increments are not transactional.

Medium risks:
- Raw Prisma response shapes are consumed by clients and can drift through include/select changes.
- Ownership checks are inline and easy to weaken during extraction.
- Timezone/week-boundary behavior is sensitive and already required one deterministic test fix.
- Badge orchestration has multiple trigger-specific branches and count queries that future AI changes could accidentally reorder or broaden.
- `SessionStatus.DRAFT` exists in the schema but current service start creates `IN_PROGRESS` directly.

Low or already guarded risks:
- Pure badge trigger thresholds and decisions are well covered.
- Week boundary and goal/streak pure calculations are well covered.
- Some finish badge outcomes are already service-level covered.

## Part B - Desired Target State
“Good enough / 80% production-ready safe-to-extend sessions lifecycle and badge orchestration” means:

Behavior safety:
- Current behavior is preserved unless explicitly planned and approved.
- Session status transitions are clear and pinned by focused tests.
- Finish flow has service-level safety coverage before any orchestration movement.
- Badge awarding behavior is pinned before any boundary extraction.

Data integrity:
- Multi-write flows are understood and documented.
- Transaction behavior remains unchanged unless separately approved.
- Duplicate award risks are either controlled by tests or explicitly documented as current behavior.
- Timing records and session `completedTaskCount` stay consistent with current semantics.

Ownership/authorization safety:
- Parent ownership checks remain explicit in Prisma query filters.
- Ownership checks are not hidden inside vague helpers.
- Trainer/admin access changes are not introduced in this experiment.

API response stability:
- Controller-facing response shapes do not change accidentally.
- Raw Prisma passthrough responses are identified before include/select movement.
- Frontend assumptions are inspected only if a planned change touches response shape.

Prisma safety:
- Query/write shapes are pinned before movement.
- Prisma reads/writes are not moved unless explicitly planned, justified, and covered.
- No Prisma schema, migration, cascade, or constraint changes happen in this experiment.

AI maintainability:
- Future Codex agents can identify where lifecycle, timing, and badge orchestration belong.
- Large method responsibilities are reduced only where it improves real clarity.
- Docs explain what not to touch casually.

Test adequacy:
- High-risk behavior has meaningful safety tests.
- Tests avoid brittle implementation snapshots unless they protect real production risk.
- Pure helper tests remain focused on deterministic logic.
- Service tests pin important lookup/write ordering and exception messages where production risk is real.

Documentation adequacy:
- Final experiment records what changed, what did not, and how mergeability was judged.
- Follow-up items are clearly separated from completed experiment scope.

## Part C - Explicit Non-Goals
- No broad clean architecture rewrite.
- No DTO/controller/API shape changes unless separately justified and approved.
- No Prisma schema or migration changes.
- No badge semantics changes unless separately planned and approved.
- No session lifecycle semantics changes unless explicitly approved.
- No frontend refactor in this experiment.
- No moving Prisma reads/writes without explicit plan and coverage.
- No cosmetic helper extraction.
- No multi-domain refactor.
- No attempt to make sessions perfect before product work can continue.
- No changes to routines, children, trainers, admin, auth, subscriptions, or frontend unless a stop-condition discussion approves it.

## Part D - User Stories

### Story 1 - Finish a training session safely
As a parent user, I want finishing a session to reliably mark the session completed and return the expected session detail, so progress and history remain trustworthy.

Value:
- protects the central training completion path
- reduces risk of broken session history and progress displays

Acceptance criteria:
- ownership lookup for active sessions is pinned
- session update shape for status, completion timestamp, total seconds, and notes is pinned
- not-found behavior and message are pinned
- response shape stays current

Out of scope:
- changing transaction behavior
- changing totalSeconds calculation
- changing API response shape

Regression risks:
- wrong status transition
- wrong duration calculation
- missed badge evaluation
- response include shape drift

### Story 2 - Preserve timing data integrity
As a parent user, I want each completed task timing to be recorded once and in the current expected order, so session history reflects the actual training sequence.

Value:
- protects task-level progress and future analysis
- prevents silent timing duplication or order drift

Acceptance criteria:
- duplicate task timing rejection is pinned
- task-not-in-routine rejection is pinned
- original-order enforcement is pinned
- timing create shape and completed-task increment shape are pinned

Out of scope:
- changing task ordering rules
- changing timing DTO validation
- adding transaction behavior

Regression risks:
- timing records out of order
- double-counted completed tasks
- incorrect task membership validation

### Story 3 - Award badges correctly and only once
As a user, I want badges to be awarded when earned and not duplicated, so achievements are meaningful and stable.

Value:
- protects motivational product behavior
- reduces customer-visible reward bugs

Acceptance criteria:
- duplicate-prevention path is pinned
- existing award path does not create another award
- selected uncovered trigger paths receive focused service-level safety tests before movement
- contextKey/reason behavior remains stable

Out of scope:
- changing badge definitions or trigger semantics
- adding database uniqueness constraints
- redesigning badge strategy

Regression risks:
- duplicate awards
- missed awards
- changed badge reason/context keys
- changed query timing relative to session completion

### Story 4 - Make badge orchestration understandable for future AI-assisted changes
As a developer, I want badge evaluation orchestration to have a clear boundary if it proves safe, so future changes do not accidentally alter lifecycle behavior.

Value:
- reduces cognitive load in `SessionsService`
- gives Codex a named place for badge orchestration if extraction is justified

Acceptance criteria:
- extraction happens only after service safety coverage is added
- public controller-facing `SessionsService` methods remain unchanged
- Prisma query/write shapes remain unchanged
- moved responsibilities are documented

Out of scope:
- broad repository/service architecture
- moving lifecycle start/complete/cancel logic
- changing transaction behavior

Regression risks:
- provider wiring mistakes
- hidden query shape changes
- exception/order changes

### Story 5 - Decide when to pause sessions refactor
As an architect, I want a final outcome review that says whether to merge, partially merge, continue, or discard, so the experiment does not become an AI refactor loop.

Value:
- keeps production-readiness work bounded
- prevents cosmetic micro-extractions

Acceptance criteria:
- final branch is compared against baseline and target state
- validation results are recorded
- service LOC/responsibility impact is summarized
- merge recommendation is explicit

Out of scope:
- implementing extra ideas after the planned steps without a gate

Regression risks:
- experiment grows too broad
- documentation no longer matches implementation

## Part E - Developer Subtasks

### Step 1 - Planning document
- Type: docs-only
- Intended files:
  - `docs/sessions-lifecycle-badge-experiment.md`
- Prerequisites:
  - current main synced
- Validation:
  - `git diff --check`
  - confirm diff is docs-only
- Rollback / stop condition:
  - stop if planning requires production behavior changes
- Must not change:
  - production code
  - tests
  - DTOs/controllers
  - Prisma schema

### Step 2 - Finish lifecycle service safety tests
- Type: test-only
- Intended files:
  - `apps/api/test/sessions/sessions-lifecycle-service.test.ts`
  - or a similarly focused sessions service test file
- Prerequisites:
  - Step 1 approved
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Rollback / stop condition:
  - stop if tests require changing production code
  - stop if mocked Prisma setup becomes broad or brittle without production-risk value
- Must not change:
  - session lifecycle semantics
  - badge semantics
  - API response shape
  - Prisma schema

Expected coverage:
- active session ownership lookup in `finish(...)`
- missing/not-owned active session exception message
- session update shape for completion
- badge evaluation call effect only through existing service behavior
- return through `getById(...)`

### Step 3 - Timing lifecycle service safety tests
- Type: test-only
- Intended files:
  - `apps/api/test/sessions/sessions-lifecycle-service.test.ts`
- Prerequisites:
  - Step 2 complete
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Rollback / stop condition:
  - stop if coverage requires duplicating large routine fixtures unnecessarily
- Must not change:
  - task order rules
  - duplicate timing behavior
  - completed-task increment behavior

Expected coverage:
- `completeTask(...)` task membership rejection
- duplicate task timing rejection
- original-order enforcement
- timing create shape and completed-task increment shape for a positive path

### Step 4 - Badge duplicate-prevention and uncovered trigger safety tests
- Type: test-only
- Intended files:
  - `apps/api/test/sessions/sessions-badge-awards.test.ts`
  - optionally a new focused badge orchestration service test file
- Prerequisites:
  - Step 2 complete
  - Step 3 complete if timing facts are reused
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
- Rollback / stop condition:
  - stop if tests become snapshots of every branch instead of focused production risks
- Must not change:
  - contextKey/reason semantics
  - trigger thresholds
  - duplicate-prevention behavior

Expected coverage:
- existing award prevents duplicate create
- one currently uncovered high-value trigger path, likely `PERIOD_TARGET_COMPLETED` or `CONSECUTIVE_WEEKS_COMPLETED`

### Gate Review A - Decide whether service-boundary extraction is justified
- Type: inspection-only
- Intended files:
  - no file changes required
- Prerequisites:
  - Steps 2-4 complete
- Validation:
  - summarize current diff, test value, and remaining risks
- Stop condition:
  - stop if service extraction would be cosmetic or would require transaction/semantic changes

### Step 5 - Extract `SessionBadgeAwardService` if approved
- Type: refactor-only with existing tests
- Intended files:
  - `apps/api/src/sessions/session-badge-award.service.ts`
  - `apps/api/src/sessions/sessions.service.ts`
  - `apps/api/src/sessions/sessions.module.ts`
  - sessions tests only if constructor/provider wiring requires targeted updates
- Prerequisites:
  - Gate Review A explicitly approves extraction
- Validation:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
  - `pnpm --filter @tsmt/api build`
  - `git diff --check`
- Rollback / stop condition:
  - stop if extraction needs DTO/controller/API/schema changes
  - stop if Prisma reads/writes move beyond badge orchestration
  - stop if tests require broad rewrites
- Must not change:
  - public `SessionsService` method signatures
  - session lifecycle semantics
  - badge semantics
  - transaction behavior
  - Prisma query/write shapes

### Step 6 - Final outcome review
- Type: docs-only
- Intended files:
  - `docs/sessions-lifecycle-badge-experiment.md`
  - optionally `docs/refactor-roadmap.md` only if the experiment is accepted and guidance needs updating
- Prerequisites:
  - Step 5 complete or explicitly skipped
- Validation:
  - `git diff --check`
  - confirm docs-only if this step is only review metadata
- Rollback / stop condition:
  - stop if the review cannot clearly justify merge/partial merge/continue/discard
- Must not change:
  - production code
  - tests

## Part F - Proposed Experiment Branch / PR Strategy
Recommended controlled branch workflow:
1. Capture baseline main commit SHA.
2. Create reference branch:
   - `checkpoint/sessions-before-lifecycle-badge-experiment`
3. Create experiment branch from the same baseline:
   - `experiment/sessions-lifecycle-badge-completion`
4. Open one draft PR from experiment branch to `main`.
5. Use small commits inside the experiment branch:
   - planning document
   - finish lifecycle safety tests
   - timing lifecycle safety tests
   - badge duplicate/trigger safety tests
   - gated service-boundary extraction if approved
   - final outcome review

Recommended gates:
- Gate 1: architect approval of this plan before implementation.
- Gate 2: after finish lifecycle safety tests, confirm timing tests are still the best next risk-reduction step.
- Gate 3: after lifecycle and badge safety tests, decide whether `SessionBadgeAwardService` extraction is still justified.
- Gate 4: before extraction, confirm exact moved responsibilities, files, and unchanged API/DTO/controller/schema behavior.
- Gate 5: after extraction or decision to skip extraction, perform final outcome review before merge.

One large draft PR is recommended for the experiment because it keeps baseline comparison and final outcome review together. If the experiment produces independently valuable safety tests but the extraction is rejected, use partial merge or split commits before merging.

## Part G - Service-Boundary Decision
Recommendation: do not extract a service boundary immediately. Start the experiment with safety coverage first.

Most plausible boundary after coverage:
- `SessionBadgeAwardService`

Why this boundary:
- badge orchestration is a cohesive private responsibility today
- it includes badge definition reads, fact counts, trigger evaluation orchestration, duplicate-prevention writes, and weekly streak orchestration
- it is large enough to reduce `SessionsService` cognitive load
- it is separable from public session lifecycle methods if done carefully

Why not `SessionFinishService` first:
- finish owns lifecycle semantics and response flow, not just badge logic
- moving it first risks broadening into public method orchestration
- lifecycle write ordering and transaction behavior need more safety coverage first

Why not `SessionTimingService` first:
- `completeTask(...)` is important, but it is smaller than badge orchestration
- timing extraction would likely move validation and write sequencing before the bigger finish/badge risks are understood

Why not pure badge helper only:
- many pure badge decisions already exist
- remaining value is orchestration clarity, not more cosmetic helper extraction

What would move into `SessionBadgeAwardService` if approved:
- current private `evaluateBadges(...)`
- current private `createBadgeAwardIfMissing(...)`
- current private `getConsecutiveWeeklyGoalStreak(...)`
- Prisma reads/counts/writes used only for badge award orchestration
- calls to existing pure badge/domain helpers

What must stay in `SessionsService`:
- public controller-facing methods:
  - `start(...)`
  - `getById(...)`
  - `listByRoutine(...)`
  - `completeTask(...)`
  - `finish(...)`
  - `cancel(...)`
- ownership checks for public session lifecycle methods
- session start/create logic
- task timing lifecycle logic
- session completion update
- cancel update
- response passthrough through `getById(...)`

Tests that make extraction safe:
- finish lifecycle service tests
- badge award service tests currently in `sessions-badge-awards.test.ts`
- duplicate-prevention safety coverage
- selected uncovered trigger coverage

Rollback plan:
- keep extraction in a single commit
- if provider wiring or tests become broad, revert extraction commit and keep safety tests
- if extraction changes behavior or query/write shape, stop and request architect decision

## Part H - Final Outcome Review Criteria
The final review must compare the experiment branch against baseline main and the desired target state.

Checklist:
- Baseline commit SHA.
- Final experiment commit SHA.
- Changed files.
- Executed steps.
- Public API/controller/DTO unchanged confirmation.
- Prisma schema unchanged confirmation.
- Session lifecycle semantics unchanged confirmation unless explicitly planned.
- Badge semantics unchanged confirmation unless explicitly planned.
- List of Prisma reads/writes moved, if any.
- Transaction behavior unchanged confirmation unless explicitly planned.
- `SessionsService` responsibility and rough LOC before/after summary.
- Tests added/changed.
- Validation commands and results:
  - `pnpm --filter @tsmt/api test:unit`
  - `pnpm --filter @tsmt/api typecheck`
  - `pnpm --filter @tsmt/api build`
  - `git diff --check`
- Test quality assessment:
  - useful production-risk coverage vs brittle implementation overfitting
- Production-readiness assessment:
  - lifecycle safety
  - badge correctness
  - duplicate-prevention clarity
  - AI maintainability
- Outcome decision:
  - merge all
  - partial merge
  - continue experiment
  - discard

Merge all if:
- safety tests are meaningful
- extraction, if performed, reduces real cognitive load
- no API/DTO/controller/schema/session/badge semantics changed
- validation passes

Partial merge if:
- safety tests are valuable but extraction adds complexity or risk

Continue experiment if:
- the branch is promising but one approved gate remains incomplete

Discard if:
- extraction is cosmetic, brittle, or behavior-risky

## Part I - Stop Conditions
Codex must stop and ask for architect decision if:
- API shape change appears necessary.
- DTO/controller change appears necessary.
- Prisma schema or migration change appears necessary.
- Badge semantics would change.
- Session lifecycle semantics would change.
- Ownership/security behavior becomes uncertain.
- Prisma read/write movement becomes broad.
- Transaction behavior needs changing.
- Tests require brittle overfitting without production-risk value.
- Branch diff grows too large to review comfortably.
- Extraction expands beyond the approved sessions boundary.
- Frontend changes appear necessary.
- The next step looks cosmetic rather than production-readiness driven.

## Recommendation
Start the controlled experiment, but only after architect approval of this plan.

Recommended execution sequence:
1. Approve this plan.
2. Create reference and experiment branches from baseline main.
3. Add finish lifecycle service safety tests.
4. Add timing lifecycle service safety tests if still justified.
5. Add duplicate-prevention / uncovered badge trigger safety tests.
6. Gate-review whether `SessionBadgeAwardService` extraction is justified.
7. Extract `SessionBadgeAwardService` only if the gate approves.
8. Write final outcome review and decide merge all / partial merge / continue / discard.

## Final Outcome Review

### Baseline and Final State
- Baseline commit SHA: `04706d907c1abb58f807dbea82017e6d640d54da`
- Final experiment commit SHA: `e61416477518702661ccfc2b81ae8ca6aff872b9`
- Step 5 implementation commit SHA: `c88a3c1fa6a10be42d685479d29854fc1f3890c2`
- `c88a3c1fa6a10be42d685479d29854fc1f3890c2` is the Step 5 implementation commit; `e61416477518702661ccfc2b81ae8ca6aff872b9` is the final review/docs commit and current experiment head.

Changed files:
- `apps/api/src/sessions/session-badge-award.service.ts`
- `apps/api/src/sessions/sessions.module.ts`
- `apps/api/src/sessions/sessions.service.ts`
- `apps/api/test/sessions/sessions-badge-awards.test.ts`
- `apps/api/test/sessions/sessions-lifecycle-service.test.ts`

Executed steps:
- Step 2: added finish lifecycle service safety tests.
- Step 3: added task timing lifecycle service safety tests.
- Step 4: added badge duplicate-prevention and `PERIOD_TARGET_COMPLETED` service safety tests.
- Gate Review A: confirmed that `SessionBadgeAwardService` extraction was justified after safety coverage.
- Step 5: extracted badge award orchestration into `SessionBadgeAwardService`.

### Public API / Behavior Safety
Confirmed:
- No controller changes.
- No DTO changes.
- No intended API response shape changes.
- No Prisma schema changes.
- No session lifecycle semantics changes.
- No badge semantics changes.
- No transaction behavior changes.
- No frontend changes.

### Boundary Extraction Assessment
The `SessionBadgeAwardService` extraction achieved the intended boundary.

What stayed in `SessionsService`:
- all public controller-facing methods
- `start(...)`
- `getById(...)`
- `listByRoutine(...)`
- `completeTask(...)`
- `finish(...)`
- `cancel(...)`
- `finish(...)` active-session lookup
- `finish(...)` completion update
- `finish(...)` response flow through `getById(...)`
- `completeTask(...)` timing lifecycle and validation
- ownership checks for public lifecycle methods

What moved:
- badge award orchestration
- duplicate-prevention lookup/write behavior
- weekly streak orchestration used by badge evaluation
- calls to existing pure badge/domain helpers

The provider wiring stayed small:
- `SessionBadgeAwardService` injects `PrismaService`
- `SessionsModule` registers `SessionBadgeAwardService`
- `SessionsService` injects and delegates to `SessionBadgeAwardService`

Unrelated sessions logic did not move.

### Query / Prisma Safety
Prisma reads/writes moved into `SessionBadgeAwardService`:
- `badgeDefinition.findMany(...)`
- `session.count(...)` for completed child sessions
- `session.count(...)` for completed routine sessions
- `session.findMany(...)` for distinct completed routines
- `sessionTaskTiming.count(...)` for completed task count
- previous-best `session.findFirst(...)`
- `routine.findUnique(...)` with periods
- weekly goal `session.count(...)`
- period target `session.count(...)`
- weekly streak `session.findMany(...)`
- `badgeAward.findFirst(...)`
- `badgeAward.create(...)`

The query/write/count shapes are intended to be unchanged. Safety coverage now pins representative service behavior for:
- finish lifecycle update and badge evaluation delegation
- task timing lifecycle behavior
- first session badge
- total session count badge
- routine record badge
- task completion count badge
- weekly goal badge
- period target badge
- duplicate-prevention lookup and no-create path

### Tests and Validation
Tests added/changed:
- `sessions-lifecycle-service.test.ts` was added to cover `finish(...)` and `completeTask(...)` lifecycle safety.
- `sessions-badge-awards.test.ts` now tests badge orchestration through `SessionBadgeAwardService` directly.
- Existing pure badge/domain helper tests remain unchanged.

Validation passed after Step 5:
- `pnpm --filter @tsmt/api test:unit`
- `pnpm --filter @tsmt/api typecheck`
- `pnpm --filter @tsmt/api build`
- `git diff --check`

Test quality assessment:
- The test changes are reasonable and production-risk driven.
- They avoid full implementation snapshots of every badge branch.
- They do pin important query/write shapes where behavior is high-risk.
- The badge service tests became cleaner after extraction because they no longer need to drive badge behavior through the full session lifecycle harness.

### SessionsService Before / After
Before:
- `SessionsService` owned session lifecycle, task timing lifecycle, response reads, badge evaluation orchestration, duplicate-prevention writes, weekly streak orchestration, and all related Prisma operations.
- Approximate size: ~685 lines.

After:
- `SessionsService` remains the controller-facing lifecycle facade.
- Badge award orchestration is isolated behind `SessionBadgeAwardService`.
- Approximate `SessionsService` size is materially reduced by moving ~400 lines of badge orchestration.

Remaining large/risky areas:
- `start(...)`, `getById(...)`, `listByRoutine(...)`, `completeTask(...)`, `finish(...)`, and `cancel(...)` still return or depend on raw Prisma shapes.
- `completeTask(...)` remains non-transactional for timing create + completed-task increment.
- `finish(...)` remains non-transactional for session completion + badge evaluation.
- Transaction behavior was intentionally not changed in this experiment.

### Production-Readiness Impact
Finish lifecycle safety:
- improved through focused service-level tests for active-session ownership lookup, completion update shape, totalSeconds behavior, badge evaluation delegation, and response flow.

Task timing lifecycle safety:
- improved through tests for not-found behavior, task membership validation, duplicate timing validation, original-order enforcement, timing create shape, completed-task increment, and response flow.

Badge duplicate-prevention safety:
- improved through explicit existing-award coverage that verifies the current `badgeAward.findFirst(...)` lookup and no-create behavior.

Period target badge safety:
- improved through service-level coverage for `PERIOD_TARGET_COMPLETED`, including period-scoped count query and `periodId` award data.

AI maintainability:
- improved. Future agents now have a named `SessionBadgeAwardService` boundary for badge orchestration and a smaller `SessionsService` lifecycle facade.
- This is not merely code movement: the branch added safety coverage first, then moved a cohesive private workflow boundary.

### Merge Recommendation
Recommendation: merge all.

Why:
- The safety tests are meaningful and cover production-critical lifecycle and badge risks.
- The extraction reduced real cognitive load in `SessionsService`.
- Public API/controller/DTO/schema/frontend behavior did not change.
- Session lifecycle, badge semantics, and transaction behavior were intentionally preserved.
- Validation passed.

Do not partial-merge unless review finds an unexpected maintainability issue in the new boundary.

### Follow-Up Recommendations
Immediately after merge:
- Update `docs/refactor-roadmap.md` or architecture guidance with a short sessions checkpoint.
- Mark `SessionBadgeAwardService` as the first sessions workflow service boundary.
- Pause sessions backend refactoring by default after the checkpoint.

Future sessions candidates should remain inspection-only until justified:
- `completeTask(...)` transaction/data-integrity inspection
- `finish(...)` transaction/idempotency inspection
- `start(...)` and `getById(...)` raw response shape inspection
- additional service-level badge coverage for `ROUTINE_SESSION_COUNT`, `DISTINCT_ROUTINE_COUNT`, or `CONSECUTIVE_WEEKS_COMPLETED`
- frontend/session runner smoke or e2e quality gate planning
