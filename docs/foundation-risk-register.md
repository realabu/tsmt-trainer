# Foundation Risk Register

## Purpose
This register is the central inventory for foundation/refactor risks that must not be lost between experiments, checkpoints, and future product work.

It tracks:
- completed foundation work
- deferred risks
- trigger conditions for revisiting those risks
- required reading before future work touches an area
- current safety coverage that protects the area
- the next recommended action

This document is not a license to refactor by momentum. It is a routing document: use it to decide what must be inspected before touching a domain, component, workflow, or quality gate.

Current checkpoint:
- Checkpoint 0: inventory and register skeleton
- Checkpoint 1: backend/domain reconciliation
- Checkpoint 2: frontend hotspot reconciliation
- Checkpoint 3: quality/infrastructure reconciliation
- PR range considered: `#44` through `#99`
- Current posture: routines backend, sessions backend, TrainingRunner, and RoutinesManager foundation work have reached checkpoints; further work should be selected by product/foundation priority, not by continuing the last thread.

## How Future Codex Prompts Should Use This Register
Future feature, refactor, UX, data, or quality-gate prompts must inspect this register first.

Required workflow:
1. Identify the area or module touched by the prompt.
2. Read that area's row in this register.
3. Read every linked area-specific plan or checkpoint doc before implementation.
4. Check trigger conditions and deferred risks.
5. Decide whether the prompt can proceed, needs scoped inspection first, or must stop for architect review.
6. State the required reading and the chosen decision in the task update or PR body.

Explicit rule:
- Future feature/refactor/UX prompts must inspect this register first and then inspect any linked area-specific plan docs before implementation.
- If the touched area is not yet reconciled in this register, stop and add or request a scoped reconciliation before implementation.
- Do not treat `good enough` as `safe to change blindly`.

## Status Labels
Use these labels consistently when filling later checkpoints:

| Status | Meaning |
| --- | --- |
| `good enough` | Safe for normal scoped work with existing guardrails, but still inspect touched paths. |
| `acceptable but inspect first` | Not blocking feature work, but scoped inspection is required before changing behavior or boundaries. |
| `needs targeted foundation` | A small foundation PR is recommended before serious feature work in this area. |
| `high-risk / not feature-ready` | Do not start serious feature work here without inspection and likely stabilization. |
| `deferred by decision` | Known risk accepted for now; revisit only when trigger conditions occur. |
| `historical reference` | Completed experiment or plan that informs future work but is not the active next-step guide. |
| `to be reconciled` | Checkpoint 0 inventory entry; details must be completed in later checkpoints. |

## Required Fields Per Area
Each area should eventually include:

| Field | Required content |
| --- | --- |
| Area / module | Domain, component, workflow, or quality gate being tracked. |
| Related PRs | PRs that changed or stabilized the area. |
| Detailed docs | Required plan/checkpoint docs for future work. |
| Completed foundation work | What was stabilized, extracted, tested, documented, or guarded. |
| Deferred risks | Risks intentionally not solved yet. |
| Trigger conditions | Events that require revisiting deferred risks. |
| Required reading before touching | Docs that future prompts must read before implementation. |
| Current safety coverage | Unit/service/API smoke/browser smoke/build/CI coverage that protects the area. |
| Current status | One of the status labels above. |
| Next recommended action | Inspect, pause, add guardrails, implement a small foundation PR, or leave unchanged. |

## Checkpoint 0 Inventory Summary
This is a high-level inventory only. Later checkpoints should reconcile each row with concrete deferred-risk details.

### Backend / Domain Areas To Reconcile

| Area / module | Related PRs | Detailed docs | Current inventory note | Current status |
| --- | --- | --- | --- | --- |
| Auth | Older direct PR mapping uncertain; API/browser smoke coverage through `#87-#95` | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | Auth/profile/token behavior is centralized enough for current work, but token refresh/revocation, profile changes, and default subscription creation remain production-sensitive. | `acceptable but inspect first` |
| Children | Older direct PR mapping uncertain; child ownership smoke in `#88` | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | CRUD is compact; delete impact and badge aggregation still share the service and touch cascade-sensitive data. | `acceptable but inspect first` |
| Routines backend | `#44-#80`, `#79` | `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md`, this register | Backend routines reached a checkpoint with task/period/progress/search/delete-impact guardrails and `RoutineDeleteImpactService`; actual delete semantics and broad service responsibilities remain deferred. | `acceptable but inspect first` |
| `RoutineDeleteImpactService` | `#75-#79` | `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md`, this register | First routines workflow-service boundary; owns delete-impact preview lookup/count orchestration, while public facade and actual deletes remain in `RoutinesService`. | `good enough` |
| Sessions backend | `#83-#85`, `#84`, API smoke `#91-#92` | `docs/sessions-lifecycle-badge-experiment.md`, `docs/refactor-roadmap.md`, this register | Sessions lifecycle and badge orchestration are guarded; lifecycle/timing writes and response flow remain transaction-sensitive in `SessionsService`. | `acceptable but inspect first` |
| `SessionBadgeAwardService` | `#84` | `docs/sessions-lifecycle-badge-experiment.md`, this register | First sessions workflow-service boundary; badge-only reads/writes, duplicate-prevention, and weekly streak orchestration moved out of `SessionsService`. | `good enough` |
| Trainers | Older direct PR mapping uncertain | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | Ownership/role checks and include-heavy overview queries need scoped inspection before trainer feature work. | `needs targeted foundation` |
| Admin/catalog backend | Older direct PR mapping uncertain; admin backend checkpoint documented | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | Admin backend is more split than the frontend, but catalog/activity query shapes remain complex. Admin catalog UI risk is tracked separately in the frontend checkpoint. | `acceptable but inspect first` |

