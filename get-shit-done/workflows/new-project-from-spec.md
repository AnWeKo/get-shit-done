<purpose>
Initialize a project from spec files. Reads markdown specs from a folder, classifies each file's role, detects contradictions and gaps, synthesizes PROJECT.md. This is the spec-driven alternative to the interactive questioning flow in `new-project.md`.

Instead of deep interactive questioning, this workflow:
1. Reads all .md files from a spec folder
2. Classifies each file by content (PRD, tech spec, user stories, etc.)
3. Synthesizes a unified PROJECT.md using the project template
4. Detects contradictions and gaps, asking the user only when critical

Same output format as `/gsd:new-project` — downstream tools work unchanged.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup and Initialization

**MANDATORY FIRST STEP — Execute these checks before ANY user interaction:**

```bash
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs init new-project)
```

Parse JSON for: `project_exists`, `has_git`, `is_brownfield`, `needs_codebase_map`, `commit_docs`, `has_codebase_map`, `planning_exists`, `has_existing_code`, `has_package_file`, `researcher_model`, `synthesizer_model`, `roadmapper_model`, `project_path`.

**If `project_exists` is true:** Error — project already initialized:
```
Error: Project already initialized.

A .planning/PROJECT.md already exists. Use /gsd:progress to continue.
```
Exit.

**If `has_git` is false:** Initialize git:
```bash
git init
```

**Parse spec folder path from `$ARGUMENTS`:**
- If `$ARGUMENTS` contains a path → use that as the spec folder
- If `$ARGUMENTS` is empty → default to `./specs/`

Store as `$SPEC_PATH`.

**Display initial banner:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► READING SPECS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 2. Existing `.planning/` Detection

**If `.planning/` directory exists with artifacts** (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, etc.):

Use AskUserQuestion:
- header: "Existing Project"
- question: "Found existing planning artifacts in .planning/. Proceeding will overwrite them."
- options:
  - "Overwrite" — Replace existing artifacts with new spec-driven output
  - "Abort" — Exit without changes

**If "Abort":** Exit with message:
```
Aborted. Existing .planning/ artifacts preserved.
```

**If "Overwrite":** Continue. Existing artifacts will be replaced during generation.

**If `.planning/` does not exist or is empty:** Continue silently.

## 3. Brownfield Offer

**If `needs_codebase_map` is true** (from init — existing code detected but no codebase map):

Use AskUserQuestion:
- header: "Codebase"
- question: "I detected existing code in this directory. Would you like to map the codebase first?"
- options:
  - "Map codebase first" — Run /gsd:map-codebase to understand existing architecture (Recommended)
  - "Skip mapping" — Proceed with project initialization

**If "Map codebase first":**
```
Run `/gsd:map-codebase` first, then return to `/gsd:new-project-from-spec`
```
Exit command.

**If "Skip mapping" OR `needs_codebase_map` is false:** Continue to Step 4.

## 4. Spec Folder Validation and File Reading

**Validate spec folder exists and contains .md files.**

```bash
ls "$SPEC_PATH" 2>/dev/null
```

**If folder doesn't exist:**
```
No spec folder found at {SPEC_PATH}

Create .md files there, or specify a path:
  /gsd:new-project-from-spec ./my-specs/
```
Exit.

**Check for .md files:**
```bash
ls "$SPEC_PATH"/*.md 2>/dev/null
```

**If folder exists but no .md files:**
```
No .md files found in {SPEC_PATH}

Add markdown spec files (.md) to this folder and try again.
```
Exit.

**If .md files found:**

1. Enumerate all `.md` files from the folder (top-level only, not recursive):
   ```bash
   ls "$SPEC_PATH"/*.md
   ```

2. Display progress:
   ```
   Reading {N} spec files from {SPEC_PATH}...
   ```

3. Read each file's full content using the Read tool.

4. Display file list with sizes:
   ```
   ┌─────────────────────────────────────────┐
   │ Spec Files                              │
   ├─────────────────────┬───────────────────┤
   │ File                │ Size              │
   ├─────────────────────┼───────────────────┤
   │ prd.md              │ 4.2 KB            │
   │ tech-spec.md        │ 8.1 KB            │
   │ user-stories.md     │ 2.3 KB            │
   │ api.md              │ 5.7 KB            │
   └─────────────────────┴───────────────────┘
   ```

