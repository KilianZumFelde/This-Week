# CLAUDE.md

## Project Brief

<!-- Replace with a 2-4 sentence description of this project: what it is, who it's for, what problem it solves. -->

The goal is finished, working software — not a prototype, mockup, or design exploration.

The project runs in two modes: an initial from-scratch build, then incremental releases on top of it. The line below states the active mode.

**Current work:** Initial build

---

## Start of Every Session

At the start of a new Claude Code session:

1. Read this file.
2. Check **Current work** above.
   - If it names a release, the work order is `/docs/releases/release-N/TASKS.md`.
     If that file does not exist yet, your first action is to create it per the
     Planning Rules (from the release's delta lenses, UI brief, and `/docs/ui`) —
     do NOT fall back to the root `TASKS.md`.
   - If it says "Initial build", the work order is the root `TASKS.md`.
3. Read that TASKS.md. Completed tasks are already built; continue from the next incomplete one.
4. Read any documents the next task names before implementing.

Do not infer overall project state by reasoning about the docs. The active TASKS.md is the source of what is done and what is next — completed = built, the rest is the work order.

If the user says "continue", use the active TASKS.md.

---

## Project Documents

The main documents in `/docs` are the baseline source of truth — they describe the app as last shipped. If they don't exist yet, that's expected pre-discovery; run the appropriate discovery/architecture skill to produce them rather than guessing their contents.

Each release adds a folder `/docs/releases/release-N/` containing that release's delta lenses, UI brief, and TASKS.md. During a release, the main docs describe the baseline, the release folder describes what that release changes, and the release's TASKS.md tracks what is built so far.

Read the relevant documents before planning or implementing work.

Expected documents include:

- TECHSTACK.md — selected technologies and technical setup
- DATABASE_DESIGN.md — database schema and data rules
- product lens.md — product intent and scope
- domain lens.md — entities and relationships
- requirements lens.md — business rules
- UX lens.md — user flows and interaction behavior
- /docs/ui — UI prototype/reference files. Navigation map.
- credentials.md
- env.md

Do not duplicate these documents inside `CLAUDE.md`.

---

## Planning Rules

When asked to create an implementation plan: for the initial build, create the root `TASKS.md`; for a release, create `TASKS.md` inside that release's folder, built from the release's delta plus the existing lenses and real `/docs/ui` code as integration context.

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

**Ground every task in real code before writing it.** Do not name a file in a task without having read it. The lenses and `/docs/ui` tell you *what* to build; reading the actual target files tells you *where it goes and what it collides with*. A plan written from the docs alone is a guess. For any change to a flow (navigation, a job, a scheduled ritual, a trigger), trace the existing mechanism end-to-end first and list every gate it passes through — route registration, navigation guards / allow-lists, conditional creation, preconditions — and confirm the new feature's precondition actually fires (e.g. *does the trigger even run in this case?*).

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

### UI source of truth

`/docs/ui` always represents the **target** design — the full current UI including any in-progress release's screens. It is ahead of the running app during a release.

The release's UI brief (in the release folder) states what is new or changed in `/docs/ui` versus the last shipped version, and therefore which app screens need to be built or updated to match it.

So: `/docs/ui` = what the app should look like. The UI brief = what changed and which code to update to get there. Build the app code to match `/docs/ui`, scoped by the brief.

<!-- If the UI prototype is built in a different stack than the shipping app (e.g. web prototype vs. native app), state the translation rule here explicitly: what maps 1:1, what must be re-expressed in the target stack's idioms, and what to precompute (colors, gradients, etc.) that the target stack can't express natively. Without this, "port the design" is ambiguous. -->

---

## Validation Rules

Every implementation task must have a validation method.

Use the most direct validation available. Create test data to validate where applicable/necessary. Don't use the user's personal information for it — use throwaway credentials.

Examples:

- API endpoint: validate with `curl` or equivalent HTTP request
- backend business logic: validate with unit tests
- database migration: apply migration and inspect schema/constraints
- TypeScript: run type checking
- frontend screen: run the app and compare against `/docs/ui`
- frontend interaction: test manually or with component tests
- navigation: verify the route/screen transition in the app
- AI output parsing: validate with schema tests and sample inputs
- reminders/jobs: validate with controlled test records and logs

If a task cannot be validated automatically, include a manual validation step.

**Validate as much as you can yourself before handing back, and tell the user exactly what you need when you genuinely can't.** Do not pre-emptively declare something "user-only" — first check `docs/credentials.md` and `docs/env.md` for test users, tokens, and keys that unlock self-validation. Reserve the user for what truly needs them — rendered-pixel fidelity, touch/transition feel on a device, and explicit sign-off on risky actions. Prefer extracting pure functions (mappings, validators, derivations) so logic is unit-testable cheaply.

---

## User Check-Ins

Include user check-ins when a phase changes something the user should judge visually or experientially.

Examples:

- screen layout
- interaction behavior
- navigation flow
- wording/microcopy
- AI draft review experience
- any core completion/interaction behavior

The check-in should state exactly what the user should test or look at.

---

## End-of-Phase Admin Tasks

At the end of every phase, include admin tasks to:

- mark completed tasks in `TASKS.md`
- mark skipped or deferred tasks in `TASKS.md`
- record open questions in `TASKS.md`
- note what the user should test next, if applicable
- update project docs only if a real decision changed
- update `CLAUDE.md` only if repo working instructions changed, or update with a note on what packages were successfully installed, etc.

Progress tracking belongs in `TASKS.md`, not in `CLAUDE.md`.

---

## Setup Tasks

User setup requirements should be represented as tasks in `TASKS.md`.

Examples:

- install a required dev tool or emulator
- create accounts/projects with third-party services (database, hosting, etc.)
- configure environment variables
- configure build/deploy tooling
- configure notification credentials

Do not repeatedly ask whether a setup step is done. Check `TASKS.md` first.

## Credentials and environment

Two files in `/docs` manage project config:

- `credentials.md` — **secrets only**: API keys, passwords, tokens, private keys, deploy hooks. Never committed. Listed in `.gitignore`.
- `env.md` — everything non-secret: environment variable names, instructions, public/publishable keys, service names, account identifiers, project URLs, repository URL. Safe to commit.

**What goes where:**

| Belongs in `credentials.md` | Belongs in `env.md` |
|-----------------------------|---------------------|
| Service role / secret keys | Publishable / anon keys |
| Passwords | Project URLs |
| Private API keys | Service names |
| Deploy hook URLs | Account emails |
| Push/notification secrets | Repository URL |

When adding new config: if it would cause harm if exposed, it goes in `credentials.md`. If it can be public, it goes in `env.md`.

When adding new credentials: put the secret value in `credentials.md`, put the variable name and usage instructions in `env.md`.

---

## Coding Rules

Use the stack defined in `TECHSTACK.md`.

Keep changes focused.

Do not rewrite unrelated files.

Treat shipped code and the baseline lenses as current reality. Do not redesign, simplify, or rebuild existing work to accommodate a new feature unless the release delta explicitly calls for it.

Do not introduce broad abstractions before they are needed.

Do not add new libraries unless they are necessary and consistent with the tech stack.

Do not create additional architecture or planning documents unless the user asks for them.

When changing behavior, update or add validation for that behavior.

If Claude Code is sandboxed and can't run installs itself, ask the user to run any `npm install`/equivalent, and log what was installed in a `libraries.md`.

NEVER start a new phase without asking the user.

---

## Releases: Fold-Back

Every release's final phase folds its work into the baseline so the main docs become current again:

- merge the release's delta lenses into the main lenses in `/docs`
- keep the release folder as a dated archive (do not delete)

<!-- If the UI comes from a design export that's already current (as opposed to something Claude must fold back manually), note that here. Otherwise remove this caveat. -->

Until the lens fold-back runs, the main lenses remain the pre-release baseline.

---

## Fixing Bugs

When the user tests and detects bugs and gives you a list of bugs, do the following:
1) Analyze what the cause is
2) Create a plan to fix it
3) Only after the plan, do the fix
4) Where possible, validate the fix yourself — use curl for API changes, read the relevant code to confirm logic is correct, or run a type check. Only hand back to the user for validation that genuinely requires the running app (visual layout, touch interactions, device behavior).

---

## If Blocked

If blocked, state:

- what is blocked
- why it is blocked
- the smallest decision or action needed to unblock it

Ask the user only when the decision is actually blocking implementation.

If something is unclear but not blocking, make a reasonable assumption, document it in `TASKS.md`, and continue.

---

## Git: Committing and Pushing

<!-- Fill in the actual OS/shell this project runs on, and any path quirks that trip up commits (e.g. paths with parentheses/spaces on Windows/PowerShell). Remove this block entirely if not relevant. -->

<!-- Fill in the actual deploy target and trigger, if any (e.g. "pushing to main auto-deploys via X, live at Y"). Remove if not relevant. -->

---

## Out of Scope Unless Explicitly Requested

<!-- List categories of work this project intentionally excludes by default (e.g. offline-first sync, multi-tenant/SaaS features, platform ports, autonomous AI actions, complex analytics) so Claude doesn't scope-creep into them without being asked. Replace with this project's actual boundaries. -->
