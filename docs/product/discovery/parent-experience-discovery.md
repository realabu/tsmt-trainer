# Parent Experience Discovery

## Status

Current maturity:
Documented

Confidence:
Medium-High

Mode:
Product Discovery

## Scope

This document captures the current shared understanding of the parent experience within TSMT Trainer.

This artifact is documented at role / perspective discovery level.

No open question currently blocks Parent Experience Discovery closure. Remaining non-blocking questions are transferred to future discovery, concept, or UX rounds with lifecycle metadata.

Future rounds whose active focus matches a revisit trigger should load and reconcile the matching transferred question before that target round can close.

It focuses on the parent's two essential roles:

- Practice Partner during shared home practice
- Program Owner / Setup & Review Owner outside the shared practice moment

The parent is the bridge between the instructor-provided TSMT plan and a child-understandable, jointly executable digital practice experience.

This is not a UX wireframe, screen specification, technical plan, or MVP acceptance document.

## Core Parent Problem

The parent primarily uses TSMT Trainer to help the child start and complete the day's home practice with as little conflict as possible.

The parent is not primarily looking for administration, analytics, or gamification. The parent needs support in making the practice understandable, doable, and emotionally manageable.

The parent also needs to understand whether today's practice is necessary or whether it can still be delayed without harming the weekly or therapy-cycle practice goal.

Outside the shared practice moment, the parent is also responsible for turning the instructor-provided TSMT program into something the system and child can use.

This setup, configuration, and review responsibility is necessary because it enables the simple shared parent-child practice experience. It should not turn the product into an admin-first dashboard, analytics product, or technical import system.

## Key Insights

- The parent benefits from the same core progress understanding as the child, with additional text and context where needed.
- The parent has two essential roles: Practice Partner and Program Owner / Setup & Review Owner.
- The parent bridges the instructor-provided TSMT plan and the child-understandable digital practice experience.
- The parent should not have to act as the full system operator who remembers every task, repetition, timing need, and next step.
- Program setup and review matter because they make the shared practice moment simpler, not because the product is admin-first.
- The product should support a shared parent-child practice moment rather than splitting the experience too early into separate child and parent products.
- The parent controls motivational tools. The system should not automatically diagnose when to introduce new motivation layers.
- The parent role is closer to a training partner than an operator or commander.

## Parent Role Split

The parent experience has two connected roles.

### Practice Partner

During practice, the parent helps the child:

- start home practice
- understand what is happening
- complete the current task and session
- stay emotionally regulated
- share a progress view
- experience practice as something done together

This role uses a shared orientation and progress surface. The parent is present with the child rather than acting as a separate dashboard operator.

### Program Owner / Setup & Review Owner

Outside the shared practice moment, the parent is responsible for making the instructor-provided TSMT program usable in the product.

At discovery level, this may include:

- capturing or importing the paper-based TSMT program from the instructor
- checking and correcting an automatically suggested task set
- providing weekly repetition count and practice period start/end
- adding rhymes/songs, required tools, extra execution instructions, and task purpose notes where relevant
- creating or editing child profiles
- handling instructor visibility/connection requests or initiating a connection
- configuring child-facing motivational layers such as themes, badges, and story/narrative availability
- manually recording, correcting, reviewing, or annotating practice when needed

This role is essential but secondary to the shared practice experience. Its purpose is to make the daily parent-child practice understandable, executable, and trustworthy.

Detailed behavior belongs to later Product Capability Discovery / Concept Model work. This document should not define UX flows, screen specifications, import architecture, trainer permissions, data models, or implementation tasks.

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

Timing should be treated carefully later during UX/product refinement because timing should not distort movement quality. Keep this as an insight and transferred lifecycle question rather than a detailed feature specification.
The specific timing and personal-best question is transferred in the Open Question Lifecycle section.

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

This principle applies during practice. Outside practice, the parent still has a Program Owner / Setup & Review Owner responsibility so the shared practice experience can stay simple.

## Motivation Layers

Parent Experience-level principle:
The parent controls motivational tools. The system should not automatically diagnose when to introduce new motivation layers.

This is part of the parent's Program Owner / Setup & Review Owner role: the parent configures which child-facing motivational layers are available, while detailed Motivation Toolbox behavior remains future concept work.

