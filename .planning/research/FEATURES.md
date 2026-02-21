# Feature Research

**Domain:** Spec-driven project initialization for AI meta-prompting system
**Researched:** 2026-02-21
**Confidence:** HIGH (based on deep analysis of existing codebase, existing interactive flow, and established patterns in project scaffolding / document-processing automation)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = the command is useless or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-file spec reading | The whole point — read a folder of markdown files and synthesize them | MEDIUM | Must handle arbitrary number of files with varying structures. Default `./specs/`, configurable via argument. Glob `*.md` in folder. |
| Spec synthesis into PROJECT.md | Users expect spec content to flow into the standard PROJECT.md format | MEDIUM | Must extract: what it is, core value, requirements, constraints, context, decisions. Map arbitrary spec prose to structured template sections. |
| Full pipeline output (PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md) | Same artifacts as `gsd-new-project` — downstream tools must work unchanged | LOW | Reuse existing templates and agents. The output format is fixed by the existing system. |
| Research always runs | Specs have blind spots — research validates and supplements | LOW | Already built. Just always set research=true, don't ask. |
| Brownfield support | Users may add spec-based projects to existing codebases | LOW | Same as `gsd-new-project`: detect existing code, offer codebase mapping. Already implemented in init tooling. |
| Config.json generation | Downstream workflows require config.json for mode, depth, parallelization, agents | LOW | Extract from spec if present (e.g., spec mentions "quick iterations" → depth: quick). Fall back to asking user for what's missing. |
| No approval gates | Spec is source of truth — full automation is the point. Stopping to ask "approve this?" defeats the purpose | LOW | Skip all interactive approval gates from `gsd-new-project`. Auto-approve requirements, auto-approve roadmap. |
| REQ-ID generation | REQUIREMENTS.md must have proper `[CATEGORY]-[NUMBER]` IDs for traceability | LOW | Same as existing flow. Categories derived from spec content. |
| Traceability (requirements mapped to phases) | Existing downstream tools (`plan-phase`, `execute-phase`, `verify-work`) depend on this | LOW | Handled by `gsd-roadmapper` agent — just invoke it the same way. |
| Multi-runtime compatibility | Must work in Claude Code, OpenCode, and Gemini CLI | LOW | Handled by existing installer (`bin/install.js`). New command follows same pattern as `new-project.md`. |
| Error on missing specs | If `./specs/` doesn't exist or has no `.md` files, give a clear error, not silent failure | LOW | Critical UX. Users need to know what went wrong. |

### Differentiators (Competitive Advantage)

