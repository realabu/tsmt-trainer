# Trainer Experience Discovery

## Status

Current maturity:
Documented

Confidence:
Medium-High

Mode:
Product Discovery

## Scope

This document captures the current shared understanding of the trainer / instructor experience within TSMT Trainer.

This is a Product Discovery / Role-Perspective / Trainer Experience artifact.

It is pre-capability-design, pre-UX, pre-specification, and pre-engineering.

This document does not define dashboards, screens, flows, permission models, notifications, workflows, APIs, schemas, acceptance criteria, implementation plans, or backlog items.

It does not design the Trainer Connection / Visibility capability.

## Core Trainer Problem

The trainer works with many children and is expected to remain fundamentally reactive rather than continuously monitoring home practice.

The primary trainer problem is not lack of a monitoring dashboard.

The trainer problem is:

When attention turns to a particular child, the instructor needs to reconstruct the relevant professional and practice context quickly.

The two primary attention situations are:

1. responding to a parent question or problem
2. preparing for and conducting a control / assessment where the current period is evaluated and the next professional decision or task set may be created

The control and creation of the next task set may be part of the same professional decision point.

Trainer support should make these rare but context-heavy attention moments more efficient.

The trainer should not be described as a continuous monitor or active participant in daily home practice.

## Key Insight

The trainer experience is context reconstruction, not continuous supervision.

The low-hanging-fruit value is easy access to existing professional context and naturally generated home-practice evidence when the trainer already needs to think about a child.

The product should not create a new trainer-first analytics workflow.

## Existing Cross-role Guardrails

This artifact preserves the existing cross-role direction:

- TSMT Trainer is primarily a parent-child home practice support tool.
- The primary experience is the shared parent-child practice experience.
- The instructor relationship is secondary and background.
- Instructor connection is invisible to the child.
- Instructor connection in MVP is optional, permission-based, passive, and one-directional.
- The instructor may passively see the faithful digitalized practice plan and relevant practice information where supervision visibility exists.
- MVP does not include in-system parent-instructor chat.
- MVP does not include instructor reply workflow.
- MVP does not include active parent-instructor cooperation.
- MVP does not include instructor approval of digitalized plans.
- MVP does not include in-system correction workflow or program negotiation.
- The parent faithfully digitizes the instructor-provided paper plan.
- Digital enrichment may improve usability but must not change professional meaning.
- The instructor is not responsible for policing or approving parent digitization.
- The product should reduce digitization error instead of creating an approval / correction loop.
- The child experience remains centered on understandable progress and shared practice, not supervision.
- The parent remains responsible for weekly practice rhythm.
- The child should not carry scheduling responsibility or weekly-risk pressure.
- The product should not become a family calendar.
- Parent notes may be private or instructor-visible, but the product should not become a detailed practice diary.

Do not reopen these directions in Trainer Experience Discovery.

## Reactive Trainer Role

The trainer remains fundamentally reactive.

The product should not create expectations that the trainer:

- continuously monitors children
- regularly checks practice compliance
- proactively looks for deviations
- reviews every measurement
- carries daily or weekly monitoring responsibility

The value appears when trainer attention is already directed toward a child because of a parent contact, a problem, a control, or another professional decision point.

The product should make those attention moments more efficient.

## Minimum Trainer Value

The most important low-hanging-fruit trainer value is that the instructor can quickly access:

- the child's basic professional context
- the current task set
- previous task sets in chronological context
- when the task set was performed
- how many times it was performed
- how regularly it was performed

The basic trainer value is not a new trainer workflow.

It is easy access to existing professional context and naturally generated home-practice evidence.

Additional information such as detailed measurements, timing data, parent observations, or trainer notes should be treated as supplementary or problem-driven deeper context rather than the core trainer experience.

## Context Before Analytics

The primary purpose of trainer support is rapid professional context reconstruction, not an analytics-first experience.

The trainer's first need is to understand:

- who the child is
- age
- basic problem
- development goal
- date of last assessment / control
- current task set

Then, depending on the question or problem, the trainer may need deeper context.

Do not turn this into screen layout, dashboard, or information architecture design.

## The Task Set Itself Is Professional Context

The task set is not merely a list of exercises.

For an instructor, professional meaning may be carried by:

- exercise selection
- sequence
- repetition counts
- combination of exercises
- changes compared with previous task sets

Looking at the task set may help the instructor reconstruct:

- what the likely development focus was
- what problem was being addressed
- what professional strategy was being followed

Do not conclude that every task set requires structured documentation of its professional rationale.

The task set itself may already function as part of the instructor's professional memory.

## Program History Can Carry Professional Meaning

The chronological sequence of previous task sets may provide valuable professional context.

The historical sequence may help the trainer understand:

- changes in development focus
- exercises that remained or disappeared
- changing task composition
- progression or professional direction over time