The detailed Motivation Layer Model belongs later to:
`docs/product/concepts/motivation-toolbox.md`

See the `Motivation Layer Model` Parking Lot item in `docs/product/state/product-state.md`.

## Explicitly Out Of Scope / Not MVP

The following should not be included as MVP:

- visual next-best-action guidance
- animations/glow/pulsing to guide attention
- smart attention highlights
- explicit generated parent coaching text
- advanced Training Manager interaction intelligence

These belong to Parking Lot / later Execution Support System / UX exploration.

This document also does not define:

- parent dashboard UX
- analytics workflows
- OCR/import architecture
- trainer permission models
- profile management flows
- practice review screens
- acceptance criteria
- API, schema, or data-model behavior

These responsibilities may be explored later as Product Capability Discovery or Concept Model work.

## Open Question Lifecycle

No open question currently blocks Parent Experience Discovery closure.

The following questions are transferred / non-blocking. They should be loaded and reconciled when their target focus becomes active.

### Parent-facing progress information density

Question:
How much progress information helps parents without making the experience feel analytical or heavy?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Progress Understanding UX refinement
- Parent Journey UX
- Shared Parent-Child Progress View refinement

Revisit trigger:
When Parent Journey UX, shared progress view UX, or Progress Understanding UX refinement starts.

Required future resolution action:
Resolve into UX direction, explicitly defer with a new trigger, transfer to a more specific target, or reject before the target round closes.

Reopen condition:
Reopen Parent Experience Discovery only if later UX work changes the parent role definition, not merely the amount of information shown.

### Today's practice importance without scheduling

Question:
How should the system communicate whether today's practice matters without becoming a scheduling assistant?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Resolved for Cross-role Interaction Discovery / partially transferred for later UX

Cross-role resolution:

- weekly practice responsibility belongs to the parent
- the child should understand progress, purpose, and movement toward goals
- the child should not carry scheduling responsibility or weekly-risk pressure
- the no-family-calendar boundary remains

Remaining transferred detail:
How to present this in UX without creating schedule pressure or family-calendar behavior.

Transferred to:

- Parent Journey UX
- shared progress view UX refinement

Revisit trigger:
When Parent Journey UX or shared progress view UX starts.

Required future resolution action:
Resolve into UX direction, explicitly preserve the no-family-calendar boundary, or transfer to a more specific UX artifact before the target round closes.

Reopen condition:
Reopen Parent Experience Discovery only if the product starts redefining the parent as a scheduling/planning user, which would conflict with the current boundary.

### Timing, personal best, and movement quality

Question:
How should timing and personal bests support motivation without distorting movement quality?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Self-Comparison / Progress Quality Discovery
- Execution / Practice Support Discovery
- Trainer Experience Discovery, if therapist interpretation becomes relevant

Revisit trigger:
When Self-Comparison / Progress Quality, Execution Support, timing, measurement, or trainer interpretation becomes active.

Required future resolution action:
Resolve into product principle or concept model, explicitly defer with a new trigger, or reject timing/personal-best framing as inappropriate before the target round closes.

Reopen condition:
Reopen Parent Experience Discovery only if the answer changes the parent's role in interpreting or enforcing performance.

### Child-owned actions vs parent control

Question:
What is the right balance between child-owned actions and parent control during practice?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Execution / Practice Support Discovery
- Shared Training Manager concept work
- Parent Journey UX
- Child Journey UX

Revisit trigger:
When Execution Support, Training Manager interaction, Child Journey UX, or Parent Journey UX starts.

Required future resolution action:
Resolve into interaction/product direction, transfer to UX if still interaction-level, or mark as blocking if the active Training Manager round cannot safely proceed without it.

Reopen condition:
Reopen Parent Experience Discovery only if later work changes the parent from training partner into primary operator/commander.

### Parent-facing text usefulness

Question:
Which parent-facing text is genuinely useful, and which should remain invisible or optional?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Execution / Practice Support Discovery
- Parent Journey UX
- Training Manager UX / content guidance exploration

Revisit trigger:
When parent-facing guidance, Training Manager feedback, or Parent Journey UX starts.

Required future resolution action:
Resolve into UX/content direction, explicitly defer with a new trigger, or reject parent-facing text patterns before that target round closes.

