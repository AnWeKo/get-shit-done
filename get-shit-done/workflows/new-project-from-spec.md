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
</milestone_context>

<question>
{stack_question}
</question>

<files_to_read>
- {project_path} (Project context and goals)
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
</milestone_context>

<question>
{features_question}
</question>

<files_to_read>
- {project_path} (Project context)
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
</milestone_context>

<question>
{architecture_question}
</question>

<files_to_read>
- {project_path} (Project context)
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
</milestone_context>

<question>
{pitfalls_question}
</question>

<files_to_read>
- {project_path} (Project context)
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

<!-- Steps 11-12 added by Plan 02 and Plan 03 -->

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
