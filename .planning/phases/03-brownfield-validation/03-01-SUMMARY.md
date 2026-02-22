---
phase: 03-brownfield-validation
plan: 01
subsystem: workflow
tags: [brownfield, codebase-map, validated-requirements, capability-merging]

# Dependency graph
requires:
  - phase: 02-pipeline-automation
    provides: Full pipeline workflow (Steps 1-13) in new-project-from-spec.md
provides:
  - Brownfield-aware spec-from-file workflow with codebase capability merging
  - Three-branch brownfield detection (existing map, needs map, greenfield)
  - Validated requirements propagation through PROJECT.md, research agents, and REQUIREMENTS.md
affects: [03-02 (contradiction surfacing builds on same workflow), 04 (multi-runtime must handle brownfield path)]

# Tech tracking
tech-stack:
  added: []
  patterns: [codebase-capability-merging, validated-requirements-propagation, brownfield-context-injection]

key-files:
  created: []
  modified: [get-shit-done/workflows/new-project-from-spec.md]

key-decisions:
  - "Validated capabilities auto-marked without user confirmation (CONTEXT.md locked decision)"
  - "Partial overlaps split into Validated + Active line items"
  - "Unmentioned codebase capabilities listed in separate 'Existing Capabilities' section, not treated as requirements"
  - "All 4 researchers receive codebase context files conditionally"
  - "Validated items get N/A phase and Validated status in traceability table"

patterns-established:
  - "Conditional template sections: {If variable is not empty} pattern for brownfield/greenfield variants"
  - "Codebase context injection: researchers receive existing system context to focus research on gaps"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 3 Plan 1: Brownfield Codebase Detection & Capability Merging Summary

**Three-branch brownfield detection with codebase capability extraction flowing through PROJECT.md (Validated), research agents (context), and REQUIREMENTS.md (pre-satisfied items)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T09:01:49Z
- **Completed:** 2026-02-22T09:04:45Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Step 3 enhanced with three brownfield scenarios: existing codebase map (use/refresh), no map but existing code (map/skip), and greenfield (silent continue)
- Step 3b added to extract codebase capabilities from ARCHITECTURE.md and STACK.md, storing as `codebase_capabilities` and `codebase_context_files` variables
- Step 7 PROJECT.md template conditionally populates Validated section with partial overlap handling and "Existing Capabilities" section for unmentioned capabilities
- All 4 researcher agents (Stack, Features, Architecture, Pitfalls) receive codebase map files and brownfield context when available
- Step 11 REQUIREMENTS.md generation includes Validated items as checked items with N/A phase assignments

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance Step 3 brownfield offer with existing-map handling** - `e28a84d` (feat)
2. **Task 2: Merge Validated requirements into PROJECT.md, REQUIREMENTS.md, and research agents** - `ab506a8` (feat)

## Files Created/Modified
- `get-shit-done/workflows/new-project-from-spec.md` - Added brownfield detection (Step 3/3b), Validated requirements (Step 7), researcher codebase context (Step 10c), and Validated propagation (Step 11b/11c)

## Decisions Made
- Validated capabilities are auto-marked without user confirmation (mirrors CONTEXT.md locked decision)
- Partial overlaps between spec requirements and existing code are split into separate Validated + Active line items
- Codebase capabilities not mentioned in specs go into a separate "Existing Capabilities" section in PROJECT.md Context — they don't create requirements
- Validated items in REQUIREMENTS.md get N/A phase assignment and "Validated" status in traceability table
- All 4 researchers receive brownfield context conditionally, with summary note to focus research beyond existing capabilities

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Brownfield capability merging complete (BRWN-01, BRWN-02)
- Ready for 03-02-PLAN.md (spec-vs-research validation & contradiction surfacing, PIPE-07)
- Step 10e insertion point is ready for contradiction surfacing between research completion and requirements generation

---
*Phase: 03-brownfield-validation*
*Completed: 2026-02-22*
