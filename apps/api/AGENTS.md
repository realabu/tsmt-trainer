# API AGENTS

Backend-specific operating rules for `apps/api`.

## Primary Goal
Move the backend toward:
- thin controllers
- explicit application services
- testable domain logic
- isolated data access

Do this incrementally, not by rewriting the whole API at once.

## Current Reality
The API already has feature folders:
- `auth`
- `children`
- `routines`
- `sessions`
- `trainers`
- `admin`
- `health`
- `common`

This is good. The main issue is oversized services and mixed responsibilities inside them.

## Desired Backend Direction

### Controllers
Controllers should only:
- validate input
- authorize
- map transport to use-case calls
- return output

Controllers should not:
- hold business rules
- build complex aggregates
- calculate progress/badges directly
- contain significant branching logic

### Services
Application services should:
- coordinate one use case or a small cohesive cluster
- orchestrate repositories, calculators, policies, and persistence

Services should not:
- become giant “god services”
- mix unrelated CRUD, calculation, and orchestration concerns

### Pure Logic
Move pure logic into dedicated modules when possible:
- progress calculation
- badge awarding rules
- repetition formatting rules
- catalog matching/scoring
- delete impact calculation

Pure logic modules must:
- accept plain values
- return plain values
- be unit-testable

### Data Access
Prisma access should remain practical, not overabstracted.

Direction:
- keep direct Prisma access acceptable for simple CRUD
- isolate Prisma from calculation-heavy logic when practical
- prefer focused repository-style helpers for repeated or risky queries

Do not:
- introduce a full repository layer everywhere just for style

## Current Refactor Hotspots
Highest backend refactor priority:
- [routines.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/routines/routines.service.ts)
- [sessions.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/sessions/sessions.service.ts)
- [admin.service.ts](/Users/bszabo/Oghma%20docs/codex/tmst-trainer/apps/api/src/admin/admin.service.ts)

Refactor these by extracting:
- one use case at a time
- one calculator at a time
- one policy at a time

Do not split them into dozens of meaningless files.

## Domain-Specific Rules

### Auth
- centralize authorization rules
- keep current-user handling explicit
- do not duplicate role checks across many modules if a policy helper can own them

### Children
- child lifecycle logic belongs here
- child delete impact logic should be explicit and testable

### Routines
- own feladatsor structure, tasks, periods, catalog integration
- split CRUD and calculation logic
- do not let progress logic keep growing here long-term

### Sessions
- own runtime execution of tornák
- session completion should orchestrate:
  - timing persistence
  - completion updates
  - progress/badge evaluation
- but not permanently embed all badge logic inline

### Badges / Progress
Even if there is no dedicated module yet, treat this as a distinct backend concern.
Target extraction:
- badge rule evaluation
- context key generation
- weekly/period progress calculation
- streak logic

### Admin
Admin should orchestrate cross-domain operations, but not become the home for core business rules that belong elsewhere.

## Schema / Migration Rules
If editing Prisma schema:
1. keep the change minimal
2. review cascade/delete behavior
3. generate migration explicitly
4. sanity-check seed/import scripts
5. update docs if the domain model meaning changed

## Testing Expectations
Add tests first for:
- progress calculation
- badge rule evaluation
- delete impact summaries
- routine import parsing/matching

When business rules change, do not rely on manual Swagger testing alone.

## Backend Quality Gates
Use as relevant:
- `pnpm --filter @tsmt/api typecheck`
- `pnpm --filter @tsmt/api build`
- `pnpm db:generate` when schema changes
- migration sanity
- tests for affected rule-heavy modules

## Safe Backend Increment Examples
Good:
- extract `calculatePeriodProgress(...)`
- extract `buildBadgeContextKey(...)`
- extract `getRoutineDeleteImpact(...)`

Bad:
- “convert API to clean architecture”
- “replace all Prisma access with repositories”
- “rewrite admin service entirely”
