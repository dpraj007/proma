---
description: "Create, list, update, or close epics in ProMa. Manages EPIC-NN entries in proma/ROADMAP.md. Accepts subcommands: create, list, update, close. Use when: 'create epic', 'add milestone', 'list epics', 'close epic', 'epic status', 'define milestone'."
---

# /proma:epic

Manage epics (milestones) in the ProMa project backbone.

## Argument Parsing

Parse `$ARGUMENTS` for the first word as the subcommand. Valid values: `create`, `list`, `update`, `close`. If no subcommand is given, default to `list`.

Remaining words after the subcommand are treated as the EPIC ID (e.g., `EPIC-03`) or free-form title, depending on context.

---

## Subcommand: `create`

### Step 1 — Gather information

Prompt the user for each of the following. Do not infer or assume values — ask explicitly:

- **title** (required): A short, imperative phrase (e.g., "Ship evaluation harness")
- **exit_criteria** (required): A list of 2–5 verifiable, binary conditions that define "done." Each must be independently testable.
- **blocked_by** (optional): Comma-separated EPIC IDs that must close before this one can begin. Default `none`.
- **blocks** (optional): Comma-separated EPIC IDs that this epic must close before they can begin. Default `none`.

### Step 2 — Determine next EPIC number

1. Read `proma/ROADMAP.md`. Extract all EPIC-NN identifiers using pattern `EPIC-\d+`.
2. Also scan all files in `proma/archive/` for EPIC-NN identifiers (to avoid reusing archived numbers).
3. Compute `new_number = max(found numbers) + 1`. Zero-pad to 2 digits: `EPIC-01`, `EPIC-02`, etc.
4. If no EPICs exist yet, start at `EPIC-01`.

### Step 3 — Append to ROADMAP.md

Locate the line `## Closed Epics` in `proma/ROADMAP.md`. Insert the new block **immediately before** that line (preserving a blank line separator). If `## Closed Epics` does not exist, append to the end of the file.

Format:

```markdown
### EPIC-NN — <Title>
- **status:** active
- **created:** YYYY-MM-DD
- **closed:** 
- **exit_criteria:**
  - [ ] <Condition 1>
  - [ ] <Condition 2>
- **blocked_by:** <EPIC-NN or none>
- **blocks:** <EPIC-NN or none>
```

Use today's date for `created`. Leave `closed` blank.

### Step 4 — Update PROGRESS.md

Read `proma/PROGRESS.md`. Find the epic summary table (look for a Markdown table with columns `Epic`, `Title`, `Status`, `Progress`). Append a new row:

```
| EPIC-NN | <Title> | active | 0% |
```

If the table does not exist, create it with headers before appending.

### Step 5 — Report

Output:

```
Created EPIC-NN: <title> with N exit criteria.
blocked_by: <value>
blocks: <value>
```

---

## Subcommand: `list`

### Step 1 — Parse ROADMAP.md

Read `proma/ROADMAP.md`. Extract every `### EPIC-NN — <Title>` block and parse the fields:
- `status`
- `created`
- `closed`
- `exit_criteria` checklist items (count `[x]` as checked, `[ ]` as unchecked)

### Step 2 — Compute progress

For each EPIC: `progress = checked_criteria / total_criteria * 100` (as integer %). If total is 0, show `—`.

### Step 3 — Render table

Output a Markdown table:

```
| Epic    | Title               | Status          | Progress | Created    |
|---------|---------------------|-----------------|----------|------------|
| EPIC-01 | <title>             | active          | 60%      | 2026-01-15 |
| EPIC-02 | <title>             | pending_closure | 100%     | 2026-02-01 |
```

Sort: active epics first (by creation date), then pending_closure, then closed.

### Step 4 — Summary line

```
N epics total: X active, Y pending closure, Z closed.
```

---

## Subcommand: `update`

### Step 1 — Identify target EPIC

Parse the EPIC ID from `$ARGUMENTS` (e.g., `update EPIC-03`). If no ID is provided, ask the user which EPIC to update.

