<purpose>
Initialize a project from spec files — full pipeline from reading specs to committed planning artifacts. Reads markdown specs from a folder, classifies each file's role, detects contradictions and gaps, synthesizes PROJECT.md, extracts config preferences, runs domain research, generates requirements, creates roadmap, and commits everything atomically. This is the spec-driven alternative to the interactive questioning flow in `new-project.md`.

Instead of deep interactive questioning, this workflow:
1. Reads all .md files from a spec folder
2. Classifies each file by content (PRD, tech spec, user stories, etc.)
3. Synthesizes a unified PROJECT.md using the project template
4. Detects contradictions and gaps, asking the user only when critical
5. Extracts config preferences from spec prose (or asks user)
6. Runs 4 parallel domain researchers + synthesizer
7. Generates REQUIREMENTS.md with REQ-IDs and traceability
8. Creates ROADMAP.md and STATE.md via roadmapper agent
9. Commits all artifacts atomically

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

**Three scenarios, checked in order:**

### 3a. Existing Codebase Map

**If `has_codebase_map` is true** (from init — codebase map already exists in `.planning/codebase/`):

Use AskUserQuestion:
- header: "Codebase Map"
- question: "Found an existing codebase map in .planning/codebase/. Use it or refresh?"
- options:
  - "Use existing" — Proceed using the current codebase map
  - "Refresh map" — Run /gsd:map-codebase to update, then return to /gsd:new-project-from-spec

**If "Refresh map":**
```
Run `/gsd:map-codebase` first, then return to `/gsd:new-project-from-spec`
```
Exit command.

**If "Use existing":** Continue to Step 3b (capability extraction).

### 3a (alt). No Codebase Map, but Existing Code

**If `has_codebase_map` is false AND `needs_codebase_map` is true** (from init — existing code detected but no codebase map):

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

**If "Skip mapping":** Set `codebase_capabilities` to empty list and `codebase_context_files` to empty list. Continue to Step 4 (greenfield path).

### 3a (greenfield). No Existing Code

**If `needs_codebase_map` is false AND `has_codebase_map` is false:** Set `codebase_capabilities` to empty list and `codebase_context_files` to empty list. Continue to Step 4.

## 3b. Extract Codebase Capabilities

**This step runs only when `has_codebase_map` is true** (user chose "Use existing" in Step 3a, or map was already present).

Mirrors the pattern from the interactive `new-project.md` workflow (lines 289-314) where codebase capabilities become Validated requirements.

1. Read `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STACK.md`
2. Identify what the codebase already does — extract capabilities as a list of descriptions (e.g., "JWT authentication with refresh tokens", "PostgreSQL database with Prisma ORM", "REST API with Express")
3. Store as `codebase_capabilities` (a list of capability descriptions) for use in Step 7

Also enumerate and store `codebase_context_files` — the list of codebase map files that exist in `.planning/codebase/` (ARCHITECTURE.md, STACK.md, and any others such as STRUCTURE.md, CONVENTIONS.md, INTEGRATIONS.md) for passing to research agents in Step 10.

**Display progress:**
```
Extracting capabilities from codebase map...
  Found {N} existing capabilities
  Codebase context: {list of files}
```

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

{If `codebase_capabilities` is not empty (brownfield with codebase map):}

Populate with capabilities extracted in Step 3b:
- ✓ [Existing capability 1] — existing
- ✓ [Existing capability 2] — existing
- ✓ [Existing capability 3] — existing

Auto-mark as Validated — no user confirmation needed (CONTEXT.md locked decision).

**Partial overlap handling:** When a spec requirement partially overlaps with existing code, split the requirement — existing part as Validated, missing part as Active (two separate line items). Example:
- Spec says "JWT auth with social login"
- Codebase already has "JWT auth with email/password"
- → Validated: "✓ JWT authentication with email/password — existing"
- → Active: "[ ] Social login (OAuth) integration"

{If `codebase_capabilities` is empty (greenfield):}
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

{If `codebase_capabilities` is not empty AND there are capabilities NOT mentioned in specs:}

