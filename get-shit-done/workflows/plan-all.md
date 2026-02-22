<purpose>
Batch-plan all unplanned roadmap phases. Discovers which phases need planning, displays
a summary table, then plans each sequentially. This file handles discovery and reporting —
Phase 6 extends it to add the sequential planning loop.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. Initialize

```bash
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs init plan-all)
```

Parse JSON for: `research_enabled`, `plan_checker_enabled`, `commit_docs`, `planning_exists`, `roadmap_exists`, `unplanned_phases`, `unplanned_count`, `total_phases`, `state_path`, `roadmap_path`, `requirements_path`.

**If `planning_exists` is false:** Error — run `/gsd:new-project` first.
**If `roadmap_exists` is false:** Error — no ROADMAP.md found.

## 2. Parse Arguments

Extract from $ARGUMENTS:
- `--dry-run` flag

## 3. Discover Unplanned Phases

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DISCOVERING UNPLANNED PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use `unplanned_phases` from init JSON (already computed).

**If `unplanned_count` is 0 (nothing to plan):**

Display:
```
All {total_phases} phases have plans.

Nothing to plan. Your project is fully planned!

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute your plans** — start running the phase plans

`/gsd:execute-phase {next_executable_phase}`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd:progress` — view project progress
- `/gsd:verify-work {N}` — verify a completed phase

───────────────────────────────────────────────────────────────
```

Exit workflow.

**If unplanned phases found:**

Display discovery table:
```
Found {N} phase(s) to plan:

| Phase | Name | Status |
|-------|------|--------|
| 5 | Command & Phase Discovery | discussed |
| 6 | Sequential Planning Loop | empty |
| 7 | Retry & Completion | empty |
```

Status column maps disk_status values:
- `no_directory` → "empty"
- `empty` → "empty"
- `discussed` → "discussed"
- `researched` → "researched"

## 4. Dry Run Exit

**If `--dry-run` flag:**

Display: `Dry run — exiting without planning.`

Exit workflow.

<!-- Phase 6 replaces this section -->
## 5. Planning Loop Placeholder

Display:
```
Discovery complete. Sequential planning not yet implemented.

To plan individual phases:
/gsd:plan-phase 5
/gsd:plan-phase 6
/gsd:plan-phase 7
```

This placeholder gets replaced by Phase 6's sequential loop implementation.

</process>

<offer_next>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DISCOVERY COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found {N} phase(s) to plan.

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Plan individual phases** — or wait for Phase 6 (sequential loop)

`/gsd:plan-phase {first_unplanned}`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] ROADMAP.md exists and parsed
- [ ] Unplanned phases correctly identified
- [ ] Summary table displayed with phase number, name, status
- [ ] --dry-run flag exits after discovery without planning
- [ ] Nothing-to-plan case shows clean message with next steps
- [ ] User sees discovery results before any planning begins
</success_criteria>