Features that make spec-from-file *better* than just using `gsd-new-project --auto` with a pasted doc. Not required, but this is where the value lives.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-file synthesis (not just concatenation) | Specs may be split across files (PRD, tech-spec, user-stories, constraints). The tool understands each file's role and synthesizes intelligently — not just `cat *.md` | HIGH | This is THE differentiator from `--auto` mode which takes a single document. Must handle contradictions between files, overlapping content, varying formats. Strategy: read all files, identify what each contributes, merge into unified context. |
| Ambiguity detection and targeted questions | When spec files contradict or leave critical gaps, ask ONLY about those specific issues — not a full questionnaire | MEDIUM | e.g., spec says "use PostgreSQL" in one file and "use SQLite" in another → ask user to resolve. Spec never mentions auth strategy → ask. But don't ask about things the spec clearly answers. This is the "minimal interaction" promise. |
| Preference extraction from spec prose | Extract config.json preferences from how the spec is written, not from explicit config sections | MEDIUM | e.g., Spec says "we need to ship this in 2 weeks" → depth: quick. Spec says "this is a critical production system" → depth: comprehensive, verifier: true. Spec mentions "parallel workstreams" → parallelization: true. Avoids asking user config questions that the spec implicitly answers. |
| Smart requirement categorization | Auto-derive requirement categories from spec content rather than using generic defaults | MEDIUM | Instead of always using AUTH/CONTENT/SOCIAL categories, derive from actual spec: PARSING, SYNTHESIS, PIPELINE, CLI, etc. Makes REQUIREMENTS.md match the project's domain language. |
| Spec file role detection | Recognize what kind of document each spec file is (PRD, tech spec, user stories, constraints doc, API spec) and weight content accordingly | MEDIUM | A tech spec file's technology choices should override a PRD's vague mentions. User stories should drive requirements. Constraints doc should drive the Constraints section. This avoids treating all files equally. |
| Graceful handling of partial specs | Work with whatever the user provides — a single bullet-point list or 10 detailed documents | LOW | Don't error on minimal input. Extract what you can, ask about what you can't. The tool should be useful even with a 3-line spec. |
| Spec content validation against research | Research findings validate spec claims — surface when spec assumes something that research contradicts | MEDIUM | e.g., Spec assumes "use library X for Y" but research finds X is deprecated. Surface this as a finding, not a blocker. Let research supplement and correct the spec. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately exclude these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Spec schema/format enforcement | "Specs should follow a template for reliable parsing" | Kills flexibility. Users have specs in different formats — PRDs, RFCs, braindumps, Notion exports. Requiring a specific format means users must rewrite their specs before using the tool. The whole point is to accept arbitrary markdown. | Use LLM intelligence to interpret any markdown structure. Accept messy input, produce clean output. |
| Spec validation/linting | "Warn when spec is incomplete or poorly structured" | Turns a productivity tool into a gatekeeper. Users want to go from spec→plan, not spec→feedback→rewrite→plan. Also: "incomplete" is subjective — a 3-line spec for a weekend project is fine. | Detect genuine gaps (e.g., no mention of what to build) and ask targeted questions instead of rating spec quality. |
| Interactive spec editing | "Let user modify spec content during initialization" | Scope creep — now you're building a spec editor. The spec files are the source of truth. If users want to change them, they edit the files. The tool reads specs, it doesn't write them. | If spec has gaps, ask targeted questions. Answers become part of PROJECT.md context, not modifications to spec files. |
| Spec versioning/diffing | "Track spec changes and re-initialize when specs update" | Overengineering. Re-initialization is a new project. Incremental updates should use existing GSD workflows (`add-phase`, `new-milestone`). Building spec diffing creates a parallel state management system. | For spec changes: use existing GSD milestone workflow to evolve the project. Spec files are initialization input, not living documents in the GSD system. |
| Non-markdown format support | "Support JSON specs, YAML specs, OpenAPI specs" | Expands surface area enormously. Each format needs different parsing. Markdown is universal — any spec can be written in or converted to markdown. JSON/YAML specs are machine formats, not human specs. | Accept only markdown. If users have other formats, they convert first. Markdown is the lingua franca. |
| Approval gates on generated artifacts | "Let user review and approve PROJECT.md before generating requirements" | Defeats the automation purpose. The whole point is spec → complete planning artifacts without stopping. If the output is wrong, the user adjusts the spec and re-runs. Same philosophy as `--auto` mode. | No gates. If artifacts need adjustment, user edits them directly or re-runs with updated specs. |
| Config.json interactive wizard when spec is present | "Always ask all config questions even when spec provides hints" | Unnecessary friction. If the spec says "ship fast, 2-week timeline," asking "How thorough should planning be?" is insulting. Only ask what can't be inferred. | Extract what you can from spec prose. Only ask user for truly ambiguous or missing preferences. |
| Template generation for specs | "Generate a spec template to fill in" | Wrong direction. The tool adapts to user specs, not the other way around. Template generation implies a required format. Also out of scope per PROJECT.md. | Point users to docs that show example specs in various styles. Accept any markdown. |

## Feature Dependencies

```
[Multi-file spec reading]
    └──requires──> [Spec synthesis into PROJECT.md]
                       └──requires──> [Full pipeline output]
                                          └──requires──> [REQ-ID generation]
                                          └──requires──> [Traceability]

[Spec file role detection] ──enhances──> [Multi-file synthesis]

[Preference extraction from spec prose] ──enhances──> [Config.json generation]

[Ambiguity detection] ──requires──> [Multi-file spec reading]
                      ──enhances──> [Spec synthesis into PROJECT.md]

[Smart requirement categorization] ──enhances──> [REQ-ID generation]

[Spec content validation against research] ──requires──> [Research always runs]
                                           ──requires──> [Spec synthesis]

[Brownfield support] ──independent──> (all other features, same as existing)

[Error on missing specs] ──independent──> (guard clause, runs first)
```

### Dependency Notes