## Checkpoint 1 Backend / Domain Reconciliation

This checkpoint reconciles backend/domain rows from current docs and targeted code inspection. It does not restart backend refactoring and does not define open-ended implementation plans.

### Area: Auth
- Area / module: `apps/api/src/auth`
- Related PRs: older direct PR mapping uncertain; quality coverage added through `#87-#95`.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, `docs/quality-gate-strategy.md`, `docs/api-smoke-completion-experiment.md`.
- Completed foundation work: `AuthService` centralizes register, login, refresh, current-user, profile update, logout, token issuing, and refresh-token hashing. API smoke exercises `/api/auth/login` and `/api/auth/me`; local browser smoke exercises real UI login.
- Deferred risks: auth remains production-sensitive because registration creates the default free subscription, refresh-token rotation/revocation is security-sensitive, profile/email/password updates can affect identity, and auth UI/storage behavior spans frontend helpers.
- Trigger conditions: changes to registration, login, refresh, logout, profile update, token expiry/claims, role behavior, subscription entitlement, auth UI, or auth storage.
- Required reading before touching: this register, `docs/refactor-roadmap.md` auth rows, `docs/architecture-refactor-audit.md` auth sections, `docs/quality-gate-strategy.md`, and auth/API smoke files if the behavior is endpoint-facing.
- Current safety coverage: DB-backed API smoke for login plus `/api/auth/me`; local-first browser smoke for UI login; frontend auth storage/API helper tests; typecheck/build/CI.
- Current status: `acceptable but inspect first`.
- Next recommended action: leave stable unless auth or subscription work is selected; start with scoped inspection and targeted safety tests before changing token, profile, role, or subscription behavior.

### Area: Children
- Area / module: `apps/api/src/children`
- Related PRs: older direct PR mapping uncertain; parent-owned children API smoke added in `#88`.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, `docs/quality-gate-strategy.md`.
- Completed foundation work: `ChildrenService` has a compact ownership-filtered CRUD surface, delete-impact preview, and child badge listing. API smoke verifies a parent sees an owned child and does not see unrelated child data.
- Deferred risks: child delete is cascade-sensitive; delete-impact counts and badge aggregation live in the same service as CRUD; badge listing returns aggregated award details; direct service-level safety coverage appears lighter than routines/sessions.
- Trigger conditions: child delete UX/API changes, child badge/progress feature work, parent/child ownership changes, cascade/schema changes, or frontend dashboard changes that depend on child response shape.
- Required reading before touching: this register, `docs/refactor-roadmap.md` children rows, `docs/architecture-refactor-audit.md` children/family notes, `docs/quality-gate-strategy.md`, and `packages/db/prisma/schema.prisma` for delete/cascade changes.
- Current safety coverage: API smoke for child ownership visibility/non-leak; typecheck/build/CI. Direct child service tests are not currently as prominent as routines/sessions tests.
- Current status: `acceptable but inspect first`.
- Next recommended action: do not refactor by momentum; add targeted safety coverage before changing delete impact, badge aggregation, ownership, or cascade-sensitive behavior.

### Area: Routines backend
- Area / module: `apps/api/src/routines`
- Related PRs: `#44-#80`, especially `#79`; routine API/browser smoke through `#89` and `#95`.
- Detailed docs: `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md`, `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: task/period/progress/search/delete-impact paths gained focused safety coverage; multiple pure domain helpers exist; `RoutineDeleteImpactService` owns delete-impact preview lookup/count orchestration; API smoke verifies parent-owned routine list visibility; browser smoke verifies owned routine visibility.
- Deferred risks: `RoutinesService` remains broad and still owns routine/task/period CRUD, resolver orchestration, progress, catalog listing/search, and actual delete methods. Actual delete semantics and cascade behavior intentionally did not change.
- Trigger conditions: routine/task/period CRUD changes, task catalog search or song catalog changes, progress changes, delete semantics changes, Prisma include/select/order changes, routine editor feature work, trainer/routine sharing, or schema/cascade changes.
- Required reading before touching: this register, `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md`, `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, and `docs/routines-manager-foundation-plan.md` if frontend routine editor/delete UX is involved.
- Current safety coverage: broad routines unit/service tests for CRUD, task catalog, progress, delete impact, input/payload helpers, media/repetition helpers, and `RoutineDeleteImpactService`; DB-backed routine API smoke; local browser routine visibility smoke.
- Current status: `acceptable but inspect first`.
- Next recommended action: keep backend routines paused by default. For future routines work, inspect the exact touched method and add focused tests before moving Prisma reads/writes or changing delete/catalog/progress behavior.

