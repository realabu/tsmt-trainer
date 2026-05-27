# Thread Bootstrap System

## Purpose

This document defines how a new ChatGPT planning thread should be started so the AI collaboration framework can be applied consistently across Product Discovery, UX / Design, and Engineering conversations.

Use this with:

- [AI Collaboration Framework](README.md)
- [Product Development Framework](product-development-framework.md)
- [Product Discovery Mode](modes/product-discovery-mode.md)
- [UX / Design Mode](modes/ux-design-mode.md)
- [Engineering Mode](modes/engineering-mode.md)
- [Product State](state/product-state.md)
- [Thread Start Template](templates/thread-start-template.md)

## Why This Exists

New ChatGPT threads do not automatically preserve full working context.

The bootstrap system exists to reconstruct:

- active mode
- current focus
- product state
- committed directions
- open questions
- exploration topics
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
- reconstructs Current Best Understanding
- separates committed direction from exploration
- protects the selected operating mode
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
3. Relevant product documents, such as product vision or journey docs
4. Relevant mode document
5. Current conversation summary, if provided
6. Repository/code reality, only when the mode requires it

In Product Discovery mode, product truth is more important than current code reality.

In Engineering mode, committed product/UX direction and current code reality must both be considered.

## Bootstrap Prompt Structure

A bootstrap prompt should usually include:

```text
Repository:
Mode:
Framework docs to use:
Current focus:
Current Best Understanding:
Committed Directions:
Exploration Zone:
Open Questions:
Rejected Directions:
Current abstraction level:
Requested output:
Rules for this thread:
What not to do:
Relevant source documents:
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
- identify the current abstraction level
- summarize Current Best Understanding
- separate committed decisions from exploratory ideas
- list open questions
- identify what source docs should be read or pasted
- ask for only missing critical context
- then continue from the reconstructed state

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

Framework docs to use:
- docs/ai-collaboration/README.md
- docs/ai-collaboration/product-development-framework.md
- docs/ai-collaboration/modes/product-discovery-mode.md
- docs/ai-collaboration/state/product-state.md
- docs/ai-collaboration/templates/thread-start-template.md

Current focus:
TSMT Trainer MVP planning.

Current Best Understanding:
Use the current Product State if available. Preserve the product north star: product vision, emotional goals, core user problems, and the difference between product direction and feature ideas.

Committed Directions:
Use only decisions explicitly recorded in Product State or provided in this prompt.

Exploration Zone:
MVP boundaries, motivation principles, user problems, and possible product directions.

Open Questions:
Identify open questions from Product State or ask for critical missing context.

Rejected Directions:
Use only directions explicitly marked as rejected.

Current abstraction level:
Product strategy and MVP definition, not UX screen design or implementation.

Requested output:
Produce clarified direction, open questions, and next suggested focus. Do not produce implementation tasks.

Rules for this thread:
- Preserve controlled ambiguity until there is enough confidence to commit.
- Distinguish exploration from commitment.
- Reason holistically and surface tradeoffs.
- Challenge assumptions respectfully.
- Explicit user decisions override recommendations.

What not to do:
- Do not jump to implementation.
- Do not invent backend architecture.
- Do not assume screens too early.
- Do not let current code dictate future product direction.
- Do not turn feature ideas into committed product direction without an explicit decision.

Relevant source documents:
Read or use the relevant Product State and Product Discovery mode docs. If you cannot access them, ask me to paste or summarize them.

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
