# Cross-role Interaction Discovery

## Status

Current maturity:
Documented

Confidence:
Medium-High

Mode:
Product Discovery

## Scope

This document captures the current shared understanding of how the child, parent, and instructor roles connect within TSMT Trainer.

This is a role / perspective / cross-role interaction discovery artifact.

It is pre-UX, pre-specification, and pre-engineering.

This document does not define workflows, screens, permission models, data structures, APIs, acceptance criteria, or implementation behavior.

## Core Cross-role Problem

TSMT Trainer needs to connect the professional TSMT practice plan, parent-led home execution, and child-facing practice understanding without turning the product into a complex three-role collaboration platform.

The product should support the shared parent-child home practice experience first.

The instructor relationship matters, but it should remain secondary, background, and child-invisible at MVP direction level.

## Key Insight

The roles do not need to see the same thing or do the same work in order to be connected.

They participate in the same practice program at different levels:

- Instructor: professional plan source and passive supervisory observer
- Parent: faithful digitalizer, Program Owner, Practice Partner, and retrospective observer
- Child: participant in the understandable, visible, progress-oriented practice experience

The system connects the roles through the same underlying practice plan and practice history while keeping their responsibilities distinct.

## Primary Product Relationship

TSMT Trainer is primarily a parent-child home practice support tool.

The primary experience is the shared parent-child practice experience.

It is not primarily a three-role child-parent-instructor collaboration platform.

Instructor connection is secondary and operates in the background.

The instructor relationship should not define the child-facing experience.

The instructor connection is invisible to the child.

## Role Connection Model

### Instructor

The instructor provides the professional TSMT practice plan.

The instructor is the professional source of the plan, not an active participant in the daily parent-child practice experience.

### Parent

The parent:

- receives the normal paper-based practice plan
- faithfully digitizes that same plan
- uses the digitalized practice plan together with the child
- remains responsible for weekly practice rhythm and execution responsibility
- may add limited personal reminders and retrospective observations
- may authorize instructor visibility where a supervision relationship exists

The parent does not redesign, reinterpret, or professionally modify the instructor-provided plan.

### Child

The child performs the practice together with the parent using the digitalized plan.

The child should understand:

- the process
- the current goal
- progress
- remaining work
- positive movement toward the goal

The child should not carry scheduling responsibility or weekly-risk pressure.

### Background Supervision Connection

If a supervision / visibility relationship exists, child + parent practice activity may provide execution information and parent-visible/shared retrospective feedback to the instructor.

This connection is optional, permission-based, background, passive, and one-directional at MVP direction level.

## Practice Plan Transfer

The paper TSMT practice plan is the professional source of the home practice program.

At discovery level, the paper plan may contain:

- child / person the plan belongs to
- required weekly practice frequency
- next assessment date
- task sequence number
- simple visual task illustration
- task short name
- task instruction
- rhyme / accompanying text
- extra instruction
- repetition count

Some other information may be indirect:

- required equipment
- next task
- execution memory aid through the stick-figure illustration

This information model explains role transfer and faithful digitization. It is not a technical field specification.

### Faithful Digitization

The digital practice plan should remain semantically faithful to the paper plan.

The parent records exactly the professional plan they received.

Catalog-based or structured enrichment may make referenced information more usable, but must not change the professional meaning of the plan.

Examples of possible enrichment at product-understanding level:

- resolving a rhyme title to the full rhyme text or related reusable content
- connecting implicit equipment references to structured equipment catalog entries
- representing repetition counts in a structured way that can support practice execution

Digital enrichment is not professional reinterpretation.

Do not design catalog schemas, OCR pipelines, imports, data models, fields, APIs, or UX in this artifact.

## Role Responsibility Boundaries

The instructor owns the professional TSMT plan.

The parent owns faithful digitization, home execution responsibility, weekly practice rhythm, and the shared practice moment with the child.

The child participates in the understandable, visible, progress-oriented practice experience.

