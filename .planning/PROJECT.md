# GSD: Spec-Based Project Initialization

## What This Is

A new workflow for the Get Shit Done (GSD) meta-prompting system that initializes projects automatically from specification files. Instead of the interactive questioning flow of `/gsd-new-project`, the new `/gsd-new-project-from-spec` command reads markdown spec files from a folder, extracts all project context, and drives the full pipeline (PROJECT.md → config.json → research → REQUIREMENTS.md → ROADMAP.md → STATE.md) with minimal user interaction. Only asks the user when crucial information is missing or ambiguous.

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

### Active

- [ ] New `/gsd-new-project-from-spec` command and workflow
- [ ] Spec folder reading — read all markdown files from a folder (default `./specs/`, configurable via argument)
- [ ] Spec synthesis — extract project context, requirements, constraints, decisions from arbitrary spec files
- [ ] Auto-generation of PROJECT.md from spec content
- [ ] Config.json extraction from spec or fallback to user prompts
- [ ] Research phase always runs — validates and supplements spec content
- [ ] Auto-generation of REQUIREMENTS.md with proper REQ-IDs and categories
- [ ] Auto-generation of ROADMAP.md and STATE.md via roadmapper
- [ ] Minimal interaction — only ask user when crucial info is missing or ambiguous
- [ ] No approval gates — fully automatic pipeline, commit everything
- [ ] Brownfield support — detect existing code, offer codebase mapping (same as gsd-new-project)
- [ ] Multi-runtime compatibility — command works in Claude Code, OpenCode, and Gemini CLI

### Out of Scope

- Non-markdown spec formats — specs must be structured markdown
- Spec validation/linting tool — the agent interprets specs, doesn't enforce a schema
- Incremental spec updates after initialization — use existing GSD workflows for changes
- Changes to the existing `/gsd-new-project` interactive flow — this is additive

## Context

This extends the existing GSD meta-prompting system (npm: `get-shit-done-cc`, v1.20.5). The system already has a three-tier architecture: slash commands → workflows → agents. The new feature follows the same pattern: a new slash command (`gsd-new-project-from-spec`) delegates to a new workflow file, which orchestrates spec reading, synthesis, and the existing agent pipeline (researchers, roadmapper).

The existing `/gsd-new-project` flow has 8+ phases of interactive questioning before generating artifacts. This new flow replaces the questioning phase with spec file parsing, keeping all downstream phases (research, requirements, roadmap) intact.

Key existing components this builds on:
- `commands/gsd/new-project.md` — existing interactive command (pattern to follow)
- `get-shit-done/workflows/new-project.md` — existing interactive workflow (reuse structure)
- `gsd-project-researcher` agent — spawned for research phase
- `gsd-research-synthesizer` agent — synthesizes research outputs
- `gsd-roadmapper` agent — creates ROADMAP.md and STATE.md
- `bin/install.js` — must register new command for all three runtimes
- `get-shit-done/bin/gsd-tools.cjs` — may need new subcommands for spec reading

## Constraints

- **Architecture**: Must follow existing command → workflow → agent pattern
- **Zero dependencies**: No new npm dependencies — Node.js stdlib only
- **Multi-runtime**: New command must work in Claude Code, OpenCode, and Gemini CLI (installer handles conversion)
- **Existing templates**: Must produce artifacts using existing templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- **Git identity**: Git user must be configured for commits to work

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spec folder with default path | Flexible — user can organize specs however they want | — Pending |
| Research always runs | Specs can have blind spots — research validates and supplements | — Pending |
| No approval gates | Spec is source of truth — full automation is the point | — Pending |
| Config from spec or ask | Graceful degradation — extract if present, ask if not | — Pending |
| Same output artifacts as gsd-new-project | Downstream tools (plan-phase, execute-phase) work unchanged | — Pending |

---
*Last updated: 2026-02-21 after initialization*