### Area: `RoutineDeleteImpactService`
- Area / module: `apps/api/src/routines/routine-delete-impact.service.ts`
- Related PRs: `#79`.
- Detailed docs: `docs/routines-domain-completion-experiment.md`, `docs/routines-refactor-plan.md`, `docs/routines-manager-foundation-plan.md` for frontend destructive-flow context.
- Completed foundation work: delete-impact preview lookup/count orchestration moved behind a named workflow service; existing pure builders remain in use; `RoutinesService` remains the public facade; actual delete methods stayed in `RoutinesService`.
- Deferred risks: the service protects preview orchestration, not actual delete semantics; frontend delete-impact state and stale confirmation risks remain frontend concerns; schema/cascade behavior remains unchanged.
- Trigger conditions: delete-impact query/count/shape changes, destructive routine/task/period UX changes, actual delete behavior changes, cascade/schema changes, or frontend delete preview/confirmation work.
- Required reading before touching: this register, `docs/routines-domain-completion-experiment.md`, `docs/routines-refactor-plan.md`, and `docs/routines-manager-foundation-plan.md` for UI destructive-flow triggers.
- Current safety coverage: `apps/api/test/routines/routines-delete-impact-service.test.ts`, `apps/api/test/routines/routine-delete-impact.test.ts`, and routines service/facade coverage.
- Current status: `good enough`.
- Next recommended action: leave stable; revisit only when a concrete destructive-preview/delete risk or product change touches the boundary.

### Area: Sessions backend
- Area / module: `apps/api/src/sessions`
- Related PRs: `#83-#85`, especially `#84`; API smoke `#91-#92`; browser runner smoke `#95`.
- Detailed docs: `docs/sessions-lifecycle-badge-experiment.md`, `docs/api-smoke-completion-experiment.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/refactor-roadmap.md`.
- Completed foundation work: service-level safety tests cover finish lifecycle and task timing behavior; badge duplicate-prevention and `PERIOD_TARGET_COMPLETED` paths are covered; `SessionBadgeAwardService` owns badge orchestration; API smoke covers start, complete task, finish, and post-finish session listing; browser smoke covers one-task runner completion.
- Deferred risks: `SessionsService` still owns lifecycle writes, active-session lookup, task timing writes, `getById`/list response flow, and transaction-sensitive sequencing. Transaction behavior, idempotency, and several badge trigger paths were not broadened by the experiment.
- Trigger conditions: changes to `start(...)`, `completeTask(...)`, `finish(...)`, `cancel(...)`, `getById(...)`, session list response shape, task timing writes, status transitions, idempotency, transaction behavior, runner/session UX, badge/progress behavior, or Prisma schema/status fields.
- Required reading before touching: this register, `docs/sessions-lifecycle-badge-experiment.md`, `docs/api-smoke-completion-experiment.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, and `docs/training-runner-foundation-plan.md` for frontend runner interactions.
- Current safety coverage: `apps/api/test/sessions/sessions-lifecycle-service.test.ts`, `apps/api/test/sessions/sessions-badge-awards.test.ts`, pure badge/session helper tests, DB-backed session lifecycle API smoke, and local browser one-task runner smoke.
- Current status: `acceptable but inspect first`.
- Next recommended action: keep sessions backend refactoring paused by default. Use scoped inspection and targeted tests before changing lifecycle/timing/transaction-sensitive behavior.

### Area: `SessionBadgeAwardService`
- Area / module: `apps/api/src/sessions/session-badge-award.service.ts`
- Related PRs: `#84`.
- Detailed docs: `docs/sessions-lifecycle-badge-experiment.md`, `docs/refactor-roadmap.md`.
- Completed foundation work: badge evaluation, duplicate-prevention lookup/write behavior, weekly streak orchestration, and badge-only Prisma reads/writes moved out of `SessionsService` into a named workflow service.
- Deferred risks: badge semantics remain sensitive; duplicate prevention is still behaviorally guarded rather than treated as a broad schema redesign; not every badge trigger path has service-level smoke-style coverage; `finish(...)` still calls badge evaluation from the lifecycle flow.
- Trigger conditions: badge trigger additions/changes, award duplicate semantics, badge visibility features, period/weekly streak logic changes, session finish badge behavior, or database uniqueness/constraint work.
- Required reading before touching: this register, `docs/sessions-lifecycle-badge-experiment.md`, badge domain helper tests, and `packages/db/prisma/schema.prisma` if uniqueness/constraint behavior is discussed.
- Current safety coverage: `apps/api/test/sessions/sessions-badge-awards.test.ts`, badge trigger/fact/decision/domain tests, and finish lifecycle service tests that preserve the badge evaluation entry path.
- Current status: `good enough`.
- Next recommended action: leave stable; add targeted safety coverage for any newly touched trigger before changing badge semantics or award write behavior.

### Area: Trainers
- Area / module: `apps/api/src/trainers`
- Related PRs: older direct PR mapping uncertain.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: trainer assignment endpoints live in a dedicated module/service; role checks distinguish parent, trainer, and admin paths; ownership checks use routine/child relationships; overview/list methods assemble trainer-facing data.
- Deferred risks: `TrainersService` is still broad, role/ownership checks are inline, overview/list queries are include-heavy, direct tests appear lighter than routines/sessions, and assignment revocation/visibility semantics are production-sensitive.
- Trigger conditions: trainer assignment creation/revoke changes, trainer dashboard/overview features, sharing permissions, parent/trainer/admin role behavior, include/response shape changes, or subscription/entitlement coupling.
- Required reading before touching: this register, `docs/refactor-roadmap.md` trainer rows, `docs/architecture-refactor-audit.md` trainer assignment notes, and `packages/db/prisma/schema.prisma` for routine assignment relationships.
- Current safety coverage: typecheck/build/CI and any indirect API protections from auth/ownership patterns. No dedicated trainer smoke path or prominent trainer service tests were identified in this checkpoint.
- Current status: `needs targeted foundation`.
- Next recommended action: before serious trainer feature work, run an inspection-first foundation PR and likely add focused role/ownership/query-shape safety tests. Do not refactor trainer code without a concrete trainer feature or production risk.

