---
description: "Run the ProMa daily sweep. Archives completed items, audits staleness, runs self-heal, re-renders views. Use when: 'run tick', 'daily sweep', 'maintenance', 'proma tick', 'reconcile state', or when the SessionStart hook reports tick is overdue."
---

# /proma:tick

Run the ProMa daily sweep: archive completed items, audit staleness, self-heal missing files, re-render views, and update state.

Run this once per day (or when prompted by the SessionStart hook). All steps are idempotent — running tick twice on the same day is safe.

---

## Step 1 — Check if tick is due

Read `proma/STATE.md`. Parse the `last_tick:` field (format: `YYYY-MM-DD`).

- If `last_tick` equals today's date: report "Tick not due yet (last: YYYY-MM-DD). Run with `force` to override." Then stop, unless `$ARGUMENTS` contains `force`.
- If `last_tick` is absent or the file is missing: proceed (treat as overdue).

---

## Step 2 — Sweep completed items

### 2a — Find completed tasks

Read `proma/BACKLOG.md`. Find all TASK blocks where `status: done`. Collect: TASK-NNN, title, epic, completion date (parse from the block; use today if absent).

### 2b — Find resolved inbox items

Read `proma/INBOX.md`. Find all IN blocks where `Status: resolved`. Collect: IN-NNN, title, type, resolution date.

### 2c — Archive

