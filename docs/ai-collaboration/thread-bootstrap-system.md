# Thread Bootstrap System

## Purpose

This document defines how a new ChatGPT planning thread should be started so the AI collaboration framework can be applied consistently across Product Discovery, UX / Design, and Engineering conversations.

Use this with:

- [AI Collaboration Framework](README.md)
- [Product Development Framework](product-development-framework.md)
- [Planning Cadence System](planning-cadence-system.md)
- [Discovery Facilitator System](discovery-facilitator-system.md)
- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)
- [Product State](../product/state/product-state.md)
- [Thread Start Template](templates/thread-start-template.md)
- [Product Development Map](../product/product-development-map.md)

## Why This Exists

New ChatGPT threads do not automatically preserve full working context.

The bootstrap system exists to reconstruct:

- active mode
- current focus
- product state
- committed directions
- open questions
- exploration topics
- round state
- Parking Lot
- current abstraction level
- requested output

## Core Principle

A new planning thread should not begin with a vague task.

It should begin by reconstructing the shared working state.

## Responsibilities

### User

The user:

- decides when to start a new thread
- states the intended mode or asks ChatGPT to recommend one
- provides or points to relevant state
- makes final product decisions

### ChatGPT

ChatGPT:

- generates a thread bootstrap prompt when asked
- identifies missing context
- asks for only critical missing information
- reconstructs state before planning
- reconstructs Current Best Understanding
- separates committed direction from exploration
- protects the selected operating mode
- reads Product State and Product Development Map when repository access exists and the user asks to use the repository or framework
- checks Product Development Map and Parking Lot before starting a new planning round
- checks whether Product State and Product Development Map are consistent before accepting Active Focus or Next Suggested Focus as stable
- checks unresolved Product Discovery tracks before recommending the next Concept Model
- distinguishes product-development position from framework or documentation cleanup position
- avoids treating captured Concept Models as active next focus unless Product State and the framework support that
- includes a compact status block at the beginning of planning responses when useful
- avoids premature closure

### Codex

Codex:

- may update documentation
- may read repository docs when instructed
- may report state from repo files
- must not make product decisions

## Source Of Truth Order

When preparing a new thread, use sources in this order:

1. Explicit user instruction in the current message
2. Current Product State document
3. Product Development Map
4. Relevant product documents, such as product vision or journey docs
5. Relevant mode document
6. Current conversation summary, if provided
7. Repository/code reality, only when the mode requires it

In Product Discovery mode, product truth is more important than current code reality.

In Engineering mode, committed product/UX direction and current code reality must both be considered.

Examples and templates are illustrative only. They must not override explicit user instruction, current Product State, or the Product Development Map.

## Startup Consistency Gate

Before starting a new planning round, ChatGPT should check whether the documented state is fresh, internally consistent, and safe to continue from.

Check:

- whether Active Focus still reflects the current work
- whether Round State is still accurate
- whether Next Suggested Focus is still consistent with Product State, Product Development Map, Open Questions, and Parking Lot
- whether Product State and Product Development Map agree on phase, statuses, active focus, and downstream readiness
- whether relevant product artifacts agree with Product State and Product Development Map status
- whether recently completed documentation or framework cleanup left stale wording in Product State, Product Development Map, bootstrap examples, or related framework docs
- whether open questions are truly blocking, already resolved, intentionally deferred, or should move to Parking Lot
- whether any Concept Model is being treated as active next focus without discovery support
- whether the conversation is about product-development state or framework/documentation cleanup state

If inconsistencies are found:

- do not start the next planning round yet
- state the inconsistency
- recommend the smallest safe documentation alignment update
- only recommend a next planning focus after the state is safe to continue from, or clearly mark the recommendation as provisional

## Bootstrap Prompt Structure

A bootstrap prompt should usually include:

```text
Repository:
Mode:
Framework docs to use:
Product documents to read:
Product Development Map position:
Product State summary:
Active Focus:
Round State:
Current Best Understanding:
Committed Directions:
Exploration Zone:
Open Questions:
Parking Lot:
Rejected Directions:
Current abstraction level:
State / map consistency check:
Startup consistency check:
State freshness:
State / map mismatches:
Artifact status mismatches:
Documentation update needed before planning:
Requested output:
Evidence required before decisions:
Rules for this thread:
What not to do:
Missing context to ask for if needed:
```

## Mode Selection Guidance

Choose Product Discovery when the work is about product vision, user problems, emotional goals, MVP boundaries, strategic tradeoffs, or deciding what should matter.

Choose UX / Design when the work is about journeys, flows, screen responsibilities, wireframes, interaction models, design principles, progress understanding, or low cognitive load.

Choose Engineering when the work is about mapping committed product/UX direction to the existing codebase, planning implementation, refactoring incrementally, validating behavior, or shaping PRs.

If the correct mode is unclear, ask ChatGPT to recommend a mode before starting the planning round.

## State Reconstruction Protocol

At the start of a new thread, ChatGPT should:

- identify the mode
- reconstruct state before planning
- identify the current abstraction level
- identify the Product Development Map position
- summarize Product State
- identify the Round State
- summarize Current Best Understanding
- separate committed decisions from exploratory ideas
- list open questions
- check Parking Lot for relevant items
- check whether Product State and Product Development Map are consistent before accepting Active Focus or Next Suggested Focus as stable
- run the Startup Consistency Gate before starting a new planning round
- identify whether the current round is still active, ready to review, ready to close, or should move to next focus
- check unresolved Product Discovery tracks before recommending the next Concept Model
- distinguish product-development position from framework or documentation cleanup position
- avoid treating captured Concept Models as active next focus unless Product State and the framework support that
- identify what source docs should be read or pasted
- ask for only missing critical context
- then continue from the reconstructed state