### Area: Admin/catalog backend
- Area / module: `apps/api/src/admin`, especially `AdminService`, `AdminCatalogService`, `AdminActivityService`, and `AdminUserService`.
- Related PRs: older direct PR mapping uncertain; admin backend checkpoint is documented in the roadmap.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, `docs/quality-gate-strategy.md`.
- Completed foundation work: `AdminService` is a thin admin authorization facade; catalog, user/family admin, and activity logic are separated into dedicated services; admin activity helpers and admin facade tests exist; catalog media/domain tests exist.
- Deferred risks: catalog CRUD still has complex write/query shapes and transactions; activity list/detail includes remain shape-sensitive; admin user delete/update is destructive; admin catalog UI remains a separate high-risk frontend hotspot and is not solved by backend splits.
- Trigger conditions: admin catalog CRUD changes, task/song/equipment/media catalog import or linking changes, admin activity list/detail changes, admin user/family destructive changes, or admin UI work that depends on backend response shape.
- Required reading before touching: this register, `docs/refactor-roadmap.md` admin backend checkpoint, `docs/architecture-refactor-audit.md` admin notes, existing admin service tests, and frontend admin catalog plans when UI is involved.
- Current safety coverage: `apps/api/src/admin/admin.service.spec.ts`, `apps/api/src/admin/admin-activity.service.spec.ts`, `apps/api/test/admin/admin-catalog-media.test.ts`, `apps/api/test/admin/admin-media-kind.test.ts`, typecheck/build/CI.
- Current status: `acceptable but inspect first`.
- Next recommended action: keep backend stable unless admin product work resumes; inspect the exact service and add focused safety coverage before changing catalog query/write shapes or destructive admin behavior. Track admin catalog UI risk in the frontend checkpoint, not here.

### Frontend Areas To Reconcile

| Area / module | Related PRs | Detailed docs | Current inventory note | Current status |
| --- | --- | --- | --- | --- |
| TrainingRunner | `#95`, `#98` | `docs/training-runner-foundation-plan.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, this register | Session-control deterministic decisions are now helper-backed and tested; cancel, multi-task, in-flight, timer, and visual structure risks remain deferred. | `acceptable but inspect first` |
| RoutinesManager | `#99` | `docs/routines-manager-foundation-plan.md`, this register | Routine editor save-plan risk was reduced; delete-impact preview state, partial save failure, duplicate saves, rendered editor coverage, and `TaskBuilder` coupling remain deferred. | `acceptable but inspect first` |
| TaskBuilder | Related through `#99`; older direct PR mapping uncertain | `docs/routines-manager-foundation-plan.md`, `docs/refactor-roadmap.md`, this register | Catalog search, song loading, draft editing, media fields, and delete callbacks share one component. #99 did not solve this hotspot. | `needs targeted foundation` |
| ParentDashboard | Earlier helper/view-model PRs; direct PR mapping uncertain | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | Helper/view-model layers exist; loading, selection, progress, badges, and rendering still converge in one component. | `acceptable but inspect first` |
| AdminCatalogManager | Older direct PR mapping uncertain | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, this register | Multi-domain admin catalog UI remains one of the largest frontend hotspots and is not solved by admin backend service splits. | `high-risk / not feature-ready` |
| API client/auth storage | Earlier auth/API helper PRs; direct PR mapping uncertain | `docs/quality-gate-strategy.md`, `docs/refactor-roadmap.md`, this register | Shared auth storage and `apiFetch` refresh behavior are tested and stable; auth UX changes remain sensitive. | `good enough` |

## Checkpoint 2 Frontend Hotspot Reconciliation

This checkpoint reconciles frontend hotspot rows from current docs and targeted code inspection. It does not restart frontend refactoring and does not define open-ended implementation plans.

