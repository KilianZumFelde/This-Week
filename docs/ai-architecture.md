# AI Architecture

## Overview

AI in Weekly Focus is a **thin, backend-mediated assist layer** over a manual-first
productivity app — never an autonomous actor. Its job is to turn the user's natural-language
input into structured drafts the user reviews and confirms; the app, not the model, owns every
write. The guiding principle is the standing project rule: **no autonomous AI actions without
user confirmation.** All AI runs server-side through Anthropic; the API key never reaches the
device.

This document was backfilled from the shipped implementation in `backend/src/routes/ai.ts` —
it describes the AI as actually built at the v1 baseline. Release-scoped changes live in
`/docs/releases/release-N/ai-architecture.md`.

## Provider and Models

- **Provider:** Anthropic (`@anthropic-ai/sdk`, backend only).
- **Primary model:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) — the capture workhorse. $3 / $15
  per million input / output tokens. Good extraction quality at reasonable cost.
- **Secondary model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — used only for the
  narrow, high-volume reminder-parsing step where speed and cost matter more than nuance.
  $1 / $5 per million tokens, ~3× faster.

  > Note: the codebase pins the dated Haiku ID `claude-haiku-4-5-20251001`. The bare alias
  > `claude-haiku-4-5` resolves to the same model and is preferred for new code.

Business framing: Sonnet is the default for anything the user sees and reviews (task/habit
drafts); Haiku is reserved for the mechanical "phrase → datetime" conversion behind reminders,
where its lower writing quality doesn't matter.

## Integration Pattern

- **Location:** Backend only (Fastify routes under `/ai/*`).
- **Reason:** The `ANTHROPIC_API_KEY` stays on the server (Render env var); cost and rate limits
  are controlled centrally; the app talks only to our own REST endpoints.
- **API key handling:** `process.env.ANTHROPIC_API_KEY`, never shipped to the Expo app. The app
  sends the user's transcript/text + minimal context to the backend, which calls Anthropic.

## Use Cases

### Voice/text capture → structured task or habit

- **Trigger:** User dictates or types a capture (the "+" quick-add / voice overlay). App calls
  `POST /ai/capture` with the transcript + context (themes, active primary goal, timezone).
- **Input:** The raw transcript plus a compact context block — the user's themes (id + name +
  color), the active primary goal (id + title), and timezone. Deliberately **not** sent: full
  task/habit history, other goals, any historical transcripts.
- **Output:** Structured — one or more `CaptureItem`s (`item_type` task|habit, title, theme_id,
  effort/return level, week_assignment, weekly_target, goal_id, optional reminder_spec, and
  `confidence_flags` naming fields the model was unsure about).
- **Output schema:** Enforced two ways — Anthropic **tool use** with a forced
  `tool_choice: {type: 'tool', name: 'capture_items'}` (the `CAPTURE_TOOL` JSON schema), then
  **Zod** (`CaptureOutputSchema`) validation of `tool_use.input` on the backend.
- **Validation:** If there's no `tool_use` block, or Zod rejects the shape → throw → 422. The app
  never receives an unvalidated draft.
- **User confirmation required:** **Yes.** The endpoint returns drafts only; the user reviews and
  taps to save. Nothing is written to the database by this endpoint (it only writes a metadata
  row to `ai_capture_logs`).
- **Failure behavior:** On any error (no tool use, schema failure, API error) the route logs the
  failure to `ai_capture_logs` (`success=false`, `error_code`) and returns HTTP 422; the app keeps
  the user's input and surfaces a retry. No partial/garbage draft is shown.
- **Streaming:** No — batch (single `messages.create`, `max_tokens: 1024`). The user waits for a
  complete reviewable draft, so batch is correct.
- **Estimated cost per call:** ~$0.005–0.01 (short system context + short transcript in, a few
  hundred output tokens). Negligible at single-user volume.

### Natural-language reminder parsing → ReminderSpec

- **Trigger:** User types a reminder phrase ("tomorrow 9am", "every Monday until done") when
  adding a reminder to a task. App calls `POST /ai/parse-reminder` with the text + timezone.
- **Input:** The reminder phrase and the user's timezone. The backend passes the *current local
  time* (no UTC suffix) into the prompt so the model can resolve relative references without
  doing offset math; the backend then converts the model's local datetime to UTC via `localToUTC`.
