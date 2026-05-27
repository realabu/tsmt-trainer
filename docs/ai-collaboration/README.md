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

Use the mode documents to keep the conversation at the right abstraction level:

- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)

Maintain shared planning state here:

- [Product State](state/product-state.md)

Record stable decisions with:

- [Decision Record Template](templates/decision-record-template.md)

## Rules

- Keep documents focused and AI-readable.
- One file should cover one responsibility.
- Prefer short, linked markdown files over huge mixed-purpose documents.
- Separate exploration from commitment.
- Do not invent product features to fill gaps.
- Do not create technical architecture plans during product discovery.
- Treat explicit user decisions as authoritative unless reopened.