- **Multi-file spec reading → Spec synthesis:** You must read all spec files before you can synthesize them into a single PROJECT.md. Reading is I/O; synthesis is intelligence.
- **Spec file role detection enhances Multi-file synthesis:** Knowing that file A is a PRD and file B is a tech spec produces better synthesis than treating all files equally. But synthesis works without it (just less intelligently).
- **Ambiguity detection requires Multi-file spec reading:** You can only find contradictions after reading all files. This feeds back into synthesis — resolved ambiguities improve the PROJECT.md.
- **Preference extraction enhances Config.json generation:** Config.json works without preference extraction (just asks user everything). Preference extraction reduces questions.
- **Spec content validation requires Research:** Research must run to have findings to validate against. This is why research always runs — it's not optional for spec-based init.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Multi-file spec reading (folder glob, configurable path) — core I/O
- [ ] Spec synthesis into PROJECT.md (merge N files into structured context) — core intelligence
- [ ] Full pipeline output (all 6 artifacts) — required for downstream compatibility
- [ ] Config.json generation with fallback to user prompts — required for downstream workflows
- [ ] Research always runs — validates spec assumptions
- [ ] No approval gates — automation promise
- [ ] Error on missing specs / empty folder — basic error handling
- [ ] Brownfield support — same as existing `gsd-new-project`
- [ ] Multi-runtime compatibility — follows existing installer pattern
- [ ] Ambiguity detection with targeted questions — the "only ask when crucial" promise

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Spec file role detection — improves synthesis quality, not required for it to work
- [ ] Preference extraction from spec prose — reduces user questions, not required for config.json
- [ ] Smart requirement categorization — improves requirement quality, categories still work without it
- [ ] Spec content validation against research — surfaces spec errors, research still runs without it

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Spec file caching / incremental re-read — only matters if specs change frequently
- [ ] Spec quality scoring (informational, not blocking) — may help power users iterate on specs

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-file spec reading | HIGH | LOW | P1 |
| Spec synthesis into PROJECT.md | HIGH | MEDIUM | P1 |
| Full pipeline output | HIGH | LOW | P1 |
| No approval gates | HIGH | LOW | P1 |
| Error on missing specs | HIGH | LOW | P1 |
| Ambiguity detection + targeted questions | HIGH | MEDIUM | P1 |
| Config.json generation with fallback | MEDIUM | LOW | P1 |
| Research always runs | MEDIUM | LOW | P1 |
| Brownfield support | MEDIUM | LOW | P1 |
| Multi-runtime compatibility | MEDIUM | LOW | P1 |
| Spec file role detection | MEDIUM | MEDIUM | P2 |
| Preference extraction from prose | MEDIUM | MEDIUM | P2 |
| Smart requirement categorization | MEDIUM | LOW | P2 |
| Spec validation against research | LOW | MEDIUM | P2 |

**Priority key:**
- P1: Must have for launch — without these, the command doesn't fulfill its promise
- P2: Should have, add when possible — improve quality but not blocking

## Competitor/Pattern Analysis

There are no direct competitors for "spec-driven AI meta-prompting initialization." But the patterns come from several established domains:

| Pattern | Where It Exists | What We Learn | Our Approach |
|---------|----------------|---------------|--------------|
| Single-doc project init | `gsd-new-project --auto @doc.md` (existing) | Works but limited to one file. Users with multiple spec docs must merge manually. | Multi-file: read a folder, synthesize all files. |
| Interactive questioning | `gsd-new-project` (existing) | Deep and effective but slow (8+ rounds of interaction). Not needed when specs exist. | Replace questioning with spec reading. Only ask when specs are ambiguous. |
| Scaffold from config | Yeoman, create-react-app, cookiecutter | Config-driven generation works. But configs are structured; specs are unstructured. | Use LLM to bridge unstructured spec → structured config. |
| Document synthesis | AI summarization tools (Claude, GPT) | Multi-doc synthesis is a solved problem for LLMs. Quality depends on clear instructions. | Lean on LLM capability for synthesis. Focus engineering on pipeline integration. |
| Spec-to-code generation | Cursor, Copilot Workspace, Bolt, v0 | These go spec→code. We go spec→plan. Plans are more valuable because they're reviewable and adjustable. | Spec→plan→code (via existing GSD execution pipeline). |

## Sources

- Existing GSD codebase analysis (HIGH confidence — primary source):
  - `commands/gsd/new-project.md` — existing command pattern
  - `get-shit-done/workflows/new-project.md` — existing interactive workflow (1116 lines analyzed)
  - `get-shit-done/workflows/new-milestone.md` — existing milestone workflow (382 lines)
  - `get-shit-done/templates/project.md` — PROJECT.md template
  - `get-shit-done/templates/requirements.md` — REQUIREMENTS.md template
  - `get-shit-done/templates/research-project/FEATURES.md` — FEATURES.md template
  - `.planning/PROJECT.md` — project context for this milestone
  - `.planning/config.json` — config structure
- Pattern analysis from project scaffolding tools (MEDIUM confidence — established patterns)
- AI-assisted development tool patterns (MEDIUM confidence — rapidly evolving space)

---
*Feature research for: spec-driven project initialization*
*Researched: 2026-02-21*
