# Requirements: GSD Spec-Based Project Initialization

**Defined:** 2026-02-21
**Core Value:** Fully automated project initialization from spec files — user provides specs, GSD produces complete planning structure ready for execution

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Command Infrastructure

- [x] **CMD-01**: User can run `/gsd-new-project-from-spec [path]` to initialize a project from spec files
- [x] **CMD-02**: Command defaults to `./specs/` when no path argument provided
- [ ] **CMD-03**: Command works in Claude Code, OpenCode, and Gemini CLI (installer handles conversion)
- [x] **CMD-04**: Command shows clear error when spec folder doesn't exist or contains no .md files

### Spec Reading

- [x] **SPEC-01**: Workflow reads all `.md` files from the specified spec folder
- [x] **SPEC-02**: Workflow identifies each spec file's role (PRD, tech spec, user stories, constraints, etc.)
- [x] **SPEC-03**: Workflow synthesizes multiple spec files into a unified PROJECT.md using the existing template
- [x] **SPEC-04**: Workflow detects ambiguities and contradictions between spec files
- [x] **SPEC-05**: Workflow asks user targeted questions only when spec content is critically missing or contradictory

### Pipeline Automation

- [x] **PIPE-01**: Workflow generates PROJECT.md from spec content (identical format to interactive flow)
- [x] **PIPE-02**: Workflow extracts config preferences from spec prose (e.g., "ship fast" → quick depth)
- [x] **PIPE-03**: Workflow falls back to asking user for config preferences not inferable from specs
- [x] **PIPE-04**: Workflow always runs research phase (4 parallel researchers + synthesizer)
- [x] **PIPE-05**: Workflow generates REQUIREMENTS.md with domain-specific categories and REQ-IDs
- [x] **PIPE-06**: Workflow spawns roadmapper to generate ROADMAP.md and STATE.md
- [ ] **PIPE-07**: Workflow validates spec assumptions against research findings and surfaces contradictions
- [x] **PIPE-08**: No approval gates — all artifacts committed automatically
- [x] **PIPE-09**: Requirements include full traceability (each requirement mapped to a phase)

### Brownfield Support

- [ ] **BRWN-01**: Workflow detects existing code and offers codebase mapping before initialization
- [ ] **BRWN-02**: Existing codebase capabilities become Validated requirements in PROJECT.md

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Performance

- **CACHE-01**: Spec file caching for incremental re-reads when specs change frequently

### Quality

- **SCORE-01**: Informational spec quality scoring (non-blocking) to help users iterate on specs

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Non-markdown spec formats (JSON, YAML, OpenAPI) | Markdown is universal; other formats can be converted before use |
| Spec schema/template enforcement | Kills flexibility; LLM interprets any markdown structure |
| Interactive spec editing during initialization | Users edit spec files directly; tool reads them, doesn't write them |
| Spec versioning/diffing | Re-initialization is a new project; use existing GSD workflows for incremental changes |
| Spec template generation | Tool adapts to user specs, not the other way around |
| Approval gates on generated artifacts | Defeats automation purpose; if output is wrong, user adjusts spec and re-runs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMD-01 | Phase 1 | Complete |
| CMD-02 | Phase 1 | Complete |
| CMD-03 | Phase 4 | Pending |
| CMD-04 | Phase 1 | Complete |
| SPEC-01 | Phase 1 | Complete |
| SPEC-02 | Phase 1 | Complete |
| SPEC-03 | Phase 1 | Complete |
| SPEC-04 | Phase 1 | Complete |
| SPEC-05 | Phase 1 | Complete |
| PIPE-01 | Phase 1 | Complete |
| PIPE-02 | Phase 2 | Complete |
| PIPE-03 | Phase 2 | Complete |
| PIPE-04 | Phase 2 | Complete |
| PIPE-05 | Phase 2 | Complete |
| PIPE-06 | Phase 2 | Complete |
| PIPE-07 | Phase 3 | Pending |
| PIPE-08 | Phase 2 | Complete |
| PIPE-09 | Phase 2 | Complete |
| BRWN-01 | Phase 3 | Pending |
| BRWN-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-22 after Phase 2 completion*
