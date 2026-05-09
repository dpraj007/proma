---
description: "File, answer, or list inbox items in ProMa. Manages IN-NNN items in proma/INBOX.md for human-agent coordination. Accepts subcommands: file, answer, list. Use when: 'file inbox item', 'ask human', 'answer inbox', 'list inbox', 'pending decisions', 'human input needed'."
---

# /proma:inbox

Manage IN-NNN items in the ProMa inbox — the coordination layer between the agent and the human. Parse `$ARGUMENTS` to determine the subcommand. If no subcommand is given, default to `list`.

---

## Subcommand: file

Use this subcommand when the agent needs a human decision before proceeding.

1. Ask the user for the following fields (prompt for each that is missing from `$ARGUMENTS`):
   - **short title** — a 3–8 word label (becomes the `IN-NNN — <title>` heading)
   - **gate type** — one of: `scope`, `delivery`, `external`, `budget`, `destructive`, `advisory`
   - **question** — a single, specific question the human must answer
   - **context** — why the agent is asking; what information led to this question
   - **blocking** — TASK-NNN, EPIC-NN, `session`, or `none`
   - **informs** — TASK-NNN, EPIC-NN, ADR-NNN, or `none`

2. Determine the next IN ID:
   - Grep `proma/INBOX.md` and every file under `proma/archive/` for patterns matching `IN-\d+`.
   - Take the maximum number found and add 1. If no existing items are found, start at `IN-001`.
   - Zero-pad to three digits (e.g. `IN-003`).

3. Append the new item to `proma/INBOX.md` under the `## Open` section using this exact format:

```markdown
### IN-NNN — <short title>
- **Date opened:** YYYY-MM-DD
- **Gate type:** scope | delivery | external | budget | destructive | advisory
- **Status:** pending
- **Blocking:** TASK-NNN | EPIC-NN | session | none
- **Informs:** TASK-NNN | EPIC-NN | ADR-NNN | none
- **Flag:** (empty)

#### Context
<Why the agent is asking.>

#### Question
<A single, specific question.>

#### Answer
<!-- Human fills in here -->
```

4. If `blocking:` references a TASK:
   - Find that `### TASK-NNN` block in `proma/BACKLOG.md`.
   - Set `blocked_by: IN-NNN` on that task.
   - Set `status: blocked` on that task (apply valid transition rules — only `open` or `in_progress` may move to `blocked`).

5. Update `proma/TODO.md` — add a row to the **Human Queue** table with: ID, title, gate type, blocking, and date opened.

6. Report to the user:
   > "Filed IN-NNN: <title>. Blocking: <blocking value>. Human action required."

---

## Subcommand: answer

Use this subcommand when the human is providing their response to a pending inbox item.

1. Parse the target IN ID (e.g. `IN-003`) from `$ARGUMENTS`.

2. If the ID is not in `$ARGUMENTS`, ask the user which item they are answering.

3. Locate the `### IN-NNN` block in `proma/INBOX.md`.

4. Collect the answer:
   - If `$ARGUMENTS` contains text after the IN ID, use that as the answer.
   - Otherwise, prompt the user: "What is your answer to IN-NNN?"

5. In `proma/INBOX.md`:
   - Fill in the `#### Answer` section with the user's response.
   - Set `Status: answered`.

6. Unblock dependent tasks:
   - Read the `Blocking:` field from the item.
   - If it references one or more TASK-NNN IDs, find each in `proma/BACKLOG.md`:
     - Set `blocked_by: (none)`
     - Set `status: open`

7. Update `proma/TODO.md` — update the Human Queue row for IN-NNN to show status `answered` and remove it from the pending view.

8. Report to the user:
   > "Answered IN-NNN. Unblocked: <comma-separated list of TASK-NNN IDs, or 'none'>"

---

## Subcommand: list

1. Read `proma/INBOX.md`.

2. Parse all IN-NNN items from both `## Open` and any `## Answered` / `## Resolved` sections.

3. For each **pending** item, calculate staleness:
   - Age = today's date minus `Date opened`
   - 3–6 days → flag `🟡`
   - 7+ days → flag `🔴`
   - Under 3 days → no flag (leave `Flag:` empty in display)
   - Update the `**Flag:**` field in `proma/INBOX.md` in-place for any item whose flag has changed.

4. Render results as a Markdown table:

   | ID | Title | Type | Status | Age | Flag | Blocking |
   |----|-------|------|--------|-----|------|----------|
   | IN-NNN | ... | ... | pending | Xd | 🔴 | TASK-NNN |

   Sort order: pending items first (oldest first), then answered/resolved items.

5. Below the table, print a count summary line:
   > "X pending, Y answered, Z resolved"
