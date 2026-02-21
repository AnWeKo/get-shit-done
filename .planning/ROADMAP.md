# Roadmap: GSD Spec-Based Project Initialization

## Overview

This project adds a `/gsd-new-project-from-spec` command that reads a folder of markdown spec files and produces the same planning artifacts as the interactive `/gsd-new-project` flow — fully automated, no approval gates. The work progresses from getting the command to read and synthesize specs (Phase 1), through wiring the full artifact pipeline (Phase 2), adding brownfield and research validation support (Phase 3), to multi-runtime verification and polish (Phase 4).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Spec Reading & Synthesis** - Command entry point that reads spec files and produces PROJECT.md
- [ ] **Phase 2: Pipeline Automation** - Wire full artifact generation: config, research, requirements, roadmap, auto-commit
- [ ] **Phase 3: Brownfield & Validation** - Existing codebase detection and spec-vs-research validation
- [ ] **Phase 4: Multi-Runtime & Polish** - Cross-runtime compatibility and edge case handling

## Phase Details

### Phase 1: Spec Reading & Synthesis
**Goal**: User can run the command and get a valid PROJECT.md synthesized from their spec files
**Depends on**: Nothing (first phase)
**Requirements**: CMD-01, CMD-02, CMD-04, SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, PIPE-01
**Success Criteria** (what must be TRUE):
  1. User can run `/gsd-new-project-from-spec` (or `/gsd-new-project-from-spec ./my-specs/`) and the command starts the workflow
  2. Workflow reads all `.md` files from the spec folder, or shows a clear error if the folder is missing/empty
  3. Workflow produces a PROJECT.md that contains synthesized project context, requirements, constraints, and decisions extracted from the spec files — in the same format as the interactive flow
  4. When spec files contain contradictions or critical gaps, the workflow asks the user targeted questions instead of silently guessing
  5. Each spec file's role (PRD, tech spec, user stories, etc.) is identified and weighted during synthesis
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Command entry point & spec reading engine (validation, file reading, classification)
- [ ] 01-02-PLAN.md — Spec synthesis & PROJECT.md generation (conflict detection, gap handling, template-compliant output)

### Phase 2: Pipeline Automation
**Goal**: One command produces all planning artifacts (PROJECT.md → config.json → research → REQUIREMENTS.md → ROADMAP.md → STATE.md) and commits everything automatically
**Depends on**: Phase 1
**Requirements**: PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-08, PIPE-09
**Success Criteria** (what must be TRUE):
  1. Running the command on a spec folder produces all 6 planning artifacts (PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md, research/SUMMARY.md) without user intervention
  2. Config preferences are extracted from spec prose (e.g., "move fast" → quick depth, "mission-critical" → comprehensive depth) — or the user is asked when preferences aren't inferable
  3. Research phase runs automatically (4 parallel researchers + synthesizer) and its findings inform the generated requirements
  4. Generated REQUIREMENTS.md has domain-specific categories, proper REQ-IDs, and full traceability to roadmap phases
  5. All generated artifacts are committed to git automatically with no approval gates
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Brownfield & Validation
**Goal**: The command correctly handles existing codebases and validates spec assumptions against research findings
**Depends on**: Phase 2
**Requirements**: BRWN-01, BRWN-02, PIPE-07
**Success Criteria** (what must be TRUE):
  1. When run in a directory with existing code, the workflow detects the codebase and offers mapping before initialization
  2. Existing codebase capabilities appear as Validated requirements in the generated PROJECT.md
  3. Research findings that contradict spec assumptions are surfaced to the user with specific references to the conflicting spec content
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Multi-Runtime & Polish
**Goal**: The command works reliably across all supported runtimes and handles edge cases gracefully
**Depends on**: Phase 3
**Requirements**: CMD-03
**Success Criteria** (what must be TRUE):
  1. `/gsd-new-project-from-spec` works in Claude Code, OpenCode, and Gemini CLI (installer correctly converts the command for each runtime)
  2. Large spec folders (>100KB total) are handled without token limit failures
  3. End-to-end test: a realistic spec folder produces artifacts that are fully compatible with downstream GSD commands (`/gsd-plan-phase`, `/gsd-execute-plan`, etc.)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Spec Reading & Synthesis | 0/2 | Not started | - |
| 2. Pipeline Automation | 0/3 | Not started | - |
| 3. Brownfield & Validation | 0/2 | Not started | - |
| 4. Multi-Runtime & Polish | 0/2 | Not started | - |