5. **Warn about non-markdown files** in the folder (don't error):
   ```bash
   # Check for non-.md files
   ls "$SPEC_PATH" | grep -v '\.md$'
   ```
   If non-markdown files exist:
   ```
   ⚠ Skipping non-markdown files: schema.json, notes.txt
   ```

Store all file contents for the classification step.

## 5. Spec File Classification

**Classify each spec file by analyzing its CONTENT (not filename).**

For each spec file, the agent reads the full content and assigns one of these roles:

| Role | Description | Typical Content |
|------|-------------|-----------------|
| PRD / Product Requirements | High-level product vision, features, user needs | Goals, user personas, feature lists, success metrics |
| Technical Specification | Implementation details, architecture decisions | System design, data flow, API contracts, tech stack |
| User Stories / Use Cases | Behavioral requirements from user perspective | "As a user, I want...", acceptance criteria, scenarios |
| Architecture / System Design | System structure and component relationships | Component diagrams, service boundaries, data models |
| Constraints / Non-functional Requirements | Performance, security, compliance requirements | SLAs, security policies, regulatory requirements |
| API Specification | API endpoints, request/response formats | REST/GraphQL endpoints, schemas, authentication |
| Data Model / Schema | Database structure, entity relationships | Tables, fields, relationships, migrations |
| UI/UX Specification | Interface design, user flows, interactions | Wireframes (described), navigation, component specs |
| Other / General | Doesn't fit neatly into above categories | Mixed content, meeting notes, brainstorming |

**Classification approach:** The orchestrating agent (Claude) reads each file and assigns a role based on semantic understanding of the content. No regex parsing — the agent interprets content directly.

**Display classification results:**
```
Classifying spec files...

✓ prd.md — PRD / Product Requirements
✓ tech-spec.md — Technical Specification
✓ user-stories.md — User Stories / Use Cases
✓ api.md — API Specification
```

**Store classification alongside file content** for the synthesis step (Plan 02). Each file is tracked as:
- Filename
- Assigned role
- Full content (raw text, including any YAML frontmatter as-is)

**CRITICAL:** Do NOT use `extractFrontmatter()` on user spec files. Read raw content. The custom YAML parser only handles GSD's controlled patterns — user specs may contain arbitrary YAML that would silently produce wrong results.

**CRITICAL:** Do NOT build a regex-based spec parser. Treat specs as unstructured text for agent consumption. The agent interprets meaning semantically.

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- Plan 02 continues from here — synthesis, conflict detection, output   -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

## 6. Synthesis & Conflict Detection

<!-- No regex-based spec parsing — agent interprets content semantically -->

**Display progress:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SYNTHESIZING SPECS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing {N} classified spec files...
```

The orchestrating agent (Claude) performs synthesis — this is NOT delegated to a subagent. The agent processes all classified spec files in a single pass:

### 6a. Merge Overlapping Content

When multiple specs cover the same topic (e.g., two files both describe authentication requirements), merge and keep the most specific/detailed version of each point. Track which file(s) contributed to each merged item for traceability.

**Rules:**
- More specific beats more general ("JWT with RS256" beats "token-based auth")
- Quantitative beats qualitative ("< 200ms response time" beats "fast responses")
- Implementation detail beats vague intent ("PostgreSQL with row-level security" beats "secure database")
- When specificity is equal, keep both and let the user decide in Step 6b

### 6b. Detect Contradictions

Scan all classified specs for conflicts between files. Classify each contradiction:

**Major contradiction** (require user input):
- Architectural conflicts: "REST API" vs "GraphQL", "monolith" vs "microservices"
- Technology conflicts: "PostgreSQL" vs "MongoDB", "React" vs "Vue"
- Feature-level conflicts: "real-time via WebSocket" vs "polling-based updates"
- Scope conflicts: One spec includes a feature, another explicitly excludes it
- Priority conflicts: Different specs disagree on what's most important

**Minor difference** (resolve automatically):
- Wording/style differences: "users" vs "customers" for the same concept
- Slight detail variations: "5 retries" vs "3 retries" (use the more conservative/specific)
- Formatting differences: Different heading structures for same content
- Redundant coverage: Same point stated differently in two files

For minor differences, automatically use the more specific/conservative version and note the resolution for traceability.

### 6c. Detect Critical Gaps

Identify information that is critically missing — things that would significantly affect project structure if assumed wrong:

- No target users/audience defined across any spec
- No tech stack preference stated (language, framework, database)
- Core feature described but no success criteria or acceptance criteria
- Conflicting priority signals with no resolution
- No deployment or hosting strategy mentioned
- Authentication/authorization model not specified despite user-facing features
- No data model or persistence strategy for a data-heavy application

**Skip gaps that are non-critical:**
- Missing nice-to-haves or future roadmap items
- Absent style/design preferences (use sensible defaults)
- Missing CI/CD details (can be decided later)

### 6d. Batch All Questions

Collect ALL major contradictions and critical gaps found during analysis. Do NOT ask questions one at a time. Present them as a single batch after analysis completes.

**Each question MUST cite source files and relevant quotes:**

```
**Conflict 1: API Architecture**
- `prd.md` says: "Build a REST API with standard endpoints" (line ~15)
- `tech-spec.md` says: "Use GraphQL for all client-server communication" (section 3)
→ Which approach should we use? (REST / GraphQL / Hybrid)

**Conflict 2: Database Choice**
- `tech-spec.md` says: "Use PostgreSQL for relational data" (line ~42)
- `architecture.md` says: "MongoDB for flexible document storage" (under Data Layer)
→ Which database? (PostgreSQL / MongoDB / Both for different concerns)

**Gap 1: Target Users**
- No spec file defines the primary user persona or target audience
→ Who are the primary users of this system?

**Gap 2: Authentication**
- `prd.md` mentions "secure login" but no spec details the auth approach
→ What authentication method? (Email/password / OAuth / Magic links / Other)
```

**Present questions using AskUserQuestion** (if ≤ 3 questions) or as a numbered markdown list (if > 3 questions). Wait for responses to all questions before proceeding.

**If no contradictions or gaps found:**
```
No conflicts detected — specs are consistent ✓
```

Display: `Asking about {N} conflicts and gaps...` (if any questions exist)

### 6e. Classify Extracted Requirements

After resolving all contradictions and gaps, classify every requirement extracted from specs:

- **CLEAR:** Explicitly stated in specs, unambiguous — use directly
- **INFERABLE:** Not stated explicitly but reasonably deduced from context — use, but document the inference in Key Decisions table with `⚠️ Revisit` outcome
- **AMBIGUOUS:** Could go either way, needs user input — should have been caught in Steps 6b/6c above; if any remain, ask immediately

Document all INFERABLE assumptions in the Key Decisions table so the user can review and override later.

## 7. PROJECT.md Generation

<!-- NEVER use extractFrontmatter() on user spec files -->
<!-- Classify by content analysis, not filename -->

**Display progress:**
```
Generating PROJECT.md...
```

**Create `.planning/` directory structure:**
```bash
mkdir -p .planning
```

Generate PROJECT.md following the **EXACT** template structure from `get-shit-done/templates/project.md`:

```markdown
# [Project Name from specs]

## What This Is

[Synthesized from specs — 2-3 sentences describing what this product does and who it's for.
Use the language and framing from the spec files.]

(Generated from spec files: file1.md, file2.md, ...)

## Core Value

[The ONE thing that matters most. Extract from the highest-priority content across all specs.
If not explicitly stated, infer from the most emphasized features/goals.
If unclear, should have been asked in Step 6.]

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] [Requirement 1] <!-- from: prd.md -->
- [ ] [Requirement 2] <!-- from: tech-spec.md, user-stories.md -->
- [ ] [Requirement 3] <!-- from: prd.md -->

