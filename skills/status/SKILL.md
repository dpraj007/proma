---
description: "Show the ProMa project dashboard. Renders project status as HTML or Markdown. Use when: 'project status', 'show dashboard', 'proma status', 'how is the project going', 'progress report', 'overview'."
---

# /proma:status

Generate and display the ProMa project dashboard. Renders a comprehensive view of epic progress, task counts, inbox health, and recent activity.

---

## Step 1 — Verify proma/ exists

Check that `proma/STATE.md` exists.

If it does not exist: output the following and stop:

```
proma/ is not initialized. Run /proma:init to set up the project backbone.
```

---

## Step 2 — Ask for output format

Prompt the user:

```
How would you like the dashboard?
  1. Markdown — rendered inline in this conversation
  2. HTML     — saved to proma/dashboard.html
  3. Both     — inline Markdown + HTML file
```

Wait for the response before proceeding. Accept: `1`, `markdown`, `md`, `2`, `html`, `3`, `both`.

If `$ARGUMENTS` contains `html`, `md`, `markdown`, or `both`, skip the prompt and use the specified format.

---

## Step 3 — Read all state files

Read the following files in parallel:

- `proma/STATE.md` — current session state, last_tick, tick_count, boot log
- `proma/ROADMAP.md` — epics and exit criteria
- `proma/BACKLOG.md` — all tasks and statuses
- `proma/INBOX.md` — all inbox items, flags, ages
- `proma/decisions/INDEX.md` — ADR counts by status

If any file is missing, note it and continue with partial data.

---

## Step 4 — Compute metrics

### Epic metrics
For each EPIC in ROADMAP.md:
- `checked_criteria` = count of `[x]` items
- `total_criteria` = count of all `[ ]` and `[x]` items
- `pct` = round(checked / total * 100) if total > 0, else 0
- `status` = value of the `**status:**` field

### Task metrics
From BACKLOG.md, count tasks by status:
- `open`: status is `open`
- `in_progress`: status is `in_progress`
- `blocked`: status is `blocked`
- `stale`: status is `stale`
- `done`: status is `done` (still in file, not yet archived)

### Inbox metrics
From INBOX.md:
- `pending`: count of IN blocks with `Status: pending`
- `answered`: count with `Status: answered`
- `resolved`: count with `Status: resolved`
- For pending items: count how many have Flag `yellow`, how many have Flag `red`
- Oldest pending item: compute age in days from `Opened:` date

### ADR metrics
From decisions/INDEX.md:
- `accepted`: count rows with status `accepted`
- `proposed`: count rows with status `proposed`
- `rejected`: count rows with status `rejected`

### Timing metrics
- `days_since_tick`: today minus `last_tick` from STATE.md (0 if ticked today)
- `project_age`: today minus earliest date found in STATE.md Boot Log section (or created date of STATE.md as fallback)

### Recent activity
Parse STATE.md for the last 5 `## Daily Summary` entries. Extract the "Shipped" bullet from each.

---

## Step 5 — If Markdown format

Render the following inline in the conversation. Use the actual computed values:

```markdown
# ProMa Dashboard — {{PROJECT_NAME}}
_Generated: YYYY-MM-DD | Project age: N days | Last tick: N days ago_

## Epic Progress
| Epic    | Title    | Status  | Progress           |
|---------|-----------|---------|--------------------|
| EPIC-01 | <title>  | active  | ██████░░░░ 60%     |
| EPIC-02 | <title>  | active  | ██░░░░░░░░ 20%     |

## Task Summary
| Status      | Count |
|-------------|-------|
| Open        | X     |
| In Progress | Y     |
| Blocked     | Z     |
| Stale       | W     |
| Done        | V     |

## Open Inbox Items
| ID     | Title    | Age  | Flag   |
|--------|----------|------|--------|
| IN-NNN | <title>  | 2d   | none   |
| IN-NNN | <title>  | 8d   | 🔴     |

## Decisions
- Accepted: X | Proposed: Y | Rejected: Z

## Flags
<If any yellow items:>   🟡 Yellow (3–6 days): IN-NNN, IN-NNN
<If any red items:>      🔴 Red (7+ days): IN-NNN
<If none:>               No active flags.

## Recent Activity
<Last 5 daily summary "Shipped" bullets, one per line, with date prefix>
  2026-03-10: Shipped TASK-005 (Write evaluation harness), TASK-006 (Add CLI flag)
  2026-03-09: Nothing shipped
  ...
```

Replace `{{PROJECT_NAME}}` with the value from STATE.md `project:` field, or with the parent directory name if not set.

For progress bars: `█` = filled (each = 10%), `░` = empty. Render 10 characters total. Example: 60% → `██████░░░░`.