### Existing Capabilities

The codebase has these capabilities that are not covered by the spec requirements. They exist in the codebase but are not being tracked as project requirements:

- [Capability not in specs 1] — (from codebase map)
- [Capability not in specs 2] — (from codebase map)

These are noted for awareness but don't create requirements — specs define what we're building.

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

## 8. Config Extraction from Specs

**Display progress:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► EXTRACTING CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8a. Check for Existing Config (Re-run Scenario)

**If `.planning/config.json` already exists:**

Use AskUserQuestion:
- header: "Config"
- question: "Found existing config.json. How should I proceed?"
- options:
  - "Use existing config" — Keep current settings, skip to Step 9
  - "Re-infer from specs" — Analyze spec prose for config preferences again
  - "Start fresh" — Use defaults for all values, skip inference

**If "Use existing config":** Read `.planning/config.json`, display its values, skip to Step 9.

**If "Re-infer from specs":** Continue to Step 8b below.

**If "Start fresh":** Use defaults for all values, skip inference, proceed directly to Step 8c to present defaults for confirmation.

**If `.planning/config.json` does not exist:** Continue to Step 8b.

### 8b. Analyze Spec Prose for Config Signals

The agent scans all classified spec file content (from Step 5) for config preference signals. For each config key, look for natural language cues that suggest a value. **Conservative inference:** only set a value when the signal is very clear. When remotely ambiguous, mark as "needs confirmation."

**Skip inference for purely technical keys** that don't have natural prose mappings (e.g., `max_parallel_agents`) — use defaults for those.

**Signal-to-config mapping table:**

| Config Key | Spec Signals → Value | Default |
|------------|---------------------|---------|
| `mode` | "move fast", "no blockers", "fully automated" → `yolo`. "careful", "review each step", "approve before" → `interactive` | `yolo` |
| `depth` | "rapid prototyping", "MVP", "ship fast", "quick experiment" → `quick`. "production", "enterprise", "mission-critical", "thorough" → `comprehensive` | `standard` |
| `parallelization` | "speed matters", "fast execution", "parallel" → `true`. "sequential", "one at a time" → `false` | `true` |
| `commit_docs` | "track everything", "audit trail", "version control planning" → `true`. "local only", "no tracking" → `false` | `true` |
| `model_profile` | "high quality", "thorough analysis", "best results" → `quality`. "budget", "cost efficient", "minimize cost" → `budget` | `balanced` |
| `workflow.research` | Always `true` for spec-from-file flow (locked decision: research always runs to validate spec assumptions) | `true` |
| `workflow.plan_check` | "verify", "quality gates", "validate plans" → `true`. "skip verification", "trust the plan" → `false` | `true` |
| `workflow.verifier` | "verify", "validate work", "confirm deliverables" → `true`. "skip checks" → `false` | `true` |

**For each config key:**
1. Scan all classified spec file content for signal phrases
2. If a clear signal is found: record the inferred value AND the source citation (file name + relevant passage)
3. If no signal or ambiguous signals: mark as "default — needs confirmation"
4. If contradictory signals found in different spec files: record both citations, mark as "contradictory — needs user choice" (same pattern as Phase 1 contradiction handling in Step 6b)

### 8c. Present Unified Config View with Citations

