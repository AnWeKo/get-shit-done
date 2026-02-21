# Project Research Summary

**Project:** Spec-Based Project Initialization (`/gsd-new-project-from-spec`)
**Domain:** Markdown spec parsing → structured artifact generation (GSD meta-prompting system extension)
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This project extends the existing GSD meta-prompting system with a new command that reads a folder of arbitrary markdown spec files and produces the same planning artifacts as the interactive `/gsd-new-project` flow. The research is unambiguous: **the stack is predetermined (Node.js CommonJS, zero dependencies), the architecture is a thin preprocessing layer atop an existing pipeline, and ~80% of the system is reuse.** The core engineering challenge is not technology selection but designing the spec synthesis step — where an LLM agent reads arbitrary, potentially contradictory markdown files and produces structured, format-compliant artifacts that don't break 25+ downstream commands.

The recommended approach is to create exactly 2 new files: a slash command (`commands/gsd/new-project-from-spec.md`) and a workflow (`workflows/new-project-from-spec.md`). The workflow replaces the interactive questioning phase with agent-driven spec reading and synthesis, then feeds the identical downstream pipeline (research → requirements → roadmap). No new agents, no new npm dependencies, no new templates. The existing installer auto-discovers new command files, so no installer code changes are needed either. An optional CLI subcommand (`init new-project-from-spec`) can be added for spec folder validation, but the simpler approach is to handle path validation inline in the workflow.

The top risk is **output drift** — the spec-driven flow producing artifacts that look correct to humans but are structurally incompatible with downstream parsers (missing REQ-IDs, wrong heading formats, absent sections). This is mitigated by reusing existing templates and adding validation steps that run `gsd-tools.cjs` parsing functions against generated artifacts. The second risk is **ambiguity silence** — the pipeline proceeding with vague requirements because the "no approval gates" philosophy discourages asking questions. The mitigation is an explicit ambiguity detection protocol that classifies extracted requirements as CLEAR, INFERABLE, or AMBIGUOUS, stopping only for genuinely ambiguous items.

## Key Findings

### Recommended Stack

The stack is entirely predetermined — no technology decisions needed. The codebase enforces zero runtime dependencies, Node.js CommonJS (`require()`), and `node:test` for testing. All new code extends existing modules.

**Core technologies (all existing):**
- **Node.js CommonJS (>=16.7.0):** Runtime — package.json constraint, all `.cjs` files
- **`node:fs` / `node:path`:** Spec file reading and path resolution — already used everywhere
- **`node:test`:** Testing — existing test infrastructure in `tests/*.test.cjs`
- **Custom frontmatter parser (`lib/frontmatter.cjs`):** Metadata extraction — reuse for GSD files only (NOT for user spec files)
- **Core utilities (`lib/core.cjs`):** `safeReadFile()`, `output()`, `error()` — established patterns

**Critical constraint:** Do NOT use `extractFrontmatter()` on user-provided spec files. The custom parser handles GSD's controlled YAML patterns only. User specs may contain YAML features (multiline strings, anchors, comments) that would silently produce wrong results.

### Expected Features

