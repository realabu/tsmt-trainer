# AI Collaboration Framework

## Purpose

This documentation defines how the user, ChatGPT, and Codex collaborate during long-running product development.

It exists to preserve shared understanding across planning, design, and implementation threads without turning every conversation into an engineering task.

## Scope

This framework covers three operating modes:

- Product Discovery
- UX / Design Exploration
- Engineering / Refactor / Implementation

Each mode has a different purpose, output, and level of commitment. Modes should not be mixed casually.

## Core Principle

Documents are not the product itself.

Documents externalize shared understanding so that later product, UX, and engineering work can proceed without losing context.

The user remains the product owner. The assistant can recommend, challenge, compare, and clarify, but it must not silently take over product decisions.

## Product North Star

Product conversations should continuously preserve:

- product vision
- emotional goals
- core user problems
- the difference between product direction and feature ideas

Feature ideas are possible expressions of a direction. They are not automatically product direction.

## Documentation Layers

### Product Understanding Layer

This layer captures why the product should exist and what kind of experience it should create.

It may include:

- vision
- philosophy
- emotional goals
- user problems
- motivation principles
- UX principles

This layer should remain exploratory when the product direction is still forming.

### Product Specification Layer

This layer captures how the product should behave once direction is stable enough to specify.

It may include:

- journeys
- flows
- screens
- states
- interactions
- business rules
- edge cases
- acceptance criteria

This layer should not collapse too early into implementation plans.

## How To Use This Framework

Start each planning thread with the thread start template:

- [Thread Start Template](templates/thread-start-template.md)

New planning threads should begin by pasting or reconstructing the Thread Start Context.

If the user wants ChatGPT to follow this framework, they should explicitly declare the `Mode`.

If Product State exists, paste or summarize the relevant parts at the beginning of the thread unless ChatGPT has repository access and is asked to read it.

Use the thread bootstrap system when creating a prompt for a new planning thread:

- [Thread Bootstrap System](thread-bootstrap-system.md)

Use the planning cadence system to keep planning rounds focused and directional:

- [Planning Cadence System](planning-cadence-system.md)

Use the discovery facilitator system to protect active focus, manage Parking Lot items, and require evidence before review or merge decisions:

- [Discovery Facilitator System](discovery-facilitator-system.md)

Use the product development map to keep the wider route from discovery to implementation visible:

- [Product Development Map](../product/product-development-map.md)

Use the mode documents to keep the conversation at the right abstraction level:

- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)

Maintain shared planning state here:

- [Product State](../product/state/product-state.md)

Record stable decisions with:

- [Decision Record Template](templates/decision-record-template.md)

## Rules

- Keep documents focused and AI-readable.
- One file should cover one responsibility.
- Prefer short, linked markdown files over huge mixed-purpose documents.
- Separate exploration from commitment.
- Do not optimize too early for closure.
- Protect one active focus at a time.
- Capture relevant interruptions in Parking Lot instead of switching focus silently.
- Check actual evidence before approval, merge, rejection, or completion decisions.
- Keep the Product Development Map status visible when planning spans multiple rounds.
- Keep Product Discovery as the controlling phase until relevant discovery tracks are documented, deferred, skipped by the product owner, or superseded by a confirmed focus switch.
- Treat Concept Models as discovery-derived capability models, not automatic next-focus targets.
- Check Product State and Product Development Map consistency when planning rounds close or documentation PRs change navigation, status, or focus.
- Do not invent product features to fill gaps.
- Do not create technical architecture plans during product discovery.
- Treat explicit user decisions as authoritative unless reopened.

Each meaningful planning round should ideally produce at least one of:

- insight
- clarified direction
- decision
- open question
- rejected direction
- updated Current Best Understanding
- next suggested focus
