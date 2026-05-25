# TaskBuilder Foundation Plan

## Purpose

This document records Checkpoint 0 for the controlled TaskBuilder foundation experiment.

The goal is to reduce concrete production and AI-maintainability risk in `TaskBuilder` without turning the current routine editor into a broad UI rewrite. Future TaskBuilder work must inspect `docs/foundation-risk-register.md` and this plan before implementation.

This plan is connected to `docs/routines-manager-foundation-plan.md`: `TaskBuilder` remains owned by the RoutinesManager flow, and destructive-flow risks around task deletion and delete-impact preview are still shared with RoutinesManager. This experiment must not start backend routines refactoring, delete-impact extraction, browser-smoke expansion, or TaskBuilder visual redesign by momentum.

## Experiment Baseline

- Baseline main SHA: `e7b6659e20c8c2a9de75e7bdeb52c7d84f7cafe5`
- Experiment branch: `experiment/task-builder-foundation`
- Draft PR title: `refactor(web): task builder foundation experiment`
- Current checkpoint: Checkpoint 0, inspection and extraction plan only
- Current risk-register status at Checkpoint 0 baseline: Orange, needs targeted foundation before serious TaskBuilder feature work. Final status after `#101`: acceptable but inspect first; see the final outcome review below and `docs/foundation-risk-register.md`.

## Current Responsibility Map

`apps/web/components/task-builder.tsx` currently owns several responsibilities in one 430-line component:

- Catalog task search state: `query`, `results`, `searchStatus`, 250 ms debounce, `/api/routines/task-catalog/search`.
- Song catalog loading state: `songs`, `/api/routines/song-catalog`, fallback to empty options on failure.
- Used catalog-task filtering: `usedCatalogTaskIds` and disabled "Mar hozzaadva" behavior.
- Task draft creation: `emptyTask(...)`, custom task add, catalog task add, default song selection, default title/details mapping.
- Task draft mutation: `updateTask(...)` patches task fields by index.
- Task ordering normalization: `normalizeTasks(...)` resets `sortOrder` after add/remove.
- Task removal: new task removal is local; persisted task removal delegates to RoutinesManager delete-impact callbacks.
- Draft field rendering: title, details, difficulty level, song, coach text, repetition fields, image/audio/video URL fields.
- Catalog result rendering: title, summary/instructions fallback, default song/equipment/difficulty labels, preview image.
- Delete-impact preview rendering for persisted task delete confirmation.

This is not one kind of complexity. It mixes IO effects, draft business rules, destructive-action UI, and form rendering.

## RoutinesManager Boundary

`RoutinesManager` uses `TaskBuilder` in two places:

- New routine creation: `tasks={tasks}`, `onChange={setTasks}`. There are no delete-impact callbacks for new unsaved tasks.
- Existing routine editing: `tasks={editingTasks}`, `onChange={setEditingTasks}`, and task delete callbacks:
  - `onRequestRemoveTask={(task) => task.id && void requestTaskDeleteImpact(task.id)}`
  - `taskDeleteImpact={taskDeleteImpact}`
  - `onConfirmDeleteTask={confirmTaskDelete}`
  - `onCancelDeleteTask={() => setTaskDeleteImpact(null)}`

RoutinesManager still owns:

- persisted delete-impact fetches
- destructive confirmations
- actual task deletion API call
- editor save plan and API mutation sequencing
- parent data reload timing
- status copy

TaskBuilder should not take ownership of those side effects in this experiment.

## State And API Orchestration

TaskBuilder local state:

- `query`: catalog search input
- `results`: catalog search results
- `songs`: song catalog options
- `searchStatus`: user-facing catalog search status/error copy

TaskBuilder derived state:

- `accessToken`: read directly from `window.localStorage`
- `usedCatalogTaskIds`: memoized set of selected catalog task ids
- catalog result preview data: first media link image, summary/instructions fallback, equipment labels, difficulty labels
- task display labels through `getDisplayRepetitionsLabel(...)`

TaskBuilder API calls:

- `GET /api/routines/task-catalog/search?q=...`
- `GET /api/routines/song-catalog`

TaskBuilder does not directly save routine/task payloads. Those shapes are owned by:

- `apps/web/lib/routines-manager-payloads.ts`
- `apps/web/lib/routines-manager-save-plan.ts`

## Existing Coverage At Checkpoint 0 Baseline

Current safety coverage relevant to TaskBuilder:

- `routines-manager-helpers.test.ts` protects routine API response to task/period draft mapping, media extraction, catalog metadata, default song handling, and repetition label fallback.
- `routines-manager-payloads.test.ts` protects create/update task payload shape, default song behavior, media link payload order/labels, period payloads, and create routine payload shape.
- `routines-manager-save-plan.test.ts` protects routine editor save operation ordering, removed task/period id detection, task/period create/update ordering, and task `sortOrder` semantics.
- API routine tests protect backend task CRUD, task catalog search query shape, delete-impact behavior, routine period CRUD, routine create/update/delete, and progress-adjacent routines behavior.
- API smoke protects auth, parent-owned children, parent-owned routines, minimal session lifecycle, and finished session listing.
- Browser smoke protects app load/auth panel, real UI login, parent dashboard, owned child/routine visibility, runner standby, and one-task runner completion.

Coverage gaps:

- No focused TaskBuilder unit tests.
- No browser smoke for routine editor create/save/delete UX.
- No test pins custom task add behavior.
- No test pins catalog task add behavior, default song selection, duplicate catalog disabling, or catalog search status copy.
- No test pins song catalog failure fallback.
- No rendered coverage for delete-impact preview targeting, confirm/cancel wiring, or stale preview risk.

## Production And AI-Maintainability Risks

Concrete production risks:

- Catalog task insertion can accidentally change default song semantics, difficulty metadata, title/details defaults, or `sortOrder`.
- Custom task insertion and removal can accidentally break editor order and save-plan payload semantics.
- Duplicate catalog task prevention can drift because it is currently inline derived state.
- Song catalog loading and default-song option behavior can drift, creating confusing or invalid song selection payloads.
- Persisted task deletion depends on correct callback routing between TaskBuilder and RoutinesManager. Wrong target or stale preview is a destructive-flow risk.
- Media URL fields are visually simple but feed payload behavior that distinguishes image from audio/video links.

AI-maintainability risks:

- A future Codex change could edit form rendering and accidentally alter draft business rules because they live in the same component.
- Catalog search, song loading, task creation, delete preview, and field editing are easy to mentally conflate.
- The component already has enough responsibilities that adding product features directly inside it would make review harder.

Risks that are mostly readability for now:

- Splitting every input row into presentational components.
- Extracting a full catalog-search hook before catalog UX changes are planned.
- Building a generic task editor state machine.

## Target-State Architecture

The target is a small, boring boundary around deterministic TaskBuilder decisions, not a new framework.

Recommended target shape:

- `TaskBuilder` remains the React component that renders task editor UI and owns local catalog/song fetch effects for now.
- A pure TaskBuilder helper module owns deterministic draft operations:
  - empty/custom task creation
  - catalog task draft creation
  - task list normalization after add/remove
  - used catalog task id derivation
  - optional catalog search status message selection if it can be kept pure and small
- RoutinesManager continues to own save orchestration, delete-impact side effects, destructive confirmations, and parent data reloads.
- Existing routines-manager payload/save-plan helpers remain the source of truth for API payload and mutation ordering.
- Catalog search and song loading may later move behind a small hook/helper only if a concrete catalog UX feature or stability risk requires it.
- Delete-impact preview extraction stays deferred until destructive-flow work is selected.

## Extraction Epics

### Epic 1: Task Draft Operation Helper

- Why needed: custom/catalog task add, duplicate catalog filtering, and sort normalization are core editor behavior currently hidden inside rendering.
- Production risk protected: wrong task defaults, wrong default song selection, wrong `sortOrder`, duplicated catalog task insertion.
- AI-maintainability benefit: future changes can reason about task draft behavior without reading the whole component.
- Behavior that must remain unchanged: default empty fields, `__DEFAULT__` song sentinel, catalog title/details defaults, current normalization order, duplicate disabled behavior.
- Existing coverage to rely on: routines-manager payload/save-plan tests, browser routine visibility smoke.
- New tests needed: pure helper tests for empty task creation, catalog task draft creation, normalization, used catalog id derivation, duplicate behavior.
- Implementation risk: low if helper stays pure and does not perform API calls.
- Recommendation: must-have before serious TaskBuilder feature work.

### Epic 2: Catalog Search Status Helper Or Tiny Search Hook

- Why needed: search status copy and result loading are mixed with UI rendering.
- Production risk protected: weak, mostly UX consistency unless catalog search work is planned.
- AI-maintainability benefit: moderate if future work changes catalog search behavior.
- Behavior that must remain unchanged: 250 ms debounce, empty query behavior, endpoint path, current user-facing status/error copy.
- Existing coverage to rely on: backend catalog search tests.
- New tests needed: only pure status-message tests if extracted; avoid rendered or fetch-heavy tests unless a catalog feature requires them.
- Implementation risk: medium because moving debounce/fetch effects can become broad.
- Recommendation: defer unless catalog search UX or reliability work is selected.