Display ALL config values in one view. Each value shows its source:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Config Extraction                                                       │
├──────────────────────┬────────────────┬─────────────────────────────────┤
│ Key                  │ Value          │ Source                          │
├──────────────────────┼────────────────┼─────────────────────────────────┤
│ mode                 │ yolo           │ tech-spec.md: "fully automated" │
│ depth                │ comprehensive  │ prd.md: "production-grade"      │
│ parallelization      │ true           │ (default)                       │
│ commit_docs          │ true           │ (default)                       │
│ model_profile        │ quality        │ prd.md: "thorough analysis"     │
│ workflow.research    │ true           │ (always — spec-from-file flow)  │
│ workflow.plan_check  │ true           │ (default)                       │
│ workflow.verifier    │ true           │ (default)                       │
└──────────────────────┴────────────────┴─────────────────────────────────┘
```

**For inferred values:** Show the spec passage that drove the inference (e.g., "`tech-spec.md` line 12: 'rapid prototyping' → depth: quick")

**For default values:** Show "(default)" with brief rationale

**For contradictory signals:** Show both citations and ask user to choose (same pattern as Phase 1 contradiction handling)

### 8d. Per-Value User Confirmation

Each configurable value gets its own AskUserQuestion option set — NOT a single freeform prompt. Present as a series of questions, one per config key.

For each config key, use AskUserQuestion:
- header: "[Config Key]"
- question: "Inferred [value] from specs ([citation]). Confirm or override?"
  OR: "No spec signal found. Default is [value]. Confirm or override?"
- options: all valid values for that key (e.g., for `mode`: "yolo", "interactive")

**For `workflow.research`:** Do NOT ask — always `true` for the spec-from-file flow (locked decision). Display it in the config view but skip the question.

**After all confirmations, display final summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CONFIG FINALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mode: yolo
depth: comprehensive
parallelization: true
commit_docs: true
model_profile: quality
workflow.research: true (always)
workflow.plan_check: true
workflow.verifier: true
```

**Log user overrides:** If the user changed any inferred value, log the override as a decision in PROJECT.md's Key Decisions table:

```markdown
| Config: [key] set to [value] | User override — spec suggested [other] | — Active |
```

### 8e. Write config.json

```bash
mkdir -p .planning
```

Write `.planning/config.json` with all finalized values:

```json
{
  "mode": "yolo|interactive",
  "depth": "quick|standard|comprehensive",
  "parallelization": true|false,
  "commit_docs": true|false,
  "model_profile": "quality|balanced|budget",
  "workflow": {
    "research": true,
    "plan_check": true|false,
    "verifier": true|false
  }
}
```

**Note:** `workflow.research` is always `true` for the spec-from-file flow (locked decision: research always runs to validate and supplement spec content).

**If `commit_docs` = false:** Add `.planning/` to `.gitignore` (create if needed).

**Do NOT commit config.json here** — all artifacts will be committed in one atomic commit at the end of the pipeline (Plan 03).

## 9. Resolve Model Profile

Use the model variables from the init JSON parsed in Step 1: `researcher_model`, `synthesizer_model`, `roadmapper_model`.

These were already parsed from the `INIT` JSON in Step 1. This step documents that the workflow uses these model variables for agent spawning in subsequent steps:

- `researcher_model` → used when spawning research agents (Step 10)
- `synthesizer_model` → used when spawning the research synthesizer (Step 10)
- `roadmapper_model` → used when spawning the roadmapper agent (Step 12)

## 10. Research

**Display progress:**
```
Running research (4 parallel researchers)... this may take a minute.
```

**No decision gate** — research ALWAYS runs in the spec-from-file flow (locked decision: `workflow.research` is always `true`). Skip any "Research first?" question.

### 10a. Determine Milestone Context

Check PROJECT.md to determine if this is greenfield or subsequent milestone:
- If no "Validated" requirements in PROJECT.md → **Greenfield** (building from scratch)
- If "Validated" requirements exist → **Subsequent milestone** (adding to existing app)

### 10b. Derive Research Topics from Spec Content

Unlike the interactive flow which uses generic research questions, the spec-from-file flow derives **custom research topics** by analyzing PROJECT.md. The agent should:

1. Read the synthesized PROJECT.md
2. Identify the project's domain, tech stack preferences, and key features
3. Generate domain-specific research questions for each of the 4 dimensions:
   - **Stack**: "What's the standard 2025 stack for [specific domain from specs]?" — include any tech stack constraints from specs
   - **Features**: "What features do [domain] products have?" — informed by what specs already specify
   - **Architecture**: "How are [domain] systems typically structured?" — informed by any architecture hints in specs
   - **Pitfalls**: "What do [domain] projects commonly get wrong?" — informed by the specific approach described in specs

