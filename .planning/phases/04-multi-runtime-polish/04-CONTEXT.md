# Phase 4: Multi-Runtime & Polish - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Make `/gsd-new-project-from-spec` work reliably across all supported runtimes (Claude Code, OpenCode, Gemini CLI), handle large spec folders without token limit failures, and verify end-to-end downstream compatibility. The installer already handles most cross-runtime conversion — this phase verifies correctness, adds large-input resilience, and hardens edge cases.

</domain>

<decisions>
## Implementation Decisions

### Large spec folder strategy
- Threshold: 100KB total spec content triggers intervention
- Strategy: Priority ordering — classify files first, read high-priority roles in full, summarize lower-priority ones
- Always full read: PRD, tech spec, and constraints files (these three roles always get full content regardless of budget)
- Lower-priority files (user stories, appendices, etc.) get summarized when over budget
- User notification: Only show which files were summarized when a summarized file had conflicts or ambiguities detected. Don't clutter output otherwise.

### Cross-runtime verification
- Follow existing installer patterns for any conversion work — no new conversion paradigms
- `Task()` syntax in workflow bodies: handle the same way existing functionality handles cross-runtime Task calls (installer converts what's needed)
- `AskUserQuestion` references in workflow body prose: leave as-is for Gemini (Gemini interprets natural language tool references fine)
- `${VAR}` in bash code blocks: no escaping needed for workflows — bash blocks pass through literally to the shell
- Verification method: Installer output check — verify the installer produces correct converted files for each runtime (correct paths, tool names, command namespace)

### End-to-end test design
- Ship a test fixture: purpose-built spec folder in `tests/fixtures/` (or similar)
- Fixture scope: Minimal — 2-3 files (PRD and tech spec at minimum), just enough to prove the pipeline produces all 6 artifacts
- Verification depth: Structure + parseability — verify all 6 artifacts exist with correct structure AND GSD tooling can parse them (ROADMAP phases, STATE.md validity, REQ-IDs present)
- Automation: Automated test script that runs the fixture through the pipeline and checks outputs programmatically

### Edge case behavior
- Non-markdown files in spec folder: Note and skip — "Skipping 3 non-markdown files (logo.png, schema.json, ...)" then continue
- Empty .md files (0 bytes or whitespace only): Skip silently, don't count or mention
- File encoding issues (non-UTF8, binary with .md extension): Best effort — try to read what's readable, ignore garbled parts
- Subdirectories: Keep top-level only (existing Phase 1 decision), no change

### Claude's Discretion
- Exact summarization approach for lower-priority files (how compressed, what to preserve)
- Test script implementation details (shell script vs Node.js, assertion style)
- Which installer output properties to check per runtime
- How to implement the 100KB size calculation (before or after classification)

</decisions>

<specifics>
## Specific Ideas

- The installer already has three distinct conversion pipelines (Claude Code native, OpenCode flattened, Gemini TOML) — Phase 4 work should verify these produce correct output for the new-project-from-spec command specifically, not rebuild the conversion system
- The 9 classification roles from Phase 1 (PRD, tech spec, user stories, constraints, etc.) are the basis for priority ordering — reuse the existing classification step output
- Test fixture should be small enough to run quickly but realistic enough to exercise the synthesis pipeline (conflict detection, gap handling)

</specifics>

<deferred>
## Deferred Ideas

- Recursive spec folder traversal (reading .md files from subdirectories) — currently top-level only per Phase 1 decision, would be a new capability
- Non-markdown spec format support (JSON, YAML, OpenAPI) — explicitly out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 04-multi-runtime-polish*
*Context gathered: 2026-02-22*
