# Phase 2: Pipeline Automation - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

One command produces all planning artifacts (PROJECT.md → config.json → research → REQUIREMENTS.md → ROADMAP.md → STATE.md) and commits everything automatically, with no approval gates. The command takes an already-synthesized PROJECT.md (from Phase 1) and runs the full artifact pipeline. Brownfield detection and spec-vs-research validation are Phase 3. Multi-runtime compatibility is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Config preference extraction
- **Conservative inference** — only auto-set config values when the signal in spec prose is very clear. When remotely ambiguous, ask the user
- Try to infer **all config keys** from specs, but **skip inference for purely technical keys** (e.g., max_parallel_agents) that don't have natural prose mappings — use defaults for those
- When asking the user about config, **show what was inferred + ask to confirm** (e.g., "Based on your specs, I'm guessing 'comprehensive' depth. Sound right?")
- **Batch all config questions** — analyze all config keys first, then present one unified view of inferred values (with spec citations) and defaults together
- **Per-value choices** — each configurable value gets its own question with options, not a single freeform prompt
- **Cite sources** for every inference — show which spec passage drove each config value (e.g., "tech-spec.md line 12 says 'rapid prototyping' → research_depth: quick")
- When spec prose contains **contradictory config signals**, ask with both citations (same pattern as Phase 1 contradiction handling)
- For keys with **no signal at all**, show defaults and ask user to confirm (not silent defaults)
- **Show summary before proceeding** — after config is finalized, display a summary of all final values and their sources, then continue pipeline
- Config adjustments (user overrides) are **logged in PROJECT.md's Key Decisions table** as intentional choices
- **One-shot memory** — config.json is the source of truth. No separate correction tracking across runs
- If **config.json already exists** (re-run scenario), ask the user: use existing, re-infer from specs, or start fresh

### Research-to-requirements flow
- Research topics **derived from spec content** — analyze PROJECT.md to generate custom research topics tailored to the project domain, not default research areas
- Research findings **inform only** — requirements come from specs. Research shapes HOW requirements are written (informed by ecosystem reality), not WHAT they are. No auto-generated requirements from research
- **Simple waiting message** during research — "Running research (4 parallel researchers)... this may take a minute." No per-researcher progress updates

### Pipeline failure handling
- **Claude's Discretion** on failure strategy — Claude determines the best approach (retry, abort, skip) based on which step failed and the severity
- **Ask the user on re-run** — if existing artifacts are found, prompt: "Found existing artifacts: [list]. Resume from [first missing], or start fresh?"
- **Full summary with file list** on completion — "Created 6 artifacts: PROJECT.md, config.json, research/SUMMARY.md, REQUIREMENTS.md, ROADMAP.md, STATE.md" plus key stats
- **Just show start and end** for pipeline progress — no step-by-step updates during execution. Show "Starting pipeline..." then the completion summary

### Auto-commit strategy
- **One commit at the end** with all artifacts — clean history, atomic result
- **Descriptive commit message** with conventional commit style: "docs: initialize project planning from spec files"
- If **no git repo**, warn and skip: "No git repo detected. Artifacts generated but not committed." Suggest git init
- **Respect commit_docs config flag** — if commit_docs=false, skip auto-commit even if git exists. Consistent with existing GSD behavior

### Claude's Discretion
- Requirement category organization — whether to mirror spec structure or create domain-appropriate groupings
- Pipeline failure strategy — retry/abort/skip decision based on failure context
- Exact wording of progress messages and summaries
- Research topic generation approach — how to analyze PROJECT.md for relevant research areas

</decisions>

<specifics>
## Specific Ideas

- Config UX follows Phase 1's citation pattern — every inference shows which spec file and passage drove it
- Unified config view: inferred values with citations + defaults in one presentation, but per-value choices for adjustment
- Re-run behavior is always explicit — never silently overwrite or silently reuse existing artifacts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-pipeline-automation*
*Context gathered: 2026-02-21*
