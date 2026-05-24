# AdminCatalogManager Foundation Plan

## Purpose

This document defines the controlled foundation experiment for `AdminCatalogManager`.
It is a checkpoint guide, not a broad admin UI rewrite. Future work touching the
admin catalog UI must inspect `docs/foundation-risk-register.md` and this plan
before implementation.

Backend admin/catalog services are not part of this experiment unless a later
checkpoint finds a concrete blocker that cannot be addressed safely in the
frontend. The current goal is to make deterministic admin catalog UI behavior
visible, testable, and safer for future AI-assisted changes.

## Experiment Model

- Baseline main SHA: `b737eac6a4a87710f8ad28f224f346b25b7843a2`
- Branch: `experiment/admin-catalog-manager-foundation`
- Draft PR title: `refactor(web): admin catalog manager foundation experiment`
- PR mode: one draft PR, sequential checkpoints, architect review after each checkpoint
- Merge decision after final outcome review: merge all, split/partial merge, continue experiment, or discard

Do not merge intermediate checkpoints separately. If a checkpoint becomes broad,
requires backend/API/schema changes, or starts redesigning the admin UI, stop and
ask for architect direction.

## Required Reading

- `docs/foundation-risk-register.md`
- `docs/refactor-roadmap.md`
- `docs/architecture-refactor-audit.md`
- `docs/quality-gate-strategy.md`
- `apps/web/AGENTS.md`
- `apps/web/components/admin-catalog-manager.tsx`
- `apps/web/lib/api.ts`

Targeted backend context, only as needed:

- `apps/api/src/admin/*`
- `apps/api/test/admin/*`
- `packages/db/prisma/schema.prisma`

## Inspection Summary

`AdminCatalogManager` is a large stateful frontend component that manages three
catalog domains in one file:

- Task catalog items
- Song catalog items
- Equipment catalog items

It owns catalog loading, selection, form state, form hydration, save/delete
mutations, status copy, and all rendering for these domains. The backend admin
catalog service has domain helper coverage, but the frontend admin catalog form
and payload behavior currently has no focused unit coverage.

## Current Responsibility Map

`AdminCatalogManager` currently handles:

- Loading task, song, and equipment catalogs through authenticated admin API calls.
- Tracking selected task/song/equipment ids.
- Hydrating task/song/equipment edit forms from selected records.
- Creating new blank forms for each catalog domain.
- Building task/song/equipment save payloads inline.
- Saving existing records with `PATCH` and new records with `POST`.
- Deleting records with `DELETE`.
- Managing status and error messages.
- Rendering catalog lists, editor forms, task difficulty rows, media URL textareas,
  equipment checkboxes, and destructive delete buttons.

This makes the file risky for future admin catalog UI work because deterministic
business decisions are mixed with rendering and side effects.

## State And API Orchestration Map

State owned by the component:

- `taskCatalog`, `songCatalog`, `equipmentCatalog`
- `selectedTaskId`, `selectedSongId`, `selectedEquipmentId`
- `taskForm`, `songForm`, `equipmentForm`
- `status`

API calls currently orchestrated by the component:

- `GET /api/admin/task-catalog`
- `GET /api/admin/song-catalog`
- `GET /api/admin/equipment-catalog`
- `POST /api/admin/task-catalog`
- `PATCH /api/admin/task-catalog/:id`
- `DELETE /api/admin/task-catalog/:id`
- `POST /api/admin/song-catalog`
- `PATCH /api/admin/song-catalog/:id`
- `DELETE /api/admin/song-catalog/:id`
- `POST /api/admin/equipment-catalog`
- `PATCH /api/admin/equipment-catalog/:id`
- `DELETE /api/admin/equipment-catalog/:id`

The first frontend foundation step should not move API calls. Side effects should
remain in the component until deterministic form and payload decisions are
characterized.

## Production-Risk Findings

High-risk deterministic behavior currently lives inline:

- Task save payload construction, including `summary`, `instructions`,
  `focusPoints`, `demoVideoUrl`, `defaultSongId`, `isActive`, `equipmentIds`,
  `mediaLinks`, and `difficultyLevels`.
- Task image URL conversion to `mediaLinks` with image media kind and default labels.
- Difficulty level filtering, trimming, and `sortOrder` assignment.
- Song save payload construction and current empty-string-to-`undefined` behavior.
- Equipment save payload construction and current empty-string-to-`undefined`
  behavior.
- Form hydration from selected catalog records.
- Current semantics around clearing optional relations/URLs are subtle and must
  not be changed accidentally.

Destructive admin deletes are also production-risky, but adding confirmation or
preview behavior would be a behavior change. That seam should be inspected only
if future product work touches destructive admin behavior.

