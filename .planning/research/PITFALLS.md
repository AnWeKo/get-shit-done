# Pitfalls Research

**Domain:** Spec-driven project initialization for a meta-prompting system
**Researched:** 2026-02-21
**Confidence:** HIGH (based on codebase analysis + domain expertise in document-to-artifact pipelines)

## Critical Pitfalls

### Pitfall 1: Markdown Structure Assumption — Parsing Breaks on Real Specs

**What goes wrong:**
The parser assumes spec files follow a predictable heading hierarchy (H1 > H2 > H3) or use specific section names ("Requirements", "Architecture", "Constraints"). Real user specs are wildly inconsistent: flat lists, nested bullet points as pseudo-headings, mixed prose and structured data, frontmatter with non-standard keys, headings that don't match expected categories. The parser either misses content or maps it to the wrong artifact section.

**Why it happens:**
Developers test with idealized spec files they wrote themselves. The "happy path" works perfectly because the test data mirrors the parser's assumptions. They don't encounter specs with: headings inside code blocks, inconsistent heading levels (jumping H1 to H4), multiple H1 headings, heading text that doesn't match category keywords ("The Plan" instead of "Requirements"), or markdown extensions like callouts/admonitions.

**How to avoid:**
- Do NOT write a structural markdown parser that tries to map headings to semantic categories. Instead, treat spec files as **unstructured text that happens to be markdown** and let the LLM agent extract meaning.
- The new command's workflow markdown should instruct the orchestrating agent to *read* spec files and *synthesize* them, not parse them programmatically. This is the GSD pattern already — workflows are agent instructions, not code.
- If programmatic preprocessing is needed (e.g., a `gsd-tools.cjs spec-read` subcommand), limit it to: listing files in the spec folder, reading file contents, and concatenating them. Do NOT attempt semantic parsing in Node.js code.
- Reserve structural understanding for the LLM agent, which handles arbitrary markdown natively.

**Warning signs:**
- A `parseSpec()` function with regex patterns for heading extraction
- Unit tests that only use well-structured spec files
- Code that maps `## Requirements` headings to specific output fields
- Any attempt to build an AST from spec markdown

**Phase to address:**
Phase 1 (core spec reading). The very first design decision must be: agent-driven synthesis, not programmatic parsing. Getting this wrong means rewriting the entire pipeline.

---

### Pitfall 2: Output Drift — Spec-Driven Artifacts Diverge from Interactive Artifacts

**What goes wrong:**
The spec-driven flow produces PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md that are structurally different from what the interactive `/gsd-new-project` flow produces. Missing sections, different heading names, absent REQ-IDs, wrong traceability table format, missing frontmatter fields. Downstream commands (`/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:progress`) then break because they parse these artifacts with specific expectations.

**Why it happens:**
The interactive flow has years of refinement — each template section and format convention was added because a downstream consumer needs it. The spec-driven flow is built by a different agent/prompt with different instructions, and it's easy to produce artifacts that *look right* to a human but are missing machine-readable structures. Specifically:
- REQ-IDs must follow `[CATEGORY]-[NUMBER]` format (e.g., `AUTH-01`) because `roadmap.cjs` and `phase.cjs` parse them
- ROADMAP.md must have `**Requirements**: [REQ-IDs]` lines because phase planning reads them
- STATE.md must have specific section headers that `state.cjs` parses
- config.json must have exact key names that `loadConfig()` reads

**How to avoid:**
- Reuse the existing templates (`templates/project.md`, `templates/requirements.md`, `templates/roadmap.md`, `templates/state.md`) by reference in the workflow. The agent fills templates, not free-forms.
- Write a validation step that runs *after* artifact generation: call `gsd-tools.cjs` parsing functions on each generated file and verify they produce expected output. For example, `gsd-tools.cjs frontmatter-get .planning/STATE.md` should return valid JSON.
- The workflow should explicitly list every artifact format requirement, not just "create a PROJECT.md." It should say: "Create PROJECT.md using template at `templates/project.md`. Must include: What This Is, Core Value, Requirements (Validated/Active/Out of Scope), Context, Constraints, Key Decisions sections."
- Run the existing test suite against spec-generated artifacts as an integration test.