### Area: TrainingRunner
- Area / module: `apps/web/components/training-runner.tsx`, `apps/web/lib/training-runner-session-control.ts`, and related runner helpers.
- Related PRs: `#95` browser smoke experiment and `#98` TrainingRunner foundation experiment.
- Detailed docs: `docs/training-runner-foundation-plan.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/quality-gate-strategy.md`.
- Completed foundation work: Playwright local-first browser smoke covers runner standby and one-task completion; #98 added a pure session-control helper and focused tests; `TrainingRunner` uses that helper for complete-task payload construction, last-task finish decision, success copy, and error fallback copy. Existing runner view-model/image/format helpers have unit coverage.
- Deferred risks: `TrainingRunner` still owns routine loading, API sequencing, React state, timer state, image state, rendering, routine refresh, and cancel behavior. Multi-task browser coverage, cancel flow, double-click/in-flight mutation behavior, timer/best-time logic, media rendering branches, and visual structure remain intentionally deferred.
- Trigger conditions: runner redesign, start/complete/finish/cancel UX changes, multi-task flow changes, timer/best-time changes, in-flight mutation prevention, media rendering changes, badge/progress display in runner, or any feature that changes session-control sequencing.
- Required reading before touching: this register, `docs/training-runner-foundation-plan.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, session API smoke docs, and runner helper tests.
- Current safety coverage: `apps/web/lib/__tests__/training-runner-session-control.test.ts`, `training-runner-view-model.test.ts`, `training-runner-task-images.test.ts`, `training-runner-helpers.test.ts`, DB-backed API session lifecycle smoke, and local-first browser smoke for one-task runner completion.
- Current status: `acceptable but inspect first`.
- Next recommended action: do not continue runner refactoring by momentum. If product work touches runner behavior before the planned redesign, inspect the exact seam and add focused tests for cancel, multi-task, in-flight, timer, or media behavior as needed.

### Area: RoutinesManager
- Area / module: `apps/web/components/routines-manager.tsx`, `apps/web/lib/routines-manager-save-plan.ts`, and related routines manager helpers.
- Related PRs: `#99` RoutinesManager foundation experiment.
- Detailed docs: `docs/routines-manager-foundation-plan.md`, `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: #99 added a pure routine editor save-plan helper and focused tests, then wired it into `RoutinesManager`. The helper pins removed task/period id detection, task/period update/create ordering, endpoint/method planning, and sort-order semantics. Existing routines manager helper and payload tests cover draft mapping and payload construction.
- Deferred risks: frontend delete-impact preview state remains in `RoutinesManager`; stale/competing delete preview risk, partial save failure behavior, duplicate save/in-flight mutation behavior, rendered routine editor save/delete coverage, and `TaskBuilder` coupling remain unsolved. Backend routines refactoring remains paused and is separate from this frontend hotspot.
- Trigger conditions: routine/task/period deletion UX, destructive confirmation changes, routine editor save/delete UX changes, `TaskBuilder` delete callbacks, bulk/reorder/duplicate/archive features, richer editor states, or bugs around stale preview/wrong confirm target/accidental delete.
- Required reading before touching: this register, `docs/routines-manager-foundation-plan.md`, `docs/routines-refactor-plan.md` if backend routines are touched, and backend delete-impact docs/tests if destructive preview behavior changes.
- Current safety coverage: `apps/web/lib/__tests__/routines-manager-save-plan.test.ts`, `routines-manager-payloads.test.ts`, `routines-manager-helpers.test.ts`, routines backend delete-impact service tests, DB-backed routine API smoke, and local browser routine visibility smoke.
- Current status: `acceptable but inspect first`.
- Next recommended action: do not continue RoutinesManager extraction by momentum. Revisit delete-impact preview extraction only for a concrete destructive-flow feature, bug, or architect decision.

### Area: TaskBuilder
- Area / module: `apps/web/components/task-builder.tsx`.
- Related PRs: related through `#99`; older direct PR mapping uncertain.
- Detailed docs: `docs/routines-manager-foundation-plan.md`, `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: task draft mapping and routine payload behavior are covered by routines manager helper/payload tests; #99 explicitly left `TaskBuilder` internals unchanged.
- Deferred risks: `TaskBuilder` still owns catalog search, song loading, task draft editing, media/audio/video fields, custom/catalog task composition, used-catalog filtering, and task delete-impact panel rendering. It also receives destructive callbacks from `RoutinesManager`, so delete UX changes can span both files.
- Trigger conditions: catalog search UX, song loading, media fields, task draft editing, task delete callbacks, task reorder/duplicate/archive, richer task editor states, or destructive-flow UX touching task deletion.
- Required reading before touching: this register, `docs/routines-manager-foundation-plan.md`, `apps/web/AGENTS.md`, routines manager helper/payload tests, and backend routines/delete-impact docs if delete behavior changes.
- Current safety coverage: indirect coverage through `routines-manager-helpers.test.ts`, `routines-manager-payloads.test.ts`, and `routines-manager-save-plan.test.ts`; routine visibility browser smoke. There is no dedicated `TaskBuilder` unit/component test suite yet.
- Current status: `needs targeted foundation`.
- Next recommended action: before serious TaskBuilder feature work, run inspection first and choose one small seam, likely catalog search/song-loading/draft editing or delete callback behavior. Do not combine with RoutinesManager delete-impact extraction unless the product risk requires both.

### Area: ParentDashboard
- Area / module: `apps/web/components/parent-dashboard.tsx`, `apps/web/lib/parent-dashboard-helpers.ts`, and `apps/web/lib/parent-dashboard-view-model.ts`.
- Related PRs: earlier helper/view-model work; direct PR mapping uncertain. Browser smoke coverage through `#95`.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`.
- Completed foundation work: parent dashboard helper and view-model modules exist with focused unit tests; DB-backed API smoke covers children, routines, session lifecycle, and post-finish session listing; local browser smoke covers real login, parent dashboard visibility, and owned child/routine visibility.
- Deferred risks: `ParentDashboard` still owns loading, auth-token checks, selection state, progress/badge fetches, fallback selection behavior, recent sessions, and rendering. Progress/badge UI behavior is not exhaustively covered, and raw API response assumptions still matter.
- Trigger conditions: dashboard loading/selection changes, child/routine/session visibility changes, progress or badge UI changes, response shape changes, multi-child UX changes, or authenticated landing/dashboard navigation changes.
- Required reading before touching: this register, `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, `parent-dashboard-*` helper tests, and backend children/routines/sessions docs for API-shape changes.
- Current safety coverage: `parent-dashboard-helpers.test.ts`, `parent-dashboard-view-model.test.ts`, DB-backed API smoke for the dashboard data foundations, and local browser smoke for login/dashboard/child/routine visibility.
- Current status: `acceptable but inspect first`.
- Next recommended action: leave stable unless dashboard product work is selected; use feature-specific inspection and helper/view-model tests before changing loading, selection, progress, or badge behavior.

### Area: AdminCatalogManager
- Area / module: `apps/web/components/admin-catalog-manager.tsx`.
- Related PRs: older direct PR mapping uncertain.
- Detailed docs: `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`, `docs/quality-gate-strategy.md`.
- Completed foundation work: admin backend has service splits and backend tests; frontend admin catalog still uses a single large component for task, song, and equipment catalog management.
- Deferred risks: `AdminCatalogManager` owns three catalog domains, multiple form states, selection state, save/delete mutations, difficulty levels, media URL shaping, equipment links, status handling, and rendering in one large file. It has no dedicated browser/API smoke path for admin catalog UI and should not be treated as safe for serious admin UI work without stabilization.
- Trigger conditions: admin catalog UI feature work, task/song/equipment catalog CRUD changes, import/media/equipment linking UX, difficulty-level editing, destructive catalog deletion, admin role/permission UX, or backend catalog response shape changes.
- Required reading before touching: this register, `docs/refactor-roadmap.md` admin sections, `docs/architecture-refactor-audit.md` admin UI notes, admin backend tests/docs, and `apps/web/AGENTS.md`.
- Current safety coverage: backend admin service/activity/catalog-media tests and general typecheck/build/CI. Frontend admin catalog-specific coverage is light.
- Current status: `high-risk / not feature-ready`.
- Next recommended action: before admin catalog UI feature work, run a focused inspection/foundation checkpoint and split or test exactly one catalog domain or form seam. Do not start broad admin UI rewrite.

### Area: API client/auth storage
- Area / module: `apps/web/lib/api.ts`, `apps/web/lib/auth-storage.ts`, and `apps/web/lib/use-auth-user.ts`.
- Related PRs: earlier auth/API helper PRs; direct PR mapping uncertain. Quality coverage through API/browser smoke PRs `#87-#95`.
- Detailed docs: `docs/quality-gate-strategy.md`, `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: auth token storage keys and change events are centralized; `apiFetch` centralizes base URL handling, auth headers, JSON parsing, refresh retry, auth clearing, and retry-loop prevention; `useAuthUser` centralizes stored user synchronization.
- Deferred risks: auth UX and redirect behavior remain sensitive; refresh failure behavior clears auth and may redirect; SSR/browser assumptions depend on current helper boundaries; broader auth UI changes can still break storage/event synchronization.
- Trigger conditions: login/register/profile UX changes, refresh-token behavior changes, auth redirect changes, role-aware UI changes, API error-shape changes, storage key changes, or SSR/server-component usage of auth helpers.
- Required reading before touching: this register, `docs/quality-gate-strategy.md`, `docs/architecture-refactor-audit.md` auth flow notes, `api.test.ts`, `auth-storage.test.ts`, and backend auth docs/tests if endpoint behavior changes.
- Current safety coverage: `apps/web/lib/__tests__/api.test.ts`, `apps/web/lib/__tests__/auth-storage.test.ts`, DB-backed auth API smoke, local browser real UI login smoke, typecheck/build/CI.
- Current status: `good enough`.
- Next recommended action: keep stable; inspect before auth UX or token/refresh behavior changes. Do not duplicate auth/session handling in components.

### Quality / Infrastructure Areas To Reconcile

| Area / module | Related PRs | Detailed docs | Current inventory note | Current status |
| --- | --- | --- | --- | --- |
| API smoke | `#87-#93` | `docs/api-smoke-completion-experiment.md`, `docs/quality-gate-strategy.md`, this register | DB-backed API smoke runs in CI and covers auth, children, routines, session lifecycle, and post-finish session listing. | `good enough` |
| Browser smoke | `#94-#95` | `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/quality-gate-strategy.md`, this register | Playwright local-first browser smoke covers app-load/auth, real login, dashboard, owned child/routine visibility, runner standby, and one-task completion; not CI-required. | `good enough` |
| Generated artifact guard | `#81`, related docs `#82` | `docs/quality-gate-strategy.md`, `docs/architecture-refactor-audit.md`, this register | `pnpm check:generated` guards tracked generated output, including `.test-dist`, `.next`, `dist`, and generated Prisma output. | `good enough` |
| CI quality gates | `#81`, `#87`, later quality docs | `docs/quality-gate-strategy.md`, this register | CI runs generated-output guard, Prisma generate/migrate deploy, typecheck, unit tests, DB-backed API smoke, API build, and web build. Browser smoke is local-only. | `good enough` |
| Local dev / Docker deferred | Deferred by explicit quality-gate decisions | `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, this register | Docker/local DB orchestration is intentionally deferred until deployability, onboarding, browser-smoke CI promotion, or local DB reproducibility becomes a concrete goal. | `deferred by decision` |

## Checkpoint 3 Quality / Infrastructure Reconciliation

This checkpoint reconciles quality/infrastructure rows from current docs and targeted script/config inspection. It does not promote browser smoke to CI, add Docker, or define open-ended infrastructure work.

### Area: API smoke
- Area / module: `apps/api/test/smoke`, root `test:smoke`, and `@tsmt/api` `test:smoke`.
- Related PRs: `#87-#93`.
- Detailed docs: `docs/api-smoke-completion-experiment.md`, `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`.
- Completed foundation work: DB-backed API smoke boots the Nest `AppModule` in-process, uses deterministic smoke fixtures, runs against real Postgres in CI, and is exposed through `pnpm --filter @tsmt/api test:smoke` plus root `pnpm test:smoke`.
- Deferred risks: API smoke is intentionally thin, not exhaustive. It does not cover destructive preview endpoints, badge permutations, progress read details, negative session ownership, admin/catalog API flows, payment/subscription behavior, or every API response contract.
- Trigger conditions: browser smoke or product work exposes a backend gap; destructive UI work needs delete-impact endpoint confidence; admin/catalog product work resumes; API response-shape drift causes frontend risk; smoke runtime/flakiness worsens in CI.
- Required reading before touching: this register, `docs/api-smoke-completion-experiment.md`, `docs/quality-gate-strategy.md`, `apps/api/test/smoke/smoke-helpers.ts`, and the specific smoke file being extended.
- Current safety coverage: CI runs Postgres 16, `pnpm db:migrate:deploy`, then `pnpm --filter @tsmt/api test:smoke`. Covered flows are `/api/auth/login` -> `/api/auth/me`, `/api/children` ownership visibility/non-leak, `/api/routines?childId=...` routine ownership visibility/non-leak, session start, task completion, finish, and post-finish `GET /api/sessions?routineId=...`.
- Current status: `good enough`.
- Next recommended action: leave stable; add one targeted API smoke only when a named production, browser-smoke, or release risk justifies it.