Store these as `stack_question`, `features_question`, `architecture_question`, `pitfalls_question` for use in the Task() prompts below.

### 10c. Spawn 4 Parallel Researcher Agents

Create research directory:
```bash
mkdir -p .planning/research
```

Spawn 4 parallel gsd-project-researcher agents:

```
Task(prompt="First, read ~/.claude/agents/gsd-project-researcher.md for your role and instructions.

<research_type>
Project Research — Stack dimension for [domain derived from specs].
</research_type>

<milestone_context>
[greenfield OR subsequent]

Greenfield: Research the standard stack for building [domain] from scratch.
Subsequent: Research what's needed to add [target features] to an existing [domain] app. Don't re-research the existing system.

{If codebase_context_files is not empty:}
Brownfield: Existing codebase uses [summary from STACK.md]. Research should focus on what's NEEDED BEYOND existing capabilities, not re-research the existing system.
</milestone_context>

<question>
{stack_question}
</question>

<files_to_read>
- {project_path} (Project context and goals)
{If codebase_context_files is not empty:}
- .planning/codebase/ARCHITECTURE.md (Existing system architecture)
- .planning/codebase/STACK.md (Existing tech stack)
</files_to_read>

<downstream_consumer>
Your STACK.md feeds into roadmap creation. Be prescriptive:
- Specific libraries with versions
- Clear rationale for each choice
- What NOT to use and why
</downstream_consumer>

<quality_gate>
- [ ] Versions are current (verify with Context7/official docs, not training data)
- [ ] Rationale explains WHY, not just WHAT
- [ ] Confidence levels assigned to each recommendation
</quality_gate>

<output>
Write to: .planning/research/STACK.md
Use template: ~/.claude/get-shit-done/templates/research-project/STACK.md
</output>
", subagent_type="general-purpose", model="{researcher_model}", description="Stack research")

Task(prompt="First, read ~/.claude/agents/gsd-project-researcher.md for your role and instructions.

<research_type>
Project Research — Features dimension for [domain derived from specs].
</research_type>

<milestone_context>
[greenfield OR subsequent]

Greenfield: What features do [domain] products have? What's table stakes vs differentiating?
Subsequent: How do [target features] typically work? What's expected behavior?

{If codebase_context_files is not empty:}
Brownfield: Existing codebase uses [summary from STACK.md]. Research should focus on what's NEEDED BEYOND existing capabilities, not re-research the existing system.
</milestone_context>

<question>
{features_question}
</question>

<files_to_read>
- {project_path} (Project context)
{If codebase_context_files is not empty:}
- .planning/codebase/ARCHITECTURE.md (Existing system architecture)
- .planning/codebase/STACK.md (Existing tech stack)
</files_to_read>

<downstream_consumer>
Your FEATURES.md feeds into requirements definition. Categorize clearly:
- Table stakes (must have or users leave)
- Differentiators (competitive advantage)
- Anti-features (things to deliberately NOT build)
</downstream_consumer>

<quality_gate>
- [ ] Categories are clear (table stakes vs differentiators vs anti-features)
- [ ] Complexity noted for each feature
- [ ] Dependencies between features identified
</quality_gate>

<output>
Write to: .planning/research/FEATURES.md
Use template: ~/.claude/get-shit-done/templates/research-project/FEATURES.md
</output>
", subagent_type="general-purpose", model="{researcher_model}", description="Features research")

Task(prompt="First, read ~/.claude/agents/gsd-project-researcher.md for your role and instructions.

<research_type>
Project Research — Architecture dimension for [domain derived from specs].
</research_type>

<milestone_context>
[greenfield OR subsequent]

Greenfield: How are [domain] systems typically structured? What are major components?
Subsequent: How do [target features] integrate with existing [domain] architecture?

{If codebase_context_files is not empty:}
Brownfield: Existing codebase uses [summary from STACK.md]. Research should focus on what's NEEDED BEYOND existing capabilities, not re-research the existing system.
</milestone_context>

<question>
{architecture_question}
</question>

<files_to_read>
- {project_path} (Project context)
{If codebase_context_files is not empty:}
- .planning/codebase/ARCHITECTURE.md (Existing system architecture)
- .planning/codebase/STACK.md (Existing tech stack)
</files_to_read>

<downstream_consumer>
Your ARCHITECTURE.md informs phase structure in roadmap. Include:
- Component boundaries (what talks to what)
- Data flow (how information moves)
- Suggested build order (dependencies between components)
</downstream_consumer>

<quality_gate>
- [ ] Components clearly defined with boundaries
- [ ] Data flow direction explicit
- [ ] Build order implications noted
</quality_gate>

<output>
Write to: .planning/research/ARCHITECTURE.md
Use template: ~/.claude/get-shit-done/templates/research-project/ARCHITECTURE.md
</output>
", subagent_type="general-purpose", model="{researcher_model}", description="Architecture research")

Task(prompt="First, read ~/.claude/agents/gsd-project-researcher.md for your role and instructions.

<research_type>
Project Research — Pitfalls dimension for [domain derived from specs].
</research_type>

<milestone_context>
[greenfield OR subsequent]

Greenfield: What do [domain] projects commonly get wrong? Critical mistakes?
Subsequent: What are common mistakes when adding [target features] to [domain]?

{If codebase_context_files is not empty:}
Brownfield: Existing codebase uses [summary from STACK.md]. Research should focus on what's NEEDED BEYOND existing capabilities, not re-research the existing system.
</milestone_context>

<question>
{pitfalls_question}
</question>

<files_to_read>
- {project_path} (Project context)
{If codebase_context_files is not empty:}
- .planning/codebase/ARCHITECTURE.md (Existing system architecture)
- .planning/codebase/STACK.md (Existing tech stack)
</files_to_read>

<downstream_consumer>
Your PITFALLS.md prevents mistakes in roadmap/planning. For each pitfall:
- Warning signs (how to detect early)
- Prevention strategy (how to avoid)
- Which phase should address it
</downstream_consumer>

<quality_gate>
- [ ] Pitfalls are specific to this domain (not generic advice)
- [ ] Prevention strategies are actionable
- [ ] Phase mapping included where relevant
</quality_gate>

<output>
Write to: .planning/research/PITFALLS.md
Use template: ~/.claude/get-shit-done/templates/research-project/PITFALLS.md
</output>
", subagent_type="general-purpose", model="{researcher_model}", description="Pitfalls research")
```

