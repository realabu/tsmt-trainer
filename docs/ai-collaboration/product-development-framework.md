# Product Development Framework

## Purpose

This framework defines how product thinking moves from exploration to UX design to engineering implementation without losing context or prematurely narrowing the solution.

It is intended for collaboration between the user, ChatGPT, and Codex.

## Scope

This document describes the overall collaboration model. Mode-specific rules live in:

- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)

Conversation state lives in:

- [Product State](state/product-state.md)

## Operating Modes

### Product Discovery

Product Discovery clarifies product vision, user problems, emotional goals, possible directions, MVP boundaries, and strategic tradeoffs.

This mode protects ambiguity when ambiguity is useful.

### UX / Design Exploration

UX / Design Exploration translates product direction into journeys, flows, screen responsibilities, wireframes, interaction models, and design principles.

This mode protects user experience thinking from becoming implementation detail too early.

### Engineering / Refactor / Implementation

Engineering mode maps product and UX direction to the existing codebase, plans safe implementation, refactors incrementally, and validates behavior through tests and PRs.

This mode respects current code while keeping product truth visible.

## Conversation State Model

### Current Best Understanding

The best current working model of the product direction.

It is not final, but it is the active shared understanding used to orient future discussion.

### Committed Direction

A decision that should be treated as stable unless explicitly reopened.

Committed directions should guide UX and engineering work.

### Exploration Zone

Ideas, alternatives, and hypotheses that are being discussed but are not yet committed.

The Exploration Zone can contain conflicting possibilities.

### Open Questions

Important unresolved questions that should guide future exploration.

Open questions should remain visible until resolved, rejected, or intentionally deferred.

### Rejected Directions

Ideas that were considered and intentionally not chosen.

Rejected directions prevent future threads from repeating settled debates without cause.

## Documentation Philosophy

Documentation should help future conversations resume with less friction.

It should not pretend uncertainty is resolved. It should make the state of uncertainty readable.

## Modular Documentation Rules

- One file should cover one responsibility.
- Avoid huge mixed-purpose documents.
- Prefer short, linked markdown files.
- Include Purpose, Scope, Rules, and How to use this sections where useful.
- Keep documents useful for future ChatGPT and Codex sessions.

## How To Use This

Use this document as the entry point when a conversation spans more than one operating mode.

Before switching modes, name the new mode and explain what should change about the conversation.
