---
phase: 04-multi-runtime-polish
plan: 01
subsystem: workflow
tags: [content-budgeting, large-spec-folders, edge-cases, priority-tiers]

# Dependency graph
requires:
  - phase: 01-spec-reading-synthesis
    provides: 9 classification roles for spec file types
  - phase: 01-spec-reading-synthesis
    provides: spec file reading and classification in Steps 4-5
provides:
  - Priority-based content budgeting for large spec folders (>100KB)
  - Edge case handling for empty files, encoding errors, and non-markdown files
  - Summarized file notification rule for contradiction resolution
affects: [04-02 cross-runtime verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [priority-tiered content budgeting, graceful degradation for unreadable files]

key-files:
  created: []
  modified: [get-shit-done/workflows/new-project-from-spec.md]

key-decisions:
  - "100KB threshold for content budget activation"
  - "3 priority tiers: Tier 1 always full, Tier 2 full if budget allows, Tier 3 summarize when over"
  - "Summarization notices only shown when relevant to contradiction/gap resolution"
  - "Empty .md files skipped silently, encoding errors handled gracefully"

patterns-established:
  - "Content budget gate: check size after reading, trim after classification"
  - "Priority-based summarization: classify first, then use roles to determine what to preserve"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 4 Plan 1: Large Spec Folder Resilience Summary

**Priority-based content budgeting system (100KB threshold) with 3 tiers across all 9 classification roles, plus edge case handling for empty/unreadable/non-markdown files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T09:46:44Z
- **Completed:** 2026-02-22T09:48:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added content budget system across Steps 4-6 of the new-project-from-spec workflow
- Tier 1 files (PRD, tech spec, constraints) always read in full regardless of folder size
- Tier 2/3 files summarized when over 100KB budget, preserving key requirements and contradictory content
- User only notified about summarized files when they're involved in contradiction/gap resolution
- Edge cases handled: empty .md files skipped silently, encoding errors handled gracefully, non-markdown file warning improved

## Task Commits

Each task was committed atomically:

1. **Task 1: Add content budget system and edge case handling** - `71f9f31` (feat)

## Files Created/Modified
- `get-shit-done/workflows/new-project-from-spec.md` - Added content budgeting (Steps 4-5b) and summarized file notification rule (Step 6), plus edge case handling

## Decisions Made
- 100KB threshold chosen per CONTEXT.md decision
- All 9 classification roles assigned to 3 priority tiers per CONTEXT.md guidance
- Summarized file notices only appear during contradiction resolution (not proactively listed) per CONTEXT.md notification rule

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Content budgeting complete, ready for 04-02-PLAN.md (cross-runtime verification & E2E test fixture)
- No blockers

---
*Phase: 04-multi-runtime-polish*
*Completed: 2026-02-22*