**Warning signs:**
- Spec-generated REQUIREMENTS.md without REQ-IDs
- ROADMAP.md with phase headings in a different format than `### Phase N: Name`
- STATE.md missing the `## Project Reference` section
- `gsd-tools.cjs` commands failing with "not found" errors on spec-generated projects
- A manually crafted artifact that passes human review but breaks `findPhaseInternal()`

**Phase to address:**
Phase 1 (artifact generation) and Phase 3 (integration testing). Must be validated before shipping: run every downstream command against a spec-generated project.

---

### Pitfall 3: Ambiguity Silence — Pipeline Proceeds with Gaps Instead of Asking

**What goes wrong:**
The spec file says "support authentication" but doesn't specify: email/password? OAuth? Magic links? Session duration? The pipeline generates a PROJECT.md that says "Support authentication" and a REQUIREMENTS.md with vague requirements like "AUTH-01: User can authenticate." Downstream planning and execution produce auth code that doesn't match what the user wanted, requiring rework.

The whole point of the spec-driven flow is to avoid interactive questioning — but the failure mode is avoiding *necessary* questions. The interactive flow's deep questioning phase exists because vague requirements cause rework. The spec-driven flow must detect when specs are too vague and escalate.

**Why it happens:**
- The "no approval gates" and "fully automatic" design goals create pressure to never stop and ask
- LLM agents are eager to fill gaps with plausible defaults instead of flagging uncertainty
- The distinction between "spec is clear enough" and "spec has a critical gap" requires judgment
- Spec authors assume their spec is complete because *they* know what they mean

**How to avoid:**
- Define an explicit **ambiguity detection protocol** in the workflow. The synthesizing agent must classify each extracted requirement as: CLEAR (specific enough to implement), INFERABLE (reasonable default exists), or AMBIGUOUS (multiple valid interpretations, user must clarify).
- For AMBIGUOUS items: the pipeline MUST stop and ask the user. This is the one exception to "no approval gates." Frame it as: "Your spec mentions X but doesn't specify Y. Which approach?" with concrete options.
- For INFERABLE items: proceed with the default but document the assumption in PROJECT.md's Key Decisions table with outcome "— Inferred from spec."
- Build a "spec gap checklist" into the workflow: Does the spec specify a tech stack? User types? Core value / prioritization? Data model? External integrations? For each gap, the agent decides: infer or ask.

**Warning signs:**
- Generated PROJECT.md with a Core Value that's generic ("Deliver a great user experience")
- REQUIREMENTS.md where all requirements read like section headings ("Handle payments")
- No entries in KEY Decisions table
- Spec says "integrate with X" but no details about X's API, auth, or data format

**Phase to address:**
Phase 1 (spec synthesis). The ambiguity detection must be built into the synthesis step, not bolted on after. It's architecturally foundational.

---

### Pitfall 4: Multi-File Spec Contradiction — Conflicting Specs Produce Incoherent Plans

**What goes wrong:**
User provides 3 spec files: `overview.md` says "mobile-first React Native app," `technical.md` says "Next.js web application," and `requirements.md` lists features assuming both. The pipeline doesn't detect the contradiction and generates a PROJECT.md that incoherently describes both a mobile app and a web app, leading to a roadmap that's impossible to execute.

**Why it happens:**
- Spec files are often written by different people or at different times
- When synthesizing multiple documents, the agent treats each as additive rather than checking for conflicts
- Contradictions aren't always obvious — they can be implicit (one file assumes server-side rendering, another assumes a SPA)
- The "fully automatic" design goal discourages stopping to resolve conflicts

**How to avoid:**
- The synthesis step must include an explicit **contradiction detection pass** before generating artifacts. After reading all spec files, the agent should:
  1. List all technology choices mentioned across files
  2. List all architecture assumptions
  3. List all scope statements
  4. Flag where files disagree
