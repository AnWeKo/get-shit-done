# Stack Research: Spec-Based Project Initialization

**Domain:** Markdown spec parsing → structured artifact generation pipeline (extending GSD meta-prompting system)
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This is **not a greenfield technology selection problem.** The stack is predetermined: Node.js CommonJS, zero runtime dependencies, custom YAML frontmatter parser, gsd-tools.cjs CLI. The research question is: *What patterns and approaches should we use within these constraints to build a spec-file-driven automation pipeline?*

After analyzing the existing codebase (50+ subcommands, 11 agents, 32 workflows, custom frontmatter parser), the recommendation is: **extend the existing patterns rather than introduce new abstractions.** The spec pipeline is architecturally identical to the `--auto` mode of `/gsd-new-project` — it replaces the questioning phase with file-reading, while reusing the entire downstream pipeline (research → requirements → roadmap) unchanged.

## Recommended Stack

### Core Technologies (All Existing — No New Dependencies)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js (CommonJS) | >=16.7.0 | Runtime | **Existing constraint.** Package.json specifies this. All `.cjs` files use `require()`. No ESM migration needed or desired. |
| `node:fs` | stdlib | Spec file reading, artifact writing | **Already used everywhere.** `safeReadFile()`, `fs.readdirSync()`, `fs.writeFileSync()` patterns throughout codebase. Zero dependency mandate means no `glob` or `fast-glob` packages. |
| `node:path` | stdlib | Path resolution for spec folder | **Already used everywhere.** `path.join()`, `path.isAbsolute()` patterns throughout. |
| `node:test` | stdlib | Testing | **Existing test infrastructure.** `tests/*.test.cjs` use `node:test` + `node:assert`. |

**Confidence: HIGH** — Verified by reading `package.json` (zero runtime deps, `engines: >=16.7.0`), all `.cjs` source files, and existing test infrastructure.

### Supporting Libraries (All Existing — No New Additions)

| Library | Location | Purpose | How It Applies |
|---------|----------|---------|----------------|
| Custom YAML frontmatter parser | `lib/frontmatter.cjs` | Extract metadata from markdown files | **Reuse for spec files that have frontmatter.** `extractFrontmatter()` handles `---\n...\n---` blocks with nested objects, arrays, inline arrays. |
| Core utilities | `lib/core.cjs` | `safeReadFile()`, `output()`, `error()`, `loadConfig()` | **Reuse for all new CLI subcommands.** Established patterns for JSON output, error handling, config loading. |
| Init module | `lib/init.cjs` | Compound init commands | **Extend with `cmdInitNewProjectFromSpec()`.** This is where `init new-project` lives; the spec variant follows the identical pattern. |

**Confidence: HIGH** — Verified by reading all source files directly.

### Development Tools (All Existing)

| Tool | Purpose | Notes |
|------|---------|-------|
| `node --test` | Test runner | Used via `npm test` → `node --test tests/*.test.cjs`. No jest, no mocha. |
| `esbuild` | Hook bundling | Only devDependency. Used for `scripts/build-hooks.js`. Not needed for new feature. |

**Confidence: HIGH** — Verified in `package.json` and `scripts/`.

## Pipeline Architecture Recommendation

### The Core Pattern: "Read Files → Extract Structure → Feed Existing Pipeline"

The spec-based init is a **preprocessing stage** that converts arbitrary markdown spec files into the same structured context that the interactive questioning flow produces. Everything downstream (research, requirements, roadmap) stays unchanged.