### Epic 3: Song Options Helper

- Why needed: default-song option and loaded song options influence task payload behavior.
- Production risk protected: accidental drift in default-song UI and `songSelection` semantics.
- AI-maintainability benefit: moderate if song selection UX changes.
- Behavior that must remain unchanged: `__DEFAULT__` option only when catalog default exists, empty song option, loaded song options order from API, failure fallback to empty list.
- Existing coverage to rely on: routines-manager payload tests for `__DEFAULT__`, backend task CRUD tests for song validation.
- New tests needed: pure option/view-model tests only if extracted.
- Implementation risk: low to medium.
- Recommendation: optional; consider after Epic 1 if song/catalog feature work is planned.

### Epic 4: Media Field View-Model Helper

- Why needed: image/audio/video fields are visually simple but map to different payload paths.
- Production risk protected: only relevant if media UX changes.
- AI-maintainability benefit: moderate for media-specific features.
- Behavior that must remain unchanged: image URL remains `customImageExternalUrl`; audio/video remain ordered `mediaLinks` labels via existing payload helper.
- Existing coverage to rely on: routines-manager helper/payload tests.
- New tests needed: none unless media rendering logic changes.
- Implementation risk: low but easy to become cosmetic.
- Recommendation: defer.

### Epic 5: Delete Callback Boundary

- Why needed: TaskBuilder renders task delete-impact preview while RoutinesManager owns the destructive side effects.
- Production risk protected: stale preview, wrong confirm target, accidental destructive action.
- AI-maintainability benefit: high if destructive-flow UX changes.
- Behavior that must remain unchanged: persisted task delete must request preview first, unsaved task removal remains local, confirm/cancel callbacks remain RoutinesManager-owned.
- Existing coverage to rely on: backend delete-impact tests and RoutinesManager final outcome guard.
- New tests needed: likely rendered/component coverage or a very small pure targeting helper if a seam is found.
- Implementation risk: medium to high because destructive UI and parent state are coupled.
- Recommendation: defer until product work touches task deletion, destructive confirmation, TaskBuilder delete callbacks, or routine editor delete/save UX.

## User Stories

- As a developer, I can inspect how TaskBuilder creates custom and catalog task drafts without reading the entire component, so feature changes do not accidentally break save payload semantics.
- As a parent, adding a catalog task should preserve the current title/details/default-song behavior.
- As a parent, adding/removing tasks should preserve the current editor order and downstream `sortOrder` save behavior.
- As an architect, I can decide whether catalog search, song options, or destructive delete preview deserve more work after the first small seam is tested.

## Checkpoint Plan

### Checkpoint 0: TaskBuilder Deep Inspection And Plan

- Type: docs-only
- Files: `docs/task-builder-foundation-plan.md`
- Scope: inspect TaskBuilder, RoutinesManager boundary, existing helpers/tests, and coverage.
- Validation: `git diff --check`, `pnpm typecheck`
- Acceptance criteria: plan identifies responsibilities, risks, target architecture, checkpoint order, stop conditions, and must-not-change constraints.

### Checkpoint 1: Characterize Task Draft Operations

- Type: test-only plus tiny pure helper
- Intended files:
  - `apps/web/lib/task-builder-draft.ts`
  - `apps/web/lib/__tests__/task-builder-draft.test.ts`
- Prerequisites: Checkpoint 0 accepted.
- Exact scope:
  - create pure helpers for empty task creation, catalog task draft creation, task normalization, used catalog id derivation, and possibly removal normalization.
  - do not use helper in `TaskBuilder` yet unless unavoidable.
- Acceptance criteria:
  - tests pin current custom task defaults.
  - tests pin current catalog task defaults, including title/details/default song/difficulty metadata.
  - tests pin normalization and duplicate catalog id derivation.
  - no React/component test tooling.
- Validation:
  - `pnpm --filter @tsmt/web test:unit`
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `git diff --check`
- Stop conditions:
  - helper would duplicate payload helper behavior.
  - helper grows into a generic state machine.
  - tests require rendered component tooling.
- Must not change:
  - UI behavior, API calls, endpoint paths, payload shapes, RoutinesManager implementation, delete-impact behavior.

### Checkpoint 2: Use Draft Helper In TaskBuilder

