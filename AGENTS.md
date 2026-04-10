# AGENTS

Repository-level operating rules for AI and human contributors.

Read this together with [ENGINEERING_GUIDE.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/ENGINEERING_GUIDE.md).

## Repository Intent
This is a long-lived product repository. Optimize for:
- safe iteration
- domain clarity
- low-regression changes
- AI-readable structure

Do not start broad architectural rewrites without a scoped plan.

## Current Repository Shape
- `apps/api`: NestJS backend
- `apps/web`: Next.js frontend
- `packages/db`: Prisma schema, migrations, seed, import scripts
- `packages/types`: shared contracts

## Required Behavior Before Making Changes
1. Inspect the relevant domain files first.
2. Write a short plan in the task/update.
3. Keep work scoped to one domain unless cross-domain change is necessary.
4. Avoid growing already-large files when a focused extraction is practical.
5. If touching business rules, add or update tests when they exist or when the rule is critical.

## Safe Change Rules
- Do not duplicate business logic across backend and frontend.
- Do not hide side effects inside generic helpers.
- Do not refactor unrelated files “while here”.
- Do not introduce abstractions without immediate value.
- Do not change schema/delete behavior without reviewing impact.
- Do not make multi-domain behavior changes without documenting the reason.

## Preferred Commit / Change Shape
Good:
- one use case
- one migration
- one screen
- one domain rule

Bad:
- broad cleanup
- “architecture rewrite”
- touching many domains without tests or documentation

## Quality Gates
At minimum run what is relevant:
- `pnpm typecheck`
- app-specific `build` if relevant
- schema sanity if Prisma changed
- targeted tests when critical logic changes

## Repository-Specific Caution Areas
High-risk files because they currently mix responsibilities:
- [apps/api/src/routines/routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts)
- [apps/api/src/sessions/sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts)
- [apps/api/src/admin/admin.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin.service.ts)
- [apps/web/components/routines-manager.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/routines-manager.tsx)
- [apps/web/components/training-runner.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/training-runner.tsx)
- [apps/web/components/parent-dashboard.tsx](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/components/parent-dashboard.tsx)

If touching one of these:
- first consider extracting one cohesive helper/module
- do not add more unrelated responsibilities

## Domain Language
UI language:
- `Feladatsor`
- `Torna`
- `Időszak`

Code language may still contain:
- `routine`
- `session`
- `period`

Do not perform broad rename campaigns unless explicitly requested.

## Docs Maintenance
Update docs when:
- architecture direction changes
- workflow changes
- a new domain concept is introduced
- a dangerous delete/import/security path is added

## Where To Look Next
- [apps/api/AGENTS.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/AGENTS.md)
- [apps/web/AGENTS.md](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/web/AGENTS.md)
