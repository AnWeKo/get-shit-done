---
phase: 05-command-phase-discovery
plan: 01
subsystem: cli
tags: [gsd-tools, roadmap, discovery, init]

# Dependency graph
requires:
  - phase: 01-04 (v1.0)
    provides: gsd-tools CLI framework, roadmap analyze, init pattern
provides:
  - "roadmap unplanned subcommand — filters phases with no plans and not complete"
  - "init plan-all compound init — pre-computes all context for plan-all workflow"
  - "analyzeRoadmapInternal helper — reusable roadmap analysis without output"
affects: [05-02, 06-sequential-planning-loop]

# Tech tracking
tech-stack:
  added: []
  patterns: [internal-helper-extraction, analysis-reuse]

key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/roadmap.cjs
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/gsd-tools.cjs
    - tests/roadmap.test.cjs

key-decisions:
  - "Extracted analyzeRoadmapInternal from cmdRoadmapAnalyze for reuse — cleaner than standalone duplicate"
  - "cmdInitPlanAll uses lazy require of roadmap.cjs to avoid circular dependency"

patterns-established:
  - "Internal helper extraction: extract *Internal() from cmd* for cross-module reuse"

requirements-completed: [ORCH-01]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 5 Plan 1: Roadmap Unplanned & Init Plan-All Summary

**`roadmap unplanned` and `init plan-all` CLI subcommands with 5 unit tests covering filtering, completion exclusion, and edge cases**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T12:40:39Z
- **Completed:** 2026-02-22T12:43:41Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extracted `analyzeRoadmapInternal` helper from `cmdRoadmapAnalyze` for reuse without duplicating logic
- Added `roadmap unplanned` subcommand that filters phases with no plans AND not roadmap-complete
- Added `init plan-all` compound init returning config flags, file paths, and unplanned phases
- Added 5 unit tests covering all filtering scenarios from CONTEXT.md decisions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add roadmap unplanned subcommand** - `a9d8460` (feat)
2. **Task 2: Add init plan-all and tests** - `c9ba239` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/roadmap.cjs` - Extracted analyzeRoadmapInternal, added cmdRoadmapUnplanned
- `get-shit-done/bin/lib/init.cjs` - Added cmdInitPlanAll with unplanned phase discovery
- `get-shit-done/bin/gsd-tools.cjs` - Router wiring for both new subcommands
- `tests/roadmap.test.cjs` - 5 new tests for roadmap unplanned command

## Decisions Made
- Extracted `analyzeRoadmapInternal` from `cmdRoadmapAnalyze` rather than duplicating parsing logic — cleaner approach, both functions share the same analysis
- Used lazy `require('./roadmap.cjs')` inside `cmdInitPlanAll` to avoid potential circular dependency issues between init.cjs and roadmap.cjs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both CLI primitives ready for Plan 02 (command file, workflow, installer)
- `analyzeRoadmapInternal` exported for any future consumers needing roadmap analysis without output

---
*Phase: 05-command-phase-discovery*
*Completed: 2026-02-22*