## Existing Safety Coverage

Backend/admin coverage currently protects:

- Admin catalog scalar data helper behavior.
- Task media link create shapes and media kind handling.
- Task equipment link mapping.
- Task difficulty level sort order mapping.
- Song media create/update relation helpers.
- Equipment icon media create/update relation helpers.
- Admin service/facade delegation paths.

Quality gates currently protect:

- API smoke for auth, parent-owned children/routines, session lifecycle, and
  post-finish session listing.
- Local-first browser smoke for app load, login, dashboard, owned child/routine
  visibility, runner standby, and one-task runner completion.
- Typecheck/build/unit tests and generated artifact guard.

Missing frontend coverage:

- Admin catalog form defaults.
- Admin catalog form hydration from records.
- Admin catalog save payload construction.
- Admin task media URL conversion.
- Admin task difficulty filtering/trimming/sort ordering.
- Admin delete button behavior and lack of confirmation.
- Rendered admin catalog UI behavior.

## Target-State Architecture

The desired near-term structure is intentionally modest:

- `AdminCatalogManager` remains the orchestrating component for loading, saving,
  deleting, status messages, and rendering.
- A small pure helper module owns deterministic form and payload decisions.
- Focused unit tests characterize the helper behavior.
- Later checkpoints may use the helper inside the component if it fits naturally.
- Async fetching, authorization, delete behavior, and presentational splits remain
  deferred unless a later gate finds a concrete risk worth addressing.

Possible helper file:

- `apps/web/lib/admin-catalog-manager-forms.ts`

Possible tests:

- `apps/web/lib/__tests__/admin-catalog-manager-forms.test.ts`

## Extraction Epics

### Epic 1: Form And Payload Helper

Why needed:
Task/song/equipment form defaults, hydration, and save payload construction are
production-sensitive and currently untested in the component.

Risk protected:
Accidental changes to payload shape, optional-field handling, task media links,
difficulty sort order, and equipment/default-song values.

AI-maintainability benefit:
Future changes can inspect a small helper and tests instead of reverse-engineering
the full component.

Behavior that must remain unchanged:
Endpoint paths, HTTP methods, payload shapes, optional-field semantics, status
copy, reload behavior, delete behavior, and UI rendering.

New tests needed:
Focused pure unit tests for form defaults, selected-record hydration, payload
construction, media URL conversion, and difficulty ordering.

Implementation risk:
Low if helper remains pure and does not move side effects.

Status:
Must-have before serious admin catalog UI feature work.

### Epic 2: Media URL / Media Kind View-Model Helper

Why needed:
Task image URLs are transformed into `mediaLinks` inline. Song and equipment media
fields have separate optional URL semantics.

Risk protected:
Wrong media kind, wrong label behavior, accidental trimming/filtering changes, or
unexpected clearing semantics.

AI-maintainability benefit:
Makes media-specific behavior discoverable.

Behavior that must remain unchanged:
Current task image URL conversion and current song/equipment optional URL behavior.

New tests needed:
Can be covered inside Epic 1 if small. Avoid creating a separate helper unless the
media logic grows.

Implementation risk:
Low as part of a pure helper; moderate if it starts changing semantics.

Status:
Include in Epic 1 only if small; otherwise defer.

### Epic 3: Save-Plan Helper

Why needed:
The component chooses create vs update based on selected id for three domains.

Risk protected:
Wrong endpoint/method selection.

AI-maintainability benefit:
Could make save orchestration clearer after payload behavior is characterized.

Behavior that must remain unchanged:
API sequencing, status copy, error handling, and reload timing.

New tests needed:
Only if create/update endpoint planning becomes a source of feature risk.

Implementation risk:
Moderate. Moving too much save orchestration could hide side effects behind a
generic dispatcher.

Status:
Deferred. Not the first step.

### Epic 4: Delete Confirmation / Destructive Boundary

Why needed:
Admin deletes are destructive and currently direct.

Risk protected:
Accidental deletes, wrong target deletes, and future confirmation UX regressions.

AI-maintainability benefit:
Would make destructive behavior explicit before UX changes.

Behavior that must remain unchanged:
Current delete behavior unless a future task explicitly requests a UX/behavior
change.

New tests needed:
Only after a scoped destructive-flow inspection.

Implementation risk:
High if attempted now because confirmation/preview would change behavior.

Status:
Deferred until product work touches admin destructive behavior.

### Epic 5: Catalog Domain Section Split

Why needed:
Task, song, and equipment sections are rendered in one large file.

Risk protected:
Reviewability and future UI feature isolation.

AI-maintainability benefit:
Smaller files can reduce accidental cross-domain edits.