- **Output:** Structured — `{kind: one_shot|recurring_until_done, scheduled_for, recurrence_rule}`
  (RRULE string for recurring). Via the forced `parse_reminder` tool.
- **Validation:** If no `tool_use`, or both `scheduled_for` and `recurrence_rule` are null
  (input wasn't a time reference) → 422 `unparseable`.
- **User confirmation required:** **Yes** — the parsed reminder is shown to the user before the
  reminder is created; the user can edit it.
- **Failure behavior:** 422 (`unparseable` / `parse_failed`); the user can re-phrase or set the
  reminder manually.
- **Streaming:** No — batch (`max_tokens: 256`).
- **Estimated cost per call:** ~$0.001–0.002 (Haiku, tiny prompt). Negligible.

### Goal task-suggestion assist ("Anything to add?") — Release 1

- **Trigger:** During the Sunday triage **goal step → Plan** sub-screen, after the user has been shown the goal's own existing open/backlog tasks, they may tap a quiet **"Anything to add?"** button. Only then does the app call `POST /ai/suggest-goal-tasks`. The assist is **never** invoked automatically and **never** before the user's own tasks are shown — both are hard requirements.
- **Input:** A compact goal-planning context: the goal (title, `why`, `target_date`, `health_level`), its **nearest upcoming milestone** (title + date), the goal's **existing this-week + open/backlog task titles** (so the model suggests *additional*, non-duplicate tasks), the user's themes (id + name). Deliberately **not** sent: unrelated goals, full task history beyond this goal, stats, any stored health-record history.
- **Output:** Structured — a short list of **suggested task drafts**, each `{title, theme_id?, effort_level?, return_level?}`. Suggestions are *additions toward the goal*, pre-linkable to the goal and defaulted to this week, but **nothing is created** by the model.
- **Output schema:** Anthropic **tool use** with a forced `tool_choice` on a `suggest_goal_tasks` tool, then **Zod** validation of the tool input on the backend before returning. Reuses the existing task-draft field conventions (effort/return enums, theme_id) so the app's confirm-card UI is consistent with capture.
- **Validation / soft-fail:** No `tool_use` block, or Zod rejection, or an empty list → return `{ items: [] }` cleanly (the assist is optional). Never return an unvalidated draft. **This differs from capture**: capture fails to 422; goal-suggest fails soft (no suggestions shown, rest of triage unaffected).
- **User confirmation required:** Yes — each suggested task renders as a draft card that requires an **explicit confirm tap** before it becomes a real task (inherits the standing "never auto-save AI output" rule).
- **Failure behavior:** Soft. On any AI error/timeout/empty result the Plan screen shows no suggestions; the rest of the triage goal step is completely unaffected. AI being down must never block the mandatory Sunday ritual.
- **Streaming:** No — batch. The user taps and waits for a small reviewable set of draft cards.
- **Model:** **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — same as capture.
- **Estimated cost per call:** ~$0.01. Invoked at most a few times per Sunday, per goal — negligible at single-user volume.

### Goal coach ("Coach me") — dropped, button removed

- The Goal coach feature was **dropped from scope (2026-05-24)** and the non-functional **"Coach me"**
  button was **removed from the Goals tab (2026-06-18)**. There is **no backend route, prompt, or model**
  wired to it. If it is ever revived it must follow the same rules: backend-only, structured/validated,
  user-confirmed, with a defined failure path. Documented here so the gap is explicit, not
  silently assumed-built.

## Prompt Architecture

- **System prompt location:** In code (`backend/src/routes/ai.ts`) — `buildSystemPrompt()` for capture, an inline template string for reminder parsing, and a per-request builder for the goal-suggestion route. No external markdown prompt files.
- **Templating:** The capture system prompt is built per-request from the user's themes, primary goal, timezone, and current time. The reminder prompt interpolates the current local time. The goal-suggestion prompt is built from the goal/milestone/existing-tasks/themes context.
- **Versioning:** Prompts are versioned with the code (git). No runtime prompt store.
- **Who can change them:** Developers, via a code change + deploy.

## Structured Output and Validation

- Every AI-to-app flow uses **Anthropic tool use with forced `tool_choice`** to constrain shape, then **Zod** to validate on the backend before returning.
- On validation failure: **capture and reminder parsing fail fast to 422** (user retries or acts manually). The **goal-suggestion assist fails soft** — invalid/missing tool-use returns `{ items: [] }` (no suggestions shown, triage continues). This distinction is intentional: capture is user-initiated with a direct retry path; goal-suggest is optional and must never block the Sunday ritual.
- A single-retry-with-the-validation-error-fed-back step is a reasonable future hardening but is not implemented today — documented so the absence is intentional, not overlooked.

## Tool Use / Function Calling

- Tools are used **only** as the structured-output mechanism (`capture_items`, `parse_reminder`, `suggest_goal_tasks` — Release 1), not to give the model agency. The model never calls back into the app, reads the database, or takes actions. No multi-step agent loop.

## Caching Strategy

- **None today.** Each call sends a freshly-built, per-request system prompt (it embeds the
  current timestamp and the user's live theme/goal context), so there is no stable cacheable
  prefix, and at single-user volume there's nothing to amortize. Anthropic prompt caching also
  has a minimum cacheable prefix (~2K tokens on Sonnet 4.6, ~4K on Haiku 4.5) that these short
  prompts fall under. If a future high-volume, fixed-prefix use case appears, revisit.

## Error Handling and Fallbacks

- **Timeout/retry:** Relies on the Anthropic SDK defaults (it auto-retries 429/5xx with backoff).
  No custom timeout is set on these calls.
- **Fallback UX:** Every use case fails closed to an HTTP 422 with the user's input preserved
  client-side; the user retries or does the action manually. AI being wrong, slow, or down never
  blocks the core manual flow.
- **No silent writes on failure:** failures are logged (capture) and surfaced; nothing is saved.

## Cost Management

- Single primary user. **No hard cap**; monitor spend in the Anthropic console. Expected spend is
  cents/month given the volume (a handful of captures + reminder parses per day). Model choice
  (Sonnet for capture, Haiku for reminders) already keeps per-call cost minimal.

## Data Sensitivity

Per-field intent for what the backend sends to Anthropic:

| Field | Sent? | Notes |
|---|---|---|
| Capture transcript / reminder text | **Sent** | The user's own words — required for the task. |
| Theme names + ids, primary goal title + id | **Sent** | Needed for accurate theming/linking. Low sensitivity (the user's own labels). |
| Timezone / current local time | **Sent** | Needed for date resolution. |
| Goal `why` (motivation text) | **Sent (goal-suggest, Release 1)** | More personal/reflective than capture's inputs, but needed for relevant suggestions. Backend-only, not stored. |
| Goal title, target date, `health_level`, nearest milestone | **Sent (goal-suggest, Release 1)** | Planning context for relevance. |
| The goal's existing task titles | **Sent (goal-suggest, Release 1)** | Required so suggestions are *additional* and non-duplicate. |
| Full task/habit history, other goals, stats | **Never sent** | Not needed; keeps the prompt minimal and the surface small. |
| Health-record history, raw transcripts | **Never sent / never stored** | Same stance as baseline. |
| Auth tokens, user id, email | **Never sent** | Stay server-side; AI calls are scoped by the authenticated session, but identity is not part of any prompt. |
| Raw AI transcripts/responses | **Never stored** | `ai_capture_logs` is metadata-only by design (see DB doc). |

## Logging and Observability

- **`ai_capture_logs`** (DB): metadata only per capture — `input_type`, `output_type`, `success`,
  `error_code`, optional `created_record_id`, timestamp. **No** raw transcript, prompt, or model
  response is stored (matches the baseline DB "metadata only" decision).
- Reminder parsing is **not** logged to a table today (only standard Render request logs).
- Deliberately **not** logged anywhere: full prompts, full model responses, token counts.

## Open Questions

- Should validation do a **single retry** (feed the Zod error back to the model) before failing to
  422? Not implemented; low priority at current quality/volume.
- The **goal coach** is unbuilt — its architecture (model, prompt, whether it streams, transcript
  retention) is deferred until it's actually scoped. The standing rule is "no saved full AI coach
  transcripts" unless explicitly requested.
