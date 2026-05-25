# Trainers Foundation Plan

## Purpose

This document defines the controlled foundation experiment for the Trainers API
module. Future trainer feature/refactor/UX work must inspect
`docs/foundation-risk-register.md` and this plan before implementation.

This is not a broad backend refactor. Children, routines, auth, and subscription
behavior are context only unless a later checkpoint finds a concrete blocker.
The first goal is to make current role, ownership, assignment, and query-shape
behavior explicit and safer for future AI-assisted changes.

## Experiment Model

- Baseline main SHA: `090e8c9b164fa5e146b41938a1553cb246041fc3`
- Branch: `experiment/trainers-foundation`
- Draft PR title: `refactor(api): trainers foundation experiment`
- PR mode: one draft PR, sequential checkpoints, architect review after each checkpoint
- Merge decision after final outcome review: merge all, split/partial merge, continue experiment, or discard

Do not merge intermediate checkpoints separately. Stop for architect direction if
a checkpoint requires API shape changes, Prisma schema changes, auth/subscription
changes, or broad children/routines refactoring.

## Required Reading

- `docs/foundation-risk-register.md`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`
- `docs/quality-gate-strategy.md`
- `apps/api/AGENTS.md`
- `apps/api/src/trainers/*`
- `packages/db/prisma/schema.prisma`

Context-only files, only as needed:

- `apps/api/src/auth/*`
- `apps/api/src/children/*`
- `apps/api/src/routines/*`
- `apps/web/components/trainer-dashboard.tsx`
- `apps/web/components/trainer-assignment-detail.tsx`
- `apps/web/components/trainer-assignment-panel.tsx`

## Current Responsibility Map

The Trainers module currently owns trainer assignment API behavior:

- Creating a trainer assignment for a parent-owned child/routine pair.
- Looking up trainers by normalized email.
- Allowing only `TRAINER` or `ADMIN` users to be assigned as trainers.
- Returning an existing active assignment instead of creating a duplicate.
- Listing trainer-facing assignments for the current trainer.
- Listing parent-owned assignments, optionally filtered by `childId` and `routineId`.
- Returning a trainer routine overview with child, owner, badges, routine, tasks,
  sessions, task timings, and active trainer shares.
- Revoking an active assignment by setting `revokedAt` and status `REVOKED`.

The controller is thin and delegates to the service. The service is cohesive in
domain scope, but it mixes role checks, ownership checks, Prisma query shapes,
assignment lifecycle behavior, and frontend response assumptions in one file.

## Endpoint And Service Map

Controller endpoints:

- `POST /api/trainers/assignments` -> `createAssignment(...)`
- `GET /api/trainers/assignments/owned` -> `listOwnedAssignments(...)`
- `GET /api/trainers/assignments` -> `listMyAssignments(...)`
- `GET /api/trainers/assignments/:id` -> `getTrainerRoutineOverview(...)`
- `DELETE /api/trainers/assignments/:id` -> `revokeAssignment(...)`

DTOs:

- `CreateTrainerAssignmentDto`
  - `childId`
  - `routineId`
  - `trainerEmail`
  - `status` as `"PENDING" | "ACTIVE"`

The public API shape should not change in this experiment.

## Ownership And Role-Safety Map

Current role checks:

- `createAssignment(...)`: only `PARENT` or `ADMIN`.
- `listOwnedAssignments(...)`: only `PARENT` or `ADMIN`.
- `revokeAssignment(...)`: only `PARENT` or `ADMIN`.
- `listMyAssignments(...)`: only `TRAINER` or `ADMIN`.
- `getTrainerRoutineOverview(...)`: only `TRAINER` or `ADMIN`.

Current ownership/visibility checks:

- `createAssignment(...)` verifies the requested `routineId` and `childId`
  belong together and that `child.ownerId` is `currentUser.sub`.
- `listOwnedAssignments(...)` filters active assignments by `child.ownerId`.
- `revokeAssignment(...)` finds only active assignments whose `child.ownerId` is
  `currentUser.sub`.
- `listMyAssignments(...)` filters active assignments by
  `trainerId: currentUser.sub`.
- `getTrainerRoutineOverview(...)` filters active assignment detail by
  `id`, `trainerId: currentUser.sub`, and `revokedAt: null`.

Important current semantics:

- `ADMIN` is role-allowed on parent and trainer views, but the current ownership
  filters still use `currentUser.sub`. That means admin does not automatically
  bypass ownership/trainer assignment filters in these methods. Preserve this
  behavior unless a future product decision explicitly changes admin visibility.
- Assignment creation normalizes `trainerEmail` to lowercase for lookup.
- Duplicate active assignment creation returns the existing assignment and does
  not create a new record.
- Revocation is a soft revoke: `revokedAt` is set and status becomes `REVOKED`.

## Query Shape Map

High-value query shapes currently relied on by frontend code:

- `listOwnedAssignments(...)` returns trainer identity, child id/name, and routine
  id/name for the parent trainer-sharing panel.
- `listMyAssignments(...)` returns child/owner context and a routine with periods,
  recent sessions, ordered tasks with media links, and active trainer assignments.
- `getTrainerRoutineOverview(...)` returns child owner, recent badge awards,
  ordered tasks with media links, recent sessions with ordered task timings, and
  active trainer assignments.

The trainer dashboard and detail pages depend on these raw nested response shapes.
Do not change include/select/order/take behavior without explicit contract work.

## Existing Coverage Map

Current direct trainer coverage at Checkpoint 0 baseline:

- No dedicated `apps/api/test/trainers/*` tests were found.
- No DB-backed API smoke path covers `/api/trainers/*`.

Indirect coverage:

- Routine delete-impact tests count trainer assignments.
- Typecheck/build/CI cover compilation.
- Auth guard and API smoke cover general authentication paths.
- Browser smoke covers parent/routine/session happy paths, not trainer flows.

At Checkpoint 0, trainer role/ownership and response-shape behavior was
under-protected relative to its production sensitivity. The final outcome review
below records that `#103` added focused service-level characterization tests and
that Trainers is now acceptable-but-inspect-first rather than
needs-targeted-foundation.

## Missing Coverage Map

Missing direct safety coverage:

- Role rejection for parent-only and trainer-only methods.
- Parent ownership lookup for create/list/revoke paths.
- Trainer visibility lookup for list/detail paths.
- Duplicate active assignment behavior.
- Trainer email normalization.
- Assignment status mapping to `ACTIVE` or `PENDING`.
- Revocation update shape.
- Include/order/take shapes for trainer dashboard and detail queries.
- Current admin role semantics that still honor ownership/trainer filters.

## Production Risks

- Role/ownership mistakes can leak child/routine/session information across
  parent/trainer boundaries.
- Include-heavy trainer queries are raw response contracts for frontend trainer
  pages.
- Duplicate assignment behavior and soft revocation affect visible sharing state.
- Current admin semantics are subtle and could be accidentally broadened.
- Revocation is destructive-ish from the product perspective even though it is a
  soft update.

## AI-Maintainability Risks

- Inline guards are easy for future AI changes to accidentally loosen.
- Query include graphs are large and repeated enough that small edits can break
  trainer dashboard/detail assumptions.
- There is no compact test file that explains current trainer assignment rules.
- A future feature could mistake the `ADMIN` role checks for global admin bypass.

## Target-State Architecture

Near-term target state:

- `TrainersController` stays thin.
- `TrainersService` keeps public use-case methods and Prisma orchestration.
- Direct service tests characterize current role, ownership, duplicate, revoke,
  and query-shape behavior.
- A small pure role/policy helper may be considered only after tests demonstrate
  the seam is useful.
- Query extraction or service-boundary extraction is deferred unless tests show a
  concrete repeated high-risk shape worth naming.

Do not introduce a repository layer, rewrite Prisma queries, or change response
contracts by momentum.

## Extraction And Test Epics

### Epic 1: Trainer Role/Ownership Safety Characterization

Why needed:
Role and ownership behavior is the highest production risk and currently lacks
direct tests.

Production risk protected:
Cross-family data leaks, trainer visibility leaks, accidental admin bypass, and
incorrect parent/trainer role access.

AI-maintainability benefit:
Future changes can read one focused test file to understand current access rules.

Behavior that must remain unchanged:
All current role checks, owner filters, trainer filters, error types/messages,
and admin-filter semantics.

New tests needed:
Focused service-level tests for create, owned-list, my-list, overview, and revoke
authorization/where clauses.

Implementation risk:
Low if test-only and fixtures stay small.

Status:
Must-have before serious trainer feature work.

### Epic 2: Trainer Assignment Lifecycle Characterization

Why needed:
Create/duplicate/status/revoke behavior is production-sensitive sharing state.

Production risk protected:
Duplicate active assignment creation, wrong status mapping, email case mismatch,
and incorrect soft revoke update.

AI-maintainability benefit:
Documents assignment lifecycle rules without reading the full service.

Behavior that must remain unchanged:
Lowercase email lookup, existing-active return behavior, `ACTIVE`/`PENDING`
mapping, and soft revoke result `{ success: true }`.

New tests needed:
Focused service-level tests using small Prisma mocks.

Implementation risk:
Low if kept test-only.

Status:
Must-have before serious trainer assignment feature work.

### Epic 3: Query-Shape Characterization

Why needed:
Trainer dashboard/detail pages rely on include-heavy raw response shapes.

Production risk protected:
Accidental removal of periods, sessions, tasks, task timings, badge awards, owner
identity, active trainer shares, orderBy, or take limits.

AI-maintainability benefit:
Makes frontend response assumptions visible from backend tests.

Behavior that must remain unchanged:
Current include/select/order/take shapes and active assignment filters.

New tests needed:
Small service-level tests asserting Prisma arguments for `listMyAssignments(...)`,
`listOwnedAssignments(...)`, and `getTrainerRoutineOverview(...)`.

Implementation risk:
Moderate. Tests should assert critical query structure without becoming broad,
 brittle snapshots.

Status:
Recommended as part of the first implementation checkpoint if kept focused.

### Epic 4: Role/Policy Helper Extraction

Why needed:
Inline role checks are repeated and easy to loosen.

Production risk protected:
Wrong role access across parent/trainer methods.

AI-maintainability benefit:
Could name allowed-role decisions.

Behavior that must remain unchanged:
Exact allowed roles and thrown exceptions.

New tests needed:
Only after characterization tests exist.

Implementation risk:
Moderate. Extraction may be unnecessary if tests are sufficient.

Status:
Optional/deferred. Do not start before test characterization.

### Epic 5: Query Helper Or Service Seam

Why needed:
Repeated include graphs could eventually benefit from named helpers.

Production risk protected:
Query-shape drift in trainer views.

AI-maintainability benefit:
Could isolate trainer dashboard/detail data contracts.

Behavior that must remain unchanged:
All Prisma where/include/select/order/take shapes and returned raw response shape.

New tests needed:
Characterization tests first; extraction only if query helpers clearly reduce
review risk.

Implementation risk:
Moderate to high. Moving query graphs can become noisy and brittle.

Status:
Deferred unless Checkpoint 1 shows a clear small seam.

### Epic 6: API Smoke

Why needed:
A real API smoke could prove login plus trainer assignment visibility.

Production risk protected:
End-to-end auth/DB wiring for trainer flows.

AI-maintainability benefit:
Would catch broken trainer route wiring after future changes.

Behavior that must remain unchanged:
No API shape or fixture broadening.

New tests needed:
Only if trainer workflows become release-critical and a small fixture can prove
one path without a broad product journey.

Implementation risk:
Moderate because it needs parent, trainer, child, routine, and assignment fixture
setup.

Status:
Deferred. Do not add API smoke by momentum.

## User Stories

### Story 1: Parent Can Only Assign Trainers To Owned Routines

As a maintainer, I can see the exact ownership query used when a parent creates a
trainer assignment, so future trainer features do not leak cross-family access.

Acceptance criteria:

- Tests prove non-parent/trainer roles are rejected.
- Tests prove routine lookup requires `routineId`, `childId`, and `child.ownerId`.
- Tests preserve trainer email normalization and trainer/admin assignable roles.

### Story 2: Trainer Can Only See Active Assignments For Themselves

As a maintainer, I can see the exact trainer visibility filters for list/detail
views, so future query changes do not expose another trainer's assignments.

Acceptance criteria:

- Tests prove trainer-only role requirements.
- Tests prove `trainerId: currentUser.sub` and `revokedAt: null` filters.
- Tests preserve critical include/order/take shapes without broad snapshots.

### Story 3: Parent Revocation Remains A Scoped Soft Revoke

As a maintainer, I can see that revocation is limited to parent-owned active
assignments and updates `revokedAt` plus `REVOKED` status.

Acceptance criteria:

- Tests prove revoke lookup requires assignment id, active state, and owner id.
- Tests prove update shape sets status `REVOKED` and a `Date` `revokedAt`.
- Tests preserve `{ success: true }`.

## Checkpoint Plan

### Checkpoint 0: Deep Inspection And Foundation Plan

Type:
Docs-only.

Intended files:

- `docs/trainers-foundation-plan.md`

Scope:
Inspect Trainers responsibilities, role/ownership rules, query shapes, coverage,
and define the smallest safe implementation checkpoint.

Validation:

- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:

- Plan identifies current trainer risks and coverage gaps.
- Plan recommends the smallest risk-reducing next checkpoint.
- No code/tests/API/schema/frontend changes.

Stop conditions:

- Docs and code materially disagree about current trainer behavior.
- The first useful step would require behavior or API shape changes.

### Checkpoint 1: Characterize Trainer Role/Ownership And Query Shapes

Type:
Test-only.

Intended files:

- `apps/api/test/trainers/trainers-service.test.ts`

Scope:
Add focused service-level tests for current TrainersService behavior. Use small,
deterministic Prisma mocks; do not create broad fixture factories.

Suggested coverage:

- `createAssignment(...)` rejects non-parent/admin roles.
- `createAssignment(...)` looks up the routine through `routineId`, `childId`,
  and `child.ownerId`.
- `createAssignment(...)` lowercases trainer email lookup.
- `createAssignment(...)` rejects non-trainer/non-admin target users.
- `createAssignment(...)` returns an existing active assignment without creating.
- `createAssignment(...)` maps status to `ACTIVE` or `PENDING`.
- `listOwnedAssignments(...)` filters by parent-owned child and optional filters.
- `listMyAssignments(...)` filters by current trainer and active assignments.
- `getTrainerRoutineOverview(...)` filters by assignment id, trainer id, and
  active assignment, and keeps critical include/order/take structure.
- `revokeAssignment(...)` soft-revokes only parent-owned active assignments.

Validation:

- `pnpm --filter @tsmt/api test:unit`
- `pnpm --filter @tsmt/api typecheck`
- `pnpm typecheck`
- `git diff --check`

Acceptance criteria:

- Tests describe current role/ownership/query behavior.
- No production code changes.
- No API/DTO/schema/response shape changes.
- Mocks stay small and deterministic.

Stop conditions:

- Tests require broad brittle Prisma mocks.
- Current behavior is internally contradictory enough that tests would encode a
  suspected bug without architect review.
- Service changes become necessary.

### Checkpoint 2.5: Gate Review Before Extraction

Type:
Inspection/docs-only.

Intended files:

- `docs/trainers-foundation-plan.md`

Scope:
Decide whether characterization tests are sufficient, or whether a tiny role
helper/query helper extraction is justified.

Validation:

- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:

- Gate decision is explicit.
- Further extraction is justified only by concrete production or
  AI-maintainability risk.

Stop conditions:

- Continuing would become query rewrite or broad service refactor.
- Extraction would change API shape, ownership behavior, role behavior, or
  response shape.

Gate result after Checkpoint 1:

- Recommendation: stop implementation and proceed to Checkpoint 5 final outcome
  review.
- Checkpoint 1 addressed the highest concrete Trainers risk by characterizing
  role gates, ownership filters, current admin semantics, duplicate active
  assignment behavior, email normalization, status mapping, soft revoke behavior,
  and critical dashboard/detail query shapes.
- Role/policy helper extraction is not must-have now. The decisions are named in
  focused tests, and extracting them immediately would add abstraction with low
  incremental risk reduction.
- Query helper extraction is not must-have now. The include/order/take shapes are
  characterized, and moving them now would risk response-shape drift or noisy
  refactor without a concrete trainer feature.
- Trainer API smoke remains deferred until trainer workflows become
  release-critical or product work touches trainer-facing flows.
- The current PR is valuable and mergeable after final outcome review if
  validation remains green.

### Optional Checkpoint 3: Tiny Policy Or Query Seam

Type:
Small backend refactor, only if Checkpoint 2.5 approves.

Possible files:

- `apps/api/src/trainers/trainers.service.ts`
- `apps/api/src/trainers/trainers-policy.ts` or
  `apps/api/src/trainers/trainers-query-shapes.ts`
- `apps/api/test/trainers/trainers-service.test.ts`

Scope:
Extract exactly one named seam if tests prove it reduces risk. Prefer role/policy
helper over query movement unless query shape duplication becomes the clearer
risk.

Validation:

- `pnpm --filter @tsmt/api test:unit`
- `pnpm --filter @tsmt/api typecheck`
- `pnpm typecheck`
- `git diff --check`

Stop conditions:

- API response shape changes.
- Prisma query semantics change.
- A repository layer starts forming.
- Children/routines/auth refactoring starts.

### Checkpoint 5: Final Outcome Review

Type:
Docs/PR-body update only.

Intended files:

- `docs/trainers-foundation-plan.md`
- `docs/foundation-risk-register.md`, only if a small status update is needed
- PR body

Scope:
Record final state, validations, behavior preserved, risk reduced, deferred
risks, trigger conditions, and merge/split/continue/discard recommendation.

Validation:

- `git diff --check`
- `pnpm typecheck`

Final outcome:

- Checkpoint 0 created this plan and captured Trainers responsibilities,
  endpoint/service/query maps, ownership and role-safety rules, coverage gaps,
  target-state guidance, and checkpoint stop conditions.
- Checkpoint 1 added focused service-level characterization tests in
  `apps/api/test/trainers/trainers-service.test.ts`.
- Checkpoint 2.5 concluded that the characterization tests address the highest
  concrete Trainers risk and that further extraction should not continue by
  momentum.

Files changed by the experiment:

- `docs/trainers-foundation-plan.md`
- `apps/api/test/trainers/trainers-service.test.ts`
- `docs/foundation-risk-register.md`

Validation results recorded across the experiment:

- `pnpm --filter @tsmt/api test:unit` passed after Checkpoint 1.
- `pnpm --filter @tsmt/api typecheck` passed after Checkpoint 1.
- `pnpm typecheck` passed after Checkpoints 0, 1, 2.5, and final outcome
  review.
- `git diff --check` passed after Checkpoints 0, 1, 2.5, and final outcome
  review.

Behavior preserved:

- No production code changed.
- API endpoint paths, HTTP methods, DTOs, Prisma schema, and API response shapes
  were not changed.
- Ownership behavior, role behavior, admin visibility semantics,
  auth/subscription behavior, duplicate assignment behavior, revoke behavior,
  and trainer query shapes were not changed.
- Frontend behavior, browser smoke scope, CI wiring, Docker setup, and
  children/routines/sessions refactoring were not changed.

Risk reduced:

- Parent/trainer/admin role gates are now characterized.
- Parent ownership filters and trainer visibility filters are now
  characterized.
- Current admin scoped semantics are explicit in tests.
- Duplicate active assignment behavior, trainer email normalization,
  `ACTIVE`/`PENDING` status mapping, and soft revoke behavior are now covered.
- Critical trainer list/detail include/order/take query shapes are now
  characterized.
- Future AI changes can inspect trainer rules in tests before changing service
  code.

Deferred risks:

- Role/policy helper extraction remains deferred.
- Query helper/service seam extraction remains deferred.
- Trainer API smoke remains deferred.
- Frontend trainer dashboard/detail/panel coverage remains light.
- A future product decision about global admin visibility remains unresolved.
- Subscription/entitlement coupling in trainer workflows remains deferred until
  it becomes a concrete product concern.

Trigger conditions for revisiting deferred seams:

- Trainer assignment create/revoke UX changes.
- Trainer dashboard/detail features.
- Parent/trainer/admin role behavior changes.
- Sharing permission changes.
- Trainer query include/select/order/take response shape changes.
- Subscription/entitlement coupling enters trainer workflows.
- Bugs appear around duplicate assignment, revoked assignment visibility, or
  trainer/parent data leakage.
- Trainer workflow becomes release-critical enough to justify API smoke.

Final recommendation:

- Merge all after final architect review and validation.
- Do not continue implementation now.
- Do not start role/policy extraction, query extraction, or trainer API smoke by
  momentum.

## Must-Not-Change Constraints

- Do not change API endpoint paths.
- Do not change HTTP methods.
- Do not change DTOs.
- Do not change Prisma schema.
- Do not change API response shapes.
- Do not change ownership behavior.
- Do not change role behavior.
- Do not change admin visibility semantics.
- Do not change auth or subscription behavior.
- Do not change trainer assignment duplicate behavior.
- Do not change revoke behavior.
- Do not change browser smoke scope.
- Do not add CI wiring.
- Do not add Docker.
- Do not broaden into children/routines/sessions refactoring.
- Do not rewrite Prisma queries by momentum.

## Rollback And Split Strategy

If Checkpoint 1 succeeds and no extraction is justified, the tests plus plan can
merge as the foundation improvement. If a later extraction becomes noisy, keep
the tests and discard the extraction. If tests reveal a suspected product bug,
stop and ask for architect/product direction rather than silently changing
behavior.

## Recommended Next Checkpoint

Proceed to Checkpoint 5: final outcome review.

Checkpoint 1 provided the intended guardrails without production changes.
Further extraction should wait for a concrete trainer feature, permission change,
or query-shape change that makes a named policy/query seam clearly safer than the
current characterized service behavior.

## Deferred Risks And Triggers

Deferred risks:

- Role/policy helper extraction remains optional.
- Query helper/service seam extraction remains optional.
- API smoke for trainer paths is deferred.
- Frontend trainer dashboard/detail/panel coverage remains light.
- Admin/global trainer visibility semantics remain current behavior and should
  not be broadened accidentally.

Trigger conditions for revisiting deferred seams:

- Trainer assignment creation/revoke UX changes.
- Trainer dashboard or detail features.
- Sharing permission changes.
- Parent/trainer/admin role behavior changes.
- Include/select/order/take response shape changes.
- Subscription/entitlement coupling enters trainer workflows.
- Bugs appear around duplicate assignment, revoked assignment visibility, or
  trainer/parent data leakage.
