---
description: "Initialize ProMa project management in the current project. Creates proma/ directory with state files, seeds first epic and task. Use when: 'init proma', 'set up project management', 'start tracking work', 'scaffold proma', 'proma init'."
---

# /proma:init — Scaffold the ProMa directory

You are initializing ProMa project management in the user's project. Follow every step below exactly, in order.

---

## Step 1 — Guard: already initialized?

Check whether `proma/` already exists in the current working directory.

- If it exists: print `ProMa already initialized — proma/ already exists. Run /proma:boot to start a session.` and **stop**.
- If it does not exist: continue to Step 2.

---

## Step 2 — Collect project info

If the user passed arguments via `$ARGUMENTS` (e.g. `/proma:init "My Project" "Build a widget"`):
- First argument = **PROJECT_NAME**
- Second argument = **PROJECT_DESC**

If `$ARGUMENTS` is empty or only one value was provided, ask the user:
1. **Project name** — a short identifier (e.g. "Quill", "WidgetAPI")
2. **One-line description** — what this project does or delivers

Wait for their response before continuing.

Set:
- `{{PROJECT_NAME}}` = the project name they provided
- `{{PROJECT_DESC}}` = the one-line description they provided
- `{{DATE}}` = today's date in YYYY-MM-DD format

---

## Step 3 — Create directories

Create the following directories:
- `proma/`
- `proma/decisions/`
- `proma/archive/`

---

## Step 4 — Create files

Create each file below with exactly the content shown. Substitute `{{PROJECT_NAME}}`, `{{PROJECT_DESC}}`, and `{{DATE}}` with the actual values you collected.

### `proma/STATE.md`

```markdown
# STATE — {{PROJECT_NAME}}

- **state:** bootstrap
- **current_epic:** EPIC-01 — PM Backbone Setup
- **current_task:** (none)
- **task_started:** (none)
- **last_completed:** (none)
- **last_tick:** {{DATE}}
- **tick_count:** 0
- **session_start:** {{DATE}}

## Open Flags

### Yellow
- (none)

### Red
- (none)

## Daily Summary (tick-00)
Project initialized. Waiting for human to answer IN-001 before work begins.

## Progress Log
- {{DATE}}: Project scaffolded via /proma:init

## Boot Log
- {{DATE}}: ProMa initialized for "{{PROJECT_NAME}}" — {{PROJECT_DESC}}
- Created: STATE.md, ROADMAP.md, BACKLOG.md, INBOX.md, decisions/INDEX.md, archive/
- Seeded: EPIC-01, TASK-001, IN-001
- Status: waiting on IN-001

## Self-Heal Log
(none)
```

### `proma/ROADMAP.md`

```markdown
# ROADMAP — {{PROJECT_NAME}}

**Terminal goal:** {{PROJECT_DESC}}

---

### EPIC-01 — PM Backbone Setup
- **status:** active
- **created:** {{DATE}}
- **closed:** (empty)
- **exit_criteria:**
  - [ ] Project goals confirmed by human (IN-001 answered)
  - [ ] First real task defined in BACKLOG
  - [ ] At least one additional EPIC defined
- **blocked_by:** (none)
- **blocks:** (all downstream epics)

---

## Closed Epics

_(Epics move here on closure.)_

## Deferred Epics

_(Epics move here when deferred via human approval.)_
```

### `proma/BACKLOG.md`

```markdown
# BACKLOG — Agent Work Queue

Pull from top. Priority order: critical > high > normal > low.
Within a tier, pick unblocked items first.

---

## Active

### TASK-001 — Define project scope and first milestone
- **priority:** critical
- **status:** open
- **epic:** EPIC-01
- **blocked_by:** IN-001
- **created:** {{DATE}}
- **completed:** (empty)
- **summary:** Tighten project goals, define EPIC-02 scope, and create initial task breakdown.
- **outcome:** (filled on completion)

---

## Completed

_(Items move here temporarily; daily sweep archives them.)_
```

### `proma/INBOX.md`

```markdown
# INBOX — Human Work Queue

Agent writes IN-NNN items. Human fills the `#### Answer` section.
Agent consumes answers on next session start.

---

## Open

### IN-001 — Project goals and priorities
- **Date opened:** {{DATE}}
- **Gate type:** scope
- **Status:** pending
- **Blocking:** TASK-001 | EPIC-01
- **Informs:** (all downstream work)
- **Flag:** (empty)

#### Context
ProMa has been initialized for "{{PROJECT_NAME}}". Before any work begins, we need to confirm the project's goals, constraints, and what success looks like.

#### Question
What are the primary goals for this project? Please describe: (1) what you want to achieve, (2) any constraints or deadlines, (3) what the first deliverable milestone should be.

#### Answer
<!-- Fill in your answer here -->

---

## Resolved

_(Resolved items stay here until the daily sweep archives them.)_
```

### `proma/decisions/INDEX.md`

```markdown
# Decision Log

| ID | Date | Title | Status | Related |
|---|---|---|---|---|
| (none yet) | | | | |
```

### `proma/archive/README.md`

```markdown
# Archive Index

Items archived during daily sweeps.

| Item ID | Type | Title | Archived On | From Epic |
|---|---|---|---|---|
| (none yet) | | | | |
```

### `proma/TODO.md`

```markdown
# TODO — {{PROJECT_NAME}}

Two-queue task system: BACKLOG (agent work) + INBOX (human decisions).

---

## Agent Queue (TASK-NNN)

| ID | Title | Priority | Status | Epic | Blocked By |
|---|---|---|---|---|---|
| TASK-001 | Define project scope and first milestone | critical | open | EPIC-01 | IN-001 |

## Human Queue (IN-NNN)

| ID | Title | Type | Status | Blocking | Flag |
|---|---|---|---|---|---|
| IN-001 | Project goals and priorities | scope | pending | TASK-001 | |
```

### `proma/PROGRESS.md`

```markdown
# PROGRESS — {{PROJECT_NAME}}

## Epic Status

| Epic | Title | Status | Exit Criteria Met | Created |
|---|---|---|---|---|
| EPIC-01 | PM Backbone Setup | active | 0/3 | {{DATE}} |

## Recent Activity

- {{DATE}}: Project initialized via /proma:init. Waiting on IN-001.

## Metrics

- **Epics:** 1 active, 0 complete
- **Tasks:** 1 open, 0 in progress, 0 done
- **Inbox:** 1 pending, 0 resolved
- **Decisions:** 0
```

---

## Step 5 — Print success banner

After all files are created, print exactly this (with no extra blank lines between the dashes):

```
✓ ProMa initialized: proma/

Next steps:
  1. Open proma/INBOX.md and answer IN-001 (project goals)
  2. Run /proma:boot to activate the PM persona
  3. The agent will consume your answer and start working

Files created:
  proma/STATE.md      — live session cache
  proma/ROADMAP.md    — epic tracking
  proma/BACKLOG.md    — task queue
  proma/INBOX.md      — human decisions
  proma/TODO.md       — rendered task view
  proma/PROGRESS.md   — rendered progress view
  proma/decisions/    — ADR directory
  proma/archive/      — daily archive
```