Verify the EPIC exists in `proma/ROADMAP.md`. If it does not exist, report an error and stop.

### Step 2 — Ask what to update

Present the user with the current EPIC block, then ask which field(s) to change:

1. **status** — new value (e.g., `active`, `on_hold`)
2. **exit_criteria** — add new criteria, mark existing ones checked/unchecked, or remove criteria
3. **blocked_by / blocks** — add or remove dependencies
4. **title** — rename the epic

Collect all desired changes before editing.

### Step 3 — Apply edits to ROADMAP.md

Make targeted edits within the identified EPIC-NN block only. Do not touch other epics.

- For status: replace the `**status:**` line value.
- For exit_criteria: add new `  - [ ] <text>` lines, or change `[ ]` to `[x]` for checked items.
- For dependencies: replace the `**blocked_by:**` or `**blocks:**` line values.
- For title: update the `### EPIC-NN — <Title>` heading.

### Step 4 — Update PROGRESS.md

Re-read the exit_criteria and recompute progress. Update the corresponding row in the epic table.

### Step 5 — Report

List each field that was changed and its new value:

```
Updated EPIC-NN:
  status: active → on_hold
  exit_criteria: added "Deploy to staging"
```

---

## Subcommand: `close`

### Step 1 — Identify target EPIC

Parse the EPIC ID from `$ARGUMENTS`. If not provided, ask the user.

### Step 2 — Verify exit criteria

Read the EPIC block from `proma/ROADMAP.md`. Check every exit criterion:

- `[x]` = satisfied
- `[ ]` = unsatisfied

If **any criterion is unchecked**, output the list of unmet items and stop:

```
Cannot close EPIC-NN: the following exit criteria are not yet satisfied:
  - [ ] <Condition text>
  - [ ] <Condition text>

Mark these complete before requesting closure.
```

Do not proceed if any criteria are unmet.

### Step 3 — Determine next IN number

Grep `proma/INBOX.md` and `proma/archive/` for highest IN-NNN → new = max + 1. Zero-pad to 3 digits.

### Step 4 — File a closure sign-off inbox item

Append to `proma/INBOX.md`:

```markdown
### IN-NNN — Sign-off: Close EPIC-NN (<Title>)
- **Opened:** YYYY-MM-DD
- **Type:** decision
- **Status:** pending
- **Flag:** none
- **Affects:** EPIC-NN

**Request:** All exit criteria for EPIC-NN are satisfied. Please confirm closure.

**Evidence:**
  - [x] <Condition 1> — satisfied
  - [x] <Condition 2> — satisfied

**On approval:** Mark EPIC-NN closed, move to Closed Epics, archive scoped tasks, advance STATE to next epic.
```

### Step 5 — Set status to pending_closure

In `proma/ROADMAP.md`, update the `**status:**` line of EPIC-NN to `pending_closure`.

### Step 6 — Report

```
EPIC-NN closure requested. Filed IN-NNN for human sign-off.
Status set to: pending_closure.
No further changes made until IN-NNN is answered.
```

### Step 7 — On sign-off received

When the human marks IN-NNN as answered/approved (either directly or via `/proma:inbox answer`):

1. Set `**status:** closed` and `**closed:** YYYY-MM-DD` in the EPIC block.
2. Move the entire EPIC block to the `## Closed Epics` section of ROADMAP.md.
3. Find all TASKs in `proma/BACKLOG.md` scoped to this EPIC (look for `epic: EPIC-NN`). Archive them:
   - Create or append to `proma/archive/YYYY-MM-DD.md` with an archived tasks section.
   - Remove them from BACKLOG.md.
4. Update `proma/STATE.md` — set `current_epic` to the next active EPIC (lowest EPIC number with `status: active`). If none, set to `none`.
5. Update PROGRESS.md: mark the epic row as `closed` and `100%`.
6. Report: "EPIC-NN closed. N tasks archived. Advancing to <next EPIC or 'no active epics'>."
