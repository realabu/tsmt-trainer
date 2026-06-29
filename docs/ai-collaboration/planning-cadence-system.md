# Planning Cadence System

## Purpose

This document defines how planning work progresses so conversations do not become endless brainstorming.

It applies to Product Discovery, UX / Design, and Engineering planning.

## Planning Round

A planning round is a focused unit of product, UX, or engineering planning.

Examples:

- product vision clarification
- child progression understanding
- MVP boundary discussion
- parent journey exploration
- screen architecture pass
- implementation mapping

Before starting a new planning round, run the Startup Consistency Gate from the [Thread Bootstrap System](thread-bootstrap-system.md).

This is the opening counterpart to the closure checklist: it checks whether Product State, Product Development Map, relevant artifacts, and next-focus guidance are fresh and consistent enough to continue from.

## Planning Loop

Each planning round should follow:

```text
explore
-> clarify
-> summarize
-> commit, defer, reject, or continue exploration
-> update state when needed
-> define next focus
```

The goal is not to force a decision every time. The goal is to make the state of the work clearer than it was before.

During Product Discovery, closing or documenting a Concept Model does not automatically advance the active focus to the next Concept Model.

Before defining the next focus, check unresolved Product Discovery tracks, relevant Parking Lot items, Product State, and the Product Development Map.

## Round State Model

Round states:

- Exploring
- Clarifying
- Ready to Commit
- Documenting
- Reviewing
- Documented
- Closed

ChatGPT should name the current round state when planning is long, multi-step, or at risk of losing focus.

## When To Update Documentation

Do not update docs after every message.

Update docs when:

- Current Best Understanding changes
- a Committed Direction is created or changed
- an important Open Question appears
- an Exploration Zone changes materially
- a Rejected Direction is established
- the Active Focus changes
- the abstraction level changes
- a planning round is closed
- a Parking Lot item changes status
- Product Development Map status changes

## Parking Lot Checks

At the start of a planning round, check Parking Lot for relevant items.

At the end of a planning round, propose which Parking Lot items should be:

- kept
- moved into active focus
- documented
- rejected
- removed

## Open Question Lifecycle

A documented artifact must not contain orphaned open questions.

Open question statuses:

- Active / Blocking: still unresolved and blocks closing or documenting the current artifact
- Resolved: answered and reflected in Current Best Understanding, Committed Directions, the artifact body, or another appropriate document
- Rejected: intentionally not pursued, with a short reason
- Deferred: intentionally postponed, with a revisit condition
- Transferred: moved to another future focus, artifact, discovery track, concept model, UX round, or engineering round
- Stale / Remove: no longer useful or relevant and should be removed or archived rather than carried forward

Before an artifact can be marked Documented, Closed, or equivalent, all open questions in that artifact must be classified.

A Documented artifact may contain non-blocking deferred or transferred questions only when each question has:

- lifecycle status
- target future focus or artifact, if transferred
- revisit trigger or condition
- required future resolution action
- reopen condition, if relevant

If a question is blocking, the artifact should remain Exploring, Clarifying, or Ready to Document rather than Documented.

Product State may track transferred or deferred questions when they affect navigation or next focus. Product Development Map may note that a future track has transferred inputs, but the detailed lifecycle should live in the source or target artifact rather than overloading the map.

## Transferred And Deferred Questions

A transferred open question must include:

- question
- source artifact
- status: Transferred / non-blocking
- transferred to: target future focus, artifact, discovery track, concept model, UX round, or engineering round
- revisit trigger
- required resolution action
- optional reopen condition

A future planning round whose active focus matches the revisit trigger must load the transferred question at startup and close it by one of:

- resolved into committed direction
- moved into the active artifact
- explicitly deferred with a new trigger
- transferred to a better target
- rejected as no longer relevant
- kept blocking, in which case the active round cannot be closed as complete

A deferred question may remain outside the active artifact only if it has:

- reason for deferral
- revisit condition
- owner location, such as Product State, source artifact, Parking Lot, or future artifact
- required future action

Deferred must not mean forgotten.

Example format:

```markdown
## Transferred Open Questions

### Parent-facing progress information density

Question:
How much progress information helps parents without making the experience feel analytical or heavy?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:
- Parent Journey UX
- Progress Understanding UX refinement

Revisit trigger:
When Parent Journey UX or shared progress view UX starts.

Required resolution action:
Resolve into UX direction, explicitly defer with a new trigger, transfer to a better target, or reject before the target round closes.

Reopen condition:
Reopen Parent Experience Discovery only if later UX or discovery work changes the parent role definition.
```

This example is illustrative. It is not a product decision.

## Product State As Navigation Center

[product-state.md](../product/state/product-state.md) is the navigation center for planning work.

It should help a future thread quickly understand:

- what is currently being planned
- what abstraction level is active
- what has been committed
- what remains exploratory
- what questions still matter
- what should happen next

## Preventing Endless Brainstorming

Each meaningful planning round should end with at least one of:

- updated Current Best Understanding
- Committed Direction
- Open Question
- Rejected Direction
- clarified Exploration Zone
- Next Suggested Focus
- explicit decision to continue exploration

Continuing exploration is valid when ambiguity is intentional and useful. It should still be named explicitly.

## Evidence Before Decision

Before review, merge, approval, rejection, or completion decisions, ChatGPT must:

- read the actual PR, document, or artifact where possible
- compare it to the request and relevant committed directions
- state what was checked
- only then make the decision

ChatGPT must not claim something is mergeable based only on a PR number or summary.

## Product Development Map

Update the [Product Development Map](../product/product-development-map.md) when a major phase changes status.

Use the map to decide whether the next focus should continue the current phase, move to a related discovery topic, or wait before jumping into UX, specification, or engineering.

The map is a high-level navigation map, not a backlog or delivery roadmap. It should be checked when focus changes, phases close, concept artifacts are documented, or the next focus is proposed.

Framework maintenance should not be treated as product development progress unless it is explicitly tracked as meta-work.

## Planning Round Closure

Planning round closure should include:

- summary
- decision or defer/reject/continue
- documentation recommendation
- Parking Lot update
- next focus

Before closing a planning round or recommending a documentation PR as complete, check:

- Did Current Best Understanding change?
- Did a Committed Direction change or emerge?
- Are there any unclassified open questions?
- Are blocking questions still blocking closure?
- Which questions were resolved?
- Which questions were rejected?
- Which questions were deferred, and with what revisit condition?
- Which questions were transferred, and to what target or trigger?
- Does Product State need to track any transferred or deferred question?
- Does the source artifact need an Open Question Lifecycle or Transferred Questions section?
- Does the target artifact or future focus need a note that it has transferred input?
- Did a Parking Lot item change status or become important enough to preserve elsewhere?
- Did Active Focus change?
- Did Next Suggested Focus change?
- Did the abstraction level or operating mode change?
- Does Product Development Map need a status or structure update?
- Does Product State need to be updated?
- Did any related artifact become stale?
- Did a new Product Principle emerge?
- Is the next suggested focus still consistent with unresolved discovery work?
- Are we accidentally moving from discovery to concept, UX, specification, or engineering without an explicit confirmed mode/focus switch?

## When To Start A New Thread

Start a new thread when:

- switching operating modes
- switching abstraction levels
- context becomes too large
- moving from discovery to UX
- moving from UX to engineering
- starting a new major planning round

When starting a new thread, use the [Thread Bootstrap System](thread-bootstrap-system.md) to reconstruct shared working state.

## How To Use This

Use this document at the end of planning rounds to decide whether to update Product State, record a decision, continue exploration, or start a new thread.

The cadence should keep planning alive and directional without pretending uncertainty is resolved too early.

## Maintenance

Update this document when the planning rhythm changes or when the team learns a better way to close, defer, or continue planning rounds.