- For detected contradictions: STOP and present the conflict to the user with the specific file + section references. "File A says X, File B says Y — which is correct?"
- Order spec files by specificity: if a general overview contradicts a detailed technical spec, the detailed spec wins (but still flag it).
- In the workflow, require the agent to produce a "Spec Consistency Report" (even if just internal to the agent's reasoning) before generating PROJECT.md.

**Warning signs:**
- Generated PROJECT.md with constraints that contradict each other
- REQUIREMENTS.md with features that assume different architectures
- Roadmap phases that build incompatible things
- Spec folder contains files from clearly different project iterations

**Phase to address:**
Phase 1 (spec synthesis). Must be part of the synthesis step, before artifact generation.

---

### Pitfall 5: Custom YAML Frontmatter Parser Breaks on Spec Frontmatter

**What goes wrong:**
The existing `frontmatter.cjs` parser handles the specific YAML patterns used in GSD's own files (plan frontmatter, summary frontmatter). User spec files may include YAML frontmatter with patterns the parser doesn't handle: multiline strings (`|`, `>`), complex nested arrays, comments (`#`), anchors/aliases (`&`, `*`), quoted keys, boolean values (`yes`/`no`/`true`/`false`), or non-standard date formats. If the spec-reading pipeline uses `extractFrontmatter()` on user spec files, it will silently produce wrong results or crash.

**Why it happens:**
- The custom parser in `frontmatter.cjs` was built for GSD's controlled YAML patterns, not arbitrary YAML
- The zero-dependency constraint means we can't use `js-yaml` or similar libraries
- Developers assume frontmatter parsing "just works" because it works on GSD files
- Silent failures (wrong parse result rather than error) are the worst outcome

**How to avoid:**
- Do NOT use `extractFrontmatter()` on user-provided spec files. If specs have frontmatter, the LLM agent should read the raw file and interpret frontmatter in context.
- If programmatic frontmatter parsing of spec files is truly needed, add a separate, more defensive parser that either:
  a) Only extracts simple key-value pairs and ignores complex YAML, or
  b) Explicitly errors on unsupported YAML features (multiline, anchors, etc.)
- Clearly document in the workflow that spec files' frontmatter is NOT parsed by `gsd-tools.cjs` — it's read as raw text by the agent.
- Keep `frontmatter.cjs` unchanged for GSD's own files.

**Warning signs:**
- Code that calls `extractFrontmatter()` on files from the spec folder
- Test specs that happen to only use simple key-value frontmatter
- Spec files with `|` or `>` multiline YAML producing empty/wrong parse results
- Treating frontmatter metadata (like `title:`, `author:`, `status:`) as project requirements

**Phase to address:**
Phase 1 (spec reading). Design decision: agent reads raw files, no programmatic frontmatter parsing of spec files.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Concatenate all spec files into one big prompt | Simple implementation, no file-ordering logic | Token limit explosions on large spec folders (10+ files); context window overwhelm degrades synthesis quality | MVP only, with a file-count/size warning. Must add chunking strategy before v2. |
| Skip the research phase for spec-driven projects | Faster pipeline, fewer tokens | Specs have blind spots. The PROJECT.md says "use research to validate and supplement spec content." Skipping means spec gaps propagate to roadmap. | Never — the project spec explicitly requires research always runs. |
| Hardcode spec folder path as `./specs/` | No argument parsing needed | Users with different folder structures can't use the command. The PROJECT.md already specifies "default `./specs/`, configurable via argument." | Never — must be configurable from day 1 per spec. |
| Reuse the `--auto` mode of `/gsd-new-project` | Less new code, faster delivery | `--auto` expects a single document via `@` reference, not a folder of files. It skips questioning but still has approval gates the spec-driven flow doesn't want. The flows are architecturally different. | Never — create a new command/workflow. Can share the downstream pipeline (research, roadmap) but the entry point must be distinct. |
| Generate REQUIREMENTS.md without REQ-ID categories | Simpler synthesis, agent doesn't need to categorize | Every downstream tool expects `[CATEGORY]-[NUMBER]` format. `phase.cjs` and `roadmap.cjs` parse REQ-IDs. Uncategorized requirements break traceability. | Never — REQ-IDs are structurally required. |

## Integration Gotchas