### Area: Browser smoke
- Area / module: `apps/web/test/smoke`, `apps/web/playwright.smoke.config.ts`, and `apps/web/playwright.auth-smoke.config.ts`.
- Related PRs: `#94-#95`.
- Detailed docs: `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/quality-gate-strategy.md`, `docs/api-smoke-completion-experiment.md`.
- Completed foundation work: Playwright was selected and installed; app-load/auth-panel smoke is DB-free through `pnpm --filter @tsmt/web test:smoke:app`; authenticated browser smoke is DB-backed through `pnpm --filter @tsmt/web test:smoke:auth`; full local browser smoke runs both through `pnpm --filter @tsmt/web test:smoke`.
- Deferred risks: browser smoke is local-first and not CI-required; authenticated/full smoke requires `DATABASE_URL`, reachable Postgres, and applied migrations; it does not cover destructive previews, admin/catalog UI, badges, broader multi-task/multi-child journeys, or full e2e coverage.
- Trigger conditions: decision to promote browser smoke to CI, browser smoke flakiness, deployability/release readiness, local DB reproducibility work, runner/routine/admin UI changes that need user-visible confidence, or broad auth/routing behavior changes.
- Required reading before touching: this register, `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/quality-gate-strategy.md`, `apps/web/test/smoke/smoke-env.ts`, and both Playwright smoke configs.
- Current safety coverage: local browser smoke covers unauthenticated app-load/auth panel, real UI login, parent dashboard, owned child/routine visibility, runner standby, and one-task runner completion. Playwright outputs are configured under `apps/web/.test-dist/...`.
- Current status: `good enough`.
- Next recommended action: do not expand or promote browser smoke by momentum. Inspect CI promotion separately only when runtime, DB orchestration, artifact handling, and flakiness are the concrete goal.

