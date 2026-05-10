# ProMa

**The project manager that ships work, not status updates.**

ProMa is a Claude Code plugin that gives any project persistent, cross-session project management. Based on the KEEL protocol, it tracks epics, tasks, human decisions, and architectural choices in pure markdown — git-friendly, agent-driven, human-in-the-loop.

---

## Install

```bash
claude --plugin-dir /path/to/proma
```

### Activate for Every Session

**Start Claude Code with `@proma` to have Claude act as your project manager for the entire session:**

```bash
claude @proma
```

This loads the PM persona automatically at session start — no need to manually run `/proma:boot` each time. The full project context (epics, tasks, open inbox items, last tick) is injected immediately, so Claude is PM-brained from the first message.

---

## Quick Start

1. `/proma:init` — scaffold the `proma/` directory in your project
2. Answer **IN-001** in `proma/INBOX.md` (project scope and goals)
3. `/proma:boot` — activate the PM persona and inject context into `CLAUDE.md`
4. **Going forward, skip steps 2–3:** just start every session with `claude @proma`

---

## Usage

Two workflows — pick the right one for where you are:

**First time (new project):**
```
/proma:init          # scaffold proma/ directory
# answer IN-001 in proma/INBOX.md
/proma:boot          # activate PM persona
```

**Every session after that:**
```bash
claude @proma        # PM persona loads automatically — just start working
```

That's it. `@proma` is the on-ramp. Everything else is driven by `/proma:*` commands from inside the session.

---

## Skill Catalog

| Skill | Purpose |
|---|---|
| `/proma:init` | Initialize PM backbone in current project |
| `/proma:boot` | Activate PM persona, inject into CLAUDE.md |
| `/proma:epic` | Create, list, update, close epics (EPIC-NN) |
| `/proma:task` | Create, list, update, close tasks (TASK-NNN) |
| `/proma:inbox` | File, answer, list human inbox items (IN-NNN) |
| `/proma:adr` | Create, list architectural decisions (ADR-NNN) |
| `/proma:tick` | Run daily sweep — archive, audit, self-heal |
| `/proma:status` | Project dashboard (HTML or Markdown) |

---

## ID Scheme

| Prefix | Meaning |
|---|---|
| EPIC-NN | Milestone / epic |
| TASK-NNN | Agent work item |
| IN-NNN | Human inbox item |
| ADR-NNN | Decision record |

---

## Architecture

State lives in `<project>/proma/` as pure markdown files — no database, no server, no lock-in. Every artifact is human-readable and diffs cleanly in git.

Skills manage all state transitions. Users interact exclusively through `/proma:*` commands; the agent handles file I/O, ID assignment, and view rendering.

A **SessionStart hook** (`hooks/tick-check.js`) fires automatically when Claude Code opens. It reads `proma/STATE.md`, checks the `**last_tick:**` field, and emits a notification if the daily sweep is overdue — keeping the backlog honest without any user action.

`CLAUDE.md` injection uses sentinel comments (`<!-- proma:start -->` / `<!-- proma:end -->`) so the PM persona block can be updated idempotently across sessions without duplicating content.

---

## State Directory Layout

```
proma/
├── STATE.md           # Live session cache — current focus, last tick, open loops
├── ROADMAP.md         # Epics and milestone plan
├── BACKLOG.md         # Agent task queue
├── INBOX.md           # Human decisions queue
├── decisions/
│   └── INDEX.md       # ADR registry
├── archive/
│   └── YYYY-MM-DD.md  # Completed / cancelled items by close date
├── TODO.md            # Rendered two-queue view (agent + human)
└── PROGRESS.md        # Rendered milestone / epic progress view
```

---

## Behavioral Rules

1. **No task without scope.** Every TASK-NNN must reference a parent EPIC-NN before it moves to `in-progress`.
2. **Force ADRs on ambiguity.** When a design question blocks two or more tasks, file an ADR before proceeding. Never pick arbitrarily.
3. **Cut scope, don't push harder.** If an epic is at risk, negotiate scope with the human via INBOX rather than extending hours or degrading quality.
4. **Escalate stale inbox items.** Items unanswered for 3 days get a `⚠ yellow` flag; 7 days get a `🔴 red` flag. The tick sweep applies flags automatically.
5. **Sync views atomically.** `TODO.md` and `PROGRESS.md` are always regenerated together — never update one without the other.
6. **Batch human asks.** Accumulate inbox items and deliver them in a single batch rather than interrupting the human once per question.

---

## License

MIT

---

## Credits

Based on the [KEEL protocol](https://github.com/dpraj007/Quill). Reference implementation: **Quill** — an opinionated research PM backbone for Claude Code.
