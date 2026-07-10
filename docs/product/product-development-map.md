# Product Development Map

## Purpose

This document provides a visible high-level map of the route from discovery to implementation.

It is a product development navigation map.

It is not:

- a delivery roadmap
- a backlog
- a substitute for Product State

Use this map to show where product planning currently stands, prevent premature jumps across abstraction levels, and keep Product Discovery, Concept Models, UX / Design, Specification, and Engineering in the right order.

This map is governed by the [AI Collaboration Framework](../ai-collaboration/README.md).

Canonical current planning state lives in [Product State](state/product-state.md).

## Status Legend

- Not Started: no meaningful discovery or artifact exists yet
- Captured: a topic is parked or noted, but not actively explored or documented as an artifact
- Exploring: active discovery or concept exploration is underway
- Clarifying: a discovery capture or artifact exists, but important review or synthesis remains
- Ready to Document: enough understanding exists to create or update an artifact
- Documented: documented at the current abstraction level
- Deferred: intentionally postponed and not part of the current planning focus
- Closed: finished for the current planning phase unless explicitly reopened
- Blocked: cannot progress without missing information or a product-owner decision

## Current Product Position

This section summarizes Product State for navigation. It should remain consistent with [Product State](state/product-state.md), but it does not replace it.

- Current product phase: Product Discovery
- Product discovery status: Program Setup / Digitization Discovery is the one active Product Capability Discovery focus
- Current product focus: Program Setup / Digitization Discovery
- Next product step: start the Program Setup / Digitization Discovery round at Product Capability Discovery level
- Guardrail: do not proceed to Motivation Toolbox concept work, UX, specification, or engineering yet.

Canonical active planning state lives in [Product State](state/product-state.md).

## Meta / Collaboration Framework

AI Collaboration Framework documentation lives under `docs/ai-collaboration/`.

Framework maintenance is meta-work, not TSMT Trainer product development progress.

This Product Development Map tracks the TSMT Trainer product development path.

## Product Discovery

Product Discovery remains the controlling phase until relevant discovery tracks are documented, intentionally deferred, explicitly skipped by the product owner, or superseded by a confirmed focus switch.

### Role / Perspective Discovery

- Child Experience Discovery: Documented
  - Artifact: [Child Experience Discovery](discovery/child-experience-discovery.md)
  - Transferred input: non-blocking open questions live in the source artifact and should be loaded by matching future tracks.
- Parent Experience Discovery: Documented
  - Artifact: [Parent Experience Discovery](discovery/parent-experience-discovery.md)
  - Note: documented at role / perspective level with Practice Partner and Program Owner / Setup & Review Owner roles.
  - Transferred input: non-blocking open questions live in the source artifact and should be loaded by matching future tracks.
- Trainer Experience Discovery: Documented
  - Artifact: [Trainer Experience Discovery](discovery/trainer-experience-discovery.md)
  - Transferred input: Parent Experience Discovery and Cross-role Interaction Discovery
  - Note: documented at role / perspective level as reactive professional context reconstruction, not continuous monitoring.
- Cross-role Interaction Discovery: Documented
  - Artifact: [Cross-role Interaction Discovery](discovery/cross-role-interaction-discovery.md)
  - Transferred input: Parent Experience Discovery
  - Note: documents the parent-child home practice relationship as primary, with optional passive instructor visibility in the background.

### Product Capability Discovery

- Progress / Completion / Understanding Discovery: Documented
  - Support: Child Experience Discovery, Parent Experience Discovery, and [Progress Understanding System](concepts/progress-understanding-system.md)
- Motivation / Reinforcement Discovery: Captured
  - Support: Child and Parent discovery notes plus Product State Parking Lot
  - Transferred input: Child Experience Discovery motivation-tool-fit and theme-evolution questions
  - Note: discovery support must be reviewed before Motivation Toolbox concept work proceeds.
- Execution / Practice Support Discovery: Captured
  - Support: Parent Experience Discovery and Guided Training Manager Attention Layer Parking Lot item
  - Transferred input: Parent Experience Discovery
- Program Setup / Digitization: Exploring
  - Support: Parent Experience Discovery, Cross-role Interaction Discovery, and Product State Parking Lot
  - Active focus: clarify the product-level capability boundary for faithful plan digitization without import UX, technical architecture, professional reinterpretation, or instructor approval workflows.
  - Active transferred input: Parent Experience Discovery Program Owner early-scope question, limited to Program Setup / Digitization.
  - Active transferred input: Cross-role Interaction Discovery Program Setup capability-scope question about faithful digitization, enrichment, error prevention, parent correction, and early product scope boundary.
  - Guardrail: other Program Owner transferred targets remain inactive future work unless explicitly transferred or deferred again during this round.
- Child / Family Profile Management: Captured
  - Support: Parent Experience Discovery and Product State Parking Lot
  - Transferred input: Parent Experience Discovery
- Trainer Connection / Visibility: Captured
  - Support: Parent Experience Discovery, Cross-role Interaction Discovery, Trainer Experience Discovery, and Product State Parking Lot
  - Transferred input: Parent Experience Discovery, Cross-role Interaction Discovery, and Trainer Experience Discovery
- Motivation Configuration: Captured
  - Support: Parent Experience Discovery and Product State Parking Lot
  - Transferred input: Child Experience Discovery theme-evolution question and Parent Experience Discovery