### Area: Generated artifact guard
- Area / module: `scripts/check-generated-artifacts.mjs`, `.gitignore`, and generated-output paths.
- Related PRs: `#81`, related docs `#82`.
- Detailed docs: `docs/quality-gate-strategy.md`, `docs/architecture-refactor-audit.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`.
- Completed foundation work: `pnpm check:generated` runs `scripts/check-generated-artifacts.mjs` and fails if generated output is tracked. CI runs this guard before dependency install/build steps.
- Deferred risks: the guard only checks tracked files, not untracked local clutter; future tools can create new generated directories that are not yet covered; Playwright/browser artifacts must continue to stay under ignored/guarded paths.
- Trigger conditions: adding test runners, code generators, build output directories, browser/video/trace artifacts, Prisma output changes, package layout changes, or CI artifact upload/download changes.
- Required reading before touching: this register, `docs/quality-gate-strategy.md`, `scripts/check-generated-artifacts.mjs`, `.gitignore`, and the tool config that produces generated files.
- Current safety coverage: blocked tracked paths include `apps/api/.test-dist/`, `apps/web/.test-dist/`, `packages/db/generated/`, and path segments `.next` and `dist`.
- Current status: `good enough`.
- Next recommended action: keep as-is; extend the guard only when a new generated-output path is introduced.

### Area: CI quality gates
- Area / module: `.github/workflows/ci.yml` and root/app package scripts.
- Related PRs: `#81`, `#87`, subsequent API/browser quality docs through `#95`.
- Detailed docs: `docs/quality-gate-strategy.md`, `docs/api-smoke-completion-experiment.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: CI has one `quality-gate` job with Postgres 16, generated-output guard, dependency install, Prisma generate, Prisma migrate deploy, `pnpm typecheck`, `pnpm test`, DB-backed API smoke, API build, and web build.
- Deferred risks: browser smoke is not required in CI; lint script exists but current CI relies on typecheck/tests/build rather than a separate lint gate; CI does not validate Docker/local dev; DB-backed browser smoke CI orchestration has not been inspected.
- Trigger conditions: release hardening, browser-smoke CI promotion, runtime/flakiness investigation, adding new package apps, introducing migrations/schema risk, changing package scripts, adding external services, or making local deployability/onboarding a goal.
- Required reading before touching: this register, `.github/workflows/ci.yml`, `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, and relevant package scripts.
- Current safety coverage: required CI currently distinguishes every-PR gates from local-only browser smoke. Every-PR gates include generated artifact check, typecheck, unit tests, DB-backed API smoke, API build, web build, and migration deploy against CI Postgres.
- Current status: `good enough`.
- Next recommended action: keep CI stable. Add or promote one gate at a time only after inspection proves it is reliable, fast enough, and protects a named production/release risk.