```
┌─────────────────────────────────┐
│  /gsd-new-project-from-spec     │  ← New slash command
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Workflow: new-project-from-spec│  ← New workflow (parallels new-project.md)
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 1: gsd-tools init         │  ← New: `init new-project-from-spec <folder>`
│  new-project-from-spec          │     Returns: same fields as `init new-project`
│  <folder>                       │     PLUS: spec_files[], spec_folder, spec_count
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 2: Read & Parse Specs     │  ← Agent reads all .md files from folder
│  (Agent-level, not CLI)         │     Uses: fs.readdirSync + Read tool
│                                 │     Extracts: project name, description,
│                                 │     requirements, constraints, decisions,
│                                 │     tech stack, out-of-scope items
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 3: Ambiguity Detection    │  ← Agent checks for:
│  (Agent-level reasoning)        │     - Missing critical info (no project name?)
│                                 │     - Contradictions between spec files
│                                 │     - Vague requirements needing specifics
│                                 │     - Missing constraints
│                                 │     Only asks user if CRUCIAL info missing.
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 4: Generate PROJECT.md    │  ← Same template as interactive flow
│  + config.json                  │     Uses: templates/project.md
│                                 │     Commits immediately
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 5: Research (always)      │  ← REUSE existing research pipeline
│  4 parallel researchers +       │     Identical spawning as new-project.md
│  synthesizer                    │     Step 6 of existing flow
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 6: Generate REQUIREMENTS  │  ← Auto-generate from spec + research
│  .md                            │     No per-category AskUserQuestion
│                                 │     Same REQ-ID format, same template
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 7: Spawn gsd-roadmapper   │  ← REUSE existing roadmapper
│                                 │     Identical spawning as new-project.md
│                                 │     No approval gate
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Step 8: Commit everything,     │  ← Same commit pattern
│  display summary                │     gsd-tools commit
└─────────────────────────────────┘
```

**Confidence: HIGH** — This mirrors the existing `--auto` mode flow in `new-project.md` almost exactly. The `--auto` mode already skips questioning, skips approval gates, and auto-advances. The spec flow replaces "extract from provided document" with "extract from folder of spec files."

### What's New vs What's Reused

| Component | Status | Notes |
|-----------|--------|-------|
| Slash command file | **NEW** | `commands/gsd/new-project-from-spec.md` |
| Workflow file | **NEW** | `workflows/new-project-from-spec.md` |
| CLI init subcommand | **NEW** | `init new-project-from-spec` in `init.cjs` + router in `gsd-tools.cjs` |
| CLI spec-read subcommand | **NEW (OPTIONAL)** | `spec read-folder <path>` — reads all .md files, returns JSON manifest |
| Agent (spec synthesizer) | **NOT NEEDED** | The workflow orchestrator (Claude/OpenCode/Gemini) does the synthesis directly — same as `--auto` mode reads a provided document |
| Research pipeline | **REUSE** | 4 parallel researchers + synthesizer, unchanged |
| Roadmapper | **REUSE** | `gsd-roadmapper` agent, unchanged |
| Templates | **REUSE** | `project.md`, `requirements.md`, `roadmap.md`, `state.md` — unchanged |
| Installer | **MODIFY** | `bin/install.js` must register new command for all 3 runtimes |

**Confidence: HIGH** — Verified by tracing the complete `--auto` flow through the codebase.

## Spec File Parsing Approach

### Recommendation: Agent-Level Parsing, Not CLI-Level Parsing

**Why NOT a heavy CLI parser:** Spec files are arbitrary markdown. Users will write them however they want — PRDs, design docs, technical specs, braindumps. A regex-based CLI parser would need to handle every possible structure. This is exactly what LLMs excel at.

**Why agent-level:** The LLM (Claude/OpenCode agent executing the workflow) reads the spec files and synthesizes them. This is the same approach as `--auto` mode, which tells the agent to "extract context from provided document." The agent understands natural language, handles ambiguity, and can reason about what's missing.

**The CLI's role is limited to:**
1. **Discovery:** Find all `.md` files in the spec folder → return file list as JSON
2. **Environment detection:** Same checks as `init new-project` (brownfield, git, etc.)
3. **Validation:** Folder exists? Has `.md` files? Spec folder isn't empty?

