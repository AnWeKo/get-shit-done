# Architecture: Spec-Based Project Initialization

**Domain:** GSD meta-prompting system extension
**Researched:** 2026-02-21
**Confidence:** HIGH (based on direct codebase analysis of all 7 layers)

## Recommended Architecture

The spec-based initialization integrates into the existing GSD 7-layer architecture by adding minimal new components at specific layers while reusing the majority of existing infrastructure. The design principle: **replace the input method (questioning → spec reading), keep the pipeline (research → requirements → roadmap) identical.**

```
USER
  │
  ▼
┌─────────────────────────────────────────────────────┐
│ Layer 1: SLASH COMMAND                              │
│ commands/gsd/new-project-from-spec.md  [NEW]        │
│   - YAML frontmatter (name, tools, argument-hint)   │
│   - References workflow via @~/ path                 │
│   - Accepts [path] argument (default: ./specs/)      │
└──────────────────────┬──────────────────────────────┘
                       │ delegates to
                       ▼
┌─────────────────────────────────────────────────────┐
│ Layer 2: WORKFLOW                                    │
│ get-shit-done/workflows/new-project-from-spec.md     │
│ [NEW]                                                │
│                                                      │
│   Step 1: Init (gsd-tools.cjs init new-project)      │
│   Step 2: Read specs → synthesize PROJECT.md         │
│   Step 3: Extract/ask config → config.json           │
│   Step 4: Research (4 parallel agents)  [REUSE]      │
│   Step 5: Synthesize research           [REUSE]      │
│   Step 6: Generate REQUIREMENTS.md                   │
│   Step 7: Spawn roadmapper              [REUSE]      │
│   Step 8: Commit & done                              │
└─────┬───────────────┬──────────────┬────────────────┘
      │               │              │
      ▼               ▼              ▼
┌───────────┐  ┌─────────────┐  ┌──────────────┐
│ Layer 3:  │  │ Layer 3:    │  │ Layer 3:     │
│ AGENTS    │  │ AGENTS      │  │ AGENTS       │
│ [REUSE]   │  │ [REUSE]     │  │ [REUSE]      │
│           │  │             │  │              │
│ 4x gsd-  │  │ gsd-research│  │ gsd-         │
│ project-  │  │ -synthesizer│  │ roadmapper   │
│ researcher│  │             │  │              │
└───────────┘  └─────────────┘  └──────────────┘
      │               │              │
      ▼               ▼              ▼
┌─────────────────────────────────────────────────────┐
│ Layer 4: CLI TOOLS                                   │
│ get-shit-done/bin/gsd-tools.cjs                      │
│                                                      │
│   init new-project          [REUSE as-is]            │
│   commit                    [REUSE as-is]            │
│   config-set                [REUSE as-is]            │
│   config-ensure-section     [REUSE as-is]            │
│                                                      │
│   init new-project-from-spec  [NEW — optional]       │
│     (returns spec_path, spec_files_found, etc.)      │
└─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│ Layer 5: HOOKS              [NO CHANGES]             │
│ Layer 6: INSTALLER          [REGISTER NEW COMMAND]   │
│ Layer 7: TEMPLATES          [NO CHANGES]             │
└─────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | New/Reuse | Communicates With |
|-----------|---------------|-----------|-------------------|
| `commands/gsd/new-project-from-spec.md` | Entry point, arg parsing, tool permissions | **NEW** | Workflow (via @reference) |
| `workflows/new-project-from-spec.md` | Orchestration: spec→PROJECT.md→config→research→requirements→roadmap | **NEW** | gsd-tools.cjs, all agents |
| `gsd-tools.cjs init new-project` | Bootstrap checks: git, brownfield, models, paths | **REUSE** | Workflow reads JSON output |
| `gsd-tools.cjs init new-project-from-spec` | Spec-specific checks: spec path validation, file enumeration | **NEW (optional)** | Workflow reads JSON output |
| `gsd-tools.cjs commit` | Git commit with file list | **REUSE** | Called by workflow |
| `gsd-tools.cjs config-set` | Update config.json fields | **REUSE** | Called by workflow |
| `gsd-project-researcher` (x4) | Domain research (stack/features/arch/pitfalls) | **REUSE** | Writes to .planning/research/ |
| `gsd-research-synthesizer` | Combine 4 research outputs → SUMMARY.md | **REUSE** | Reads research/, commits all |
| `gsd-roadmapper` | Requirements → phased roadmap | **REUSE** | Reads PROJECT/REQUIREMENTS/research, writes ROADMAP/STATE |
| `templates/project.md` | PROJECT.md structure | **REUSE** | Workflow fills template |
| `templates/requirements.md` | REQUIREMENTS.md structure | **REUSE** | Workflow fills template |
| `install.js` | Register command across runtimes | **MODIFY** | Copies new command + workflow |

### Data Flow

```
SPEC FILES (input)
  │
  │  Step 1: Workflow reads all .md files from spec folder
  ▼
