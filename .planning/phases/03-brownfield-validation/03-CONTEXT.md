# Phase 3: Brownfield & Validation - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

The `/gsd-new-project-from-spec` command correctly handles existing codebases (detects code, offers mapping, merges existing capabilities into planning artifacts) and validates spec assumptions against research findings (surfaces contradictions with spec-file references). This phase adds brownfield awareness and research validation to the existing automated pipeline from Phases 1-2.

Requirements: BRWN-01, BRWN-02, PIPE-07

</domain>

<decisions>
## Implementation Decisions

### Codebase capability merging
- When spec describes something the codebase already handles: auto-mark as Validated in PROJECT.md — no user confirmation needed
- When codebase has capabilities NOT mentioned in specs: mention in a separate "Existing Capabilities" section in PROJECT.md but don't treat them as requirements
- When a spec requirement partially overlaps with existing code: split the requirement — existing part as Validated, missing part as Active (two separate line items)
- Merging affects both PROJECT.md AND REQUIREMENTS.md — Validated capabilities don't get roadmap phases assigned. Does NOT affect roadmap phase structure directly (REQUIREMENTS.md drives that).

### Contradiction surfacing
- All four contradiction types are worth surfacing: tech choice conflicts, deprecated/risky dependencies, architectural mismatches, and feasibility concerns
- Presentation: grouped summary — "Research found N contradictions with your specs" with each item showing spec quote + research finding
- Major contradictions pause the pipeline for user input; minor contradictions are noted but don't block
- Resolution options: Keep spec / Accept research / Custom (user provides their own answer)
- Custom resolutions update PROJECT.md — the custom answer replaces the original spec assumption and flows through to requirements

### Brownfield flow sequence
- Keep current exit-and-return pattern: if user needs codebase mapping, workflow exits and tells them to run `/gsd:map-codebase` then re-run the spec command. Keeps workflows independent.
- If codebase map already exists (`.planning/codebase/`): offer "Use existing codebase map or refresh it?" before proceeding
- Codebase map data is fed to research agents — researchers receive codebase context so they investigate relative to what already exists (e.g., they know the existing stack)

### Validation strictness
- Major vs minor classification uses both factors: impact scope (architecture/core tech vs implementation details) AND research confidence (strong contradiction vs defensible alternative)
- High impact + high confidence = major (blocks). Everything else = minor (noted).
- Minor contradictions appear as flags in PROJECT.md Key Decisions table with research disagreement noted
- Resolved contradictions (from user input on majors) ripple into requirements and roadmap — if a resolution changes a requirement, downstream artifacts reflect the updated requirement

### Claude's Discretion
- Skip-mapping behavior in brownfield projects (user declines mapping — Claude decides whether to warn or just run as greenfield)
- Exact heuristics for detecting partial overlaps between spec requirements and codebase capabilities
- How codebase map context is formatted/truncated for research agent prompts
- Internal threshold calibration for major vs minor contradiction classification

</decisions>

<specifics>
## Specific Ideas

- The interactive `new-project.md` workflow (lines 289-314) already has a working pattern for reading `.planning/codebase/ARCHITECTURE.md` and `STACK.md` to populate Validated requirements — mirror this approach in the spec-from-spec flow
- Brownfield detection logic already exists in `init.cjs` (lines 146-203) — `is_brownfield` and `needs_codebase_map` flags are already computed and available
- Contradiction surfacing (PIPE-07) is entirely new — no existing pattern to mirror. This likely fits between research completion (Step 10e) and requirements generation (Step 11) in the current workflow
- Existing decision from Phase 2: "Research findings inform only — requirements come from specs. Research shapes HOW requirements are written, not WHAT they are." Contradiction surfacing extends this: research can now challenge spec assumptions, but only through explicit user resolution.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-brownfield-validation*
*Context gathered: 2026-02-22*
