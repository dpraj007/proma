---
description: "Create or list architectural decision records in ProMa. Manages ADR-NNN files in proma/decisions/. Accepts subcommands: create, list. Use when: 'create decision', 'document decision', 'list decisions', 'ADR', 'architecture decision', 'we need to decide'."
---

# /proma:adr

Manage architectural decision records (ADRs) in the ProMa project backbone.

ADRs capture significant decisions: what was chosen, what was rejected, and why. They are the institutional memory that prevents relitigating old debates.

## Argument Parsing

Parse `$ARGUMENTS` for the first word as the subcommand. Valid values: `create`, `list`. If no subcommand is given, default to `list`.

---

## Subcommand: `create`

### Step 1 — Gather decision details

Prompt the user for each of the following fields. Do not infer — ask explicitly and wait for answers before proceeding.

- **title** (required): A short decision statement, written as a noun phrase (e.g., "Use PostgreSQL as primary datastore", "Adopt trunk-based development").
- **context** (required): What situation, constraint, or event prompted this decision? What forces are at play? (2–5 sentences)
- **options** (required): At least 2 alternatives that were genuinely considered. For each, collect: name, brief description (1–3 sentences), and key trade-offs.
- **decision** (required): Which option was chosen? State it plainly.
- **rationale** (required): Why was this option chosen over the alternatives? Reference the specific forces from Context.
- **consequences** (required): What follows from this decision? Include new constraints, downstream tasks this creates, risks introduced, and anything that becomes easier or harder.
- **affects** (optional): Comma-separated EPIC, TASK, or IN IDs that this decision relates to. Default: `none`.
- **needs_human_approval** (optional): Does this decision require human sign-off before it takes effect? Default: ask the user. If the decision is within agent autonomy (e.g., file naming, code structure), default to `no`.

### Step 2 — Determine next ADR number

1. Scan all files in `proma/decisions/` matching pattern `ADR-\d+`.
2. Also scan `proma/archive/` for any archived ADR-NNN files.
3. Compute `new_number = max(found numbers) + 1`. Zero-pad to 3 digits: `ADR-001`, `ADR-002`, etc.
4. If no ADRs exist, start at `ADR-001`.

### Step 3 — Generate slug

Convert the title to kebab-case:
- Lowercase all characters
- Replace spaces and underscores with hyphens
- Remove all non-alphanumeric characters except hyphens
- Truncate to 50 characters maximum

Example: "Use PostgreSQL as primary datastore" → `use-postgresql-as-primary-datastore`

### Step 4 — Create the ADR file

Create `proma/decisions/ADR-NNN-<slug>.md` with the following format:

```markdown
# ADR-NNN — <Title>

- **date:** YYYY-MM-DD
- **status:** <proposed | accepted>
- **affects:** <comma-separated IDs or none>

## Context

<What prompted this decision — the forces, constraints, and situation>

## Options

- **Option A — <Name>:** <Description and trade-offs>
- **Option B — <Name>:** <Description and trade-offs>

## Decision

<Which option was chosen, stated plainly>

## Rationale

<Why this option over the alternatives — reference the specific forces>

## Consequences

<What follows: new constraints, downstream tasks, risks, what gets easier/harder>

## Alternatives Considered

- **Option A — <Name>:** Rejected because <reason>.
- **Option B — <Name>:** Rejected because <reason>.
```

Use today's date for `date`.

Set `status`:
- `proposed` if `needs_human_approval` is yes
- `accepted` if within agent autonomy or human already approved inline

### Step 5 — File sign-off inbox item (if proposed)

If `status` is `proposed`:

1. Determine next IN number by scanning `proma/INBOX.md` and `proma/archive/` for highest IN-NNN → new = max + 1.
2. Append to `proma/INBOX.md`:

```markdown
### IN-NNN — Review: ADR-NNN (<Title>)
- **Opened:** YYYY-MM-DD
- **Type:** decision
- **Status:** pending
- **Flag:** none
- **Affects:** ADR-NNN, <other affected IDs>

**Request:** Please review and approve or reject ADR-NNN.

**Summary:** <One-sentence summary of the decision>

**File:** proma/decisions/ADR-NNN-<slug>.md

**On approval:** Update ADR-NNN status to accepted.
**On rejection:** Update ADR-NNN status to rejected, document reason.
```

### Step 6 — Update decisions/INDEX.md

Read `proma/decisions/INDEX.md`. Locate the decisions table (columns: `ID`, `Date`, `Title`, `Status`, `Related`). Append a new row:

```
| ADR-NNN | YYYY-MM-DD | <Title> | <proposed/accepted> | <affected IDs or —> |
```

If the index file or table does not exist, create it:

```markdown
# Decisions Index

| ID      | Date       | Title                  | Status   | Related |
|---------|------------|------------------------|----------|---------|
| ADR-NNN | YYYY-MM-DD | <Title>                | proposed | —       |
```

### Step 7 — Report

```
Created ADR-NNN: <title>
Status: proposed | accepted
File: proma/decisions/ADR-NNN-<slug>.md
<If proposed:> Filed IN-NNN for human review.
```

---

## Subcommand: `list`

### Step 1 — Read the index

Read `proma/decisions/INDEX.md`. If the file does not exist or is empty, report:

```
No decisions recorded yet. Run /proma:adr create to document the first one.
```

### Step 2 — Parse and sort

Parse all rows from the decisions table. Sort by date descending (most recent first). Group by status: `accepted` → `proposed` → `rejected`.

### Step 3 — Render table

Output:

```
# Decisions

| ID      | Date       | Title                              | Status   | Related        |
|---------|------------|------------------------------------|----------|----------------|
| ADR-004 | 2026-03-10 | Use trunk-based development        | accepted | EPIC-01        |
| ADR-003 | 2026-02-28 | Adopt Pydantic for config schemas  | accepted | EPIC-01, IN-02 |
| ADR-002 | 2026-02-14 | Use PostgreSQL as primary datastore| proposed | EPIC-02        |
| ADR-001 | 2026-01-20 | Reject microservices for v1        | rejected | —              |
```

### Step 4 — Summary line

```
N decisions total: X accepted, Y proposed, Z rejected.
```
