# GSD: Spec-Based Initialization & Batch Planning

## What This Is

A meta-prompting system for the Get Shit Done (GSD) framework that automates project initialization and batch planning. Two key capabilities:

1. **`/gsd-new-project-from-spec`** — reads markdown spec files and produces all planning artifacts (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md) with zero interaction.
2. **`/gsd-plan-all`** — reads ROADMAP.md and batch-plans every phase sequentially, with auto-retry on checker failures, atomic commits, and clean completion state.

Both commands follow the GSD command -> workflow -> agent architecture and work across Claude Code, OpenCode, and Gemini CLI.

## Core Value

One command to go from roadmap to fully planned phases — no manual phase-by-phase planning, no approval gates, no interaction.

## Requirements

### Validated

- ✓ Interactive project initialization via `/gsd-new-project` — existing
- ✓ Slash command -> workflow -> agent architecture — existing
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
- ✓ `/gsd-plan-all` command with batch planning workflow — v2.0
- ✓ Roadmap parsing to discover unplanned phases — v2.0
- ✓ Sequential phase planning with plan-phase subagent per phase — v2.0
- ✓ Config-driven research and plan-check behavior — v2.0
- ✓ Auto-retry on plan-checker failures (3 attempts, auto-proceed) — v2.0
- ✓ Atomic commits per phase plan — v2.0
- ✓ STATE.md updated during and after batch planning — v2.0
- ✓ Cross-runtime compatibility for plan-all command — v2.0

### Active

(None — next milestone not yet defined)

### Out of Scope

- Non-markdown spec formats — specs must be structured markdown
- Spec validation/linting tool — the agent interprets specs, doesn't enforce a schema
- Incremental spec updates after initialization — use existing GSD workflows for changes
- Changes to the existing `/gsd-new-project` interactive flow — this is additive
- Spec file caching for incremental re-reads — deferred (CACHE-01)
- Informational spec quality scoring — deferred (SCORE-01)
- Parallel phase planning — sequential ensures consistency; deferred
- Interactive approval gates in batch mode — the entire point is zero interaction
- Phase-specific flag overrides — all phases share same config
- Cross-phase context (phase N+1 references phase N plans) — deferred (XCTX-01, XCTX-02)
- Optional `--auto-exec` parameter — deferred (EXEC-01, EXEC-02)

## Context

Shipped v1.0 with 25 files changed (3,337 lines) across 4 phases and 9 plans in 2 days.
Shipped v2.0 with 22 files changed (2,559 lines) across 3 phases and 4 plans in 1 day.

Tech stack: Node.js (zero dependencies), CJS modules, YAML frontmatter.
Architecture: slash command -> workflow -> agent (follows existing GSD pattern).
Test suite: 89+ passing tests covering CLI tools.

Key v2.0 deliverables:
- 1 command file: `commands/gsd/plan-all.md`
- 1 workflow file: `get-shit-done/workflows/plan-all.md` (314 lines)
- 2 CLI additions: `roadmap unplanned`, `init plan-all`
- 5 unit tests for roadmap unplanned filtering
- `--batch` flag for plan-phase autonomous operation

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
| 3 phases for 13 requirements | Tightly coupled workflow, natural boundaries at command/loop/retry | ✓ Good |
| Extract analyzeRoadmapInternal | Reuse from cmdRoadmapAnalyze for init plan-all and roadmap unplanned | ✓ Good |
| Sequential subagent loop | Fresh context window per phase — matches plan-phase auto-advance pattern | ✓ Good |
| Failed phases continue loop | Report at end rather than abort — maximizes batch value | ✓ Good |
| `--batch` flag for plan-phase | Makes all interactive points auto-proceed — preserves interactive mode | ✓ Good |

## Constraints

- **Architecture**: Must follow existing command -> workflow -> agent pattern
- **Zero dependencies**: No new npm dependencies — Node.js stdlib only
- **Multi-runtime**: New commands must work in Claude Code, OpenCode, and Gemini CLI (installer handles conversion)
- **Existing templates**: Must produce artifacts using existing templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- **Git identity**: Git user must be configured for commits to work

---
*Last updated: 2026-02-22 after v2.0 milestone complete*
