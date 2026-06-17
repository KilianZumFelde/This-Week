# AI Architecture — Release 1 delta

Scoped AI changes for **Release 1 — "Goals drive the week."** Only new/changed sections are
included; section headings mirror the baseline `/docs/ai-architecture.md`. Everything not listed
here (provider, integration pattern, the capture and reminder-parsing use cases, logging,
fallback philosophy) is unchanged.

This release adds **one** AI use case: the bounded "Anything to add?" task-suggestion assist
inside the new Sunday-triage goal step (Plan sub-screen). It introduces **no new provider, no new
model, and no new integration location** — it reuses the existing backend-only Anthropic setup.

## Use Cases

### Goal task-suggestion assist ("Anything to add?") — NEW

- **Trigger:** During the Sunday triage **goal step → Plan** sub-screen, after the user has been
  shown the goal's own existing open/backlog tasks, they may tap a quiet **"Anything to add?"**
  button. Only then does the app call a new backend route (e.g. `POST /ai/suggest-goal-tasks`).
  The assist is **never** invoked automatically and **never** before the user's own tasks are
  shown — both are hard requirements from the release requirements lens.
- **Input:** A compact goal-planning context: the goal (title, `why`, `target_date`,
  `health_level`), its **nearest upcoming milestone** (title + date, as framing), the goal's
  **existing this-week + open/backlog task titles** (so the model suggests *additional*, non-
  duplicate tasks), the user's themes (id + name), and optionally the user's answers to a couple
  of clarifying questions the assist may ask ("anything missing?"). Deliberately **not** sent:
  unrelated goals, full task history beyond this goal, stats, any stored health-record history.
- **Output:** Structured — a short list of **suggested task drafts**, each `{title, theme_id?,
  effort_level?, return_level?}`. Suggestions are *additions toward the goal*, pre-linkable to the
  goal and defaulted to this week, but **nothing is created** by the model.
- **Output schema:** Same mechanism as the baseline capture flow — Anthropic **tool use** with a
  forced `tool_choice` on a `suggest_goal_tasks` tool, then **Zod** validation of the tool input
  on the backend before returning. Reuse the existing task-draft field conventions (effort/return
  enums, theme_id) so the app's confirm-card UI is consistent with capture.
- **Validation:** No `tool_use` block, or Zod rejection, or an empty list → treat as "no
  suggestion" and return cleanly (the assist is optional). Never return an unvalidated draft.
- **User confirmation required:** **Yes — and this is the core constraint of the feature.** Each
  suggested task renders as a draft card that requires an **explicit confirm tap** before it
  becomes a real task (inherits the standing "never auto-save AI output" rule). The AI is
  explicitly **never the primary source** of the plan and **never auto-creates** tasks
  (requirements lens, hard rule).
- **Optional clarifying turn:** The assist *may* ask a couple of lightweight clarifying questions
  before suggesting ("anything you're missing this week?"). Keep this to **at most one short
  follow-up turn** — it is a planning nudge, not a chat. If implemented as a second model call,
  it reuses the same route/model; if the product ships single-shot first, the clarifying turn is a
  deferrable enhancement, not a blocker.
- **Failure behavior:** The assist fails **soft**, not hard. On any AI error/timeout/empty result
  the Plan screen simply shows no suggestions (e.g. a quiet "couldn't suggest right now — add
  tasks yourself"); the rest of the triage goal step (Reflect health answers, tap-to-add existing
  tasks, the "+" FAB) is completely unaffected. AI being down must never block the mandatory
  Sunday ritual.
- **Streaming:** No — batch. The user taps and waits for a small reviewable set of draft cards;
  batch matches the draft-review pattern (same as capture).
- **Model:** **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — same as capture. This is user-facing,
  judgment-laden suggestion writing where quality matters; Haiku is not appropriate here.
- **Estimated cost per call:** ~$0.01 (goal context + a handful of existing task titles in, a few
  short task drafts out; `max_tokens` on the order of ~512). Invoked at most a few times per
  Sunday, per goal — negligible at single-user volume.

## Prompt Architecture

- One new system-prompt builder for the goal-suggestion route, alongside the existing capture and
  reminder builders in `backend/src/routes/ai.ts` (or a sibling route file). Built per-request from
  the goal/milestone/existing-tasks/themes context. Same in-code, git-versioned approach as the
  baseline — no external prompt store.

## Structured Output and Validation

Unchanged approach (tool use + forced `tool_choice` + Zod). One addition: because this assist is
**optional and soft-failing**, an empty or invalid result is a normal "no suggestions" outcome
(not a 422 error the user must act on) — distinct from the capture flow, which fails to 422.

## Data Sensitivity

Delta from the baseline table — this use case sends slightly more reflective context than capture:

| Field | Sent? | Notes |
|---|---|---|
| Goal `why` (the user's motivation text) | **Sent (new)** | More personal/reflective than capture's inputs, but needed for relevant suggestions. Backend-only, not stored. |
| Goal title, target date, `health_level`, nearest milestone | **Sent (new)** | Planning context for relevance. |
| The goal's existing task titles | **Sent (new)** | Required so suggestions are *additional* and non-duplicate. |
| The user's clarifying answers (if asked) | **Sent (new)** | Only the brief planning answers; not a transcript. |
| Health-record history, other goals, stats, raw transcripts | **Never sent / never stored** | Same stance as baseline. |

## Logging and Observability

- Optional: reuse the `ai_capture_logs` pattern (metadata only — success/fail, error code, count of
  suggestions) if any observability is wanted for this route, or rely on Render request logs.
  **Do not** store the goal `why`, the suggested task text, or any prompt/response body —
  consistent with the baseline metadata-only rule and the standing "no saved AI transcripts" stance.

## Open Questions

- Ship **single-shot** (suggest immediately on tap) first, or include the **clarifying-question
  turn** from day one? Single-shot is the simpler, safe default; the clarifying turn is a bounded
  enhancement. Decide at implementation time based on how the Plan screen feels.
- Whether to log this route to `ai_capture_logs` at all, or leave it to Render logs (low stakes,
  single user).
