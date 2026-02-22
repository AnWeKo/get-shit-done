# GSD: Batch Phase Planning

## What This Is

A `/gsd-plan-all` command for the Get Shit Done (GSD) meta-prompting system that automatically generates execution plans for every phase in a roadmap with zero user interaction. Reads ROADMAP.md and REQUIREMENTS.md, plans each phase sequentially (so later phases can reference earlier plans), honors config.json for research and plan-checking, auto-retries when the plan-checker flags issues, and commits each plan as it's created. Optional `--auto-exec` parameter continues into phase 1 execution after all plans are ready.

## Core Value

One command to go from roadmap to fully planned phases — no manual phase-by-phase planning, no approval gates, no interaction.

## Requirements

### Validated

- ✓ Interactive project initialization via `/gsd-new-project` — existing
- ✓ Slash command → workflow → agent architecture — existing
- ✓ CLI tools (`gsd-tools.cjs`) for state management — existing
- ✓ Research pipeline (4 parallel researchers + synthesizer) — existing
- ✓ Roadmap generation via `gsd-roadmapper` agent — existing
- ✓ Requirements definition with REQ-IDs and traceability — existing
- ✓ Multi-runtime installer (Claude Code, OpenCode, Gemini CLI) — existing
- ✓ Brownfield detection and codebase mapping — existing
- ✓ Workflow preferences and config.json — existing
- ✓ `/gsd-new-project-from-spec` command and workflow — v1.0
- ✓ Spec folder reading (all markdown files, default `./specs/`) — v1.0
- ✓ Spec synthesis with contradiction detection and gap analysis — v1.0
- ✓ Auto-generation of PROJECT.md from spec content — v1.0
- ✓ Config extraction from spec prose with conservative inference — v1.0
- ✓ Research always runs to validate and supplement spec content — v1.0
- ✓ Auto-generation of REQUIREMENTS.md with REQ-IDs and categories — v1.0
- ✓ Auto-generation of ROADMAP.md and STATE.md via roadmapper — v1.0
- ✓ No approval gates — fully automatic pipeline — v1.0
- ✓ Brownfield support with codebase capability merging — v1.0
- ✓ Cross-runtime compatibility (Claude Code, OpenCode, Gemini CLI) — v1.0
- ✓ Content budgeting for large spec folders (100KB threshold) — v1.0
- ✓ Spec-vs-research validation with contradiction surfacing — v1.0

## Current Milestone: v2.0 Batch Phase Planning

**Goal:** Automated batch planning of all roadmap phases via a single `/gsd-plan-all` command.

**Target features:**
- `/gsd-plan-all` command that reads ROADMAP.md and plans every phase automatically
- Sequential planning (phase N plan available as context for phase N+1)
- Config-aware: honors workflow.research and workflow.plan_check settings
- Auto-retry on plan-checker failures with checker feedback
- Atomic commits per phase plan
- Optional `--auto-exec` parameter to kick off phase 1 execution after planning
- Cross-runtime compatibility (Claude Code, OpenCode, Gemini CLI)

### Active

- [ ] `/gsd-plan-all` command with batch planning workflow
- [ ] Sequential phase planning with cross-phase context
- [ ] Config-driven research and plan-check behavior
- [ ] Auto-retry on plan-checker failures
- [ ] Optional `--auto-exec` parameter
- [ ] Cross-runtime compatibility

### Out of Scope

- Non-markdown spec formats — specs must be structured markdown
- Spec validation/linting tool — the agent interprets specs, doesn't enforce a schema
- Incremental spec updates after initialization — use existing GSD workflows for changes
- Changes to the existing `/gsd-new-project` interactive flow — this is additive
- Spec file caching for incremental re-reads — deferred to v2 (CACHE-01)
- Informational spec quality scoring — deferred to v2 (SCORE-01)

## Context

Shipped v1.0 with 25 files changed (3,337 lines added) across 4 phases and 9 plans in 2 days.

Tech stack: Node.js (zero new dependencies), CJS modules, YAML frontmatter.
Architecture: slash command → workflow → agent (follows existing GSD pattern).

Key deliverables:
- 1 command file: `commands/gsd/new-project-from-spec.md` (44 lines)
- 1 workflow file: `get-shit-done/workflows/new-project-from-spec.md` (1,378 lines, 13 steps)
- 3 test fixtures: `tests/fixtures/spec-e2e/` (PRD, tech spec, user stories)
- 1 test file: `tests/e2e-spec-from-file.test.cjs` (8 tests)
- Total test suite: 89 passing, 0 failing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spec folder with default path | Flexible — user can organize specs however they want | ✓ Good |
| Research always runs | Specs can have blind spots — research validates and supplements | ✓ Good |
| No approval gates | Spec is source of truth — full automation is the point | ✓ Good |
| Config from spec or ask | Graceful degradation — extract if present, ask if not | ✓ Good |
| Same output artifacts as gsd-new-project | Downstream tools (plan-phase, execute-phase) work unchanged | ✓ Good |
| Reuse existing `init new-project` CLI command | No new init subcommand needed | ✓ Good |
| Top-level only spec file reading | Keeps spec folder semantics simple | ✓ Good |
| 9 classification roles for spec types | Covers common document types without over-fitting | ✓ Good |
| Major/minor contradiction classification | Major asks user, minor auto-resolves — balances automation with correctness | ✓ Good |
| Batched questions with citations | Single presentation with source references — better UX | ✓ Good |
| 100KB content budget threshold | Priority tiers preserve important content while staying within limits | ✓ Good |
| Source file validation for cross-runtime | Verify structure patterns rather than calling installer (not exported) | ✓ Good |

## Constraints

- **Architecture**: Must follow existing command → workflow → agent pattern
- **Zero dependencies**: No new npm dependencies — Node.js stdlib only
- **Multi-runtime**: New command must work in Claude Code, OpenCode, and Gemini CLI (installer handles conversion)
- **Existing templates**: Must produce artifacts using existing templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- **Git identity**: Git user must be configured for commits to work

---
*Last updated: 2026-02-22 after v2.0 milestone started*
