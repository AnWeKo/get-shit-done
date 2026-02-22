# Roadmap: GSD Batch Phase Planning

## Milestones

- ✅ **v1.0 Spec-Based Initialization** - Phases 1-4 (shipped 2026-02-22)
- 🚧 **v2.0 Batch Phase Planning** - Phases 5-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 Spec-Based Initialization (Phases 1-4) — SHIPPED 2026-02-22</summary>

Delivered `/gsd-new-project-from-spec` with full 13-step pipeline. 25 files, 3,337 lines, 4 phases, 9 plans.

See MILESTONES.md for details.

</details>

### 🚧 v2.0 Batch Phase Planning

**Milestone Goal:** One command to batch-plan all roadmap phases with zero interaction.

- [x] **Phase 5: Command & Phase Discovery** - Slash command that parses ROADMAP.md and identifies all unplanned phases (completed 2026-02-22)
- [x] **Phase 6: Sequential Planning Loop** - Core orchestration that plans each phase in order, commits, and reports progress (completed 2026-02-22)
- [x] **Phase 7: Retry & Completion** - Auto-retry on checker failures and clean completion state (completed 2026-02-22)

## Phase Details

### Phase 5: Command & Phase Discovery
**Goal**: User can invoke `/gsd-plan-all` and the system identifies which phases need planning
**Depends on**: v1.0 complete (phases 1-4)
**Requirements**: CMD-01, CMD-02, CMD-03, ORCH-01
**Success Criteria** (what must be TRUE):
  1. User can type `/gsd-plan-all` and the command is recognized across all supported runtimes (Claude Code, OpenCode, Gemini CLI)
  2. The command file follows GSD conventions (YAML frontmatter, agent reference, tool grants)
  3. The workflow reads ROADMAP.md and correctly identifies all unplanned phases by phase number
  4. If no unplanned phases exist, the user sees a clear "nothing to plan" message
**Plans:** 2/2 plans complete

Plans:
- [ ] 05-01-PLAN.md — CLI tooling: roadmap unplanned subcommand + init plan-all + tests
- [ ] 05-02-PLAN.md — Slash command + discovery workflow for /gsd-plan-all

### Phase 6: Sequential Planning Loop
**Goal**: Every unplanned phase gets a complete plan, committed individually, with the user seeing progress throughout
**Depends on**: Phase 5
**Requirements**: ORCH-02, ORCH-03, ORCH-04, ORCH-05, STAT-01
**Success Criteria** (what must be TRUE):
  1. Phases are planned in ascending phase-number order (phase 5 before phase 6, etc.)
  2. Each phase invokes the existing plan-phase pipeline, honoring config.json settings (research on/off, plan-check on/off)
  3. Each completed phase plan is git committed immediately before the next phase begins
  4. User sees progress updates as each phase completes (e.g., "Phase 2 of 5 planned")
  5. STATE.md is updated with current phase, status, and last activity as each phase is planned
**Plans:** 1/1 plans complete

Plans:
- [x] 06-01-PLAN.md — Sequential planning loop in plan-all workflow + command update

### Phase 7: Retry & Completion
**Goal**: Plan-checker failures are handled automatically, and batch planning ends with a clean state
**Depends on**: Phase 6
**Requirements**: RTRY-01, RTRY-02, RTRY-03, STAT-02
**Success Criteria** (what must be TRUE):
  1. When plan-checker flags issues, the planner is automatically re-invoked with checker feedback — no user intervention
  2. Retries are capped at 3 attempts per phase (matching existing plan-phase behavior)
  3. If retries are exhausted, the best available plan is committed and the workflow continues to the next phase (does not abort)
  4. On completion, STATE.md reflects all phases planned with status ready for execution
**Plans:** 1/1 plans complete

Plans:
- [ ] 07-01-PLAN.md — Batch-mode retry handling and clean completion state

## Progress

**Execution Order:** Phase 5 → Phase 6 → Phase 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | 9/9 | Complete | 2026-02-22 |
| 5. Command & Phase Discovery | v2.0 | Complete    | 2026-02-22 | - |
| 6. Sequential Planning Loop | v2.0 | 1/1 | Complete | 2026-02-22 |
| 7. Retry & Completion | 1/1 | Complete   | 2026-02-22 | - |
