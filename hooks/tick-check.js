#!/usr/bin/env node
/**
 * tick-check.js — ProMa SessionStart hook
 *
 * Checks whether the daily PM tick is overdue by reading
 * proma/STATE.md in the current working directory and comparing
 * the **last_tick:** field to today's date.
 *
 * Outputs a JSON notification to stdout if overdue; exits silently otherwise.
 * Always exits with code 0 — this hook must never block a session.
 *
 * No external dependencies: only Node.js built-ins (fs, path).
 */

const fs = require("fs");
const path = require("path");

function main() {
  const statePath = path.join(process.cwd(), "proma", "STATE.md");

  // Plugin installed but project not yet initialized — exit silently.
  if (!fs.existsSync(statePath)) {
    process.exit(0);
  }

  let content;
  try {
    content = fs.readFileSync(statePath, "utf8");
  } catch (_) {
    // Unreadable file — exit silently rather than spamming the user.
    process.exit(0);
  }

  // Parse **last_tick:** YYYY-MM-DD (bold markdown field)
  const match = content.match(/\*\*last_tick:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    // Field missing — project may be in a half-initialized state; exit silently.
    process.exit(0);
  }

  const lastTick = match[1];

  // Derive today's date as a YYYY-MM-DD string using local time.
  const now = new Date();
  const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  if (today > lastTick) {
    console.log(
      JSON.stringify({
        notification:
          "ProMa daily tick is overdue (last tick: " +
          lastTick +
          "). Run /proma:tick to sweep and reconcile.",
      })
    );
  }

  process.exit(0);
}

main();
