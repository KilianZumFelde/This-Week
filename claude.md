# CLAUDE.md

## Project Brief

Weekly Focus is an Android-first personal productivity app for one primary user.

The app helps the user connect long-term goals to weekly execution through tasks, habits, reminders, stats, and a weekly carry-over ritual.

The goal is finished, working software — not a prototype, mockup, or design exploration.

---

## Start of Every Session

At the start of a new Claude Code session:

1. Read this file.
2. Read `TASKS.md` to understand current progress.
3. Read any project documents relevant to the next incomplete task.
4. Continue from the next incomplete task unless the user gives different instructions.

If the user says “continue”, use `TASKS.md` as the source for what to do next.

---

## Project Documents

Project documents live in `/docs`.

Read the relevant documents before planning or implementing work.

Expected documents include:

- TECHSTACK.md — selected technologies and technical setup
- DATABASE_DESIGN.md — database schema and data rules
- product lens.md — product intent and scope
- domain lens.md — entities and relationships
- requirements.md lens — business rules
- UX lens.md — user flows and interaction behavior
- /docs/ui — UI prototype/reference files. Navigation map.
- credentials.md
- env.md

Do not duplicate these documents inside `CLAUDE.md`.

---

## Planning Rules

When asked to create an implementation plan, create `TASKS.md`.

The plan must be split into phases.

Each phase must have:

- a clear outcome
- a list of concrete tasks
- validation steps for the tasks
- user check-ins where visual or UX review is needed
- end-of-phase admin tasks

A phase is complete only when its outcome can be verified by running code, inspecting the database, calling an API, viewing the app, or passing tests.

Do not define phases that are only abstract setup or documentation unless they are required before implementation can start.

Prefer vertical slices over large disconnected layers. A vertical slice means implementing enough frontend, backend, database, and validation for one usable piece of functionality where practical.

---

## Task Rules

Each task in `TASKS.md` must be specific enough that Claude Code can implement it without guessing the intent.

Each task should include:

- what to build or change
- where the work is likely located
- which document(s) it is based on
- how to validate it

Backend, database, AI, notification, and architecture tasks must map to:

- `TECHSTACK.md`
- `DATABASE_DESIGN.md`
- domain lens
- requirements lens

UI implementation tasks must be grounded directly in the prototype UI code files located in `/docs/ui`.

The prototype UI files are implementation reference material for:
- layout
- spacing
- hierarchy
- component structure
- interaction behavior
- visual density
- screen composition

Do not reinterpret, redesign, simplify, modernize, or replace the UI with generic component-library patterns unless explicitly requested.

The UI brief, UX lens, and navigation docs provide behavioral and conceptual guidance, but the prototype UI code is the primary implementation reference for visual/UI structure.

---

## Validation Rules

Every implementation task must have a validation method.

Use the most direct validation available. Create test data to validate where aplicable/necessary. Don´t use the users peronal information for it, use throwaway credentials.

Examples:

- API endpoint: validate with `curl` or equivalent HTTP request
- backend business logic: validate with unit tests
- database migration: apply migration and inspect schema/constraints
- TypeScript: run type checking
- frontend screen: run the Expo app and compare against `/docs/ui`
- frontend interaction: test manually in Expo Go or with component tests
- navigation: verify the route/screen transition in the app
- AI output parsing: validate with schema tests and sample inputs
- reminders/jobs: validate with controlled test records and logs

If a task cannot be validated automatically, include a manual validation step.

---

## User Check-Ins

Include user check-ins when a phase changes something the user should judge visually or experientially.

Examples:

- screen layout
- interaction behavior
- navigation flow
- wording/microcopy
- AI draft review experience
- habit/task completion behavior

The check-in should state exactly what the user should test or look at.

---

## End-of-Phase Admin Tasks

At the end of every phase, include admin tasks to:

- mark completed tasks in `TASKS.md`
- mark skipped or deferred tasks in `TASKS.md`
- record open questions in `TASKS.md`
- note what the user should test next, if applicable
- update project docs only if a real decision changed
- update `CLAUDE.md` only if repo working instructions changed, or update with a section of what packages were succesfully installed etc.

Progress tracking belongs in `TASKS.md`, not in `CLAUDE.md`.

---

## Setup Tasks

User setup requirements should be represented as tasks in `TASKS.md`.

Examples:

- install Expo Go
- create Supabase project
- create Render service
- configure environment variables
- configure Expo EAS
- configure notification credentials

Do not repeatedly ask whether a setup step is done. Check `TASKS.md` first.

## Credentials and environment
For credentials (either tokens, or user credentials or whate have you) create in the docs folder a env.md file, and a credentials.md file. 

---

## Coding Rules

Use the stack defined in `TECHSTACK.md`.

Keep changes focused.

Do not rewrite unrelated files.

Do not introduce broad abstractions before they are needed.

Do not add new libraries unless they are necessary and consistent with the tech stack.

Do not create additional architecture or planning documents unless the user asks for them.

When changing behavior, update or add validation for that behavior.

Apparently you are sandboxed. So any npm install, ask the user to do it. Also Log in a libraries.md already what we installed.

NEVER Start a new Phase without asking the user.

---

## If Blocked

If blocked, state:

- what is blocked
- why it is blocked
- the smallest decision or action needed to unblock it

Ask the user only when the decision is actually blocking implementation.

If something is unclear but not blocking, make a reasonable assumption, document it in `TASKS.md`, and continue.

---

## Out of Scope Unless Explicitly Requested

Do not add the following unless the user explicitly requests them:

- offline-first sync
- desktop web app
- staging environment
- iOS-specific optimization
- multi-agent AI architecture
- autonomous AI actions without user confirmation
- saved full AI coach transcripts
- complex analytics
- enterprise/SaaS features
- large new architecture documents

