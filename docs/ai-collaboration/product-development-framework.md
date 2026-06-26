# Product Development Framework

## Purpose

This framework defines how product thinking moves from exploration to UX design to engineering implementation without losing context or prematurely narrowing the solution.

It is intended for collaboration between the user, ChatGPT, and Codex.

The user remains the product owner. The assistant may recommend, challenge, and synthesize, but explicit user decisions control the product direction unless they are intentionally reopened.

## Scope

This document describes the overall collaboration model. Mode-specific rules live in:

- [Discovery Facilitator System](discovery-facilitator-system.md)
- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)

Conversation state lives in:

- [Product State](../product/state/product-state.md)

`docs/ai-collaboration/` contains the generic AI Collaboration Framework.

Product-specific planning state lives with product documentation at `docs/product/state/product-state.md` so it can evolve with the product while still being governed by this framework.

The wider planning path lives in:

- [Product Development Map](../product/product-development-map.md)

## Operating Modes

### Product Discovery

Product Discovery clarifies product vision, user problems, emotional goals, possible directions, MVP boundaries, and strategic tradeoffs.

This mode protects controlled ambiguity until there is enough confidence to commit.

During Product Discovery, Product Discovery remains the controlling phase until the relevant discovery tracks are documented, intentionally deferred, explicitly skipped by the product owner, or superseded by a confirmed focus switch.

Concept Models may be drafted during Product Discovery when stable product understanding emerges, but documenting one concept does not automatically make the next Concept Model the next active focus.

Before suggesting the next active focus after a concept artifact is documented, the assistant must check unresolved Product Discovery tracks, relevant Parking Lot items, Product State, and the Product Development Map.

The default next focus should remain in Product Discovery if important discovery tracks are still unresolved.

### UX / Design Exploration

UX / Design Exploration translates product direction into journeys, flows, screen responsibilities, wireframes, interaction models, and design principles.

This mode protects user experience thinking from becoming implementation detail too early.

### Engineering / Refactor / Implementation

Engineering mode maps product and UX direction to the existing codebase, plans safe implementation, refactors incrementally, and validates behavior through tests and PRs.

This mode respects current code while keeping product truth visible.

## Conversation State Model

### Active Focus

The single primary topic of the current planning round.

New topics should be classified as current focus, Parking Lot, candidate focus switch, or unrelated. The assistant should not switch focus silently.

### Current Best Understanding

The best current working model of the product direction.

It is not final, but it is the active shared understanding used to orient future discussion.

It should preserve the product North Star: product vision, emotional goals, core user problems, and the distinction between product direction and feature ideas.

### Committed Direction

A decision that should be treated as stable unless explicitly reopened.

Committed directions should guide UX and engineering work.

### Exploration Zone

Ideas, alternatives, and hypotheses that are being discussed but are not yet committed.

The Exploration Zone can contain conflicting possibilities.

Exploration should not be forced into closure before there is enough confidence to choose.

### Open Questions

Important unresolved questions that should guide future exploration.

Open questions should remain visible until resolved, rejected, or intentionally deferred.

### Rejected Directions

Ideas that were considered and intentionally not chosen.

Rejected directions prevent future threads from repeating settled debates without cause.

### Parking Lot

Relevant topics that should not interrupt the current planning round.

Parking Lot items should have a lifecycle: Captured, Scheduled, In Progress, Resolved, Rejected, or Moved to Artifact.

## Discovery Tracks And Concept Models

Product Discovery tracks and Concept Models are related but not identical.

Discovery tracks explore product problems, roles, perspectives, emotional goals, and capability needs.

Concept Models organize stable discovery understanding into reusable product capability models.

Concept Models are still pre-UX, pre-specification, and pre-engineering artifacts. They stabilize the conceptual logic of a product capability before UX / Design Exploration.

A Concept Model may be created during Product Discovery, but it must have at least one of:

- explicit discovery source/support
- a clearly identified discovery track it belongs to
- a clear statement that it is a cross-cutting synthesis from multiple discovery tracks

A Concept Model should not be promoted as the next active focus merely because it appears next in the Product Development Map.

The Product Development Map should not imply that role/perspective discovery and capability concepts are unrelated dimensions. Future map cleanup may show role/perspective discovery tracks, product capability discovery tracks, and concept model artifacts derived from them.

## Documentation Philosophy

Documentation should help future conversations resume with less friction.

It should not pretend uncertainty is resolved. It should make the state of uncertainty readable.

When useful, the assistant may look for online examples, comparable products, UX patterns, and market precedents to support reasoning. These references should inform judgment, not replace product ownership.

Before saying a PR, document, or artifact is approved, mergeable, rejected, or complete, the assistant must read the actual artifact where possible, compare it to the request and relevant committed directions, and state what was checked.

## Product State And Map Consistency

When a meaningful planning or documentation change occurs, the assistant must check whether the following need updates:

- Product State
- Product Development Map
- relevant product artifacts
- Open Questions
- Parking Lot items
- Next Suggested Focus
- Active Focus
- status labels
- related concept/discovery documents
- Product Principles or other synthesis documents, if stable principles emerged

The assistant should not update only the artifact that was directly edited if the change affects navigation, status, focus, or related documentation.

The Product Development Map is a high-level product development navigation map. It is not a backlog or delivery roadmap.

Use the map to show the wider route, prevent premature jumps, and check focus changes, phase closures, concept artifact documentation, and next-focus proposals.

Framework maintenance should not be confused with product development progress unless it is explicitly tracked as meta-work.

## Planning Round Outcomes

Each meaningful planning round should ideally advance the product graph by producing at least one of:

- insight
- clarified direction
- decision
- open question
- rejected direction
- updated Current Best Understanding
- next suggested focus

## Modular Documentation Rules

- One file should cover one responsibility.
- Avoid huge mixed-purpose documents.
- Prefer short, linked markdown files.
- Include Purpose, Scope, Rules, and How to use this sections where useful.
- Keep documents useful for future ChatGPT and Codex sessions.

## How To Use This

Use this document as the entry point when a conversation spans more than one operating mode.

Before switching modes, name the new mode and explain what should change about the conversation.

New planning threads should start by pasting or reconstructing the Thread Start Context. If Product State exists, include the relevant parts unless the assistant has repository access and is asked to read them.

Planning responses should keep the Product Development Map position visible when it helps prevent jumping ahead.
