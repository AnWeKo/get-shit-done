# GSD: Spec-Based Project Initialization

## What This Is

A workflow for the Get Shit Done (GSD) meta-prompting system that initializes projects automatically from specification files. The `/gsd-new-project-from-spec` command reads markdown spec files from a folder, extracts all project context, and drives the full pipeline (PROJECT.md → config.json → research → REQUIREMENTS.md → ROADMAP.md → STATE.md) with minimal user interaction. Supports both greenfield and brownfield codebases, validates spec assumptions against research findings, and handles large spec folders gracefully.

## Core Value

Fully automated project initialization from spec files — the user provides specs, GSD produces a complete planning structure ready for `/gsd-plan-phase 1` without interactive questioning.

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

### Active

(None — next milestone requirements to be defined via `/gsd-new-milestone`)

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
*Last updated: 2026-02-22 after v1.0 milestone*