### 10d. Spawn Research Synthesizer

After all 4 researcher agents complete, spawn the synthesizer:

```
Task(prompt="
<task>
Synthesize research outputs into SUMMARY.md.
</task>

<files_to_read>
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</files_to_read>

<output>
Write to: .planning/research/SUMMARY.md
Use template: ~/.claude/get-shit-done/templates/research-project/SUMMARY.md
Commit after writing.
</output>
", subagent_type="gsd-research-synthesizer", model="{synthesizer_model}", description="Synthesize research")
```

### 10e. Display Completion

```
Research complete. Findings in .planning/research/
```

**Do NOT commit** — all artifacts will be committed in one atomic commit at the end of the pipeline (Plan 03).

## 11. Generate Requirements

**Display progress:**
```
Generating REQUIREMENTS.md from specs...
```

**No interactive scoping** — requirements come from specs, not user questioning. No per-category AskUserQuestion loops. No "Any additions?" question. No approval gate.

### 11a. Load Context

Read and internalize:
- `.planning/PROJECT.md` (synthesized specs from Phase 1 — source of all requirements)
- `.planning/research/SUMMARY.md` (research findings from Step 10 — informs wording only)
- `.planning/research/FEATURES.md` (feature categories — informs organization)

### 11b. Derive Requirements from Specs

**Locked decision from CONTEXT.md:** "Research findings inform only — requirements come from specs. Research shapes HOW requirements are written (informed by ecosystem reality), not WHAT they are."

The agent should:

1. **Extract all requirements** from PROJECT.md's Active requirements list (these came from spec synthesis in Phase 1)
2. **Include Validated capabilities from PROJECT.md** (brownfield): Validated items from Step 7 should also appear in REQUIREMENTS.md as pre-satisfied items. These get REQ-IDs like Active requirements but are marked as already complete:
   - Checked status: `- [x] **CAT-01**: [Capability] <!-- existing -->`
   - Assigned to no phase (N/A) in the Traceability table
   - Traceability table status shows "Validated" instead of "Pending"
   - This ensures Validated capabilities don't get roadmap phases assigned (CONTEXT.md locked decision)
3. **Organize into domain-appropriate categories** (Claude's discretion — can mirror spec structure or create better groupings based on the project domain)
4. **Assign REQ-IDs** using the format `[CATEGORY]-[NUMBER]` (e.g., AUTH-01, DATA-02, UI-03)
   - Category prefix should be a short, descriptive abbreviation (3-5 chars)
   - Numbers are sequential within each category starting at 01
   - Validated (existing) and Active (new) requirements share the same numbering within categories
5. **Make each requirement specific, testable, and user-centric:**
   - Good: "User can reset password via email link"
   - Bad: "Handle password reset"
   - Good: "API responds within 200ms for read operations"
   - Bad: "Fast API"
6. **Use research findings to INFORM the wording** — e.g., if research says "JWT is standard for auth", shape the auth requirement to mention JWT if the spec implied token auth. Research makes requirements more precise, but does NOT add new requirements beyond what specs define
7. **Include traceability:** each requirement notes which spec file(s) it originated from using the HTML comment pattern established in Phase 1: `<!-- from: filename.md -->`. For Validated items, use `<!-- existing -->`

### 11c. Generate REQUIREMENTS.md

Write `.planning/REQUIREMENTS.md` using this structure:

```markdown
# Requirements: [Project Name]

**Defined:** [date]
**Core Value:** [from PROJECT.md]

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### [Category 1]

{If codebase_capabilities produced Validated items in this category:}
- [x] **CAT-01**: [Existing capability] <!-- existing -->
- [ ] **CAT-02**: [New requirement from specs] <!-- from: spec-file.md -->
- [ ] **CAT-03**: [New requirement from specs] <!-- from: spec-file.md, other.md -->

{If no Validated items (greenfield):}
- [ ] **CAT-01**: [Specific, testable requirement] <!-- from: spec-file.md -->
- [ ] **CAT-02**: [Specific, testable requirement] <!-- from: spec-file.md, other.md -->

### [Category 2]

- [ ] **CAT2-01**: [Requirement] <!-- from: spec-file.md -->

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

[Any items from specs marked as future/later/v2, or features that research suggests deferring]

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| [From PROJECT.md Out of Scope section] | [Reason] |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
{If Validated items exist:}
| CAT-01 | N/A | Validated |
| CAT-02 | TBD | Pending |
| CAT-03 | TBD | Pending |

{If no Validated items (greenfield):}
| CAT-01 | TBD | Pending |
| CAT-02 | TBD | Pending |

**Coverage:**
- v1 requirements: [N] total ([M] validated, [N-M] new)
- Validated (existing): [M] (no phases needed)
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: [N-M]
```

### 11d. Traceability Placeholder

The Traceability section starts with all requirements unmapped (Phase = TBD, Status = Pending). Step 12 (Roadmap, Plan 03) will update this table with actual phase assignments — covering PIPE-09.

**Do NOT commit** — all artifacts will be committed in one atomic commit at the end of the pipeline (Plan 03).

## 12. Create Roadmap

**Display progress:**
```
Creating roadmap...
```

### 12a. Spawn Roadmapper

Spawn gsd-roadmapper agent:

```
Task(prompt="
<planning_context>

<files_to_read>
- .planning/PROJECT.md (Project context)
- .planning/REQUIREMENTS.md (v1 Requirements)
- .planning/research/SUMMARY.md (Research findings)
- .planning/config.json (Depth and mode settings)
</files_to_read>

</planning_context>

<instructions>
Create roadmap:
1. Derive phases from requirements (don't impose structure)
2. Map every v1 requirement to exactly one phase
3. Derive 2-5 success criteria per phase (observable user behaviors)
4. Validate 100% coverage
5. Write files immediately (ROADMAP.md, STATE.md, update REQUIREMENTS.md traceability)
6. Return ROADMAP CREATED with summary

Write files first, then return. This ensures artifacts persist even if context is lost.
</instructions>
", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

### 12b. Handle Roadmapper Return

**If `## ROADMAP BLOCKED`:**
- Present blocker information to the user
- Work with user to resolve
- Re-spawn when resolved

**If `## ROADMAP CREATED`:**
- Continue to Step 13 — no approval gate
- Do NOT present the roadmap for approval (unlike the interactive flow's Step 8 which asks "Does this roadmap structure work?")

**No approval gate** — the spec-from-file flow has no approval gates anywhere (PIPE-08). The roadmap is generated and used as-is.

**Do NOT commit yet** — atomic commit in Step 13.

## 13. Commit and Done

### 13a. Atomic Commit of All Artifacts

Check conditions before committing:

**If `has_git` is false** (from init JSON in Step 1):
```
⚠ No git repo detected. Artifacts generated but not committed.
Run `git init` and commit manually.
```
Skip commit, proceed to 13b.

**If `commit_docs` is false** (from config.json):
```
Artifacts generated but not committed (commit_docs: false in config).
```
Skip commit, proceed to 13b.

**Otherwise — commit everything in one atomic commit:**

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit "docs: initialize project planning from spec files" --files .planning/PROJECT.md .planning/config.json .planning/research/STACK.md .planning/research/FEATURES.md .planning/research/ARCHITECTURE.md .planning/research/PITFALLS.md .planning/research/SUMMARY.md .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md
```

**If `.planning/spec-references/` exists** (from Step 7 — supplementary content preserved from specs):
Include those files in the commit too. List each file in `.planning/spec-references/` and add to the `--files` argument.

### 13b. Display Completion Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PROJECT INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Project Name]** (from spec files)

Created 6 artifacts:

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Config         | `.planning/config.json`     |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |
| State          | `.planning/STATE.md`        |

**Source:** {N} spec files from {SPEC_PATH}
**Phases:** {N} (from ROADMAP.md)
**Requirements:** {N} v1 requirements mapped
**Conflicts resolved:** {N} (or "None")
**Research dimensions:** 4 (Stack, Features, Architecture, Pitfalls)
```

If `.planning/spec-references/` was created, include an additional row:

```
| Spec References | `.planning/spec-references/` |
```

### 13c. Next Steps

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase 1: [Phase Name]** — [Goal from ROADMAP.md]

/gsd-discuss-phase 1 — gather context and clarify approach

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

</process>

<output>

- `.planning/PROJECT.md` — project context synthesized from spec files
- `.planning/config.json` — workflow config (mode, depth, model profile, etc.)
- `.planning/research/` — domain research outputs
  - `STACK.md` — tech stack recommendations
  - `FEATURES.md` — feature analysis (table stakes vs differentiators)
  - `ARCHITECTURE.md` — system architecture patterns
  - `PITFALLS.md` — common mistakes and prevention strategies
  - `SUMMARY.md` — synthesized research findings
- `.planning/REQUIREMENTS.md` — v1 requirements with REQ-IDs and traceability
- `.planning/ROADMAP.md` — phased execution plan with requirement mappings
- `.planning/STATE.md` — project state for session continuity
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
- [ ] config.json generated with inferred + user-confirmed values
- [ ] Research executed (4 parallel researchers + synthesizer)
- [ ] REQUIREMENTS.md generated with REQ-IDs, categories, and spec-source traceability
- [ ] ROADMAP.md and STATE.md created by roadmapper
- [ ] REQUIREMENTS.md traceability updated with phase assignments
- [ ] All artifacts committed atomically (or skip message shown if no git / commit_docs=false)
- [ ] User knows next step is `/gsd-discuss-phase 1`

</success_criteria>