### Area: Local dev / Docker deferred
- Area / module: local Postgres/dev environment, Docker/local DB orchestration, and browser-smoke DB prerequisites.
- Related PRs: deferred by quality-gate decisions; no Docker/local DB implementation PR in the current register scope.
- Detailed docs: `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/architecture-refactor-audit.md`.
- Completed foundation work: docs and browser smoke env errors make DB prerequisites explicit. CI provides real Postgres for API smoke, while local authenticated browser smoke requires a developer-provided migrated Postgres database.
- Deferred risks: no standardized Docker/local DB orchestration exists; local authenticated/full browser smoke is not one-command reproducible on a fresh machine; local API smoke also depends on reachable Postgres; onboarding/deployability may still need more environment automation.
- Trigger conditions: serious deployability work, onboarding friction, repeated local smoke failures due DB setup, browser smoke CI promotion, production deployment planning, or feature work requiring reliable local DB fixtures across multiple contributors.
- Required reading before touching: this register, `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md`, CI workflow, Prisma scripts, and browser smoke env helper.
- Current safety coverage: CI-backed API smoke provides server-side DB confidence; DB-free app-load browser smoke remains locally runnable without Postgres; authenticated/full browser smoke fails with a clear `DATABASE_URL` prerequisite message when DB is missing.
- Current status: `deferred by decision`.
- Next recommended action: do not add Docker by momentum. Start an inspection-only local-dev/deployability plan only when onboarding, deployment, browser-smoke CI promotion, or repeated DB reproducibility pain becomes the concrete goal.

## Area Template For Later Checkpoints
Use this template when reconciling each area.

### Area: `<name>`
- Area / module:
- Related PRs:
- Detailed docs:
- Completed foundation work:
- Deferred risks:
- Trigger conditions:
- Required reading before touching:
- Current safety coverage:
- Current status:
- Next recommended action:

## Checkpoint Plan For Filling The Register

### Checkpoint 0: Inventory And Register Skeleton
Type:
- docs-only

Scope:
- create this document
- add usage rules, status labels, required fields, initial inventory, and checkpoint plan
- do not fully reconcile every risk

Validation:
- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:
- future prompts have one central register to inspect first
- every known major area has a placeholder row
- later checkpoints have clear scope

### Checkpoint 1: Backend / Domain Reconciliation
Type:
- docs-only unless architect explicitly approves a separate code PR later

Scope:
- fill backend/domain rows for:
  - Auth
  - Children
  - Routines backend
  - `RoutineDeleteImpactService`
  - Sessions backend
  - `SessionBadgeAwardService`
  - Trainers
  - Admin/catalog backend

Expected source docs:
- `docs/routines-refactor-plan.md`
- `docs/routines-domain-completion-experiment.md`
- `docs/sessions-lifecycle-badge-experiment.md`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`

Stop conditions:
- reconciliation uncovers a production risk that needs inspection before documentation can be accurate
- related docs conflict in a way that requires architect decision

### Checkpoint 2: Frontend Hotspot Reconciliation
Type:
- docs-only unless architect explicitly approves a separate code PR later

Scope:
- fill frontend rows for:
  - TrainingRunner
  - RoutinesManager
  - TaskBuilder
  - ParentDashboard
  - AdminCatalogManager
  - API client/auth storage

Expected source docs:
- `docs/training-runner-foundation-plan.md`
- `docs/routines-manager-foundation-plan.md`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`
- `docs/browser-smoke-and-quality-gate-roadmap.md`

Stop conditions:
- a future-work guard conflicts with active roadmap guidance
- a hotspot appears to need implementation before it can be safely documented

### Checkpoint 3: Quality / Infrastructure Reconciliation
Type:
- docs-only unless architect explicitly approves a separate implementation PR later

Scope:
- fill quality/infra rows for:
  - API smoke
  - Browser smoke
  - Generated artifact guard
  - CI quality gates
  - Local dev / Docker deferred

Expected source docs:
- `docs/quality-gate-strategy.md`
- `docs/api-smoke-completion-experiment.md`
- `docs/browser-smoke-and-quality-gate-roadmap.md`

Stop conditions:
- CI/browser-smoke/local DB claims cannot be verified from docs and scripts
- the register starts recommending new gates by momentum instead of concrete risk

### Checkpoint 4: Final Consistency Review
Type:
- docs-only

Scope:
- check all area rows for consistency
- remove stale `to be completed` placeholders where possible
- ensure every deferred risk has trigger conditions
- ensure every high-risk area has required reading
- ensure active roadmap docs point future Codex work to this register

Validation:
- `git diff --check`
- `pnpm typecheck`

Outcome decision:
- merge all
- split/partial merge
- continue experiment
- discard

## Current Stop Conditions For This Experiment
Stop and ask for architect review if:
- filling the register would require changing code, tests, CI, scripts, Docker, or package setup
- existing docs conflict about an area's current status
- a deferred risk appears to be immediate and production-blocking
- the register starts becoming a new broad roadmap instead of a risk routing document
- future-work recommendations become implementation plans rather than triggers and required reading

## Initial Uncertainties
- Exact PR mapping for some earlier auth, children, parent dashboard, admin, and API-client helper work remains to be completed.
- The register currently reflects docs and known checkpoint outcomes, not a fresh line-by-line code audit.
- Some area statuses may change after Checkpoints 1-3 reconcile detailed docs and current code evidence.
