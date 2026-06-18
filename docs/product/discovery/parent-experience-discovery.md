# Parent Experience Discovery

## Status

Current maturity:
Discovery capture created

Confidence:
Medium

Mode:
Product Discovery

## Scope

This document captures the current shared understanding of the parent experience within TSMT Trainer.

It focuses on the parent's role in helping the child start and complete home practice with less conflict, less cognitive load, and clearer progress understanding.

This is not a UX wireframe, screen specification, technical plan, or MVP acceptance document.

## Core Parent Problem

The parent primarily uses TSMT Trainer to help the child start and complete the day's home practice with as little conflict as possible.

The parent is not primarily looking for administration, analytics, or gamification. The parent needs support in making the practice understandable, doable, and emotionally manageable.

The parent also needs to understand whether today's practice is necessary or whether it can still be delayed without harming the weekly or therapy-cycle practice goal.

## Key Insights

- The parent benefits from the same core progress understanding as the child, with additional text and context where needed.
- The parent should not have to act as the full system operator who remembers every task, repetition, timing need, and next step.
- The product should support a shared parent-child practice moment rather than splitting the experience too early into separate child and parent products.
- The parent controls motivational tools. The system should not automatically diagnose when to introduce new motivation layers.
- The parent role is closer to a training partner than an operator or commander.

## Parent Progress & Obligation Understanding

The parent needs to understand:

- where they are in the practice process
- how many sessions have already been completed this week
- how many are still needed for the weekly goal
- how the weekly state relates to the broader therapy / practice cycle
- whether today's practice is important or whether it can still reasonably be delayed

Important boundary:
The system should not become a family calendar, scheduling assistant, or general time-window planning tool.

Rejected / bounded direction:
Do not expand the product into managing family schedules or detecting free time windows.

The product should answer:
"Where are we compared to the practice plan, and how important is it to practice today?"

It should not answer:
"When does the family have free time?"

## Shared Parent-Child Progress View

The parent and child should be able to orient themselves using the same core progress view.

The child primarily needs visual understanding:

- where am I?
- what comes next?
- how much remains?
- what have I already achieved?

The parent benefits from the same visual information, but may also need text:

- weekly completion count
- remaining sessions
- current task/session state
- broader practice-cycle position

The intent is not to create a separate child app and separate parent dashboard as the primary model.

The preferred product direction is a shared orientation surface:

- visual enough for the child
- textually explicit enough for the parent
- usable together before, during, and after practice

## Nearest Meaningful Milestone First

The progress experience should primarily emphasize the closest achievable success.

Primary emphasis:

- today's practice
- the current task
- current session completion
- the weekly goal
- the next small milestone

The full therapy / practice progression can remain visible, but should not dominate the experience.

Reason:
Long-distance goals may feel abstract or overwhelming. The product should surface "low-hanging fruit": the next achievable success that helps the child and parent feel progress now.

Candidate principle:
Nearest Meaningful Milestone First

## Progress View Lifecycle

The role of progress information changes across the practice flow.

### Before Practice

- support start and orientation
- show today's goal
- show weekly state
- show the nearest achievable milestone
- help the parent explain why today's practice matters

### During Practice

- focus primarily on the current task
- show timing / elapsed time / measured performance
- support self-comparison where appropriate
- show remaining repetitions or task progress
- keep smaller secondary awareness of the next task so the parent can prepare
- keep session-level progress visible enough to answer "how much is left?"

### After Practice

- support celebration
- show what was completed
- show progress made today
- show movement toward weekly goal / next milestone
- help parent and child share a moment of recognition

## Self-Comparison And Timing

One important child motivation mechanism is competing with oneself:

- becoming faster
- becoming more skillful
- feeling that the task becomes easier
- seeing improvement compared to previous attempts

This should not be framed as competition with other children.

Timing should be treated carefully later during UX/product refinement because timing should not distort movement quality. Keep this as an insight and open question rather than a detailed feature specification.

## Shared Training Manager With Child-Owned Actions

During practice, the Training Manager should be a shared parent-child surface.

The child should be able to own simple, motivating actions where safe:

- pressing the big next button
- moving to the next task
- participating in start/finish moments

The parent should not have to act as the full operator who remembers everything.

The parent uses the same screen to understand:

- current task
- repetitions
- task instructions
- timing
- progress
- next task
- rhyme/song/audio support when needed

The parent may start a rhyme/song/audio playback if neither the child nor parent can confidently sing or recite it.

## Parent Cognitive Load Reduction

The system should reduce the parent's cognitive load by tracking and presenting:

- task order
- repetition counts
- current task
- elapsed time / timing
- session progress
- within-task progress
- weekly progress
- broader practice progress
- available motivational tools
- rhyme/song support

This allows the parent to be more present with the child rather than constantly remembering, counting, tracking, and improvising.

## Parent As Training Partner, Not System Operator

The preferred parent role is closer to a training partner than an operator or commander.

Important nuance:
Do not turn this into a parenting/coaching doctrine. The product should not prescribe parenting style too heavily.

The system can naturally support a healthier narrative:

- "we are doing this together"
- "the system helps us follow the practice"
- "the child does not carry the whole burden alone"
- "the parent does not carry the whole cognitive load alone"

## Motivation Layers

Parent Experience-level principle:
The parent controls motivational tools. The system should not automatically diagnose when to introduce new motivation layers.

The detailed Motivation Layer Model belongs later to:
`docs/product/concepts/motivation-toolbox.md`

See the `Motivation Layer Model` Parking Lot item in `docs/ai-collaboration/state/product-state.md`.

## Explicitly Out Of Scope / Not MVP

The following should not be included as MVP:

- visual next-best-action guidance
- animations/glow/pulsing to guide attention
- smart attention highlights
- explicit generated parent coaching text
- advanced Training Manager interaction intelligence

These belong to Parking Lot / later Execution Support System / UX exploration.

## Open Questions

- How much progress information helps parents without making the experience feel analytical or heavy?
- How should the system communicate whether today's practice matters without becoming a scheduling assistant?
- How should timing and personal bests support motivation without distorting movement quality?
- What is the right balance between child-owned actions and parent control during practice?
- Which parent-facing text is genuinely useful, and which should remain invisible or optional?

## Discovery Outcome

Parent Experience Discovery reinforces the same product foundation as Child Experience Discovery: progress understanding comes before gamification.

The parent needs a shared orientation surface that helps both parent and child understand the current task, current session, weekly goal, and nearest meaningful milestone.

The product should reduce the parent's cognitive load so the parent can participate as a training partner rather than a full system operator.

Motivational layers remain parent-curated and optional.

## Parking Lot Links / Related Future Work

- `Motivation Layer Model`: remains parked for later Motivation Toolbox concept exploration.
- `Guided Training Manager Attention Layer`: should remain parked until the Training Manager interaction model is actively explored.
- `docs/product/concepts/motivation-toolbox.md`: future concept artifact for motivation layers.
- `docs/product/concepts/execution-support-system.md`: possible future concept artifact for Training Manager attention and guidance.
