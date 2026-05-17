# Product Lens — Discovery Record

**Date**: 2026-05-14
**Lens**: Product & Business

---

## Lens Summary

### Problem
Long-term goals slip out of focus because weekly noise dominates day-to-day decisions; high-leverage / low-effort actions get procrastinated indefinitely; the user "drifts" — months pass without measurable progress toward where they want to be. User's own framing: *"I suddenly find myself looking back that another 3 months passed, and I am not nearer to my goal, or where I would want to be. And I also don't tend to take my time to actually define where I would like to be when. So it feels that I am roaming a bit aimlessly."*

Two distinct dimensions:
1. **Long-term anchoring** — keep goals tethered to weekly action so they don't fade into the background.
2. **Recurring discipline** — habits force ongoing work on areas the user wants to change (gym, bachata, CV-writing for job change, etc.).

### Primary User
Solo personal use — the app's author. Mobile-first (uses phone, not desktop). Currently has no structured system; tried paper (good visibility, breaks down with scale and change), Trello (desktop friction stopped daily use), most apps (too noisy, force date/time discipline the user can't sustain).

### Current Workaround
Makeshift PWA with voice → speech-to-text → AI-parsed task creation. Captures well but lacks the structure (themes, goals, statistics, streaks, effort/return) the user needs to actually drive progress.

### Success Criteria (v1, ~3 months in)
1. Can name top milestone + next 3 actions toward it without thinking.
2. No longer feels "drifting" — clear sense of what they're working toward and why.
3. Doing more high-return / low-effort tasks instead of letting them rot (e.g., the DJ-contact example).
4. Feeling of being "on track" — steadily doing the things tied to the goal.

### In Scope for v1
- Tasks (weekly + backlog with "this week vs. later" split)
- Habits (weekly recurring with count target, e.g., 4/4 gym)
- Configurable themes (DJ career, fitness, job change, bachata, etc.)
- Statistics (weekly raw counts: tasks done + habits on target, as plain fractions; streaks; past-week history — no per-theme breakdown, goal-centric not theme-centric)
- Goals/milestones — primary + secondary, with target dates (mandatory)
- Effort/return on tasks (lightweight chips)
- Reminders (one-shot for tasks; smart-nudge for habits in "danger zone")
- AI-natural-language reminder configuration ("remind me to X at Y")
- Voice input + AI-parsed task & habit creation
- Past-week browsing
- Carry-over of unfinished tasks (explicit triage, not auto)
- AI Coach for goal definition and review
- Hard cap: max 1 primary + max 2 secondary goals at any time

### Out of Scope for v1
- Cross-device sync (mobile-only first)
- Calendar integration (user rejected date/time discipline)
- Sharing / accountability partner (solo)
- Sub-tasks / task hierarchy ("no Jira")
- Time tracking (out of problem scope)
- Backup / export UI (data must be exportable later, but no UI in v1)

### Cross-Lens Flags Raised
- Mobile-first → UI
- No mandatory date/time on tasks → Requirements (hard constraint)
- Habits roughly the same every week → Domain (recurring lifecycle)
- "Right there in my face" default → UX
- Anti-Jira / anti-noise minimal feel → UI + UX
- Lightweight goal↔task linkage → UX (one-tap, not a form)
- Voice + AI input → UX (input modality) + Requirements (AI-parsing rules)
- Backlog "this week vs. later" → Domain (task lifecycle state)
- AI-text-configured reminders → Requirements + UX
- Max 1 primary + max 2 secondary goals → Requirements (hard cap)
- Habit reminders only when "in danger zone" → Requirements (derived nudge rule)

---

## Q&A

- **Q1: Real problem behind the feature?**
  A: Spot-on. User added: *"I suddenly find myself looking back that another 3 months passed, and I am not nearer to my goal. I don't tend to take my time to actually define where I would like to be when. So it feels that I am roaming a bit aimlessly. And the habits is also nice because it forces me to keep working on certain things that I want to change (going to the gym, bachata, writing CVs for job change etc.)."*

- **Q2: Current workaround?**
  A: Nothing structured. Most apps are too noisy and force date/time. Has used Trello — desktop friction was too high; user is mobile-first. Tried paper — liked visibility ("right there in my face") but breaks down on change/space. Currently has makeshift PWA with voice input + AI-parsed task creation.

- **Q3: What does success look like in 3 months?**
  A: Picked #1 (name milestone + 3 actions), #2 (no drifting), #3 (doing high-return/low-effort), and added #4 ("actually on track and doing the things I need to do"). Plus added a critical constraint: *"I don't want to have a configuration/planning nightmare. It must be easy, simple. I don't want a freaking Jira."*

- **Q4: Scope boundaries for v1?**
  A: Flipped reminders to IN (with AI-natural-language config for ease). Everything else in the default exclusion list stays OUT. Added two important inclusions: **backlog of tasks** with this-week-vs-later split, and **voice + AI-parsed input** (already part of existing PWA workflow). Made clear: ease of use is the key principle, changes/edits must be straightforward "right then and there".