Behavior that must remain unchanged:
Rendering, labels, form wiring, save/delete behavior, and selection behavior.

New tests needed:
Only if splitting changes how state or props flow.

Implementation risk:
Moderate. Presentational splitting before deterministic behavior is characterized
could move complexity without reducing risk.

Status:
Optional/deferred. Revisit after Epic 1 and a gate review.

### Epic 6: Async Fetch / Hook Extraction

Why needed:
Catalog loading and mutation orchestration are mixed with rendering.

Risk protected:
Potentially useful if admin API behavior or loading UX becomes a feature focus.

AI-maintainability benefit:
Could isolate admin API sequencing.

Behavior that must remain unchanged:
Auth token lookup, endpoint use, error handling, status copy, and reload timing.

New tests needed:
Would require more mocking or rendered/hook test strategy.

Implementation risk:
Higher than Epic 1. It risks becoming a broad async UI refactor.

Status:
Deferred unless a concrete admin loading/mutation feature requires it.

## User Stories

### Story 1: Admin Task Save Decisions Are Characterized

As a maintainer, I can see exactly how task catalog form state becomes an admin
task save payload, so future changes do not accidentally alter media links,
difficulty ordering, equipment links, or optional field semantics.

Acceptance criteria:

- Pure helper tests cover empty/default task form behavior.
- Pure helper tests cover task form hydration from a selected record.
- Pure helper tests cover task save payload construction.
- No API calls or React state are moved.

### Story 2: Admin Song And Equipment Save Decisions Are Characterized

As a maintainer, I can see how song and equipment forms become save payloads, so
future admin catalog changes preserve current optional media URL semantics.

Acceptance criteria:

- Pure helper tests cover song and equipment defaults.
- Pure helper tests cover selected-record hydration.
- Pure helper tests cover payload construction.
- Current empty-string-to-`undefined` behavior is preserved.

### Story 3: Component Uses The Helper Without Changing Behavior

As a maintainer, I can edit `AdminCatalogManager` with less inline business logic,
while API calls, status copy, reload timing, and rendering remain in the component.

Acceptance criteria:

- Helper is used naturally in the component.
- Component diff is small and reviewable.
- Existing validations pass.
- No backend/API/schema/browser-smoke changes are required.

## Checkpoint Plan

### Checkpoint 0: Deep Inspection And Extraction Plan

Type:
Docs-only.

Intended files:

- `docs/admin-catalog-manager-foundation-plan.md`

Scope:
Inspect current component responsibilities, backend coverage, missing frontend
coverage, and define the checkpoint plan.

Validation:

- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:

- Plan identifies current risks and smallest useful first seam.
- Plan makes clear this is not a broad admin UI rewrite.

Stop conditions:

- Docs/code evidence contradicts the risk register.
- Planning reveals the first useful step would require backend/API/schema changes.

### Checkpoint 1: Characterize Admin Catalog Form/Payload Decisions

Type:
Test-only plus tiny pure helper.

Intended files:

- `apps/web/lib/admin-catalog-manager-forms.ts`
- `apps/web/lib/__tests__/admin-catalog-manager-forms.test.ts`

Scope:
Create a pure helper for deterministic form defaults, selected-record hydration,
and save payload construction. Do not use it inside the component yet unless
absolutely unavoidable.

Validation:

- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `git diff --check`

Acceptance criteria:

- Tests cover task/song/equipment defaults, hydration, and payload construction.
- Tests pin task media link conversion and difficulty ordering.
- No component, backend, API, schema, browser-smoke, or CI behavior changes.

Stop conditions:

- Helper duplicates backend domain logic broadly.
- Helper grows into a generic form framework.
- Component changes become necessary.
- Payload semantics would change.

### Checkpoint 2: Use Form/Payload Helper In AdminCatalogManager

Type:
Small frontend refactor.

Intended files:

- `apps/web/components/admin-catalog-manager.tsx`
- `apps/web/lib/admin-catalog-manager-forms.ts`
- `apps/web/lib/__tests__/admin-catalog-manager-forms.test.ts` only if a tiny missing characterization is found

Scope:
Replace only inline deterministic form/payload logic with helper calls. Keep API
calls, status copy, reload timing, delete behavior, and rendering in the
component.

Validation:

- `pnpm --filter @tsmt/web test:unit`
- `pnpm --filter @tsmt/web build`
- `pnpm typecheck`
- `pnpm check:generated`
- `git diff --check`

Optional:

- `pnpm --filter @tsmt/web test:smoke:app`

Acceptance criteria:

- `AdminCatalogManager` has less inline deterministic form/payload logic.
- Behavior is preserved.
- Diff remains small and reviewable.