Common mistakes when connecting spec-driven flow to existing GSD components.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `gsd-tools.cjs init new-project` | Calling it from the new workflow and getting `project_exists: true` error because artifacts were partially written | The new command needs its own `init` subcommand (e.g., `init new-project-from-spec`) or must handle the `project_exists` check differently since it creates PROJECT.md as part of synthesis, not as a separate gate. |
| `bin/install.js` command registration | Adding the new command but forgetting to handle all three runtimes (Claude Code, OpenCode, Gemini CLI) — especially the Gemini conversion which transforms `@` references differently | Follow the exact pattern in `install.js` for existing commands. Test registration in all three runtimes. The Gemini runtime uses a different slash command syntax. |
| Research agent spawning | Passing spec content directly in the Task prompt, blowing up context | Pass file paths as `<files_to_read>` references, same pattern as existing research spawning in `new-project.md`. The spec content goes into PROJECT.md first, then agents read PROJECT.md. |
| `gsd-tools.cjs commit` | Committing artifacts that fail `gsd-tools.cjs` parsing (e.g., ROADMAP.md without parseable phase structure) | Run `gsd-tools.cjs roadmap-phase [phase]` as a validation step before committing. If it fails to parse, the artifact is malformed. |
| Config.json creation | Not creating config.json before running research/roadmap agents — they read it for model profile and workflow settings | Config.json must be created early in the pipeline. The spec may specify workflow preferences, but defaults must exist. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading all spec files into a single agent prompt | Works fine with 2-3 small spec files | Implement file-size check: warn if total spec content exceeds 50KB; implement summarization or chunking above that threshold | 5+ spec files totaling >100KB (e.g., detailed API specs, data model docs) |
| Running 4 parallel research agents + synthesizer on a large project | Works on small projects with focused specs | This is the existing pattern and is fine. But with spec-driven projects, the spec may describe a massive scope, causing each researcher to produce enormous output | Specs describing 50+ features or multiple subsystems |
| Re-reading spec files in every agent | Spec content read by synthesizer, then again by each researcher, then by roadmapper | Write PROJECT.md first, then all downstream agents read PROJECT.md (which is already synthesized). Don't pass raw specs to research/roadmap agents. | Not a scale issue but a consistency issue — different agents may interpret the same spec differently |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Spec files containing secrets (API keys, passwords, tokens) that get copied into PROJECT.md or committed | Secrets leak into git history via `.planning/` artifacts | Add a warning in the workflow: "Check spec files for secrets before synthesis. Do not copy API keys, tokens, or passwords into planning artifacts." The agent should flag apparent secrets. |
| Spec folder path traversal (`../../etc/passwd` as argument) | Reading arbitrary files outside the project | Validate that the spec folder path resolves to within the project directory (or an absolute path the user explicitly provides). `path.resolve()` + verify it's under cwd. |
| Spec files with malicious markdown (script injection via HTML in markdown) | Not directly exploitable in GSD's context (no browser rendering) but could confuse LLM agents | Low risk for GSD. No prevention needed beyond standard markdown handling. |

## UX Pitfalls

