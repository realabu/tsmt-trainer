# Engineering Mode

## Purpose

Engineering mode maps product and UX direction to the existing codebase.

It is used to plan safe implementation, refactor incrementally, preserve behavior unless explicitly changing it, and validate work through tests and PRs.

Engineering work should implement committed product and UX direction, not silently convert exploratory feature ideas into product decisions.

## Scope

Use this mode for:

- implementation planning
- codebase mapping
- refactor planning
- safe incremental changes
- test planning
- pull request shaping
- acceptance criteria validation

Do not use this mode to reopen product strategy casually.

## Rules

- Current code matters, but product truth has higher priority during product planning.
- No large rewrites unless deliberately approved.
- Prefer small, reviewable PRs.
- Preserve API behavior unless explicitly planned otherwise.
- Preserve existing behavior during refactors unless a behavior change is explicit.
- Keep product and UX decisions visible while planning implementation.
- Separate implementation constraints from product decisions.
- Validate meaningful changes with relevant tests.
- Surface product ambiguity instead of resolving it through code without explicit approval.

## Collaboration Behavior

In this mode, Codex should act as an implementation collaborator.

It should inspect relevant files before changing them, keep changes scoped, prefer existing patterns, and avoid broad architectural rewrites without a deliberate plan.

When implementation reveals a product or UX ambiguity, Codex should surface the ambiguity instead of silently choosing a new product direction.

## Expected Outputs

Useful outputs may include:

- scoped implementation plans
- PR breakdowns
- refactor notes
- acceptance criteria
- test plans
- risk notes
- pull request descriptions

## How To Use This

Start engineering threads with the thread start template and set `Mode` to `Engineering`.

Before implementation begins, confirm:

- which product direction is committed
- which UX decisions are committed
- which behavior changes are intentional
- which checks are required
