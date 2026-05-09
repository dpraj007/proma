---
description: "Create, list, update, or close tasks in ProMa. Manages TASK-NNN items in proma/BACKLOG.md. Accepts subcommands: create, list, update, close. Use when: 'create task', 'add task', 'list tasks', 'update task', 'close task', 'mark task done', 'task status'."
---

# /proma:task

Manage TASK-NNN items in the ProMa project backbone. Parse `$ARGUMENTS` to determine the subcommand. If no subcommand is given, default to `list`.

---

## Subcommand: create

1. Ask the user for the following fields (prompt for each that is missing from `$ARGUMENTS`):
   - **title** — short imperative description
   - **priority** — P0, P1 (default), P2, or P3
   - **time estimate** — e.g. 2h, 1d, 3d
   - **epic** — EPIC-NN this task belongs to (can be `none`)
   - **rationale / description** — what this task accomplishes and why

2. Determine the next TASK ID:
   - Grep `proma/BACKLOG.md` and every file under `proma/archive/` for patterns matching `TASK-\d+`.
   - Take the maximum number found and add 1. If no existing tasks are found, start at `TASK-001`.
   - Zero-pad to three digits (e.g. `TASK-007`).

3. Append the new item to `proma/BACKLOG.md` under the `## Active` section using this exact format:

```markdown
### TASK-NNN — <title>
- **priority:** critical | high | normal | low
- **status:** open
- **epic:** EPIC-NN
- **blocked_by:** (none)
- **created:** YYYY-MM-DD
- **completed:** (empty)
- **summary:** <rationale/description>
- **outcome:** (filled on completion)
```

   Priority mapping:
   - P0 → `critical`
   - P1 → `high`
   - P2 → `normal`
   - P3 → `low`

4. Update `proma/TODO.md` — add a row to the **Agent Queue** table with at minimum: ID, title, priority, epic, and status.

5. Report to the user:
   > "Created TASK-NNN: <title>"

---

## Subcommand: list

1. Read `proma/BACKLOG.md`.

2. Parse all TASK-NNN items (both `## Active` and `## Completed` sections).

3. Apply optional filters from `$ARGUMENTS`:
   - `--epic EPIC-NN` — show only tasks belonging to that epic
   - `--status open|blocked|done|in_progress` — show only tasks in that status
   - Default (no filters): show all items whose status is **not** `done`.

4. Render results as a Markdown table:

   | ID | Title | Priority | Status | Epic | Blocked By |
   |----|-------|----------|--------|------|------------|
   | TASK-NNN | ... | ... | ... | ... | ... |

5. Below the table, print a count summary line:
   > "X open, Y in_progress, Z blocked, W done"

---

## Subcommand: update

1. Parse the target TASK ID (e.g. `TASK-007`) from `$ARGUMENTS`.

2. If the ID is not in `$ARGUMENTS`, ask the user which task to update.

3. Ask the user what field(s) to update. Supported fields:
   - `status` — see valid transitions below
   - `priority` — P0–P3 (apply the same mapping as in `create`)
   - `blocked_by` — TASK-NNN or IN-NNN causing the block, or `(none)` to clear
   - `summary` — free-text description update

4. Valid status transitions (reject any other transition with an explanation):
   - `open` → `in_progress`, `blocked`
   - `in_progress` → `done`, `blocked`, `open`
   - `blocked` → `open` (only when the blocker is resolved / cleared)

5. Update the matching `### TASK-NNN` block in `proma/BACKLOG.md` in-place.

6. If status changed **to** `in_progress`:
   - Update `proma/STATE.md` — set `current_task:` to this TASK ID.

7. Update `proma/TODO.md` to reflect the new status.

8. Report to the user:
   > "Updated TASK-NNN: <field> → <new value>"

---

## Subcommand: close

1. Parse the target TASK ID from `$ARGUMENTS`. If absent, ask the user.

2. Ask the user for an **outcome summary** — one or two sentences describing what was delivered or decided.

3. In `proma/BACKLOG.md`:
   - Set `status: done`
   - Set `completed: YYYY-MM-DD` (today's date)
   - Fill `outcome:` with the user-supplied summary
   - Move the entire `### TASK-NNN` block from `## Active` to `## Completed`

4. In `proma/STATE.md`:
   - If `current_task:` matches this TASK ID, clear it (set to `(none)` or remove the value).
   - Append an entry to the **Progress Log** section:
     > `YYYY-MM-DD — Closed TASK-NNN: <title>. <outcome summary>`

5. Check epic exit criteria:
   - Identify the task's `epic:` field.
   - Read the corresponding EPIC in `proma/BACKLOG.md` or `proma/epics/`.
   - If all tasks under that epic are now `done` and the epic's exit criteria appear satisfied, suggest to the user:
     > "All tasks under EPIC-NN are complete. Consider filing an IN item to request human sign-off on epic closure."

6. Update `proma/TODO.md` — remove or mark the task row as done.

7. Update `proma/PROGRESS.md` — refresh the milestone/EXP view to reflect completed work.

8. Report to the user:
   > "Closed TASK-NNN: <title>. Queued for archive at next tick."