When useful, ChatGPT should begin planning responses with a compact status block showing mode, active focus, round state, map position, relevant Parking Lot items, and requested output.

## Handling Incomplete Context

If product state is missing or outdated:

- do not invent missing decisions
- mark assumptions explicitly
- ask for missing critical context
- proceed with clearly labeled uncertainty if enough context exists

Incomplete context should slow commitment, not prevent useful thinking.

## When To Ask ChatGPT To Generate A Bootstrap Prompt

Use requests such as:

- "Generate a Product Discovery bootstrap prompt for the MVP planning thread."
- "Generate a UX / Design bootstrap prompt for the child player journey."
- "Generate an Engineering bootstrap prompt for mapping the MVP to the current codebase."

## Example Bootstrap Prompt

```text
Use the AI collaboration framework for this thread.

Repository:
https://github.com/realabu/tsmt-trainer

Mode:
Product Discovery

If the mode is not explicit in my request, identify the intended mode from Product State and the Product Development Map before planning.

Framework docs to use:
- docs/ai-collaboration/README.md
- docs/ai-collaboration/product-development-framework.md
- docs/ai-collaboration/planning-cadence-system.md
- docs/ai-collaboration/discovery-facilitator-system.md
- docs/ai-collaboration/modes/product-discovery-mode.md
- docs/ai-collaboration/templates/thread-start-template.md

Product documents to read:
- docs/product/state/product-state.md
- docs/product/product-development-map.md
- any product discovery or concept artifacts referenced by Product State or the Product Development Map

Product Development Map position:
Read the current map position from docs/product/product-development-map.md.

Product State summary:
Read and summarize docs/product/state/product-state.md.

Active Focus:
Reconstruct from current Product State. Do not rely on this example as the focus.

Round State:
Reconstruct from current Product State and the Planning Cadence System.

Current Best Understanding:
Use current Product State and relevant product artifacts. Preserve the product north star: product vision, emotional goals, core user problems, and the difference between product direction and feature ideas.

Committed Directions:
Use only decisions explicitly recorded in Product State, Product Development Map, relevant product artifacts, or provided in my current instruction.

Exploration Zone:
Reconstruct from Product State. Separate active exploration from captured future work.

Open Questions:
Identify unresolved questions from Product State and relevant artifacts.

Parking Lot:
Check Product State for Parking Lot items before starting. Capture new relevant topics there instead of switching focus silently.

Rejected Directions:
Use only directions explicitly marked as rejected in Product State, Product Development Map, relevant artifacts, or my current instruction.

Current abstraction level:
Reconstruct from Product State and the selected mode.

State / map consistency check:
Before recommending the next step, check whether Product State and Product Development Map agree on active focus, round state, Product Discovery status, captured Concept Models, and downstream UX/spec/engineering status.

Startup consistency check:
Before starting a new planning round, report whether the documented state is fresh, internally consistent, and safe to continue from. Check Active Focus, Round State, Next Suggested Focus, Product State, Product Development Map, relevant artifacts, Open Questions, Parking Lot, captured Concept Models, and whether the conversation is about product-development state or framework/documentation cleanup state.

State freshness:
State whether Product State and Product Development Map appear current enough to continue from.

State / map mismatches:
List any mismatch between Product State and Product Development Map, or say none found.

Artifact status mismatches:
List any mismatch between product artifacts and their recorded status, or say none found.

Documentation update needed before planning:
If alignment is needed, recommend the smallest safe documentation update before planning. If no update is needed, say that planning can continue from the reconstructed state.

Requested output:
Recommend the next planning step according to the AI Collaboration Framework. If documentation alignment is needed, recommend that before starting the next planning round. If context is incomplete, ask only for critical missing information.

Evidence required before decisions:
Before saying a PR, document, or artifact is approved, mergeable, rejected, or complete, read the actual artifact where possible, compare it to the request and committed directions, and state what was checked.

Rules for this thread:
- Follow the One Active Focus Rule.
- Preserve controlled ambiguity until there is enough confidence to commit.
- Distinguish exploration from commitment.
- Check unresolved Product Discovery tracks before recommending the next Concept Model.
- Reason holistically and surface tradeoffs.
- Challenge assumptions respectfully.
- Classify new topics as current focus, parking lot, candidate focus switch, or unrelated.
- Explicit user decisions override recommendations.

What not to do:
- Do not jump to implementation.
- Do not invent backend architecture.
- Do not assume screens too early.
- Do not let current code dictate future product direction.
- Do not turn feature ideas into committed product direction without an explicit decision.
- Do not treat captured Concept Models as active next focus unless Product State and the framework support that.
- Do not make repository changes unless I explicitly ask for documentation or code changes.

Missing context to ask for if needed:
Ask only for context that is critical to continue the planning round.
```

## Relationship To Thread Start Template

[thread-start-template.md](templates/thread-start-template.md) is the compact state block.

This document explains how and when to create or fill that block.

The bootstrap prompt can include the compact Thread Start Context plus extra instructions.

## Maintenance

This document should evolve when the collaboration process changes.

Update it when thread startup expectations, source-of-truth order, mode selection, or state reconstruction practices change.
