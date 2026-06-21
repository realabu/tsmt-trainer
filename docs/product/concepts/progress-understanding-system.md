# Progress Understanding System

## Status

Current maturity:
Concept model drafted

Confidence:
Medium

Mode:
Product Discovery / Concept Model

## Scope

This document captures the current concept-level understanding of how TSMT Trainer should make progress understandable to the parent and child.

This is not a UX wireframe, screen specification, implementation plan, acceptance criteria document, or technical architecture document.

The concepts in this document remain subject to clarification. They should not be treated as detailed product specifications or implementation commitments.

## Core Product Truth

TSMT Trainer is not primarily a gamification product.

Its primary value is making progress understandable and visible:

- what the child is doing
- where they are
- how much remains
- how they are progressing
- when they will be finished
- why today's practice matters

Motivational systems are secondary and should build on top of progress understanding.

## Central Progress Question

The Progress Understanding System should primarily answer:

"What does today's practice achieve, where does it move us, and how much remains afterward?"

In Hungarian product-owner phrasing:

"Azzal, amit ma megcsinálunk, mit érünk el, hova jutunk, és utána már mennyi van hátra?"

The system should not only show percentages or completion counts. It should help the child and parent understand the meaning of today's practice.

## Three Core Progress Horizons

Progress should be understood through three connected horizons.

### Today's Practice

- present-focused meaning
- what we do now
- what today achieves
- how today moves us forward

### Weekly Rhythm

- the most important near-term TSMT progress boundary
- required weekly practice frequency
- completed sessions this week
- remaining sessions and remaining days/opportunities
- whether today's practice helps preserve flexibility or prevents the week from becoming too dense

### Full Practice Cycle / Large Map

- the one-to-two-month repeated task-set journey
- the large adventure / final goal
- weeks and days as visible parts of the cycle
- major progress points such as first week started, halfway reached, final week reached, and cycle completed

The full cycle is close enough to be visible and meaningful, but children live strongly in the present. Therefore today's practice and weekly rhythm should carry the immediate meaning, while the full cycle remains visible as the larger adventure.

## Weekly Rhythm Is Central

The weekly layer is not merely administrative.

In TSMT, the full cycle includes a required number of practice sessions per week. This cannot simply be compressed later without changing the intended practice rhythm.

The Progress Understanding System should help the parent understand:

- how many sessions are required this week
- how many are already completed
- how many remain
- how many days/opportunities remain
- whether there is still flexibility
- whether today's practice is especially important

This should not become a family calendar or scheduling assistant.

The product should answer:

"Where are we compared to the TSMT practice rhythm?"

It should not answer:

"When does the family have free time?"

## Shared Weekly Rhythm Map

The weekly progress layer should be visible in the shared parent-child experience.

The child may see:

- simple numbers
- days of the week / practice opportunities
- which days moved the child forward
- which days remain as possible opportunities
- positive progress toward the weekly goal

The parent should additionally understand:

- precise weekly completion state
- remaining required sessions
- remaining days/opportunities
- whether the week is still flexible or becoming dense
- whether today's practice matters strongly for keeping the weekly rhythm

The child should not be made responsible for schedule pressure. The child-facing meaning should remain positive and action-oriented:

- today we move closer
- today helps the week
- today is an important step
- we are building the week

Avoid child-facing failure states such as:

- we are behind
- the weekly goal is impossible
- you failed the week
- this no longer counts

## Non-Punitive Weekly Rhythm Signal

The weekly rhythm signal should not behave as a good/bad judgment.

Avoid a punitive model:

- green = good family
- yellow = problem
- red = failure

Instead, communicate the current week as a supportive situation:

- we have flexibility
- today helps keep the rhythm
- today makes the rest of the week easier
- today matters a lot
- the weekly goal is complete

Even when the week is becoming dense, the message should be framed as:

"The current practice matters more now."

Not:

"You are failing."

This signal is primarily parent-oriented, but may be represented in a child-friendly shared way.

## Full Cycle / Large Map

The full one-to-two-month practice cycle should be visible as the large journey.

The large map should conceptually show:

- weeks
- days / practice opportunities
- completed practice days
- active weeks
- current week
- future weeks
- large-map progress points

Important distinction:

- An active week means at least one practice happened in that week.
- A completed weekly goal means the required number of weekly sessions was reached.

Starting a week should already create a visible sense of movement, even before the weekly goal is complete.

The large map should help the child and parent feel both:

- the small daily step
- the larger weekly/cycle movement

## Stage-Aware Progress Narrative

The progress narrative should change depending on where the family is in the practice cycle.

At the beginning:

- emphasize new tasks, new abilities, strengthening, and discovery
- the child is entering a new practice adventure

In the middle:

- emphasize rhythm, persistence, and visible progress
- the family is moving through the process

Near the end:

- emphasize how much has already been achieved
- how little remains
- how close the child is to finishing the cycle

This is not gamification-first. It is progress meaning.

## Week-Aware Progress Narrative

Within a given week, the emphasis should also change.