┌──────────────────────────┐
│ Raw spec content         │  Multiple markdown files, arbitrary structure
│ (user's language)        │  Could be PRD, user stories, technical notes, etc.
└──────────┬───────────────┘
           │
           │  Step 2: Workflow agent synthesizes (inline, not subagent)
           ▼
┌──────────────────────────┐
│ .planning/PROJECT.md     │  Standard GSD template filled from spec content
│                          │  Core Value, Requirements, Constraints, Context
└──────────┬───────────────┘
           │
           │  Step 3: Extract config from spec or ask user
           ▼
┌──────────────────────────┐
│ .planning/config.json    │  mode, depth, parallelization, workflow agents
└──────────┬───────────────┘
           │
           │  Step 4-5: Spawn 4 researchers + synthesizer (identical to existing)
           ▼
┌──────────────────────────┐
│ .planning/research/      │  STACK.md, FEATURES.md, ARCHITECTURE.md,
│                          │  PITFALLS.md, SUMMARY.md
└──────────┬───────────────┘
           │
           │  Step 6: Workflow generates from PROJECT.md + research
           ▼
┌──────────────────────────┐
│ .planning/REQUIREMENTS.md│  REQ-IDs, categories, traceability (empty)
└──────────┬───────────────┘
           │
           │  Step 7: Spawn roadmapper (identical to existing)
           ▼
┌──────────────────────────┐
│ .planning/ROADMAP.md     │  Phases, requirements mapping, success criteria
│ .planning/STATE.md       │  Project memory initialized
│ REQUIREMENTS.md updated  │  Traceability section filled
└──────────────────────────┘

OUTPUT: Identical artifacts to /gsd-new-project
```

## Layer-by-Layer Analysis

### Layer 1: Slash Command — NEW FILE

**File:** `commands/gsd/new-project-from-spec.md`

**Pattern to follow:** Direct clone of `commands/gsd/new-project.md` structure with modifications.

```markdown
---
name: gsd:new-project-from-spec
description: Initialize a new project from specification files
argument-hint: "[path-to-specs]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
```

**Key differences from `new-project.md`:**
- `argument-hint` is a path (default `./specs/`) not a flag
- `--auto` flag unnecessary (this IS the auto-equivalent)
- `execution_context` references the new workflow + same references/templates
- No reference to `questioning.md` (not needed)

**Reusable as-is:** YAML frontmatter pattern, `allowed-tools` set, `@~/` path references.

### Layer 2: Workflow — NEW FILE (core work)

**File:** `get-shit-done/workflows/new-project-from-spec.md`

This is the primary new component. It orchestrates the full pipeline. Structure mirrors `workflows/new-project.md` but replaces Steps 2-4 (questioning → PROJECT.md) with spec reading.

**Step-by-step mapping to existing `new-project.md`:**

| Existing Step | Spec Workflow Equivalent | Reuse Level |
|---------------|-------------------------|-------------|
| 1. Setup (`gsd-tools.cjs init`) | Same — identical init call | **100% reuse** |
| 2. Brownfield offer | Same — identical brownfield detection | **100% reuse** |
| 2a. Auto mode config | Config from spec or minimal ask | **~50% reuse** (same questions, different trigger) |
| 3. Deep questioning | **REPLACED** by spec reading + synthesis | **0% — new logic** |
| 4. Write PROJECT.md | Same template, content from specs | **80% reuse** (same output, different input) |
| 5. Workflow preferences | Config from spec or minimal ask | **~70% reuse** (same config schema) |
| 5.5 Resolve model profile | Same | **100% reuse** |
| 6. Research | Same — always runs, same agent spawning | **100% reuse** |
| 7. Define requirements | **Auto-generate** from spec + research | **~30% reuse** (same output format, but no interactive scoping) |
| 8. Create roadmap | Same — identical roadmapper spawn | **100% reuse** |
| 9. Done | Same — identical completion summary | **95% reuse** |

**The new logic (Steps 3 + 7 replacements) is the core work:**

**Spec Reading (replaces Step 3):**
1. Determine spec path from argument (default `./specs/`)
2. Enumerate all `.md` files in the folder (including subfolders)
3. Read all files into context
4. Synthesize: extract project name, core value, requirements, constraints, context, decisions
5. Handle ambiguity: if critical info missing (core value unclear, no requirements found), ask user via AskUserQuestion — but ONLY for truly missing info

**Requirements Generation (replaces Step 7 interactive scoping):**
1. Extract requirements from spec content + research FEATURES.md
2. Auto-categorize (AUTH, CONTENT, etc.) based on spec structure
3. Assign REQ-IDs following existing format (`[CAT]-[NN]`)
4. Include all table stakes from research
5. Include all features explicitly mentioned in specs
6. Defer unmentioned differentiators to v2
7. Generate REQUIREMENTS.md using existing template — no approval gate

### Layer 3: Agents — NO NEW AGENTS

All existing agents are reused without modification:

| Agent | Role in Spec Flow | Changes Needed |
|-------|------------------|----------------|
| `gsd-project-researcher` (x4) | Research after PROJECT.md created | None — reads PROJECT.md regardless of how it was created |
| `gsd-research-synthesizer` | Synthesize 4 research outputs | None — reads research/*.md files |
| `gsd-roadmapper` | Create ROADMAP.md + STATE.md | None — reads PROJECT.md + REQUIREMENTS.md + research |

**Why no new agent is needed:** The spec reading and synthesis is done inline by the workflow orchestrator (the main conversation agent), not by a subagent. This matches the pattern of `new-project.md` where PROJECT.md synthesis from questioning is done inline, not delegated.

**Key insight:** The spec synthesis requires reading potentially large files and making judgment calls about what matters. This is a task for the orchestrating agent with full context, not a fire-and-forget subagent.

### Layer 4: CLI Tools — ONE OPTIONAL NEW SUBCOMMAND

**Existing reused commands:**

| Command | Usage in Spec Flow |
|---------|--------------------|
| `init new-project` | Bootstrap checks, model resolution, brownfield detection |
| `commit <msg> --files` | Commit artifacts at each step |
| `config-set <key> <val>` | Persist config values |
| `config-ensure-section` | Initialize config.json with defaults |

**Potential new command: `init new-project-from-spec`**

This is **optional but recommended**. It would extend `init new-project` with:
- Spec path validation (does the path exist?)
- Spec file enumeration (how many .md files found?)
- Spec file list (for the workflow to know what to read)

```javascript
function cmdInitNewProjectFromSpec(cwd, specPath, raw) {
  // Everything from cmdInitNewProject PLUS:
  const result = {
    ...existingNewProjectResult,
    
    // Spec-specific
    spec_path: resolvedSpecPath,
    spec_path_exists: fs.existsSync(resolvedSpecPath),
    spec_files: mdFilesInPath,
    spec_file_count: mdFilesInPath.length,
  };
}
```

**Alternative (simpler):** Skip new CLI command, do path validation in the workflow using Bash/Read tools directly. The workflow can `ls specs/*.md` and read files. This avoids Layer 4 changes entirely.

**Recommendation:** Start with the simpler approach (no new CLI command). Add the CLI command later if spec validation becomes complex enough to warrant it.

### Layer 5: Hooks — NO CHANGES

The existing hooks (`gsd-check-update.js`, `gsd-context-monitor.js`, `gsd-statusline.js`) are event-driven runtime integrations. The spec-based flow produces the same output artifacts, so hooks work unchanged.

### Layer 6: Installer — MODIFICATION REQUIRED

**File:** `bin/install.js`

The installer auto-discovers and copies commands from `commands/gsd/`. Adding `new-project-from-spec.md` to that directory is sufficient — the installer's `copyFlattenedCommands()` (OpenCode) and `copyWithPathReplacement()` (Claude Code/Gemini) will automatically pick it up.

**What happens automatically:**
- Claude Code: `commands/gsd/new-project-from-spec.md` → `.claude/commands/gsd/new-project-from-spec.md`
- OpenCode: `commands/gsd/new-project-from-spec.md` → `.opencode/command/gsd-new-project-from-spec.md` (flattened)
- Gemini: `commands/gsd/new-project-from-spec.md` → `.gemini/commands/gsd/new-project-from-spec.md`

**Path replacement:** The installer's `~/.claude/` → runtime-specific path replacement handles cross-runtime compatibility in the command and workflow files.

**No code changes to install.js required** — just placing the files in the right source directories triggers automatic installation.

Similarly, the new workflow file at `get-shit-done/workflows/new-project-from-spec.md` is automatically copied with the `get-shit-done/` directory.

### Layer 7: Templates & References — NO CHANGES

All existing templates are reused:
- `templates/project.md` — PROJECT.md structure (filled from specs instead of questioning)
- `templates/requirements.md` — REQUIREMENTS.md structure
- `templates/roadmap.md` — ROADMAP.md structure  
- `templates/state.md` — STATE.md structure
- `templates/research-project/*.md` — Research output templates

No new templates needed because the output artifacts are identical.

## Patterns to Follow

### Pattern 1: Command → Workflow Delegation

**What:** Commands are thin entry points. All logic lives in workflows.
**Evidence:** Every `commands/gsd/*.md` file contains `<process>Execute the [X] workflow</process>`.

**Apply to spec flow:**
```markdown
<!-- commands/gsd/new-project-from-spec.md -->
<process>
Execute the new-project-from-spec workflow from 
@~/.claude/get-shit-done/workflows/new-project-from-spec.md end-to-end.
</process>
```

### Pattern 2: Init → Parse JSON → Use Values

**What:** Workflows call `gsd-tools.cjs init [subcommand]`, parse the JSON output, and use values throughout.
**Evidence:** `new-project.md` Step 1 calls `gsd-tools.cjs init new-project` and destructures `researcher_model`, `project_exists`, etc.

**Apply to spec flow:** Call `init new-project` (reuse existing) and additionally validate spec path.

### Pattern 3: Atomic Commits After Each Artifact

**What:** Each artifact is committed immediately after creation, so work survives context loss.
**Evidence:** `new-project.md` commits PROJECT.md, then config.json, then research, then REQUIREMENTS.md, then ROADMAP.md+STATE.md — each as separate commits.

**Apply to spec flow:** Same commit cadence:
1. `commit "docs: initialize project from specs" --files .planning/PROJECT.md`
2. `commit "chore: add project config" --files .planning/config.json`
3. Research committed by synthesizer agent (existing pattern)
4. `commit "docs: define v1 requirements" --files .planning/REQUIREMENTS.md`
5. `commit "docs: create roadmap (N phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md`

### Pattern 4: Parallel Agent Spawning with Task Tool

**What:** Research spawns 4 agents in parallel via Task tool, waits for all, then spawns synthesizer.
**Evidence:** `new-project.md` Step 6 spawns 4 `Task()` calls with identical structure, varying only the dimension.

**Apply to spec flow:** Identical spawning — copy the exact Task() prompts from `new-project.md` Step 6. The PROJECT.md is already written by this point, so researchers read it the same way.

### Pattern 5: No Approval Gates in Auto Flows

**What:** Auto mode (`--auto`) skips approval questions and auto-approves.
**Evidence:** `new-project.md` auto mode: "Requirements approval: Auto-approve" and "Roadmap approval: Auto-approve".

**Apply to spec flow:** The entire spec flow is implicitly auto mode. No approval gates at any step.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating a New Agent for Spec Synthesis

**What:** Spawning a dedicated `gsd-spec-reader` agent to process specs.
**Why bad:** Spec synthesis requires full context of all spec files simultaneously. A subagent gets a prompt copy, not the original context. The orchestrating agent already has Read tool access and can process specs inline, exactly like `new-project.md` processes questioning responses inline.
**Instead:** Handle spec reading and PROJECT.md synthesis inline in the workflow, same as questioning → PROJECT.md is handled inline.

### Anti-Pattern 2: Modifying Existing Agents to Handle Spec Input

**What:** Adding spec-awareness to `gsd-project-researcher`, `gsd-roadmapper`, etc.
**Why bad:** These agents read PROJECT.md and REQUIREMENTS.md — they don't care how those files were created. Modifying them creates coupling and breaks the existing flow.
**Instead:** Produce identical PROJECT.md and REQUIREMENTS.md. Downstream agents work unchanged.

### Anti-Pattern 3: Different Output Formats

**What:** Having the spec flow produce artifacts with different structure than the interactive flow.
**Why bad:** All downstream commands (`plan-phase`, `execute-phase`, `progress`, etc.) parse these files with specific expectations. Different formats break the entire pipeline.
**Instead:** Use the exact same templates. Fill them from specs instead of from questioning.

### Anti-Pattern 4: Complex Spec Schema Requirements

**What:** Requiring specs to follow a specific markdown structure (H1 = project name, H2 = requirements, etc.).
**Why bad:** Users have specs in arbitrary formats — PRDs, user stories, technical notes, brainstorming docs. Requiring a schema defeats the purpose.
**Instead:** The synthesis step interprets arbitrary markdown intelligently. The agent determines what's a requirement, what's a constraint, what's context.

### Anti-Pattern 5: Making gsd-tools.cjs Read Spec Files

**What:** Adding spec file reading to the CLI tool.
**Why bad:** gsd-tools.cjs handles state operations (config, commits, phase management). Spec interpretation requires LLM judgment — it's an agent task, not a tool task.
**Instead:** The workflow agent reads files using Read tool, synthesizes using its judgment, calls gsd-tools.cjs only for state operations.

## Build Order (Dependencies)

The components have clear build dependencies:

```
Phase 1: Command + Workflow (foundation)
  ├── commands/gsd/new-project-from-spec.md
  └── get-shit-done/workflows/new-project-from-spec.md
      ├── Spec reading logic (enumerate + read files)
      ├── Spec synthesis → PROJECT.md (core new logic)
      ├── Config extraction/asking
      ├── Requirements auto-generation (core new logic)
      └── Research + roadmap spawning (copy from existing)

Phase 2: Integration + testing
  ├── Test with sample spec folders
  ├── Verify output artifact compatibility
  └── Verify downstream command compatibility

Phase 3: Installer verification
  └── Confirm auto-discovery works for all 3 runtimes
```

**Critical path:** The workflow file is the only complex new component. Everything else is either a thin wrapper (command) or automatic (installer).

**Build order rationale:**
1. **Command file first** — it's trivial (< 40 lines, pattern-copy from new-project.md) and needed to invoke the workflow
2. **Workflow file second** — this is ~80% of the work, contains all new logic
3. **CLI tool changes (if any) third** — optional, only if spec validation needs to be centralized
4. **Testing last** — verify the entire pipeline produces correct artifacts

## Reuse Summary

| Layer | Component | Status | Effort |
|-------|-----------|--------|--------|
| L1: Command | `new-project-from-spec.md` | **NEW** | Trivial (pattern-copy) |
| L2: Workflow | `new-project-from-spec.md` | **NEW** | Significant (core logic) |
| L3: Agents | All 6 agents | **REUSE** | Zero |
| L4: CLI | `init new-project` | **REUSE** | Zero |
| L4: CLI | `commit`, `config-set` | **REUSE** | Zero |
| L4: CLI | `init new-project-from-spec` | **NEW (optional)** | Small |
| L5: Hooks | All 3 hooks | **NO CHANGE** | Zero |
| L6: Installer | `install.js` | **NO CHANGE** | Zero (auto-discovers) |
| L7: Templates | All templates | **REUSE** | Zero |

**New files: 2** (command + workflow)
**Modified files: 0-1** (optionally gsd-tools.cjs for init subcommand)
**Reused as-is: ~25+ files** (agents, templates, CLI tools, hooks, installer)

## Key Architecture Decision: Inline Synthesis vs. Subagent

The most important architectural decision is whether spec synthesis (reading arbitrary spec files and producing PROJECT.md) happens:

**Option A: Inline in workflow (RECOMMENDED)**
- The orchestrating agent reads specs, synthesizes PROJECT.md, continues pipeline
- Pros: Full context, no information loss, simpler, matches existing pattern
- Cons: Long workflow execution (but `new-project` is already long)

**Option B: Dedicated subagent**
- A `gsd-spec-synthesizer` agent reads specs, returns structured output
- Pros: Separation of concerns
- Cons: Context serialization overhead, potential information loss, another agent to maintain, doesn't match existing patterns

**Recommendation: Option A.** The existing `new-project.md` handles questioning + PROJECT.md synthesis inline. The spec flow should do the same — just with file reading instead of user questioning. The downstream agents (researchers, roadmapper) are already subagents. The orchestrator does the input processing.

## Sources

- Direct codebase analysis (HIGH confidence):
  - `commands/gsd/new-project.md` — command pattern
  - `get-shit-done/workflows/new-project.md` — full workflow with all steps
  - `get-shit-done/workflows/new-milestone.md` — alternative workflow pattern
  - `get-shit-done/bin/gsd-tools.cjs` — CLI tool interface
  - `get-shit-done/bin/lib/init.cjs` — init subcommand implementations
  - `agents/gsd-project-researcher.md` — researcher agent interface
  - `agents/gsd-research-synthesizer.md` — synthesizer agent interface
  - `agents/gsd-roadmapper.md` — roadmapper agent interface
  - `bin/install.js` — installer cross-runtime logic
  - `get-shit-done/templates/*.md` — all output templates
  - `.planning/PROJECT.md` — project context