- Meaning / Education Discovery: Not Started
- Physical / Digital Hybrid Discovery: Not Started
- Parent Practice Review & Notes Discovery: Captured
  - Source: Product State Parking Lot and Progress Understanding System related future work
  - Transferred input: Parent Experience Discovery and Cross-role Interaction Discovery
- Self-Comparison / Progress Quality Discovery: Captured
  - Source: Product State Parking Lot and Progress Understanding System deferred work
  - Transferred input: Child Experience Discovery personal-best question, Parent Experience Discovery, and Trainer Experience Discovery

### Product Synthesis

- Product Vision Synthesis: Not Started
- Product Principles: Captured
  - Note: stable principles have emerged, but no dedicated synthesis artifact exists yet.
- MVP Boundary Synthesis: Not Started

## Concept Models

Concept Models are discovery-derived product capability artifacts.

They are still pre-UX, pre-specification, and pre-engineering.

A Concept Model should have discovery support, belong to a discovery track, or be marked as a cross-cutting synthesis before active concept work begins.

### Progress Understanding System

Concept status:
Documented

Discovery support:
Child Experience Discovery, Parent Experience Discovery, and Progress / Completion / Understanding Discovery.

Reopen condition:
Reopen if later Measurement / Progress Quality work changes progress assumptions. Cross-role and Trainer Experience Discovery reinforced the existing assumptions and did not reopen this concept.

Artifact:
[Progress Understanding System](concepts/progress-understanding-system.md)

### Motivation Toolbox

Concept status:
Captured

Discovery support:
Child and Parent discovery notes plus the Motivation Layer Model Parking Lot item.

Missing discovery support / reopen condition:
Review unresolved Product Discovery tracks, Product State, and transferred Child Experience motivation questions before starting active Motivation Toolbox concept work.

Future artifact:
`docs/product/concepts/motivation-toolbox.md`

### Execution Support System

Concept status:
Captured

Discovery support:
Parent Experience Discovery and Guided Training Manager Attention Layer Parking Lot item.

Missing discovery support / reopen condition:
Requires dedicated Execution / Practice Support Discovery before UX or interaction design.

Future artifact:
`docs/product/concepts/execution-support-system.md`

### Meaning & Education System

Concept status:
Not Started

Discovery support:
Not yet documented.

### Physical / Digital Hybrid System

Concept status:
Not Started

Discovery support:
Not yet documented.

### Parent Practice Review & Notes

Concept status:
Captured

Discovery support:
Progress Understanding System related future work and Product State Parking Lot.

Missing discovery support / reopen condition:
Requires future Product Discovery / Concept Model work before any UX exploration.

Future artifact:
`docs/product/concepts/parent-practice-review-notes.md`

### Self-Comparison / Progress Quality

Concept status:
Captured

Discovery support:
Child Experience Discovery, Parent Experience Discovery, Progress Understanding System deferred work, and Product State Parking Lot.

Missing discovery support / reopen condition:
Requires later Measurement / Progress Quality / Execution Support exploration and may connect to Trainer Experience Discovery.

Future artifact:
`docs/product/concepts/progress-quality-and-self-comparison.md`

## UX / Design Exploration

UX / Design should not start until Product Discovery and relevant Concept Models are sufficiently documented, deferred, or explicitly skipped by the product owner.

Progress Understanding UX refinement and Shared Parent-Child Progress View refinement are represented here as future UX refinement inputs, not standalone map nodes. Their detailed transferred-question lifecycle remains in the source discovery artifacts.

- Journey Discovery: Not Started
- Child Journey: Not Started
  - Transferred input: Child Experience Discovery age-appropriate progress indicators, personal-best representation, and progress-information-density questions
- Parent Journey: Not Started
- Trainer Journey: Not Started
- Screen Architecture: Not Started
- Wireframes: Not Started
- Visual Design Direction: Not Started

## Specification

Specification should not start until relevant Product Discovery and UX / Design work are sufficiently documented, deferred, or explicitly skipped by the product owner.

- MVP Definition: Not Started
- Functional Specification: Not Started
- Acceptance Criteria: Not Started

## Engineering

Engineering planning should not start until committed product and UX direction are available.

- Current Code Mapping: Not Started
- Implementation Readiness Review: Not Started
- Engineering Plan: Not Started
- Backlog Generation: Not Started

Planning readiness toward engineering backlog:
Early

## Parking Lot Visibility

The detailed Parking Lot lifecycle lives in [Product State](state/product-state.md).

This map should show major captured product areas only when they affect future planning. It should not list every minor idea.

Major captured and documented areas currently visible in the map:

- Trainer Experience Discovery
- Cross-role Interaction Discovery
- Motivation Layer Model / Motivation Toolbox
- Guided Training Manager Attention Layer
- Program Setup / Digitization
- Child / Family Profile Management
- Trainer Connection / Visibility
- Motivation Configuration
- Parent Practice Review & Notes
- Self-Comparison / Progress Quality

## How ChatGPT Should Use This Map

ChatGPT should:

- show a compact status snapshot in planning threads when useful
- use the map to prevent jumping ahead
- check Product State before treating active or next focus as stable
- treat Program Setup / Digitization Discovery as the one active Product Discovery focus until the product owner changes it or the round is closed
- review unresolved discovery tracks before proposing the next Concept Model
- keep UX / Design, Specification, and Engineering downstream unless the product owner explicitly confirms a mode/focus switch
- keep this map updated when a major phase changes status

The map should make the wider product development path visible without turning it into a delivery roadmap or backlog.
