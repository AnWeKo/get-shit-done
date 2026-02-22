---
phase: 03-brownfield-validation
plan: 02
subsystem: workflow
tags: [contradiction-surfacing, spec-validation, research-vs-spec, user-resolution]

# Dependency graph
requires:
  - phase: 03-brownfield-validation
    plan: 01
    provides: Brownfield-aware workflow with codebase capability merging (Steps 3-3b, 7, 10c, 11b)
  - phase: 02-pipeline-automation
    provides: Full pipeline workflow (Steps 1-13) with research phase (Step 10)
provides:
  - Spec-vs-research validation step (10f/10g/10h) surfacing contradictions between spec assumptions and research findings
  - Major/minor contradiction classification with user resolution options (Keep/Accept/Custom)
  - Resolution flow through PROJECT.md Key Decisions and REQUIREMENTS.md
  - Updated workflow metadata reflecting brownfield and validation capabilities
affects: [04 (multi-runtime must handle validation step), future phases using this workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: [spec-research-contradiction-surfacing, grouped-summary-presentation, resolution-ripple-propagation]

key-files:
  created: []
  modified: [get-shit-done/workflows/new-project-from-spec.md]

key-decisions:
  - "Four contradiction categories: tech choice conflicts, deprecated/risky deps, architectural mismatches, feasibility concerns"
  - "Major = high impact AND high confidence; everything else = minor (CONTEXT.md locked decision)"
  - "Minor contradictions noted as Key Decisions flags with Revisit outcome, non-blocking"
  - "Major contradictions presented with AskUserQuestion: Keep spec / Accept research / Custom"
  - "Custom resolutions replace original spec assumption in PROJECT.md and flow to requirements"
  - "Contradiction surfacing extends but doesn't replace 'research informs only' principle"

patterns-established:
  - "Contradiction resolution options: Keep/Accept/Custom with distinct PROJECT.md Key Decisions outcomes (Confirmed/Updated/Custom)"
  - "Resolution ripple: Accept and Custom resolutions update both PROJECT.md and REQUIREMENTS.md requirement text"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 3 Plan 2: Spec-vs-Research Validation & Contradiction Surfacing Summary

**Spec-vs-research contradiction detection (4 categories) with major/minor classification, grouped presentation, and three resolution paths flowing through PROJECT.md and REQUIREMENTS.md**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T09:07:57Z
- **Completed:** 2026-02-22T09:09:53Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Steps 10f/10g/10h inserted between research completion and requirements generation for spec-vs-research validation
- Four contradiction categories: tech choice conflicts, deprecated/risky dependencies, architectural mismatches, feasibility concerns
- Major/minor classification using both impact scope and research confidence
- Three resolution options for major contradictions (Keep spec / Accept research / Custom) with distinct Key Decisions outcomes
- Resolution ripple: Accept and Custom resolutions update PROJECT.md and REQUIREMENTS.md requirement text
- Workflow metadata (purpose, output, success_criteria, completion summary) updated for brownfield and validation features

## Task Commits

Each task was committed atomically:

1. **Task 1: Insert Step 10.5 — Spec-vs-Research Validation** - `09443b9` (feat)
2. **Task 2: Update workflow metadata and success criteria** - `74b5c14` (feat)

## Files Created/Modified
- `get-shit-done/workflows/new-project-from-spec.md` - Added Steps 10f/10g/10h (contradiction detection, surfacing, resolution) and updated purpose, output, success_criteria, completion summary sections

## Decisions Made
- Four contradiction categories mirror CONTEXT.md locked decisions (all four worth surfacing)
- Major = high impact (architecture/core tech) AND high confidence (strong contradiction); everything else = minor
- Minor contradictions added as Key Decisions flags with `Research disagrees:` rationale and `Revisit` outcome
- Custom resolutions replace original spec assumption entirely (CONTEXT.md locked decision)
- Contradiction surfacing extends the "research informs only" principle — research can now challenge spec assumptions, but only through explicit user resolution

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 complete (BRWN-01, BRWN-02, PIPE-07 all covered)
- Workflow now handles: greenfield, brownfield with codebase map, spec-vs-research contradiction surfacing
- Ready for Phase 4 (multi-runtime compatibility and polish)

---
*Phase: 03-brownfield-validation*
*Completed: 2026-02-22*
