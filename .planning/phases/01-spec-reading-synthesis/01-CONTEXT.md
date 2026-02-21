# Phase 1: Spec Reading & Synthesis - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

User can run `/gsd-new-project-from-spec` (with optional path argument) and get a valid PROJECT.md synthesized from their markdown spec files. The command reads all spec files from a folder, identifies each file's role, merges and deduplicates content, handles contradictions and gaps by asking the user, and produces a PROJECT.md in the same format as the interactive `/gsd-new-project` flow. This phase delivers the command entry point and synthesis engine only — pipeline automation (config, research, requirements, roadmap) is Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Spec file interpretation
- Identify spec file type (PRD, tech spec, user stories, etc.) by analyzing content — no filename convention required
- When multiple spec files cover the same topic, merge and deduplicate — keep the most specific/detailed version of each point
- All spec types are treated equally — no hierarchy between PRD, tech spec, etc. When they conflict, ask the user rather than assuming one type overrides another

### Contradiction & gap handling
- Ask the user about major contradictions (architectural, feature-level); resolve minor wording differences automatically
- Ask the user about critical gaps — missing information that would significantly affect project structure
- Batch all questions together — collect all contradictions and gaps during analysis, present them as one batch after analysis completes
- Always cite sources in questions — every question references the specific files and relevant quotes that caused it (e.g., "prd.md says 'REST API' (line 42), tech-spec.md says 'GraphQL' (section 3) — which approach?")

### PROJECT.md synthesis rules
- Same structure as interactive flow, but include a note that it was generated from specs (with source file list)
- Content that doesn't map cleanly to PROJECT.md sections (detailed API schemas, data models, etc.) is preserved as separate supplementary reference files in .planning/
- Inline traceability — each major point in PROJECT.md notes which spec file(s) it came from
- Import decisions from specs into the Key Decisions table, but flag any that seem risky or contradictory for user review

### Command invocation & errors
- Default spec folder path: `./specs/` when no argument provided
- Actionable error messages — clear problem statement plus what to do (e.g., "No spec files found in ./specs/. Create .md files there or specify a path: /gsd-new-project-from-spec ./other-folder/")
- Step-by-step progress updates during processing: "Reading 5 spec files...", "Classifying...", "Synthesizing PROJECT.md...", "Asking about 2 conflicts..."
- If .planning/ already exists with artifacts, ask the user whether to overwrite (don't silently refuse or overwrite)

### Claude's Discretion
- Whether to handle non-markdown files in the spec folder (ignore, warn, or attempt to process)
- Minor contradiction resolution — what counts as "minor" vs "major"
- Exact progress message wording and granularity
- Supplementary file naming and organization within .planning/

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-spec-reading-synthesis*
*Context gathered: 2026-02-21*