```javascript
// New function in init.cjs — follows exact pattern of cmdInitNewProject
function cmdInitNewProjectFromSpec(cwd, specFolder, raw) {
  const folder = specFolder || './specs';
  const fullPath = path.isAbsolute(folder) ? folder : path.join(cwd, folder);
  
  // Validate spec folder
  if (!fs.existsSync(fullPath)) {
    output({ error: 'Spec folder not found', path: folder }, raw);
    return;
  }
  
  // Find markdown files
  let specFiles = [];
  try {
    specFiles = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
      .sort();
  } catch {}
  
  if (specFiles.length === 0) {
    output({ error: 'No markdown files found in spec folder', path: folder }, raw);
    return;
  }
  
  // Standard init checks (same as cmdInitNewProject)
  const config = loadConfig(cwd);
  // ... brownfield detection, git state, model resolution ...
  
  const result = {
    // Same fields as cmdInitNewProject
    researcher_model: resolveModelInternal(cwd, 'gsd-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'gsd-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'gsd-roadmapper'),
    commit_docs: config.commit_docs,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    // ... all standard fields ...
    
    // NEW: Spec-specific fields
    spec_folder: folder,
    spec_folder_resolved: fullPath,
    spec_files: specFiles,
    spec_count: specFiles.length,
    spec_paths: specFiles.map(f => path.join(folder, f)),
  };
  
  output(result, raw);
}
```

**Confidence: HIGH** — This pattern is directly derived from the existing `cmdInitNewProject` function in `init.cjs`. Same module, same pattern, extended fields.

### Markdown Section Extraction Patterns

The agent (not CLI) handles the actual content extraction. But the workflow should instruct the agent on what to look for. Key patterns:

**1. Header-based extraction:**
```
Specs commonly use ## headers to organize content.
The agent reads all spec files and identifies sections by header hierarchy:
- # = document title / project name
- ## = major sections (Requirements, Constraints, Architecture, etc.)
- ### = subsections
- #### = details
```

**2. List-based extraction:**
```
Requirements are often bullet lists:
- Functional requirements
- Non-functional requirements
- User stories (As a... I want... So that...)
- Acceptance criteria
```

**3. Table-based extraction:**
```
Decisions, comparisons, and constraints often appear in markdown tables:
| Decision | Rationale |
|----------|-----------|
```

**4. Frontmatter-based extraction:**
```
If spec files have YAML frontmatter, the existing extractFrontmatter() 
can pull structured metadata (project name, version, tags, etc.)
```

The workflow instructions should tell the agent to look for ALL of these patterns across ALL spec files, then synthesize into a unified PROJECT.md.

**Confidence: HIGH** — These are standard markdown patterns. The agent doesn't need special tooling — it reads text and understands structure.

### Ambiguity Detection Strategy

The agent handles ambiguity detection as part of its synthesis step. The workflow should instruct it to check for:

| Check | What's Missing | Action |
|-------|---------------|--------|
| Project name | No clear project name in any spec | Ask user (critical) |
| Core value | No clear "what this does" statement | Infer from specs, flag if uncertain |
| Tech constraints | No tech stack mentioned | Use research to determine; don't ask |
| Requirements | Vague requirements ("handle authentication") | Make specific using spec context + research |
| Contradictions | Spec A says X, Spec B says Y | Ask user which takes priority (critical) |
| Scope | No clear boundaries on what's NOT included | Infer from what IS included; don't ask |

**The key principle:** Only ask the user when information is **genuinely missing and crucial.** For everything else, the agent should make a reasonable inference and note the assumption in PROJECT.md's Key Decisions table.

**Confidence: HIGH** — This mirrors the `--auto` mode's approach: extract what you can, use smart defaults for the rest.

## New Files to Create

### 1. Slash Command: `commands/gsd/new-project-from-spec.md`

Follows exact structure of `commands/gsd/new-project.md`:

```markdown
---
name: gsd:new-project-from-spec
description: Initialize a project from spec files in a folder
argument-hint: "[spec-folder]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
Default spec folder: `./specs/`
Override: `/gsd:new-project-from-spec ./path/to/specs`
</context>

<objective>
Initialize a project from spec files — fully automated pipeline.
Reads markdown specs → generates PROJECT.md → runs research → 
generates REQUIREMENTS.md → creates ROADMAP.md + STATE.md.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-project-from-spec.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/requirements.md
</execution_context>

<process>
Execute the new-project-from-spec workflow end-to-end.
</process>
```

**Confidence: HIGH** — Direct copy of existing command structure.

### 2. Workflow: `get-shit-done/workflows/new-project-from-spec.md`

This is the largest new file. It follows the structure of `new-project.md` but replaces Steps 2–5 (brownfield offer, questioning, write PROJECT.md, workflow preferences) with:

1. **Setup** — `gsd-tools init new-project-from-spec <folder>`
2. **Read all spec files** — Agent reads each file from the spec_paths list
3. **Synthesize PROJECT.md** — Agent extracts and organizes content, using `templates/project.md`
4. **Ambiguity check** — Only ask user if critical info is missing
5. **Config** — Extract from spec frontmatter if present, otherwise use smart defaults (YOLO mode, standard depth)
6. **Research** — Reuse Steps 6 from `new-project.md` verbatim
7. **Requirements** — Auto-generate from spec + research (like `--auto` mode's Step 7)
8. **Roadmap** — Reuse Step 8 from `new-project.md` verbatim
9. **Done** — Reuse Step 9 from `new-project.md`

**Confidence: HIGH** — Follows exact patterns from existing workflow.

### 3. CLI Extension: `init.cjs` + `gsd-tools.cjs` Router

**In `init.cjs`:** Add `cmdInitNewProjectFromSpec(cwd, specFolder, raw)` — see code sketch above.

**In `gsd-tools.cjs`:** Add routing case:
```javascript
case 'new-project-from-spec':
  init.cmdInitNewProjectFromSpec(cwd, args[2], raw);
  break;
```

**Confidence: HIGH** — Identical to how all other init commands are registered.

### 4. Installer Update: `bin/install.js`

The installer must register the new slash command for all three runtimes. This follows the existing pattern where `install.js` copies command files from `commands/gsd/` into the appropriate runtime config directories.

**Confidence: HIGH** — The installer already handles all commands in `commands/gsd/`; a new file there will be picked up automatically if the installer scans the directory (need to verify). If it uses a hardcoded list, add the new entry.

### 5. Tests: `tests/init.test.cjs` (extend)

Add test cases for `init new-project-from-spec`:
- Returns spec file list when folder exists
- Returns error when folder doesn't exist
- Returns error when folder has no .md files
- Returns all standard init fields + spec-specific fields

**Confidence: HIGH** — Follows existing test patterns exactly.

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Agent-level spec parsing | CLI-level regex parser (`lib/spec.cjs`) | Specs are arbitrary markdown; regex can't handle the variety. LLM understanding is the whole point. The CLI should only handle file discovery/validation. |
| Single workflow file | Separate agent (`gsd-spec-synthesizer`) | Unnecessary indirection. The `--auto` mode already proves the orchestrating agent can synthesize docs directly. A separate agent adds token cost and complexity without benefit. |
| Smart defaults for config | Always ask config questions | Violates "no approval gates" and "minimal interaction." Spec users want full automation. Extract config from spec frontmatter if present, use sensible defaults if not. |
| Reuse existing `new-project.md` with new flag | Completely separate workflow | Tempting (avoid duplication), but `new-project.md` is already 1116 lines with complex branching for auto/interactive/brownfield. Adding a third mode would make it unmaintainable. A parallel workflow with shared downstream steps is cleaner. |
| Default folder `./specs/` | Require explicit path | Convention over configuration. Most users will put specs in `./specs/`. Making it the default with override ability matches GSD's approach (depth defaults to "standard", mode defaults to "yolo"). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New npm dependencies (marked, remark, unified) | Zero-dependency mandate in package.json. Also unnecessary — we're not rendering markdown, we're reading it as text for LLM consumption. | Node.js `fs.readFileSync()` + LLM understanding |
| JSON Schema validation for spec files | Specs should be freeform markdown. Enforcing a schema defeats the purpose — the LLM handles variety. | Agent-level reasoning about completeness |
| A new agent type (`gsd-spec-reader`) | Over-engineering. The workflow orchestrator reads files directly. No need for a separate agent that just reads files. | Direct file reading in the workflow |
| ESM modules | The codebase is 100% CommonJS. Mixing module systems creates complexity. | Continue with CommonJS `require()` |
| Separate `spec.cjs` library module | The spec-specific logic is minimal (find .md files in a folder). It doesn't warrant its own module. | Inline in `init.cjs` (same as all other init commands) |

## Config Extraction from Specs

Spec files may contain workflow preferences. The agent should look for these in frontmatter or document body:

```yaml
---
# Optional spec frontmatter that maps to config.json
gsd:
  depth: standard       # quick | standard | comprehensive
  mode: yolo            # yolo | interactive
  parallelization: true
  model_profile: balanced # quality | balanced | budget
---
```

**If found:** Extract and use directly.
**If not found:** Use smart defaults: `{ mode: "yolo", depth: "standard", parallelization: true, model_profile: "balanced", commit_docs: true, workflow: { research: true, plan_check: true, verifier: true } }`

**Confidence: MEDIUM** — The frontmatter extraction pattern is proven (existing `extractFrontmatter()`). The specific `gsd:` key is a design choice that needs validation during implementation. The agent can also look for config preferences in the document body (e.g., "use comprehensive planning depth").

## Integration Points with Existing System

### Multi-Runtime Compatibility

The new command must work across all three runtimes. The installer (`bin/install.js`) handles transformations:

| Runtime | Command Format | Agent Spawning | File Paths |
|---------|---------------|----------------|------------|
| Claude Code | `gsd:new-project-from-spec` | `Task()` | `~/.claude/get-shit-done/...` |
| OpenCode | `/gsd-new-project-from-spec` | Agent dispatch | `~/.config/opencode/get-shit-done/...` |
| Gemini CLI | `/gsd-new-project-from-spec` | Tool calls | `~/.gemini/get-shit-done/...` |

The installer already handles these transformations for all existing commands. The new command follows the same pattern — no special handling needed.

**Confidence: HIGH** — Verified by reading `bin/install.js` runtime transformation logic.

### Existing Workflow Steps That Are Reused Verbatim

These sections from `new-project.md` can be referenced or copied directly:

1. **Step 5.5: Resolve Model Profile** — `init` JSON already includes model fields
2. **Step 6: Research Pipeline** — 4 parallel researchers + synthesizer (entire block)
3. **Step 7: Requirements Generation** — Auto mode path (skip per-category questions)
4. **Step 8: Roadmap Creation** — Spawn `gsd-roadmapper` (entire block)
5. **Step 9: Done** — Completion summary display

~60% of the workflow content is reusable from the existing `new-project.md`.

**Confidence: HIGH** — Verified by reading the full workflow and identifying which steps are mode-independent.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Node.js >=16.7.0 | `fs.readdirSync()`, `path.join()` | All APIs used are available in Node 16+ |
| `extractFrontmatter()` | Spec files with optional YAML frontmatter | Existing parser handles nested objects, arrays, inline arrays |
| `gsd-tools.cjs` CLI router | New `init new-project-from-spec` subcommand | Just add a case to the existing switch statement |
| Test infrastructure | `node --test` | Available in Node 18+; but tests already use it, so >=18 is the real floor |

**Note:** `package.json` says `>=16.7.0` but `node:test` requires Node 18+. The existing tests already use `node:test`, so this is a pre-existing constraint, not new.

**Confidence: HIGH** — Verified against `package.json` and test infrastructure.

## Sources

- **Codebase analysis** (PRIMARY, HIGH confidence):
  - `package.json` — zero runtime deps, engine constraint, scripts
  - `get-shit-done/bin/gsd-tools.cjs` — CLI router, 50+ subcommands
  - `get-shit-done/bin/lib/init.cjs` — compound init commands (694 lines)
  - `get-shit-done/bin/lib/frontmatter.cjs` — YAML parser (299 lines)
  - `get-shit-done/bin/lib/core.cjs` — shared utilities (377 lines)
  - `get-shit-done/workflows/new-project.md` — existing interactive workflow (1116 lines)
  - `commands/gsd/new-project.md` — existing slash command
  - `get-shit-done/templates/project.md` — PROJECT.md template
  - `get-shit-done/templates/requirements.md` — REQUIREMENTS.md template
  - `bin/install.js` — multi-runtime installer (1865 lines)
  - `agents/gsd-project-researcher.md` — research agent definition
  - `tests/init.test.cjs` — test patterns
  - `.planning/PROJECT.md` — project context for this feature
  - `.planning/config.json` — current project configuration

---
*Stack research for: Spec-based project initialization (GSD meta-prompting system extension)*
*Researched: 2026-02-21*
