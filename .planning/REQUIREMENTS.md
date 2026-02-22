# Requirements: GSD Batch Phase Planning

**Defined:** 2026-02-22
**Core Value:** One command to go from roadmap to fully planned phases — no manual phase-by-phase planning, no approval gates, no interaction.

## v2.0 Requirements

Requirements for `/gsd-plan-all` batch planning command.

### Command

- [x] **CMD-01**: User can invoke `/gsd-plan-all` to batch-plan all phases in the current roadmap
- [x] **CMD-02**: Command file follows existing GSD slash command conventions (YAML frontmatter, agent, tools)
- [x] **CMD-03**: Command works across all supported runtimes (Claude Code, OpenCode, Gemini CLI)

### Orchestration

- [x] **ORCH-01**: Workflow reads ROADMAP.md and identifies all unplanned phases
- [x] **ORCH-02**: Phases are planned sequentially in phase-number order
- [x] **ORCH-03**: Each phase invokes the existing plan-phase pipeline (researcher if config enabled, planner, checker if config enabled)
- [x] **ORCH-04**: Each phase plan is committed immediately after creation
- [x] **ORCH-05**: User sees progress updates as each phase completes (phase N of M status)

### Retry

- [x] **RTRY-01**: When plan-checker flags issues, planner is re-spawned with checker feedback automatically
- [x] **RTRY-02**: Retry is capped at a maximum number of attempts per phase (3 retries, matching existing plan-phase)
- [x] **RTRY-03**: If retries exhausted, best available plan is committed and workflow continues to next phase

### State

- [x] **STAT-01**: STATE.md is updated as each phase is planned (current phase, status, last activity)
- [x] **STAT-02**: On completion, STATE.md reflects all phases planned and ready for execution

## Future Requirements

### Cross-Phase Context

- **XCTX-01**: Phase N+1 planner can reference phase N plans for dependency context
- **XCTX-02**: Cross-phase context is summarized to avoid token bloat

### Execution Handoff

- **EXEC-01**: Optional `--auto-exec` flag continues into phase 1 execution after all plans complete
- **EXEC-02**: Auto-exec honors existing execute-phase workflow conventions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Parallel phase planning | Sequential ensures consistency; parallel deferred to future |
| Interactive approval gates | The entire point is zero interaction |
| Phase-specific flag overrides | All phases share same config; per-phase overrides add complexity |
| Plan editing/revision UI | Plans can be revised via existing `/gsd-plan-phase N` if needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMD-01 | Phase 5 | Complete |
| CMD-02 | Phase 5 | Complete |
| CMD-03 | Phase 5 | Complete |
| ORCH-01 | Phase 5 | Complete |
| ORCH-02 | Phase 6 | Complete |
| ORCH-03 | Phase 6 | Complete |
| ORCH-04 | Phase 6 | Complete |
| ORCH-05 | Phase 6 | Complete |
| STAT-01 | Phase 6 | Complete |
| RTRY-01 | Phase 7 | Complete |
| RTRY-02 | Phase 7 | Complete |
| RTRY-03 | Phase 7 | Complete |
| STAT-02 | Phase 7 | Complete |

**Coverage:**
- v2.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