- Type: refactor-only with existing tests
- Intended files:
  - `apps/web/components/task-builder.tsx`
  - `apps/web/lib/task-builder-draft.ts`
  - `apps/web/lib/__tests__/task-builder-draft.test.ts` only if tiny adjustment is needed
- Prerequisites: Checkpoint 1 accepted.
- Exact scope:
  - replace inline `emptyTask`, catalog add, normalization, and used-catalog id decisions with the pure helper.
  - keep API effects, rendering, and delete-impact callbacks in TaskBuilder.
- Acceptance criteria:
  - component has less inline draft business logic.
  - existing behavior preserved.
  - helper is used naturally and does not obscure control flow.
- Validation:
  - `pnpm --filter @tsmt/web test:unit`
  - `pnpm --filter @tsmt/web build`
  - `pnpm typecheck`
  - `pnpm check:generated`
  - `git diff --check`
- Optional validation:
  - `pnpm --filter @tsmt/web test:smoke:app`
- Stop conditions:
  - helper usage would change task order, default song behavior, or duplicate-catalog behavior.
  - diff becomes broad/noisy.
  - delete-impact state or RoutinesManager implementation starts changing.

### Checkpoint 2.5: Gate Review Before Further Extraction

- Type: inspection/docs-only
- Intended files:
  - `docs/task-builder-foundation-plan.md`
- Prerequisites: Checkpoint 2 accepted.
- Exact scope:
  - decide whether Epic 1 already reduces enough risk.
  - evaluate whether catalog search, song options, or delete callback extraction is necessary now or feature-triggered.
- Validation:
  - `git diff --check`
  - `pnpm typecheck`
- Recommendation bias:
  - stop implementation unless a concrete remaining TaskBuilder risk clearly justifies one more small checkpoint.

Checkpoint 2.5 gate result:

- Checkpoints 1-2 addressed the highest concrete TaskBuilder production and AI-maintainability risk: deterministic task draft creation, catalog task defaults, default song sentinel behavior, duplicate catalog filtering, and task order normalization are now pure, tested, and used by `TaskBuilder`.
- Catalog search extraction is not must-have before serious TaskBuilder feature work unless upcoming work changes search UX, debounce behavior, result status copy, or catalog API assumptions.
- Song loading/options extraction is not must-have before serious TaskBuilder feature work unless upcoming work changes song selection UX, default song handling, or song catalog fallback behavior.
- Delete callback/delete-impact extraction remains important but is destructive-flow work. It should be revisited only when a product feature, bug, or architect decision touches task deletion, delete-impact UI, destructive confirmation, or RoutinesManager delete-preview state.
- Continuing now would mostly move into async UI, rendered-test, or destructive-flow territory. That could reduce some future maintainability risk, but it would also broaden the experiment beyond the approved draft-operation seam.
- Current PR is valuable and mergeable after final outcome review if final validation remains green.
- Gate recommendation: stop implementation and proceed to final outcome review. Do not start Checkpoint 3 by momentum.

### Optional Checkpoint 3: Catalog/Song Seam Only If Gate Approves

- Type: test-only or narrow refactor
- Intended files:
  - `apps/web/lib/task-builder-catalog.ts` or `apps/web/lib/task-builder-song-options.ts`
  - matching focused tests
  - `apps/web/components/task-builder.tsx` only if helper is used naturally
- Prerequisites: Checkpoint 2.5 explicitly recommends continuing.
- Exact scope:
  - extract only pure status/option derivation or a tiny hook if implementation remains small.
- Stop conditions:
  - debounce/fetch movement becomes broad.
  - tests become brittle around async UI.
  - implementation starts looking like full e2e or component testing setup.

### Checkpoint 5: Final Outcome Review

- Type: docs-only
- Intended files:
  - `docs/task-builder-foundation-plan.md`
  - PR body if useful
- Scope:
  - record final state, files changed, validation, risks reduced, deferred risks, and final recommendation.
- Outcome decision:
  - merge all
  - split/partial merge
  - continue experiment
  - discard

## Must-Not-Change Constraints

- Do not change production behavior.
- Do not change UI copy or visible behavior.
- Do not change API calls, endpoint paths, HTTP methods, or payload shapes.
- Do not change DTOs, Prisma schema, migrations, backend routines, or admin/catalog backend.
- Do not modify RoutinesManager implementation during Checkpoint 0 or Checkpoint 1.
- Do not start delete-impact extraction in this experiment unless a later gate explicitly approves it.
- Do not touch TaskBuilder internals beyond the approved checkpoint scope.
- Do not add browser smoke, CI wiring, Docker, or new dependencies.
- Do not introduce a broad fixture/test framework, generic editor state machine, or form abstraction.

