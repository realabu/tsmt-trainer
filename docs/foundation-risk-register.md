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
| Auth | To be completed in Checkpoint 1 | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | Auth/profile/token behavior is centralized enough for current work, but subscription creation and auth UX remain production-sensitive. | `acceptable but inspect first` |
| Children | To be completed in Checkpoint 1 | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | CRUD is compact; delete impact and badge aggregation still share the service. | `acceptable but inspect first` |
| Routines backend | `#44-#80`, `#79` | `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md` | Backend routines reached a checkpoint with task/period/progress/search/delete-impact guardrails and `RoutineDeleteImpactService`; actual delete semantics and large service responsibilities remain deferred. | `acceptable but inspect first` |
| `RoutineDeleteImpactService` | `#75-#79` | `docs/routines-refactor-plan.md`, `docs/routines-domain-completion-experiment.md` | First routines workflow-service boundary; owns delete-impact preview lookup/count orchestration, while public facade and actual deletes remain in `RoutinesService`. | `good enough` |
| Sessions backend | `#83-#85`, `#84` | `docs/sessions-lifecycle-badge-experiment.md`, `docs/refactor-roadmap.md` | Sessions lifecycle and badge orchestration are guarded; lifecycle/timing writes remain transaction-sensitive in `SessionsService`. | `acceptable but inspect first` |
| `SessionBadgeAwardService` | `#84` | `docs/sessions-lifecycle-badge-experiment.md` | First sessions workflow-service boundary; badge-only reads/writes and duplicate-prevention moved out of `SessionsService`. | `good enough` |
| Trainers | To be completed in Checkpoint 1 | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | Ownership/role checks and include-heavy overview queries need scoped inspection before trainer feature work. | `needs targeted foundation` |
| Admin/catalog backend | To be completed in Checkpoint 1 | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | Admin backend is more split than the frontend, but catalog/activity query shapes remain complex. | `acceptable but inspect first` |

### Frontend Areas To Reconcile

| Area / module | Related PRs | Detailed docs | Current inventory note | Current status |
| --- | --- | --- | --- | --- |
| TrainingRunner | `#95`, `#98` | `docs/training-runner-foundation-plan.md`, `docs/browser-smoke-and-quality-gate-roadmap.md` | Session-control deterministic decisions are now helper-backed and tested; cancel, multi-task, in-flight, timer, and visual structure risks remain deferred. | `acceptable but inspect first` |
| RoutinesManager | `#99` | `docs/routines-manager-foundation-plan.md` | Routine editor save-plan risk was reduced; delete-impact preview state, partial save failure, duplicate saves, rendered editor coverage, and `TaskBuilder` coupling remain deferred. | `acceptable but inspect first` |
| TaskBuilder | Related through `#99`; direct PRs to be reconciled | `docs/routines-manager-foundation-plan.md`, `docs/refactor-roadmap.md` | Catalog search, song loading, draft editing, media fields, and delete callbacks share one component. | `needs targeted foundation` |
| ParentDashboard | Earlier helper/view-model PRs to be reconciled | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | Helper/view-model layers exist; loading, selection, progress, badges, and rendering still converge in one component. | `acceptable but inspect first` |
| AdminCatalogManager | To be completed in Checkpoint 2 | `docs/refactor-roadmap.md`, `docs/architecture-refactor-audit.md` | Multi-domain admin catalog UI remains one of the largest frontend hotspots. | `high-risk / not feature-ready` |
| API client/auth storage | Earlier auth/API helper PRs to be reconciled | `docs/quality-gate-strategy.md`, `docs/refactor-roadmap.md` | Shared auth storage and `apiFetch` refresh behavior are tested and stable; auth UI changes remain sensitive. | `good enough` |

### Quality / Infrastructure Areas To Reconcile

| Area / module | Related PRs | Detailed docs | Current inventory note | Current status |
| --- | --- | --- | --- | --- |
| API smoke | `#87-#93` | `docs/api-smoke-completion-experiment.md`, `docs/quality-gate-strategy.md` | DB-backed API smoke runs in CI and covers auth, children, routines, session lifecycle, and post-finish session listing. | `good enough` |
| Browser smoke | `#94-#95` | `docs/browser-smoke-and-quality-gate-roadmap.md`, `docs/quality-gate-strategy.md` | Playwright local-first browser smoke covers app-load/auth, real login, dashboard, owned child/routine visibility, runner standby, and one-task completion; not CI-required. | `good enough` |
| Generated artifact guard | `#81`, related docs `#82` | `docs/quality-gate-strategy.md`, `docs/architecture-refactor-audit.md` | `pnpm check:generated` guards tracked generated output. | `good enough` |
| CI quality gates | `#81`, `#87`, later quality docs | `docs/quality-gate-strategy.md` | CI runs typecheck, tests, DB-backed API smoke, builds, migrations, and generated-output guard. | `good enough` |
| Local dev / Docker deferred | To be completed in Checkpoint 3 | `docs/quality-gate-strategy.md`, `docs/browser-smoke-and-quality-gate-roadmap.md` | Docker/local DB orchestration is intentionally deferred until deployability, onboarding, or browser-smoke CI promotion needs it. | `deferred by decision` |

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