Common user experience mistakes in spec-driven automation.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback during spec reading | User provides 5 spec files and sees nothing for 30+ seconds while agents work | Show progress: "Reading 5 spec files from ./specs/..." then "Synthesizing project context..." then "Running research (4 agents)..." — same banner pattern as existing workflow |
| Generating everything then showing a wall of text | User sees 500 lines of generated artifacts and can't tell if it's right | Show key decisions and extracted context incrementally: "Extracted: [project name], [core value], [N requirements]. Does this look right?" (but only for ambiguous cases per the "minimal interaction" design) |
| No way to see what was extracted from specs | User can't verify the pipeline understood their specs correctly | Include a "Spec Sources" section in PROJECT.md that lists which spec files were read and what was extracted from each. This creates an audit trail. |
| Error messages that say "spec parsing failed" without pointing to the problematic file/line | User has 5 spec files and doesn't know which one caused the issue | Always include the source file path in any error or ambiguity message: "In `specs/technical.md`: spec mentions 'PostgreSQL' but `specs/overview.md` mentions 'MongoDB' — which database?" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **PROJECT.md:** Often missing Core Value section — verify the generated PROJECT.md has a non-generic Core Value that actually drives prioritization (not "Build a great product")
- [ ] **REQUIREMENTS.md:** Often missing REQ-IDs — verify every requirement has `[CATEGORY]-[NUMBER]` format and categories are consistent
- [ ] **REQUIREMENTS.md:** Often missing Traceability section — it should be empty/placeholder initially but must exist for the roadmapper to fill
- [ ] **ROADMAP.md:** Often missing `**Requirements**:` lines in Phase Details — verify each phase lists its REQ-IDs
- [ ] **ROADMAP.md:** Often missing Progress table — verify it exists with all phases listed
- [ ] **STATE.md:** Often missing `## Project Reference` section — verify it references PROJECT.md with core value one-liner
- [ ] **config.json:** Often missing `workflow` object — verify `research`, `plan_check`, `verifier` keys exist
- [ ] **Command registration:** Often works in Claude Code but not OpenCode/Gemini — verify all three runtimes in install.js
- [ ] **Spec folder argument:** Often hardcoded to `./specs/` — verify it's configurable via command argument
- [ ] **Git commit:** Often skipped or fails silently — verify each artifact is committed (gsd-tools.cjs commit pattern)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Malformed artifacts (wrong format) | LOW | Re-run `/gsd-new-project-from-spec` — it's idempotent if run on a fresh project. Delete `.planning/` and retry. |
| Contradictory specs produced incoherent plan | MEDIUM | User must resolve spec contradictions first, then re-run. The "Spec Sources" section in PROJECT.md helps identify which file caused which decision. |
| Missing ambiguity detection (vague requirements shipped) | HIGH | Discovered late during execution. Must go back to REQUIREMENTS.md, re-specify vague requirements, update ROADMAP.md, and re-plan affected phases. This is exactly the rework the spec-driven flow should prevent. |
| Custom parser broke on user YAML | LOW | If agent-driven approach was used: no impact (agent reads raw text). If programmatic parser was used: fix parser, re-run. |
| Output drift (artifacts incompatible with downstream) | HIGH | Must diff spec-generated artifacts against interactive-generated ones, identify structural gaps, fix the workflow prompt, and re-generate. Every downstream command must be re-tested. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Markdown structure assumption | Phase 1: Core spec reading | Verify: no regex-based markdown parsing in Node.js code; agent reads raw files |
| Output drift | Phase 1: Artifact generation + Phase 3: Integration testing | Verify: run every `/gsd:*` command against spec-generated project; diff output format against interactive |
| Ambiguity silence | Phase 1: Spec synthesis workflow | Verify: test with deliberately vague spec; pipeline must stop and ask at least one question |
| Multi-file contradiction | Phase 1: Spec synthesis workflow | Verify: test with contradictory specs; pipeline must detect and flag |
| Custom YAML parser misuse | Phase 1: Spec reading design | Verify: `extractFrontmatter()` is never called on user spec files |
| Spec concatenation token limits | Phase 2: Robustness | Verify: test with >100KB of spec files; pipeline warns or chunks |
| Missing command registration | Phase 2: Multi-runtime support | Verify: install and test in Claude Code, OpenCode, and Gemini CLI |
| Secrets in specs | Phase 2: Robustness | Verify: agent flags obvious secrets (API keys, tokens) in spec files |

## Sources

- Codebase analysis: `get-shit-done/workflows/new-project.md` (existing interactive flow — the reference implementation)
- Codebase analysis: `get-shit-done/bin/lib/frontmatter.cjs` (custom YAML parser limitations)
- Codebase analysis: `get-shit-done/bin/lib/init.cjs` (init command patterns and downstream dependencies)
- Codebase analysis: `get-shit-done/templates/requirements.md` (REQ-ID format requirements)
- Codebase analysis: `get-shit-done/templates/roadmap.md` (phase format requirements)
- Codebase analysis: `bin/install.js` (multi-runtime registration pattern)
- Codebase analysis: `get-shit-done/bin/lib/config.cjs` (config.json structure requirements)
- Project specification: `.planning/PROJECT.md` (spec-driven flow requirements and constraints)
- Domain expertise: Document-to-artifact pipeline patterns (HIGH confidence — this is a well-understood problem space)

---
*Pitfalls research for: spec-driven project initialization*
*Researched: 2026-02-21*
