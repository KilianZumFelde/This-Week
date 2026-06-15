# CLAUDE.md

## Project Brief

Weekly Focus is an Android-first personal productivity app for one primary user.

The app helps the user connect long-term goals to weekly execution through tasks, habits, reminders, stats, and a weekly carry-over ritual.

The goal is finished, working software — not a prototype, mockup, or design exploration.

The project runs in two modes: an initial from-scratch build, then incremental releases on top of it. The line below states the active mode.

**Current work:** Initial build

---

## Start of Every Session

At the start of a new Claude Code session:

1. Read this file.
2. Check **Current work** above.
   - If it names a release, the work order is `/docs/releases/release-N/TASKS.md`.
   - If it says "Initial build", the work order is the root `TASKS.md`.
3. Read that TASKS.md. Completed tasks are already built; continue from the next incomplete one.
4. Read any documents the next task names before implementing.

Do not infer overall project state by reasoning about the docs. The active TASKS.md is the source of what is done and what is next — completed = built, the rest is the work order.

If the user says "continue", use the active TASKS.md.

---

## Project Documents

The main documents in `/docs` are the baseline source of truth — they describe the app as last shipped.

Each release adds a folder `/docs/releases/release-N/` containing that release's delta lenses, UI brief, and TASKS.md. During a release, the main docs describe the baseline, the release folder describes what that release changes, and the release's TASKS.md tracks what is built so far.

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
| FCM / push secrets | Repository URL |

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

Apparently you are sandboxed. So any npm install, ask the user to do it. Also Log in a libraries.md already what we installed.

NEVER Start a new Phase without asking the user.

---

## Releases: Fold-Back

Every release's final phase folds its work into the baseline so the main docs become current again:

- merge the release's delta lenses into the main lenses in `/docs`
- keep the release folder as a dated archive (do not delete)

The UI (screens + navigation) comes from the design export and is already current in `/docs/ui`; it needs no fold-back. Until the lens fold-back runs, the main lenses remain the pre-release baseline.

---

## Fixing Bugs
When the user tests and detects bugs and gives you a list of bugs do the following:
1) Analyze, what the cause is
2) create a plan to fix it
3) only after the plan, do the fix
4) where possible, validate the fix yourself — use curl for API changes, read the relevant code to confirm logic is correct, or run a type check. Only hand back to the user for validation that genuinely requires the running app (visual layout, touch interactions, device behavior).

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

This project runs on **Windows with PowerShell**. The Bash tool is available but should NOT be used for git commits — it chokes on parentheses in file paths like `app/app/(tabs)/backlog.tsx`.

**Always use the PowerShell tool for all git operations.**

### Staging files with parentheses in paths

Quote any path that contains `(` or `)`:

```powershell
git add "app/app/(tabs)/backlog.tsx"
```

Unquoted paths like `app/app/(tabs)/backlog.tsx` cause PowerShell to treat `(tabs)` as a sub-expression and throw a `CommandNotFoundException`.

### Commit message syntax

Use a PowerShell here-string (`@'...'@`) for multi-line commit messages. The closing `'@` must be at column 0:

```powershell
git commit -m @'
feat(p5): short summary line

- bullet one
- bullet two

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Do NOT use the Bash `$(cat <<'EOF'...'EOF')` pattern — it fails in PowerShell.

### Push

```powershell
git push origin main
```

Render auto-deploys on push to `main`. The backend is live at `https://this-week.onrender.com`.

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
