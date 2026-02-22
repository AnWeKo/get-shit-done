<purpose>
Batch-plan all unplanned roadmap phases. Discovers which phases need planning, displays
a summary table, then plans each one sequentially using the existing plan-phase pipeline.
Each phase gets a fresh context window via Task subagent, with STATE.md updated and
results committed after each phase completes.
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

## 5. Sequential Planning Loop

Initialize tracking:
```
PHASE_RESULTS = []    # Array of { number, name, result: "success" | "checkpoint" | "failed", error? }
SUCCESS_COUNT = 0
FAILURE_COUNT = 0
TOTAL_TO_PLAN = unplanned_count   # from init JSON
CURRENT_INDEX = 0
```

**For each phase in `unplanned_phases` (already sorted by phase number from init):**

```
CURRENT_INDEX += 1
PHASE_NUM = phase.number
PHASE_NAME = phase.name
```

### 5.1 Display Phase Banner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PLANNING PHASE {PHASE_NUM} ({CURRENT_INDEX}/{TOTAL_TO_PLAN})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {PHASE_NUM}: {PHASE_NAME}
```

### 5.2 Update STATE.md

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs state patch \
  --"Current focus" "Phase {PHASE_NUM} — {PHASE_NAME}" \
  --"Status" "Batch planning" \
  --"Last activity" "{date} — Planning phase {PHASE_NUM}"
```

### 5.3 Spawn plan-phase Subagent

Build flags string from init config:
- Always add: `--batch` (enables autonomous retry handling)
- If `research_enabled` is false: add `--skip-research`
- If `plan_checker_enabled` is false: add `--skip-verify`

Spawn a Task subagent to plan this phase:

```
Task(
  prompt="
    <objective>
    You are the plan-phase orchestrator. Plan Phase {PHASE_NUM}: {PHASE_NAME}.
    </objective>

    <execution_context>
    @~/.claude/get-shit-done/workflows/plan-phase.md
    @~/.claude/get-shit-done/references/ui-brand.md
    </execution_context>

    <arguments>
    PHASE={PHASE_NUM}
    ARGUMENTS='{PHASE_NUM} {flags}'
    </arguments>

    <instructions>
    1. Read plan-phase.md from execution_context for your complete workflow
    2. Follow ALL steps: initialize, parse arguments, validate phase, load context, handle research, check existing, spawn planner, handle checker/revision loop
    3. When spawning researcher/planner/checker agents, use the model and subagent_type from the workflow
    4. Do NOT use the Skill tool or /gsd: commands — reference workflow files directly with @file
    5. Return your final status: PLANNING COMPLETE, CHECKPOINT REACHED, or PLANNING INCONCLUSIVE
    6. The --batch flag ensures autonomous operation — plan-phase will auto-proceed on retry exhaustion without user interaction
    </instructions>
  ",
  subagent_type="general-purpose",
  description="Plan Phase {PHASE_NUM}"
)
```

### 5.4 Handle plan-phase Return

**If return contains "PLANNING COMPLETE":**
```
SUCCESS_COUNT += 1
PHASE_RESULTS.push({ number: PHASE_NUM, name: PHASE_NAME, result: "success" })
```
Display: `✓ Phase {PHASE_NUM} planned`

**If return contains "CHECKPOINT REACHED":**
```
SUCCESS_COUNT += 1
PHASE_RESULTS.push({ number: PHASE_NUM, name: PHASE_NAME, result: "checkpoint" })
```
Display: `⚠ Phase {PHASE_NUM} planned (checkpoint skipped in batch mode)`

**If return contains "PLANNING INCONCLUSIVE" or an error occurs:**
```
FAILURE_COUNT += 1
PHASE_RESULTS.push({ number: PHASE_NUM, name: PHASE_NAME, result: "failed", error: error_message })
```
Display: `✗ Phase {PHASE_NUM} failed — continuing to next phase`

### 5.5 Commit Planning Docs

If `commit_docs` is true (from init):
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit-docs "docs(phase-{PHASE_NUM}): batch plan phase {PHASE_NUM}"
```

### 5.6 Display Progress

```
Progress: {CURRENT_INDEX}/{TOTAL_TO_PLAN} phases planned
```

**End of loop — continue to next phase in `unplanned_phases`.**

---

### 5.7 Completion Summary

After all phases have been processed:

Display completion banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► BATCH PLANNING COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Display results table:
```
| Phase | Name | Result |
|-------|------|--------|
```
For each entry in PHASE_RESULTS:
- result "success" → `✓ Planned`
- result "checkpoint" → `⚠ Planned (checkpoint skipped)`
- result "failed" → `✗ Failed`

Display summary: `{SUCCESS_COUNT} of {TOTAL_TO_PLAN} phases planned successfully.`

Update STATE.md with final state:

**If FAILURE_COUNT == 0 (all succeeded):**
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs state patch \
  --"Status" "All phases planned — ready for execution" \
  --"Last activity" "{date} — Batch planned {SUCCESS_COUNT}/{TOTAL_TO_PLAN} phases" \
  --"Current focus" "Ready for /gsd-execute-phase"
```

**If FAILURE_COUNT > 0:**
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs state patch \
  --"Status" "Batch planning complete ({FAILURE_COUNT} failed)" \
  --"Last activity" "{date} — Batch planned {SUCCESS_COUNT}/{TOTAL_TO_PLAN} phases ({FAILURE_COUNT} failed)" \
  --"Current focus" "Review failed phases"
```
Display:
```
{FAILURE_COUNT} phase(s) had issues — plan manually:
```
For each failed phase: `/gsd:plan-phase {phase_number}`

</process>

<offer_next>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► BATCH PLANNING COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**{SUCCESS_COUNT} of {TOTAL_TO_PLAN} phases planned.**

| Phase | Name | Result |
|-------|------|--------|
(results table from Step 5.7)

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute Phase {first_phase}** — start running the phase plans

`/gsd:execute-phase {first_phase}`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd:plan-phase {N}` — re-plan any failed phases
- `/gsd:progress` — view project progress

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
- [ ] Sequential loop iterates each unplanned phase in order
- [ ] Each phase spawns plan-phase as a Task subagent with correct flags
- [ ] STATE.md updated via state patch before each phase and after completion
- [ ] Planning docs committed after each successful phase plan
- [ ] Progress displayed as each phase completes (N of M)
- [ ] Failed phases do not abort the loop — reported at the end
- [ ] Completion banner shows results table with per-phase status
- [ ] --batch flag is passed to plan-phase subagent for autonomous retry handling
- [ ] Final STATE.md update reflects "ready for execution" when all phases succeed
</success_criteria>