## Rollback And Split Strategy

- Checkpoint 0 is docs-only and can be discarded without code impact.
- Checkpoint 1 can be split or discarded if the pure helper feels artificial.
- Checkpoint 2 should only merge with Checkpoint 1 if the helper is used naturally in TaskBuilder.
- If Checkpoint 2 reveals behavior coupling that makes helper usage unclear, stop and keep Checkpoint 1 as characterization only or discard both implementation commits.
- Delete-impact work should remain a separate experiment unless a future product/destructive-flow task explicitly selects it.

## Recommended Next Checkpoint

Proceed to Checkpoint 1: characterize TaskBuilder draft operations with a tiny pure helper and focused unit tests.

This is the smallest useful next step because it protects the highest-risk deterministic behavior inside TaskBuilder: custom/catalog task creation, default song semantics, duplicate catalog filtering, and order normalization. It avoids async UI, backend, destructive-flow, and browser-smoke expansion while creating a seam that can be used naturally in Checkpoint 2.

## Remaining Uncertainties

- Whether catalog search and song loading deserve extraction depends on upcoming product work. They are not must-have foundation work yet.
- Delete-impact preview remains important but should be revisited only when destructive-flow UX is touched.
- There is no rendered component coverage for TaskBuilder; adding it is not recommended until a concrete UI feature requires that level of protection.

## Final Outcome Review

Final experiment state:

- Checkpoint 0 created this TaskBuilder foundation plan.
- Checkpoint 1 added `apps/web/lib/task-builder-draft.ts` and focused unit tests in `apps/web/lib/__tests__/task-builder-draft.test.ts`.
- Checkpoint 2 wired the draft helper into `apps/web/components/task-builder.tsx`.
- Checkpoint 2.5 recorded the gate decision to stop implementation and not continue into catalog search, song loading, or delete callback extraction now.

Files changed:

- `docs/task-builder-foundation-plan.md`
- `apps/web/lib/task-builder-draft.ts`
- `apps/web/lib/__tests__/task-builder-draft.test.ts`
- `apps/web/components/task-builder.tsx`

Validation results reported during the experiment:

- `pnpm --filter @tsmt/web test:unit` passed.
- `pnpm --filter @tsmt/web build` passed.
- `pnpm typecheck` passed. One overlapping build/typecheck run hit the known transient Next `.next/types` issue and passed on serial rerun.
- `pnpm check:generated` passed.
- `git diff --check` passed.
- GitHub CI was green through Checkpoint 2.5.

Behavior preserved:

- UI copy unchanged.
- Visible behavior intended unchanged.
- API calls unchanged.
- Endpoint paths unchanged.
- Payload shapes unchanged.
- Catalog search behavior unchanged.
- Song loading behavior unchanged.
- Debounce timing unchanged.
- Duplicate catalog disabled behavior preserved and now helper-backed.
- Task order and `sortOrder` behavior preserved and now helper-backed.
- Delete-impact behavior unchanged.
- RoutinesManager boundary unchanged.
- Backend routines code unchanged.

Risk reduced:

- Custom task draft defaults are named and tested.
- Catalog task draft defaults are named and tested.
- Catalog default song sentinel behavior is named and tested.
- Duplicate catalog task prevention is named and tested.
- Task ordering normalization is named and tested.
- Future AI-assisted changes can inspect deterministic draft behavior without reading the full `TaskBuilder` component.

Deferred risks explicitly not solved:

- Catalog search async behavior remains in `TaskBuilder`.
- Song loading/options behavior remains in `TaskBuilder`.
- Delete callback and delete-impact UI behavior remain connected to the RoutinesManager boundary.
- Stale or wrong destructive preview risk is deferred to destructive-flow work.
- Rendered TaskBuilder coverage was not added.
- Media field UX/view-model extraction was not attempted.

Trigger conditions for revisiting deferred seams:

- Catalog search UX changes.
- Song selection/default-song UX changes.
- Task delete/destructive confirmation UX changes.
- TaskBuilder media UX changes.
- Routine editor delete/save UX changes.
- Bugs around duplicate catalog add, wrong task defaults, wrong `sortOrder`, or stale delete preview.

Final recommendation:

- Merge all after final architect review unless final validation finds a problem.
- Do not continue implementation now.
- Do not start optional Checkpoint 3 by momentum.