[Each requirement has an inline HTML comment noting which spec file(s) it came from]

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Exclusion 1] — [why] <!-- from: constraints.md -->
- [Exclusion 2] — [why] <!-- from: prd.md -->

## Context

[Background information synthesized from all specs:
- Technical environment or ecosystem
- Relevant prior work or experience
- User research or feedback themes
- Known issues to address

Include source attributions for major points.]

See `.planning/spec-references/` for detailed specifications preserved from input docs.

## Constraints

- **[Type]**: [What] — [Why] <!-- from: tech-spec.md -->
- **[Type]**: [What] — [Why] <!-- from: constraints.md -->

Common types: Tech stack, Timeline, Budget, Dependencies, Compatibility, Performance, Security

## Key Decisions

<!-- Decisions that constrain future work. Imported from specs + inferred. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice explicitly stated in specs] | [Why — from spec content] <!-- from: tech-spec.md --> | — Pending |
| [INFERABLE assumption] | [What was inferred and from which specs] | ⚠️ Revisit |
| [Risky decision from specs] | [Why this seems risky — conflicting signals or unusual choice] | ⚠️ Revisit |

---
*Generated from spec files: [comma-separated list of all spec filenames]. Last updated: [date]*
```

**Inline traceability rules:**
- Each major point in PROJECT.md notes which spec file(s) it came from
- Use HTML comments for traceability: `<!-- from: filename.md -->`
- This is non-intrusive and doesn't clutter the document when read as rendered markdown
- If a point was synthesized from multiple files, list all: `<!-- from: prd.md, tech-spec.md -->`

**Key Decisions import:**
- Import decisions found in specs into the Key Decisions table
- Flag any that seem risky or contradictory with `⚠️ Revisit` outcome
- Add INFERABLE assumptions from Step 6e with `⚠️ Revisit` outcome
- Decisions that were resolved via user questions in Step 6d get `— Pending` outcome

**Supplementary content:**
- Content from specs that doesn't map cleanly to PROJECT.md sections is preserved as separate reference files
- This includes: detailed API schemas, comprehensive data models, extensive user story lists, UI wireframe descriptions, deployment runbooks, etc.

```bash
mkdir -p .planning/spec-references  # only if supplementary content exists
```

- Name files based on content type: `api-specification.md`, `data-model.md`, `user-stories.md`, etc.
- Add the reference note in PROJECT.md Context section: `See .planning/spec-references/ for detailed specifications preserved from input docs.`
- If no supplementary content exists, skip creating the directory and omit the reference note

**Commit PROJECT.md (and supplementary files if any):**
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs: synthesize PROJECT.md from spec files" --files .planning/PROJECT.md
```
If supplementary reference files were created, include them in the commit:
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs: synthesize PROJECT.md from spec files" --files .planning/PROJECT.md .planning/spec-references/api-specification.md .planning/spec-references/data-model.md
```

**CRITICAL: If `.planning/` already exists and user said "Overwrite" in Step 2, that permission covers this step.**

## 8. Done

**Display completion summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PROJECT INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]** (from spec files)

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Spec References| `.planning/spec-references/`|

**Source:** {N} spec files from {path}
**Conflicts resolved:** {N} (or "None")
**Questions asked:** {N} (or "None — specs were complete")

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Pipeline automation** — generate config, research, requirements, roadmap

This phase produced PROJECT.md only. To complete the full pipeline, 
Phase 2 will add: config.json → research → REQUIREMENTS.md → ROADMAP.md → STATE.md

For now, you can:
- Review the generated PROJECT.md: `cat .planning/PROJECT.md`
- Re-run with different specs: `/gsd:new-project-from-spec [path]`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

**Notes:**
- Omit the "Spec References" row from the artifact table if no supplementary files were created
- If the "Overwrite" path was taken in Step 2, mention it: "Replaced existing .planning/ artifacts"

</process>

<output>

- `.planning/PROJECT.md` — project context synthesized from spec files
- `.planning/spec-references/` — supplementary content preserved from specs (if any)

</output>

<success_criteria>

- [ ] Spec folder validated (exists, contains .md files)
- [ ] All .md files read and classified by role
- [ ] Contradictions detected and major ones presented to user with citations
- [ ] Critical gaps detected and presented in batch
- [ ] Minor differences resolved automatically
- [ ] PROJECT.md generated matching template structure
- [ ] Inline traceability (source file attributions) present
- [ ] Supplementary content preserved in spec-references/
- [ ] Key Decisions imported from specs, risky ones flagged
- [ ] PROJECT.md committed to git
- [ ] User knows Phase 2 adds pipeline automation

</success_criteria>