The child-facing experience should be shaped by progress understanding and shared practice, not by instructor supervision mechanics.

The parent may verify and correct their own digitalized version of the plan, but that does not make the parent a professional interpreter of the plan.

The product should focus on making digitization accurate and minimizing opportunities for input errors rather than building an instructor-parent correction and approval workflow.

Detailed digitization scope belongs to later Program Setup / Digitization Discovery.

## Parent-authored Information

Parent-added information must not modify the professional content of the instructor-defined practice plan.

Two parent-authored information types are clarified at discovery level.

### Personal Reminder

A personal reminder is a simple private reminder for the parent before or during learning.

For example, it may capture what to pay attention to after learning the exercise with the instructor.

It is not part of the professional plan itself.

### Retrospective Observation / Feedback

A retrospective observation is based on the actual experience of performing the tasks.

It may serve as a reminder for the parent and may also be made visible to the instructor.

At MVP direction level, a simple separation is enough:

- Private parent note
- Instructor-visible parent note

Do not over-design this.

The MVP is not intended to become a detailed practice diary or documentation system.

It is not realistic to assume that parents will write large amounts of task-by-task or session-by-session notes.

## Instructor Visibility Principle

Instructor connection in the MVP is:

- optional
- permission-based
- background
- passive
- one-directional visibility
- invisible to the child

If the supervision relationship exists, the instructor may passively see:

- the digitalized version of the practice plan
- task / practice execution information
- execution timing / time-related information
- practice regularity
- instructor-visible retrospective parent notes

The instructor does not actively participate in the daily parent-child practice experience.

The MVP does not include:

- in-system parent-instructor chat
- instructor reply workflow
- active parent-instructor cooperation
- instructor approval of the digitalized practice plan
- in-system correction workflow
- program negotiation workflow

If the instructor notices a digitization error, they may logically mention it outside the system, and the parent may correct the digitalized plan.

This is an indirect possible consequence of visibility, not a product goal or supported workflow.

## Weekly Rhythm Responsibility Across Roles

The parent is responsible for weekly practice rhythm and for ensuring the required practice is completed.

The application helps involve and motivate the child by making:

- the process understandable
- progress visible
- the current goal understandable
- remaining work visible
- advancement toward the goal meaningful

The desired effect is that the child participates more willingly, with less conflict and resistance, because the process and progress are understandable.

The child should understand progress meaning, but should not carry scheduling responsibility or weekly-risk pressure.

This remains consistent with the documented Progress Understanding System:

- parent owns weekly responsibility
- child can understand progress and positive movement
- no child-facing blame, shame, or schedule-pressure model
- no family calendar direction

Cross-role Interaction Discovery does not change existing Progress Understanding assumptions.

It reinforces the shared parent-child progress world, parent responsibility for weekly rhythm, child understanding without schedule pressure, and instructor as background observer rather than active participant in the child-facing progress model.

## Information Flow Summary

The cross-role information flow is:

```text
Instructor
-> professional TSMT practice plan
-> Parent
-> faithful digitalized practice plan
-> shared Parent + Child practice experience
-> practice execution information and retrospective parent notes
-> Instructor, only if optional visibility exists
```

This summary explains role relationship only. It is not a workflow, UX flow, permission model, or data model.

## Explicitly Out Of Scope / Rejected Directions

- TSMT Trainer is not primarily a three-role collaboration platform.
- Instructor connection should not become part of the child-facing experience.
- MVP does not include active in-system parent-instructor cooperation.
- MVP does not include chat or reply workflows.
- MVP does not include instructor approval of digitalized plans.
- MVP does not include a plan-correction workflow.
- The parent should not professionally reinterpret the instructor plan.
- Catalog enrichment must not change the professional meaning of the practice plan.
- The product should not become a detailed practice diary.
- The product should not become a family calendar or scheduling assistant.
- The child should not carry responsibility for managing weekly practice rhythm.
- This artifact does not design catalog schemas, OCR pipelines, imports, data models, fields, APIs, UX, screens, journeys, or acceptance criteria.