Determine archive file path: `proma/archive/YYYY-MM-DD.md` (today's date).

If the file already exists, append. If not, create it with a header.

Write or append:

```markdown
# Archive — YYYY-MM-DD

## Archived Tasks
| ID       | Title    | Epic    | Completed  |
|----------|----------|---------|------------|
| TASK-NNN | <title>  | EPIC-NN | YYYY-MM-DD |

## Archived Inbox Items
| ID     | Title    | Type     | Resolved   |
|--------|----------|----------|------------|
| IN-NNN | <title>  | decision | YYYY-MM-DD |
```

If there are no completed tasks, omit the "Archived Tasks" section. If there are no resolved inbox items, omit "Archived Inbox Items". If both are empty, write a note: "Nothing to archive on YYYY-MM-DD."

### 2d — Remove swept items

From `proma/BACKLOG.md`: remove all TASK blocks that were swept (those with `status: done` that were just archived). If there is a `## Completed` section used to hold done tasks, clear it entirely.

From `proma/INBOX.md`: remove all IN blocks that were swept (those with `Status: resolved`).

Be surgical — do not disturb any blocks not being swept.

### 2e — Update archive index

Read `proma/archive/README.md`. Append a row to the archive index table for today:

```
| YYYY-MM-DD | N tasks | M inbox items |
```

If the index table does not exist, create it:

```markdown
# Archive Index

| Date       | Tasks Archived | Inbox Archived |
|------------|---------------|----------------|
| YYYY-MM-DD | N             | M              |
```

---

## Step 3 — Staleness audit (inbox)

Read `proma/INBOX.md`. For each pending IN item, compute `age = today - opened_date` in days.

Apply flags:
- `age >= 3` and `age < 7`: set Flag to `yellow`
- `age >= 7`: set Flag to `red`

For red items: check if any TASK in `proma/BACKLOG.md` has `blocked_by:` referencing this IN-NNN. If not already blocked, add a `blocked_by: IN-NNN (stale — 7+ days)` note to those tasks.

Update the `Flag:` field in each affected IN block in INBOX.md.

Report newly flagged items:
```
Staleness flags applied:
  Yellow (3–6 days): IN-004, IN-007
  Red (7+ days): IN-002
  Blocked by red items: TASK-011 (blocked by IN-002)
```

If no items were flagged: "No stale inbox items."

---

## Step 4 — Backlog staleness audit

Read `proma/BACKLOG.md`. For each TASK block where `status: in_progress`:

1. Check `proma/STATE.md` for a checkpoint entry referencing this TASK (look for TASK-NNN in `current_task` or the progress log).
2. Compute days since the task was last referenced in STATE.md (or since `started:` date if no STATE entry exists).
3. If `age >= 3` days with no STATE.md checkpoint: add or update `stale: true` in the TASK block.

Report stale tasks:
```
Stale in-progress tasks (3+ days, no checkpoint):
  TASK-005: "Implement auth middleware" (in_progress for 4 days)
```

If none: "No stale in-progress tasks."

---

## Step 5 — Decision scan

Read `proma/BACKLOG.md`. Group open TASKs (status: open or in_progress) by their `epic:` field.

For each EPIC with 3 or more open TASKs:
- Check `proma/decisions/INDEX.md` for any ADR with `Related` containing that EPIC.
- If no ADR exists for that EPIC: flag it.

Report suggestions (do not auto-create):
```
Decision scan: EPIC-02 has 4 open tasks but no ADR on record.
  Consider: /proma:adr create to document key architectural choices.
```

If nothing to flag: "Decision scan: no new ADR suggestions."

---

## Step 6 — Self-heal

Verify the following invariants. For each violation, repair it and log it.

### 6a — Mandatory files

Check that all of these exist:
- `proma/STATE.md`
- `proma/ROADMAP.md`
- `proma/BACKLOG.md`
- `proma/INBOX.md`
- `proma/decisions/INDEX.md`

If any are missing: recreate with minimal valid headers and add a comment `<!-- Recreated by self-heal on YYYY-MM-DD -->` at the top.

Minimal headers:
- `STATE.md`: `# State\n\nlast_tick: \ntick_count: 0\ncurrent_epic: none\ncurrent_task: none\n`
- `ROADMAP.md`: `# Roadmap\n\n## Active Epics\n\n## Closed Epics\n`
- `BACKLOG.md`: `# Backlog\n\n## Queue\n\n## In Progress\n\n## Completed\n`
- `INBOX.md`: `# Inbox\n\n## Pending\n\n## Resolved\n`
- `decisions/INDEX.md`: `# Decisions Index\n\n| ID | Date | Title | Status | Related |\n|---|---|---|---|---|\n`

### 6b — current_task validity

Parse `current_task:` from STATE.md. If it references a TASK-NNN ID, verify that task exists in BACKLOG.md (not just in archive). If not found: set `current_task: none` and log the repair.

### 6c — Duplicate ID check

Collect all TASK-NNN IDs from BACKLOG.md. Collect all TASK-NNN IDs from all files in `proma/archive/`. If any ID appears in both active and archive: log a warning (do not auto-resolve — report to user).

Same check for IN-NNN and EPIC-NN.

### 6d — Exit criteria vs completed tasks check

For each EPIC in ROADMAP.md with `[x]` checked criteria: verify the criterion maps to an actual completed (archived or done) TASK. If a criterion is checked but no corresponding TASK exists, log a warning.

This is advisory only — do not uncheck criteria automatically.

### 6e — Log repairs

Append a self-heal log block to `proma/STATE.md` under `## Self-Heal Log`:

```markdown
### Self-Heal — YYYY-MM-DD (tick-NN)
- Recreated: proma/decisions/INDEX.md (was missing)
- Repaired: current_task set to none (TASK-007 not found in BACKLOG)
- Warning: IN-003 appears in both INBOX and archive
```

If no repairs were needed: log "Self-Heal — YYYY-MM-DD: no issues found."

---

## Step 7 — Re-render views

### 7a — Rebuild TODO.md

Read BACKLOG.md and INBOX.md. Render `proma/TODO.md`:

```markdown
# TODO — YYYY-MM-DD

## Agent Queue
| ID       | Title    | Epic    | Status      | Priority |
|----------|----------|---------|-------------|----------|
| TASK-NNN | <title>  | EPIC-NN | in_progress | high     |

## Human Queue (Inbox)
| ID     | Title    | Type     | Age  | Flag   |
|--------|----------|----------|------|--------|
| IN-NNN | <title>  | decision | 2d   | none   |
```

Sort agent queue: in_progress first, then open by priority, then blocked last. Sort human queue: red-flagged first, then yellow, then by age descending.

### 7b — Rebuild PROGRESS.md

Read ROADMAP.md and BACKLOG.md. Render `proma/PROGRESS.md`:

```markdown
# Progress — YYYY-MM-DD

## Epic Progress
| Epic    | Title    | Status  | Criteria     | Progress   |
|---------|----------|---------|--------------|------------|
| EPIC-01 | <title>  | active  | 3/5 done     | ██████░░░░ 60% |

## Task Activity (last 7 days)
| Date       | Completed | Started | Blocked |
|------------|-----------|---------|---------|
| YYYY-MM-DD | N         | M       | K       |

## Progress Log
<last 10 entries from STATE.md progress log>
```

For progress bars: use `█` for filled (each block = 10%), `░` for empty. Compute filled = round(pct / 10).

---

## Step 8 — Update STATE.md

Apply the following updates to `proma/STATE.md`:

1. Set `last_tick: YYYY-MM-DD` (today).
2. Increment `tick_count:` by 1. Parse the current value; if absent, set to 1.
3. Append a daily summary section:

```markdown
## Daily Summary (tick-NN)
_YYYY-MM-DD_

- **Shipped:** <N tasks archived, list titles if <= 3; "N tasks" if more>
- **Stalled:** <list blocked tasks or "none">
- **Flagged:** <yellow/red inbox items or "none">
- **Next:** <current_task title, or first open TASK in queue>
- **At-risk:** <any red flags, overdue items, stale epics, or "none">
```

---

## Step 9 — Commit suggestion

After all steps complete, output the suggested commit command:

```
Suggested commit:
  git add proma/ && git commit -m "chore(pm): daily tick YYYY-MM-DD"
```

Do not run the commit automatically — only suggest it.

---

## Step 10 — Print summary report

Output a compact summary of what the tick accomplished:

```
Tick complete — YYYY-MM-DD (tick-NN)

  Archived:     N tasks, M inbox items
  Staleness:    X yellow, Y red inbox items flagged
  Stale tasks:  Z in-progress tasks with no checkpoint
  ADR prompts:  W epics suggested for ADR creation
  Self-heal:    V repairs made (or "none")
  Views rebuilt: TODO.md, PROGRESS.md
  Next task:    TASK-NNN (<title>) or "none queued"
```
