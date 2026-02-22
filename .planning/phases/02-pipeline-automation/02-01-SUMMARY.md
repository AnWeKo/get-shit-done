---
phase: 02-pipeline-automation
plan: 01
subsystem: workflows
tags: [config-extraction, spec-inference, config-json, model-profile, workflow]

# Dependency graph
requires:
  - phase: 01-02
    provides: "Complete spec-from-file workflow with Steps 1-7 (reading, classification, synthesis, PROJECT.md)"
provides:
  - "Config extraction from spec prose with conservative inference and citations"
  - "Per-value user confirmation for all config settings"
  - "Model profile resolution step for agent spawning"
  - "Re-run detection for existing config.json"
affects: [02-02-research-requirements, 02-03-roadmap-commit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conservative spec prose inference — only infer when signal is very clear"
    - "Citation-backed config presentation — every inference shows source spec passage"
    - "Per-value AskUserQuestion confirmation — not freeform, structured choices"
    - "Signal-to-config mapping table for natural language to config value translation"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/new-project-from-spec.md

key-decisions:
  - "workflow.research always true for spec-from-file flow (locked decision)"
  - "Conservative inference: ambiguous signals default to asking user, not guessing"
  - "Per-value choices for config confirmation (not single freeform prompt)"
  - "User overrides logged to PROJECT.md Key Decisions table"
  - "No commit in config step — deferred to Plan 03 atomic commit"

patterns-established:
  - "Config inference pattern: scan spec prose → map signals → cite sources → confirm per-value"
  - "Re-run detection: existing config.json triggers 3-option choice (use/re-infer/fresh)"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 2 Plan 1: Config Extraction from Spec Prose Summary

**Config extraction with conservative spec prose inference, citation-backed per-value confirmation, re-run detection, and model profile resolution for agent spawning**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-22T08:19:24Z
- **Completed:** 2026-02-22T08:21:17Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced Step 8 "Done" with full Config Extraction from Specs step (8a-8e) covering re-run detection, spec prose analysis, unified config view, per-value confirmation, and config.json generation
- Added signal-to-config mapping table covering all 8 config keys with example spec phrases and defaults
- Added Step 9 "Resolve Model Profile" referencing init JSON model variables for downstream agent spawning
- Maintained file structure integrity (process/output/success_criteria tags intact)

## Task Commits

Tasks 1 and 2 were committed together (contiguous changes to same file):

1. **Task 1: Replace Step 8 "Done" with Config Extraction step** - `7208990` (feat)
2. **Task 2: Add Step 9 — Resolve Model Profile** - `7208990` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `get-shit-done/workflows/new-project-from-spec.md` — Replaced Step 8 "Done" (25 lines) with Step 8 "Config Extraction from Specs" + Step 9 "Resolve Model Profile" (140 lines added). File grew from 504 to 619 lines.

## Decisions Made
- `workflow.research` is always `true` for spec-from-file flow — research always runs to validate and supplement spec content (locked decision from CONTEXT.md)
- Conservative inference only: ambiguous spec signals default to asking user, not guessing
- Per-value AskUserQuestion choices for each config key (not a single freeform prompt)
- User overrides logged as decisions in PROJECT.md Key Decisions table
- No commit in config step — all artifacts committed atomically in Plan 03

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Step 8 (Config Extraction) and Step 9 (Model Resolution) are in place
- Ready for Plan 02 to add Steps 10-11 (Research execution and REQUIREMENTS.md generation)
- No blockers or concerns

---
*Phase: 02-pipeline-automation*
*Completed: 2026-02-22*