## Open Question Lifecycle

No open question currently blocks Cross-role Interaction Discovery closure.

### Trainer-side information needs

Question:
What information density, aggregation, time horizons, and priorities are useful for instructors if passive visibility exists?

Source artifact:
`docs/product/discovery/cross-role-interaction-discovery.md`

Status:
Resolved for Trainer Experience Discovery / transferred for capability and UX detail

Trainer Experience resolution:

- density: concise context first
- aggregation: practice frequency and regularity are primary aggregated understanding
- time horizons: current task set / current practice period plus chronological task-set history
- priority: child context -> current task set -> practice frequency / regularity -> historical context -> human observations -> detailed problem-driven measurements

Remaining transferred detail:
Capability and UX decisions about exact information presentation, interaction, and trainer-side visibility behavior.

Transferred to:

- Trainer Connection / Visibility Discovery
- later Trainer UX work

Revisit trigger:
When Trainer Connection / Visibility Discovery or later Trainer UX starts.

Required future resolution action:
Resolve capability or UX detail, explicitly defer with a new trigger, transfer to a more specific trainer artifact, or reject before the target round closes.

Reopen condition:
Reopen Cross-role Interaction Discovery only if later trainer work changes the background, passive, child-invisible instructor role.

### Program setup capability scope

Question:
Which parts of faithful digitization, enrichment, error prevention, and parent correction belong in early product scope?

Source artifact:
`docs/product/discovery/cross-role-interaction-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Program Setup / Digitization Discovery
- MVP Boundary Synthesis

Revisit trigger:
When Program Setup / Digitization Discovery or MVP Boundary Synthesis starts.

Required future resolution action:
Resolve the active scope boundary, explicitly defer remaining parts with a new trigger, transfer sub-questions to more precise artifacts, or mark as blocking if MVP boundary cannot be defined without it.

Reopen condition:
Reopen Cross-role Interaction Discovery only if later setup work changes the faithful digitization principle or gives the parent a professional reinterpretation role.

### Parent note capability scope

Question:
What lightweight private and instructor-visible note support is useful without turning the product into a detailed practice diary?

Source artifact:
`docs/product/discovery/cross-role-interaction-discovery.md`

Status:
Transferred / non-blocking

Transferred to:

- Parent Practice Review & Notes Discovery
- Trainer Connection / Visibility Discovery

Revisit trigger:
When Parent Practice Review & Notes Discovery or Trainer Connection / Visibility Discovery starts.

Required future resolution action:
Resolve into product understanding for lightweight notes, explicitly defer with a new trigger, transfer to a more specific artifact, or reject before the target round closes.

Reopen condition:
Reopen Cross-role Interaction Discovery only if later note work changes the boundary between private parent reminders and instructor-visible retrospective observations.

## Discovery Outcome

Cross-role Interaction Discovery documents TSMT Trainer as primarily a parent-child home practice support tool.

The instructor provides the professional plan and may have optional passive background visibility, but does not define the child-facing experience.

The parent faithfully digitizes the instructor-provided plan, uses it with the child, remains responsible for weekly practice rhythm, and may add limited personal reminders or retrospective observations.

The child participates in an understandable, visible, progress-oriented practice experience without carrying scheduling responsibility or weekly-risk pressure.

The roles are connected through the same underlying practice plan and practice history while their responsibilities remain distinct.

## Related Future Work

- `Trainer Connection / Visibility Discovery`: future Product Discovery for instructor-side visibility details.
- `Trainer Experience Discovery`: future Product Discovery for therapist/trainer perspective and priorities.
- `Program Setup / Digitization Discovery`: future Product Capability Discovery for faithful plan digitization and error prevention.
- `Parent Practice Review & Notes Discovery`: future Product Capability Discovery for lightweight private and instructor-visible note support.
- `MVP Boundary Synthesis`: future synthesis of which captured capabilities belong in early product scope.