**Must have (table stakes — P1):**
- Multi-file spec reading from configurable folder (default `./specs/`)
- Spec synthesis into standard PROJECT.md format
- Full pipeline output (PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- Research always runs (validates and supplements spec content)
- No approval gates — full automation from spec to roadmap
- Ambiguity detection with targeted questions (only ask when genuinely crucial)
- Proper REQ-ID generation (`[CATEGORY]-[NUMBER]` format)
- Error handling for missing specs / empty folder
- Brownfield support (same as existing)
- Multi-runtime compatibility (Claude Code, OpenCode, Gemini CLI)

**Should have (differentiators — P2):**
- Spec file role detection (PRD vs tech spec vs user stories → weighted synthesis)
- Preference extraction from spec prose (timeline mentions → depth config)
- Smart requirement categorization (domain-derived categories, not generic defaults)
- Spec content validation against research findings

**Defer (v2+):**
- Spec file caching / incremental re-read
- Spec quality scoring (informational, not blocking)

### Architecture Approach

The architecture adds a minimal preprocessing layer at two GSD layers (Layer 1: Command, Layer 2: Workflow) while reusing everything else unchanged. The key architectural decision is **inline synthesis** — the orchestrating agent reads specs and produces PROJECT.md directly, rather than delegating to a subagent. This matches the existing pattern where `new-project.md` handles questioning → PROJECT.md synthesis inline.

**Major components:**
1. **Slash command** (`commands/gsd/new-project-from-spec.md`) — Thin entry point, references workflow, accepts spec folder path argument
2. **Workflow** (`workflows/new-project-from-spec.md`) — Core orchestration: spec reading → synthesis → config → research → requirements → roadmap. ~80% of new logic lives here
3. **CLI subcommand** (`init new-project-from-spec`, optional) — Spec folder validation, file enumeration, returns JSON for workflow. Recommended to defer; workflow can validate inline
4. **Existing agents** (4x researcher, synthesizer, roadmapper) — Reused unchanged; they read PROJECT.md regardless of how it was created
5. **Existing templates** (project, requirements, roadmap, state) — Reused unchanged; same output format guarantees downstream compatibility

**New files: 2.** Modified files: 0-1 (optionally `gsd-tools.cjs`). Reused as-is: 25+ files.

### Critical Pitfalls

1. **Markdown structure assumption** — Do NOT build a regex-based spec parser. Treat specs as unstructured text for LLM consumption. Agent reads raw files, synthesizes meaning. Any `parseSpec()` function with heading regex is a red flag.

2. **Output drift** — Spec-generated artifacts must be structurally identical to interactive-generated ones. Reuse templates by reference. Validate artifacts by running `gsd-tools.cjs` parsing functions against them. Diff against interactive output during testing.

3. **Ambiguity silence** — The "no approval gates" philosophy must not prevent necessary questions. Build an explicit ambiguity detection protocol: classify requirements as CLEAR/INFERABLE/AMBIGUOUS. Stop and ask for AMBIGUOUS items. Document INFERABLE assumptions in Key Decisions.

4. **Multi-file contradiction** — Specs from different authors/timeframes may contradict. Require a contradiction detection pass before generating artifacts. Present conflicts with file+section references.

5. **Frontmatter parser misuse** — Never call `extractFrontmatter()` on user spec files. The custom parser handles GSD's controlled YAML only. Agent reads raw spec files including frontmatter as text.

## Implications for Roadmap

Based on research, the project naturally divides into 2 phases with an optional 3rd for enhancements.

### Phase 1: Core Spec Pipeline
**Rationale:** All critical path components. The workflow file is the primary deliverable and contains ~80% of new logic. Everything else is either trivial (command file) or reuse. Must be delivered as a unit because the command is useless without the workflow, and the workflow is untestable without the command.
**Delivers:** Working `/gsd-new-project-from-spec` command that reads a folder of markdown specs and produces all 6 planning artifacts identical to interactive flow.
**Addresses features:** Multi-file spec reading, spec synthesis into PROJECT.md, full pipeline output, research always runs, no approval gates, ambiguity detection, REQ-ID generation, config.json generation, error handling on missing specs.
**Avoids pitfalls:** Markdown structure assumption (agent-driven synthesis, no regex parsing), ambiguity silence (explicit detection protocol), multi-file contradiction (contradiction detection pass), frontmatter parser misuse (agent reads raw files).
**Components:**
- `commands/gsd/new-project-from-spec.md` (new file, trivial)
- `workflows/new-project-from-spec.md` (new file, significant — core spec reading, synthesis, ambiguity detection, requirements generation, plus reused research/roadmap spawning)
- Optional: `init new-project-from-spec` CLI subcommand in `init.cjs` + router in `gsd-tools.cjs`

### Phase 2: Integration, Testing & Multi-Runtime
**Rationale:** Must verify the pipeline produces downstream-compatible artifacts before shipping. Output drift is the highest-cost pitfall (recovery = HIGH). Multi-runtime verification ensures the command works across all 3 supported environments.
**Delivers:** Verified spec-driven pipeline that passes all downstream command tests, works in Claude Code / OpenCode / Gemini CLI, handles edge cases (empty specs, large specs, contradictory specs).
**Addresses features:** Brownfield support verification, multi-runtime compatibility, graceful handling of partial specs.
**Avoids pitfalls:** Output drift (diff artifacts against interactive output, run every downstream command), missing command registration (test all 3 runtimes), token limits on large spec folders (add size warning/chunking).
**Components:**
- Integration tests with sample spec folders (well-structured, minimal, contradictory, large)
- Downstream compatibility verification (run `gsd-tools.cjs` parsing on all generated artifacts)
- Multi-runtime install verification
- Edge case handling (>100KB specs, empty frontmatter, deeply nested folders)

### Phase 3: Quality Enhancements (v1.x)
**Rationale:** P2 differentiators that improve synthesis quality but aren't needed for the command to function. Should be added after validating the core pipeline works correctly.
**Delivers:** Smarter spec processing — role detection, preference extraction, domain-specific categories, research validation.
**Addresses features:** Spec file role detection, preference extraction from prose, smart requirement categorization, spec content validation against research.
**Avoids pitfalls:** None critical — these are quality improvements on a working pipeline.

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** You can't test what doesn't exist. The workflow is the critical path — build it first, then validate it.
- **Phase 2 before Phase 3:** Output drift is the highest-recovery-cost pitfall. Validate structural compatibility before adding sophistication. Enhancement features on a broken pipeline waste effort.
- **Phase 1 is self-contained:** The command + workflow + reused pipeline produce a complete working feature. Phase 2 is validation, not new functionality.
- **Phase 3 is optional for launch:** The core pipeline works without role detection or preference extraction. These improve quality incrementally.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (spec synthesis logic):** The workflow's spec reading and synthesis instructions are the novel part. Needs careful prompt engineering — how to instruct the agent to detect ambiguity, handle contradictions, and produce template-compliant artifacts. Research the existing `--auto` mode's prompt patterns as a starting point.

Phases with standard patterns (skip `/gsd-research-phase`):
- **Phase 1 (command file, CLI subcommand):** Direct pattern-copy from existing command + init code. Zero ambiguity.
- **Phase 1 (research/roadmap spawning):** Copy verbatim from existing `new-project.md` Steps 6-8.
- **Phase 2 (integration testing):** Standard testing patterns. Test with sample specs, verify output format.
- **Phase 3 (all enhancements):** Well-defined feature additions to working pipeline. Standard implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Predetermined by existing codebase. Zero decisions needed. Verified against package.json and all source files. |
| Features | **HIGH** | Clear table stakes from existing interactive flow. Differentiators well-defined. Anti-features explicitly identified. Feature dependency graph is clean. |
| Architecture | **HIGH** | 7-layer architecture fully analyzed. Reuse points verified by tracing code paths. Build order has clear dependencies. Only 2 new files needed. |
| Pitfalls | **HIGH** | All pitfalls derived from actual codebase analysis (parser limitations, format requirements, downstream dependencies). Recovery strategies defined. |

**Overall confidence: HIGH**

All four research dimensions were conducted against the actual codebase (50+ files analyzed), not external sources. The project is an extension of a well-understood system, not a greenfield build. The patterns are established, the constraints are clear, and the risk surface is well-mapped.

### Gaps to Address

- **Spec synthesis prompt engineering:** The exact workflow instructions for the agent's synthesis step need careful crafting during Phase 1 planning. How to instruct "read these files, extract project context, detect ambiguity, check for contradictions, produce template-compliant output" in a way that reliably produces good results across diverse spec formats.
- **Token limit strategy for large spec folders:** Research identified the risk (>100KB specs) but didn't prescribe a specific chunking strategy. Decide during Phase 2: summarize-then-synthesize? File-by-file extraction? Priority ordering?
- **Config preference extraction heuristics:** How to map spec prose ("ship fast", "critical production system") to config values (depth, mode) is design work for Phase 3, not fully specified in research.
- **`init new-project` vs `init new-project-from-spec`:** Research recommends starting without a new CLI subcommand (workflow validates inline), but notes it may be needed later. Decide during Phase 1 planning based on validation complexity.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of 50+ files including:
  - `package.json` — zero runtime deps, engine constraint
  - `get-shit-done/bin/gsd-tools.cjs` — CLI router (50+ subcommands)
  - `get-shit-done/bin/lib/init.cjs` — init commands (694 lines)
  - `get-shit-done/bin/lib/frontmatter.cjs` — custom YAML parser (299 lines)
  - `get-shit-done/bin/lib/core.cjs` — shared utilities (377 lines)
  - `get-shit-done/workflows/new-project.md` — interactive workflow (1116 lines)
  - `commands/gsd/new-project.md` — existing command pattern
  - `bin/install.js` — multi-runtime installer (1865 lines)
  - All agent definitions, templates, and test files
  - `.planning/PROJECT.md` — project context for this milestone

### Secondary (MEDIUM confidence)
- Pattern analysis from project scaffolding tools (Yeoman, create-react-app, cookiecutter)
- AI-assisted development tool patterns (Cursor, Copilot Workspace)
- Document-to-artifact pipeline domain expertise

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