At the start of the week:

- "We started the week."
- "Today gets the week moving."

In the middle:

- "We are moving toward the weekly goal."
- "Today keeps the rhythm."

Near the end or when the week is becoming dense:

- "Today matters a lot."
- "Today helps us still reach the weekly rhythm."
- "If today is done, the rest of the week becomes easier."

When the weekly goal is complete:

- "The weekly rhythm is complete."
- "This week's goal is done."

These statements illustrate the intended meaning. They are not final interface copy.

## Milestone Hierarchy

Milestones are not therapeutic phases. They are understandable progress points.

Primary milestone hierarchy:

1. Today's practice completed
2. Weekly goal completed
3. Large-map progress point reached
4. Full task-set / practice cycle completed

Large-map progress points may include:

- first week started
- halfway reached
- final week reached
- only a little remains

Use language like:

- large-map progress point
- progress point within the cycle
- visible journey milestone

Avoid language that implies a professionally defined therapeutic phase unless such a phase is explicitly defined later.

## Counted Marked Progress

Current concept direction:
If a practice session was started, the system should count it toward progress by default, even if completion or measurement quality is uncertain.

This applies conceptually to:

- weekly progress
- full cycle progress
- large-map movement

The main progress should not separate it as:

"2 complete + 1 uncertain"

It should show the main progress as:

"3/4 complete"

However, the relevant day may receive a subtle marker indicating:

- measurement was incomplete
- completion was uncertain
- something was not fully clean
- a task may have been skipped, modified, interrupted, or not tracked

This marker should preserve trust without punishing real-life interruptions.

The exact conditions for counting and marking remain an open product question.

## Parent Correction Later

Parents may later review and correct a marked practice day.

Current concept direction:

- If the parent confirms the relevant tasks/session as completed, the uncertainty marker can be removed.
- If the parent marks all tasks as not completed, the day should no longer contribute to weekly or cycle progress.
- A voided day should disappear from child-facing progress history.
- Detailed task-level review, corrections, and notes belong to a later Parent Practice Review & Notes layer.

Important distinction:

- child-facing / shared progress history should remove the progress impact of a fully voided day
- internal/audit/event history is a later technical/product decision and should not be specified here

## Parent And Child Roles

The child and parent should share the same core progress world, but understand it at different depth.

The child needs:

- visible progress
- numbers where simple and motivating
- today's meaning
- progress toward the week and larger journey
- no burden of schedule responsibility

The parent needs:

- exact weekly state
- remaining sessions
- remaining days/opportunities
- whether today is important
- subtle uncertainty markers
- future ability to review/correct if needed

The parent remains a training partner, not merely a system operator.

## Motivation Relationship

Badge systems and other motivational tools are secondary.

They may later provide:

- closer goals
- immediate rewards
- extra motivation when natural progress understanding is not enough

The foundation should remain:

progress -> meaning -> motivation

Not:

gamification -> reward -> compliance

Badge details belong to later Motivation Toolbox concept exploration.

## Explicitly Out Of Scope / Not MVP Concept Core

Keep these out of this artifact except as Parking Lot references:

- detailed badge system
- screen design
- Training Manager UI
- animations, glowing, pulsing, or attention guidance
- detailed parent review table
- task-level correction UI
- therapist dashboard
- family calendar
- scheduling assistant
- implementation details
- database or API model
- acceptance criteria

## Open Questions

- What exact conditions should make a started session count toward weekly and cycle progress?
- What information is needed to distinguish a clean completion from a counted but marked practice day?
- How should remaining days/opportunities be understood without turning the product into a calendar or scheduling assistant?
- What level of weekly rhythm information is supportive for the child without transferring schedule pressure?
- Which large-map progress points are meaningful across different cycle lengths?
- How should timing and self-comparison relate to progress meaning without distorting movement quality?
- When should parent review and correction become available, and what should remain outside the shared child-facing history?

## Parking Lot / Related Future Work

### Motivation Toolbox / Badge Layer

- badges as optional closer goals and immediate reinforcement
- should build on progress understanding
- belongs to later Motivation Toolbox concept exploration

### Parent Practice Review & Notes Layer

- parent can review practice details later
- task-level completed/not-completed correction
- uncertainty marker cleanup
- parent notes such as easy/hard, liked/disliked, improvement, and therapist-relevant observations
- belongs to later Product Discovery / Concept Model work before any UX exploration

### Guided Training Manager Attention Layer

- already parked in Product State
- belongs to later Execution Support System / UX exploration

### Therapist / Trainer Experience Discovery

- already parked in Product State
- belongs to later Product Discovery

## Discovery Outcome

The Progress Understanding System connects today's practice, the weekly rhythm, and the full practice cycle into one shared progress world.

Its central job is not to display completion data alone. It should help the child and parent understand what today's practice achieves, where it moves them, and how much remains.

The weekly rhythm is the central near-term boundary. It should communicate importance and flexibility without blame, punishment, or schedule pressure on the child.

Motivational systems remain secondary and should build on progress meaning.