Stop conditions:

- API call sequencing changes.
- Endpoint/method/payload behavior changes.
- Delete behavior changes.
- Component diff becomes broad/noisy.

### Checkpoint 2.5: Gate Review Before Further Admin UI Extraction

Type:
Inspection/docs-only.

Intended files:

- `docs/admin-catalog-manager-foundation-plan.md`

Scope:
Decide whether to stop implementation and final-review, continue to a small
section split, inspect destructive admin behavior, or revise the plan.

Validation:

- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:

- Gate decision is explicit.
- Further extraction is justified only by concrete production or
  AI-maintainability risk.

Stop conditions:

- Continuing would become a broad admin UI rewrite.
- Continuing would change destructive behavior without an explicit product task.

Gate result after Checkpoints 1-2:

- Recommendation: stop implementation and proceed to Checkpoint 5 final outcome
  review.
- Checkpoints 1-2 addressed the highest concrete production and
  AI-maintainability risk: deterministic task/song/equipment form defaults,
  selected-record hydration, task media link conversion, difficulty filtering and
  sort order, equipment id preservation, default-song optional behavior, and
  save payload construction are now named and covered by focused unit tests.
- `AdminCatalogManager` now uses the helper while API calls, selected-id method
  selection, save/delete orchestration, reload timing, status copy, and rendering
  remain in the component.
- Catalog domain section splitting is still useful for reviewability, but it is
  not must-have before final review because it would mostly move rendering and
  props after the riskiest deterministic behavior has already been isolated.
- Async fetch/hook extraction is not must-have now because catalog loading,
  auth-token lookup, status copy, and mutation sequencing would require broader
  async test/mocking decisions without a concrete product change.
- Delete confirmation/destructive behavior work should remain deferred until
  product work explicitly touches admin deletes; continuing there now would risk
  changing behavior rather than preserving it.
- Current PR is valuable and mergeable after final outcome review if validation
  remains green. Do not continue to a Checkpoint 3 by momentum.

### Checkpoint 5: Final Outcome Review

Type:
Docs/PR-body update only.

Intended files:

- `docs/admin-catalog-manager-foundation-plan.md`
- PR body, if useful
- `docs/foundation-risk-register.md`, only if a small status update is needed

Scope:
Record final state, files changed, behavior preserved, validation, deferred
risks, trigger conditions, and merge/split/continue/discard recommendation.

Validation:

- `git diff --check`
- `pnpm typecheck`

Acceptance criteria:

- Final decision is reviewable.
- Deferred admin UI risks are not lost.

## Must-Not-Change Constraints

- Do not change API endpoint paths.
- Do not change HTTP methods.
- Do not change payload shapes.
- Do not change optional-field semantics.
- Do not change UI copy.
- Do not change visible behavior.
- Do not change delete behavior.
- Do not change backend admin/catalog services.
- Do not change DTOs.
- Do not change Prisma schema.
- Do not change browser smoke scope.
- Do not add CI wiring.
- Do not add Docker.
- Do not start import/media/equipment-linking redesign.
- Do not start a broad admin UI rewrite.

## Rollback And Split Strategy

If Checkpoint 1 succeeds but Checkpoint 2 becomes risky, keep the pure helper/tests
as a possible partial merge and discard component integration. If helper
characterization itself becomes artificial or duplicates too much logic, discard
the experiment rather than forcing structure.

If a later checkpoint reveals destructive behavior needs product-level UX
decisions, stop and create a separate inspection prompt rather than expanding this
experiment.

## Recommended Next Checkpoint

Proceed to Checkpoint 5: final outcome review.

Checkpoints 1-2 completed the highest-value deterministic seam without changing
rendering, side effects, API sequencing, backend code, or destructive admin
behavior. Further extraction should require a fresh concrete trigger.

## Deferred Risks And Triggers

Deferred risks:

- Destructive admin deletes have no frontend confirmation seam in this experiment.
- Rendered admin catalog UI behavior remains untested.
- Async loading and mutation orchestration remain in the component.
- Task/song/equipment section rendering remains in one large component.
- Current optional media/default-song clearing semantics are subtle and must be
  inspected before changing admin catalog UX.

Trigger conditions for revisiting deferred seams:

- Product work touches admin task/song/equipment create/edit UX.
- Product work touches media URL, media kind, default song, or equipment-linking UX.
- Product work touches admin delete/destructive behavior.
- Bugs appear around wrong save payloads, lost difficulty ordering, wrong media
  links, or accidental catalog deletion.
- Admin catalog import/media/equipment-linking redesign becomes active.
- The component must support broader admin workflows that increase state or
  mutation complexity.
