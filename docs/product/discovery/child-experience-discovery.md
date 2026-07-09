# Child Experience Discovery

## Status

Current maturity:
Documented

Confidence:
Medium-High

Mode:
Product Discovery

## Scope

This document captures the current shared understanding of the child experience within TSMT Trainer.

This is a Product Discovery / Role-Perspective / Child Experience artifact.

It is pre-capability-design, pre-UX, pre-specification, and pre-engineering.

No open question currently blocks Child Experience Discovery closure at role / perspective level. Remaining non-blocking questions are transferred to future discovery, concept, or UX rounds with lifecycle metadata below.

## Core Problem

TSMT exercises may be physically tiring, cognitively demanding, and repetitive within a practice period.

They often compete with free play time and are frequently performed after kindergarten or school, when the child is already tired.

The challenge is not simply lack of motivation.

The challenge is that the child experiences a difficult, repetitive, and sometimes unclear process.

## Key Insight

The original product insight:

Children become more motivated when they understand:

- what is happening
- where they are
- how much remains
- whether they are improving
- when they will finish

Progress understanding itself can become a motivational force.

## Progress Understanding System

Children should understand the therapy journey across several time horizons.

### Current Task

- What am I doing?
- How many repetitions remain?
- When is this task finished?

### Current Session

- How many tasks are in today's session?
- Which task am I currently on?
- How many tasks remain?
- Approximately how much time has passed?

### Weekly Goal

- How many sessions are required this week?
- How many have already been completed?
- How many remain?

### Practice Period

- How many weeks remain until review?
- How many sessions remain until review?
- When is the next review?

### Personal Progress

- Am I improving compared to myself?
- What are my personal bests?
- What have I already completed?

## Foundation Layer

The foundation of the child experience consists of:

- Player
- Visible progress
- Session completion
- Progress understanding
- Self-comparison

This foundation is considered more important than gamification systems.

## Motivation Toolbox

Motivational tools are optional and build on top of the foundation.

Examples:

- Themes
- Badges
- Stories
- Characters
- Physical rewards

## Theme Layer

Themes are not primarily rewards.

Themes provide identity and emotional attachment.

Example themes:

- Space
- Dinosaurs
- Princesses
- Vehicles
- Animals

The goal is to help the child feel:

"This is my training."

## Positive Reinforcement Philosophy

- No punishment
- No shame
- No removal of earned progress
- No fear-of-loss mechanics

Missing a session may delay progress but should not create regression.

## Open Question Lifecycle

No open question currently blocks Child Experience Discovery closure at role / perspective level.

The following questions are transferred / non-blocking. Future rounds whose active focus matches a revisit trigger must load and reconcile the matching question before that target round can close.

### Age-appropriate progress indicators

Question:
Which progress indicators are most meaningful for different ages?

Source artifact:
`docs/product/discovery/child-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Progress Understanding UX refinement
- Child Journey UX

Revisit trigger:
When Progress Understanding UX refinement or Child Journey UX starts.

Required future resolution action:
Resolve age-appropriate presentation and comprehension needs into UX direction, explicitly defer with a new trigger, transfer to a more specific UX artifact, or reject age-specific differentiation as unnecessary before the target round closes.

Reopen condition:
Reopen Child Experience Discovery only if later evidence changes the underlying child need for understandable progress, not merely how progress is represented for different ages.

### Personal best representation

Question:
How should personal bests be represented?

Source artifact:
`docs/product/discovery/child-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Self-Comparison / Progress Quality Discovery
- later Child Journey UX

Revisit trigger:
When Self-Comparison / Progress Quality Discovery, measurement-quality exploration, or child-facing self-comparison UX starts.

Required future resolution action:
First resolve what kinds of self-comparison are meaningful and safe at product-discovery level, including movement-quality and pressure risks; then transfer presentation details to UX, explicitly defer with a new trigger, or reject personal-best framing where it is inappropriate.

Reopen condition:
Reopen Child Experience Discovery only if later work changes self-comparison from a foundation-level child need or changes the principle that the child is compared only with their own earlier performance or experience.

### Progress information density

Question:
How much progress information is too much?

Source artifact:
`docs/product/discovery/child-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Progress Understanding UX refinement
- Child Journey UX
- Shared Parent-Child Progress View refinement

Revisit trigger:
When Progress Understanding UX refinement, Child Journey UX, or shared progress view UX starts.

Required future resolution action:
Resolve information hierarchy and cognitive-load boundaries into UX direction, explicitly defer with a new trigger, transfer to a more specific UX artifact, or reject additional progress layers before the target round closes.

Reopen condition:
Reopen Child Experience Discovery only if later work changes the underlying child need to understand current activity, remaining work, progress, improvement, or finishability; do not reopen for presentation-density decisions alone.

### Motivational tool fit across children

Question:
Which motivational tools work best for different children?

Source artifact:
`docs/product/discovery/child-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Motivation / Reinforcement Discovery
- Motivation Toolbox Concept Model

Revisit trigger:
When Motivation / Reinforcement Discovery support review starts or Motivation Toolbox becomes an active concept focus after adequate discovery support exists.

Required future resolution action:
Clarify whether and how motivational tools should vary across children without introducing automatic diagnosis or one-size-fits-all assumptions; then resolve into product direction, transfer to the Motivation Toolbox concept, explicitly defer with a new trigger, or reject unsupported differentiation assumptions before the target round closes.

Reopen condition:
Reopen Child Experience Discovery only if later motivation work changes the foundation-before-motivation direction or makes optional motivational tools primary to the child experience.

### Theme evolution over time

Question:
How should themes evolve over time?

Source artifact:
`docs/product/discovery/child-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Motivation / Reinforcement Discovery
- Motivation Toolbox Concept Model
- Motivation Configuration Discovery

Revisit trigger:
When Motivation / Reinforcement Discovery, Motivation Toolbox concept work, or Motivation Configuration Discovery starts.

Required future resolution action:
Clarify whether themes are stable identity layers, evolving content layers, or something else at product level before deciding any lifecycle or configuration behavior; then resolve into product direction, transfer to the active concept or capability artifact, explicitly defer with a new trigger, or reject theme-evolution behavior before the target round closes.

Reopen condition:
Reopen Child Experience Discovery only if later work changes the current understanding that themes are optional motivational / identity support rather than the foundation of the child experience.

## Discovery Outcome

The primary value of TSMT Trainer is not gamification.

The primary value is making progress understandable and visible.

Motivational systems support this foundation.

Child Experience Discovery is documented at role / perspective level. Remaining non-blocking questions are transferred with lifecycle metadata and should be reconciled only when their matching future focus becomes active.