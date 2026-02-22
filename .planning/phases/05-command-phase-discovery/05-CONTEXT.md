# Phase 5: Command & Phase Discovery - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the `/gsd-plan-all` slash command that can be invoked across all supported runtimes (Claude Code, OpenCode, Gemini CLI), and a discovery workflow that reads ROADMAP.md to identify all phases that need planning. This phase does NOT implement the sequential planning loop (Phase 6) or retry logic (Phase 7) — it discovers and reports.

</domain>

<decisions>
## Implementation Decisions

### "Unplanned" phase definition
- A phase "needs planning" if it has NO PLAN.md files on disk AND is not marked complete in ROADMAP.md (roadmap_complete: false)
- Both conditions must be met: no plans AND not complete. Double-safe filtering prevents re-planning shipped phases (e.g., v1.0 phases 1-4)
- Phases with existing context (CONTEXT.md) or research (RESEARCH.md) but no plans ARE included — plan-phase picks up existing artifacts naturally
- All unplanned phases are listed regardless of dependency status. Planning order is ascending phase number (handled by Phase 6)
- No special treatment for phases with partial artifacts vs empty phases — both need planning

### Output and feedback
- Discovery output is a summary table: phase number, name, current disk status (empty/researched/discussed/etc.)
- Include a count line: "Found N phases to plan"
- "Nothing to plan" message: clean status showing all N phases have plans, plus suggested next steps (/gsd-execute-phase, /gsd-progress)
- No confirmation gate before planning starts — discovery flows directly into planning (zero interaction per requirements)
- Follow existing GSD banner style (ui-brand.md patterns: ━━━ lines, bold headers) for consistency with other commands

### Command arguments and flags
- Single flag: `--dry-run` — shows the discovery table and exits without planning
- No `--from N` flag (use /gsd-plan-phase N for single phases)
- No milestone filter (plans all unplanned phases across entire roadmap)
- No pipeline override flags (--research, --skip-research, --skip-verify) — plan-phase honors config.json settings for all phases uniformly
- argument-hint: `[--dry-run]`

### Workflow file structure
- Create the final /gsd-plan-all command file (Claude Code canonical format) — this won't change in later phases
- Create a discovery-only workflow (plan-all.md) that Phase 6 extends to add the sequential planning loop
- Discovery logic lives in gsd-tools.cjs: new `roadmap unplanned` subcommand that filters `roadmap analyze` results to only unplanned phases
- Standard init pattern: `gsd-tools.cjs init plan-all` returns roadmap_exists, planning_exists, unplanned phases list, config settings
- Create canonical Claude Code command file, then run the installer to verify OpenCode and Gemini CLI versions generate correctly (satisfies CMD-03)

### Claude's Discretion
- Exact table formatting for discovery output
- "Nothing to plan" message wording and next-step suggestions
- Internal JSON structure of the `roadmap unplanned` response
- How the workflow handles edge cases (no roadmap file, malformed roadmap)

</decisions>

<specifics>
## Specific Ideas

- Discovery should reuse `roadmap analyze` rather than re-parsing ROADMAP.md — the analysis infrastructure already exists
- The command file should be structurally identical to existing commands like /gsd-plan-phase (same YAML frontmatter fields, same XML body sections)
- The workflow file should follow the same step-based `<process>` structure as plan-phase.md and other existing workflows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-command-phase-discovery*
*Context gathered: 2026-02-22*