Reopen condition:
Reopen Parent Experience Discovery only if text guidance changes the parent role into coaching doctrine, which the current artifact explicitly avoids.

### Program Owner early scope vs later capability

Question:
Which Program Owner responsibilities belong in early product scope, and which should remain later capability work?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Partially resolved for Cross-role Interaction Discovery / transferred for capability and MVP boundary work

Cross-role resolution:

- the parent faithfully digitizes the paper plan
- the parent may verify and correct their digitalized version
- the parent may keep a personal reminder
- the parent may create retrospective observations
- the parent may authorize instructor visibility
- parent-added information must not modify professional plan content

Transferred to:

- Program Setup / Digitization Discovery
- Child / Family Profile Management Discovery
- Trainer Connection / Visibility Discovery
- Motivation Configuration Discovery
- Parent Practice Review & Notes Discovery
- MVP Boundary Synthesis

Revisit trigger:
When any Program Owner capability discovery starts, or when MVP Boundary Synthesis starts.

Required future resolution action:
Resolve scope boundary for the active capability, explicitly defer remaining parts with new triggers, transfer sub-questions to more precise artifacts, or mark as blocking if MVP boundary cannot be defined without it.

Reopen condition:
Reopen Parent Experience Discovery only if future scope work changes the fundamental two-role parent model.

### Instructor visibility and connection

Question:
How should instructor visibility or connection be understood at product-principle level without becoming a trainer workflow specification?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Resolved for Cross-role product principle / transferred for trainer-specific detail

Cross-role resolution:

- instructor connection is optional and permission-based
- instructor connection is background and child-invisible
- instructor visibility is passive in MVP
- instructor may see the faithful digitalized plan, execution information, timing-related information, practice regularity, and instructor-visible retrospective parent notes
- MVP does not include active in-system parent-instructor cooperation, chat, reply workflows, instructor approval, or correction workflow

Remaining transferred detail:
Trainer-side information density, aggregation, time horizons, priorities, and later non-MVP interaction possibilities.

Transferred to:

- Trainer Connection / Visibility Discovery
- Trainer Experience Discovery

Revisit trigger:
When Trainer Connection / Visibility Discovery or Trainer Experience Discovery starts.

Required future resolution action:
Resolve into trainer-side product understanding, transfer to trainer-specific artifact, explicitly defer with a new trigger, or mark as blocking if the active trainer round cannot close without it.

Reopen condition:
Reopen Parent Experience Discovery only if later trainer/cross-role work changes what the parent owns or controls.

## Discovery Outcome

Parent Experience Discovery reinforces the same product foundation as Child Experience Discovery: progress understanding comes before gamification.

Parent Experience is documented at role / perspective discovery level.

The parent has two essential roles:

- Practice Partner during the shared home practice moment
- Program Owner / Setup & Review Owner outside the shared practice moment

The parent is the bridge between the instructor-provided TSMT plan and a child-understandable, jointly executable digital practice experience.

The parent needs a shared orientation surface that helps both parent and child understand the current task, current session, weekly goal, and nearest meaningful milestone.

The product should reduce the parent's cognitive load so the parent can participate as a training partner rather than a full system operator.

The setup/review role exists to support that simple shared practice experience. It is not an admin-first product direction.

Motivational layers remain parent-curated and optional.

Remaining questions are non-blocking and transferred with lifecycle metadata. Future capability, concept, and UX rounds should reconcile matching transferred questions when their revisit triggers become active.

## Parking Lot Links / Related Future Work

- `Motivation Layer Model`: remains parked for later Motivation Toolbox concept exploration.
- `Guided Training Manager Attention Layer`: should remain parked until the Training Manager interaction model is actively explored.
- `Program Setup / Digitization`: future Product Capability Discovery for turning the instructor-provided plan into system-supported practice.
- `Child / Family Profile Management`: future Product Capability Discovery for managing child-specific setup.
- `Trainer Connection / Visibility`: future Product Capability Discovery for instructor visibility or connection principles.
- `Practice Review & Notes`: future Product Capability Discovery / Concept Model work for review, correction, and annotation.
- `docs/product/concepts/motivation-toolbox.md`: future concept artifact for motivation layers.
- `docs/product/concepts/execution-support-system.md`: possible future concept artifact for Training Manager attention and guidance.