This artifact does not decide:

- how many historical task sets must be visible
- how the history is presented
- whether automatic summaries exist

Those belong to later capability or UX work.

## Practice Reality

Home-practice evidence is especially valuable because the instructor is not present during regular home practice.

Primary practice reality information includes:

- how many times practice occurred
- how frequently
- how regularly
- how practice was distributed over time
- whether there were meaningful gaps or clustered catch-up periods

The current discovery understanding is that a clear visual representation of actual practice may be enough for the trainer to interpret the pattern professionally.

Do not assume MVP requires system-generated professional classification of the pattern.

## Data Complements Observation

Measured practice data should complement:

- the trainer's own professional observation during assessment / control
- the parent's reported experience of the home period

It should not replace either.

The trainer's professional understanding may combine:

```text
trainer observation
+ parent summary
+ actual practice pattern
```

Practice data may be particularly useful when the parent's description, the trainer's expectation, and the observed result do not appear to align.

Do not frame this as checking whether the parent is truthful.

Parent reports are subjective observations and practice data is another context source.

The value is triangulation and better understanding.

## Preserve Existing TSMT Behaviour

The product should not attempt to create a new documentation culture for parents or instructors.

Current understanding:

- parents commonly provide a concise retrospective summary
- the trainer uses professional memory and direct observation
- both roles may keep important context in memory today
- software may help preserve or retrieve context
- neither role should be forced into continuous documentation

Do not introduce requirements for:

- daily parent diary entries
- mandatory feedback after every practice
- task-by-task parent documentation
- mandatory trainer note-taking

## Trainer Notes

Optional trainer notes may be useful.

They may help preserve:

- special family context
- unusual professional considerations
- important impressions
- future points to revisit

Trainer notes are not currently considered the core of the Trainer Experience.

The task set itself may already reconstruct much of the trainer's professional intent and memory.

Possible note context may relate to:

- child / family
- a specific task set
- a control / assessment point associated with reviewing one task set and creating another

Do not design note types, privacy rules, fields, UI, or workflows.

Treat the need as optional contextual support.

## Timing, Personal Best, And Movement Quality

Trainer-specific understanding:

- execution time is not a primary trainer progress metric
- faster does not automatically mean better
- unchanged execution time is not inherently a problem
- timing may be secondary contextual information
- significant changes may sometimes provide clues that require professional interpretation
- faster execution could possibly suggest that a task set has become easy, but this is not automatic
- unusually slow execution could possibly indicate difficulty or incorrect execution, but timing alone cannot determine this

Professional interpretation remains with the instructor.

The Trainer Experience part of this transferred question is resolved for Trainer Experience.

Remaining motivation, self-comparison, measurement, movement-quality, and execution-support aspects stay transferred to their appropriate later discovery tracks.

Preserve existing guardrails:

- no unhealthy pressure
- no shame
- no speed-chasing
- no movement-quality distortion

## Trainer Information Priority

This hierarchy is discovery-level information priority. It is not information architecture, screen design, or dashboard design.

### Tier 1 - Immediate Orientation

- child identity
- age
- core problem
- development goal
- last assessment / control date
- current task set

### Tier 2 - Practice Reality

- when practice happened
- number of practices
- frequency
- regularity
- distribution over time
- meaningful gaps

### Tier 3 - Historical Professional Context

- previous task sets
- chronological task-set history
- relationship to control / assessment points
- optional concise historical evaluation where available

Do not decide detailed history depth.

### Tier 4 - Human Context

- concise parent-reported experience
- important parent observations
- optional trainer notes

### Tier 5 - Problem-Driven Deep Dive

- individual practice events
- task-level measurements
- timing
- other detailed measurement data

Detailed data should be available as deeper context when needed, not assumed to be the trainer's default attention level.

## Explicitly Out Of Scope / Rejected Directions

- continuous trainer monitoring
- proactive child surveillance
- routine mandatory practice review
- alert-driven supervision
- trainer-first analytics product
- mandatory parent practice diary
- mandatory trainer documentation
- automatic professional scoring
- automatic classification of practice quality or regularity
- automatic treatment-change suggestions
- automatic difficulty-adjustment recommendations
- system-generated clinical or therapeutic conclusions
- dashboards, screens, flows, permission models, notifications, workflows, APIs, schemas, acceptance criteria, implementation plans, or backlog items

These boundaries preserve the low-hanging-fruit, context-oriented trainer role.

## Open Question Lifecycle

No open question currently blocks Trainer Experience Discovery closure at role / perspective discovery level.

### Trainer-side information needs

Question:
What information density, aggregation, time horizons, and priorities are useful for instructors if passive visibility exists?

Source artifact:
`docs/product/discovery/cross-role-interaction-discovery.md`

Status:
Resolved for Trainer Experience Discovery / transferred for capability and UX detail

Resolution:

- density: concise context first
- aggregation: practice frequency and regularity are primary aggregated understanding
- time horizons: current task set / current practice period plus chronological task-set history
- priority: child context -> current task set -> practice frequency / regularity -> historical context -> human observations -> detailed problem-driven measurements

Transferred to:

- Trainer Connection / Visibility Discovery
- later Trainer UX work

Revisit trigger:
When Trainer Connection / Visibility Discovery or later Trainer UX starts.

Required future resolution action:
Resolve capability or UX detail for the active target, explicitly defer with a new trigger, transfer to a more specific artifact, or reject before the target round closes.

Reopen condition:
Reopen Trainer Experience Discovery only if later capability or UX work changes the reactive trainer role or the context-before-analytics hierarchy.

### Instructor visibility and connection

Question:
How should instructor visibility or connection be understood at product-principle level without becoming a trainer workflow specification?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Resolved at Trainer Experience role-perspective level / capability detail remains transferred

Resolution:

- usage is reactive
- value is rapid professional context reconstruction
- monitoring is not the goal
- information is hierarchical and problem-driven
- more information is not automatically better
- non-MVP interaction possibilities remain future exploration only

Transferred to:

- Trainer Connection / Visibility Discovery

Revisit trigger:
When Trainer Connection / Visibility Discovery starts.

Required future resolution action:
Resolve capability detail, explicitly defer with a new trigger, transfer to a more specific artifact, or reject before the target round closes.

Reopen condition:
Reopen Trainer Experience Discovery only if later work redefines the trainer as an active daily participant, continuous monitor, or owner of parent-instructor cooperation.

### Timing, personal best, and movement quality

Question:
How should timing and personal bests support motivation without distorting movement quality?

Source artifact:
`docs/product/discovery/parent-experience-discovery.md`

Status:
Resolved for Trainer Experience / remainder stays transferred

Resolution:

- timing is not a primary trainer progress metric
- timing is secondary contextual information
- professional interpretation is required
- faster does not automatically mean better
- unchanged execution time is not inherently a problem
- timing alone cannot determine difficulty or incorrect execution

Transferred to:

- Self-Comparison / Progress Quality Discovery
- Measurement / Progress Quality exploration
- Execution / Practice Support Discovery

Revisit trigger:
When Self-Comparison / Progress Quality, measurement quality, movement quality, or Execution Support becomes active.

Required future resolution action:
Resolve into product principle or concept model, explicitly defer with a new trigger, transfer to a more specific artifact, or reject before the target round closes.

Reopen condition:
Reopen Trainer Experience Discovery only if later work changes the trainer role in interpreting timing as professional context.

### Pattern qualification

Question:
Can the system later provide simple, safe, non-diagnostic pattern signals without creating false professional authority or misleading interpretation?

Source artifact:
`docs/product/discovery/trainer-experience-discovery.md`

Status:
Deferred / non-blocking

Reason for deferral:
Pattern qualification may be useful later, but it could create false professional authority if explored before trainer-side meaning, measurement validity, and UX framing are clarified.

Owner location:
`docs/product/discovery/trainer-experience-discovery.md`

Transferred to:

- Trainer Connection / Visibility Discovery, if trainer-side interpretation support becomes relevant
- Measurement / Progress Quality exploration, if the topic is about signal validity
- later UX only after product meaning is clarified

Revisit trigger:
When Trainer Connection / Visibility, Measurement / Progress Quality, or later trainer UX explores interpretation support.

Required future action:
Decide whether non-diagnostic pattern signals are safe and useful, explicitly defer with a new trigger, transfer to a more specific artifact, or reject before the target round closes.

Reopen condition:
Reopen Trainer Experience Discovery only if later work changes the boundary against automatic professional scoring or system-generated clinical conclusions.

## Discovery Outcome

Trainer Experience Discovery documents the trainer as a reactive professional context user, not a continuous monitor.

The core trainer value is rapid reconstruction of professional context and home-practice reality when attention is already directed toward a child.

Current and historical task sets are professionally meaningful because their selection, sequence, repetition counts, combinations, and changes over time may help reconstruct professional intent.

Practice frequency, regularity, distribution, and gaps provide important home-practice context.

Measured data complements parent report and trainer observation. It does not replace either.

Professional interpretation remains with the trainer.

## Related Future Work

- `Trainer Connection / Visibility Discovery`: future Product Capability Discovery for trainer-side visibility details.
- `Self-Comparison / Progress Quality Discovery`: future discovery for measurement, timing, movement quality, and interpretation safety.
- `Execution / Practice Support Discovery`: future discovery for practice execution support and measurement context.
- `Parent Practice Review & Notes Discovery`: future discovery for lightweight notes and retrospective observations.
- `MVP Boundary Synthesis`: future synthesis of which captured trainer-support capabilities belong in early product scope.