---

## Step 6 — If HTML format

Generate a self-contained HTML file at `proma/dashboard.html`.

Requirements:
- No external dependencies — all CSS and JavaScript must be inline.
- Fully responsive (works at 320px–2560px width).
- No JavaScript frameworks — plain vanilla JS only (used only for optional interactivity like collapsing sections).

### Color scheme and CSS variables

```css
:root {
  --bg:        #f4f1ea;
  --paper:     #fffdf8;
  --accent:    #1f6feb;
  --accent-muted: #388bfd22;
  --text:      #1c1917;
  --text-muted: #78716c;
  --border:    #e2ddd5;
  --green:     #22c55e;
  --yellow:    #f59e0b;
  --red:       #ef4444;
  --badge-open:     #dbeafe;
  --badge-active:   #dcfce7;
  --badge-blocked:  #fee2e2;
  --badge-stale:    #fef3c7;
  --badge-done:     #f3f4f6;
  --radius:    8px;
  --shadow:    0 1px 3px rgba(0,0,0,0.08);
}
```

### Layout structure

```
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProMa Dashboard — {{PROJECT_NAME}}</title>
    <style>/* all CSS inline here */</style>
  </head>
  <body>
    <!-- Hero -->
    <!-- KPI Grid -->
    <!-- Epic Progress -->
    <!-- Task Breakdown -->
    <!-- Inbox Table -->
    <!-- Recent Activity Timeline -->
    <!-- Footer -->
  </body>
</html>
```

### Hero section

A full-width banner at the top:
- Left: Project name (h1, large), subtitle "ProMa Project Dashboard"
- Right: Key stats chips — "Age: N days", "Last tick: N days ago", "Tick #N"
- Background: `var(--paper)`, bottom border: `var(--border)`
- Padding: 2rem

### KPI grid

A 4-column responsive grid (collapses to 2-col on mobile, 1-col on small screens):

Each card has:
- Large number (count) in `var(--accent)` color
- Label below in `var(--text-muted)`
- Subtle border and `var(--shadow)`

Cards:
1. **Epics** — total count, subtitle "N complete"
2. **Tasks** — total non-done count, subtitle "N done"
3. **Inbox** — pending count, subtitle "N flagged"
4. **ADRs** — accepted count, subtitle "N proposed"

### Epic progress section

Header: "Epic Progress"

For each EPIC, render a card:
- Top row: EPIC ID badge (monospace, `var(--accent-muted)` background) + Title + Status badge
- Progress bar: full-width, height 8px, rounded. Fill color:
  - pct = 100: `var(--green)`
  - pct >= 50: `var(--accent)`
  - pct < 50: `var(--yellow)`
- Progress label: "N / M criteria (pct%)" right-aligned above the bar

### Task breakdown section

Header: "Tasks by Status"

A horizontal bar chart using pure CSS (div widths set via inline style):
- One row per status: Open, In Progress, Blocked, Stale, Done
- Each row: status label (left, fixed width 100px) + colored bar (proportional to count) + count label (right)
- Colors: Open → `var(--badge-open)` border, In Progress → `var(--badge-active)` border, Blocked → `var(--badge-blocked)` border, Stale → `var(--badge-stale)` border, Done → `var(--badge-done)` border

### Inbox items table

Header: "Open Inbox Items"

If no pending items: show "No pending inbox items."

Otherwise, render a full-width table:

```
| ID     | Title                | Age  | Flag |
|--------|----------------------|------|------|
| IN-003 | Sign-off: close EPIC | 8d   | 🔴   |
```

Row background color:
- Flag red: `#fef2f2`
- Flag yellow: `#fffbeb`
- No flag: `var(--paper)`

Sort: red first, yellow second, no flag by age descending.

### Recent activity timeline

Header: "Recent Activity"

Render the last 5 daily summary entries as a vertical timeline:
- Each entry: date on the left (muted, monospace) + "Shipped: ..." text on the right
- Connected by a thin vertical line (`var(--border)`)
- If no activity: "No recorded activity yet."

### Footer

```html
<footer>
  Generated by ProMa · <time datetime="YYYY-MM-DDTHH:MM">YYYY-MM-DD HH:MM</time>
</footer>
```

Footer: centered, `var(--text-muted)`, small font, `var(--border)` top border, padding 1rem.

---

## Step 7 — Report

After generating:

If Markdown only:
```
Dashboard rendered inline.
```

If HTML:
```
Dashboard saved to: proma/dashboard.html
Open in browser to view.
```

If both:
```
Markdown dashboard rendered above.
HTML dashboard saved to: proma/dashboard.html
```
