# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Multi-runtime meta-prompting system with a CLI tools backbone, markdown-based prompt/workflow definitions, and an installer that cross-compiles to multiple AI coding assistant runtimes (Claude Code, OpenCode, Gemini CLI).

**Key Characteristics:**
- **Document-driven architecture:** All project state, plans, and workflows live in `.planning/` as markdown files with YAML frontmatter. The CLI tools layer reads/writes these documents.
- **Three-tier execution model:** User invokes slash commands → commands delegate to workflows → workflows spawn agent subprocesses via the `Task` tool. Each tier has a distinct role: commands define entry points, workflows define orchestration logic, agents define autonomous execution behavior.
- **Installer-as-compiler:** The `bin/install.js` installer transforms Claude Code-native markdown into OpenCode and Gemini CLI-compatible formats (frontmatter conversion, tool name mapping, TOML generation), acting as a cross-compilation step.
- **Zero runtime dependencies:** The npm package has no production dependencies. All CLI tooling is plain Node.js using only `fs`, `path`, `child_process`, and `crypto` from stdlib.

## Layers

**Layer 1: Slash Commands**
- Purpose: User-facing entry points that AI coding assistants register as `/gsd:*` commands
- Location: `commands/gsd/*.md`
- Contains: YAML frontmatter (name, description, allowed-tools) + prompt instructions that reference workflows and load context
- Depends on: Workflows (via `@~/.claude/get-shit-done/workflows/` references)
- Used by: Claude Code, OpenCode, Gemini CLI command systems
- Key pattern: Each command references one workflow file and passes `$ARGUMENTS` through

**Layer 2: Workflows**
- Purpose: Multi-step orchestration logic that commands execute end-to-end
- Location: `get-shit-done/workflows/*.md`
- Contains: `<step>` elements defining sequential process with branching, tool calls to `gsd-tools.cjs`, and subagent spawning via `Task`
- Depends on: `gsd-tools.cjs` CLI (via `node ~/.claude/get-shit-done/bin/gsd-tools.cjs`), agents (via `Task` tool)
- Used by: Commands
- Key pattern: Workflows call `gsd-tools.cjs init <workflow>` as first step to load all needed context in one JSON blob

**Layer 3: Agents**
- Purpose: Autonomous subprocesses spawned by workflows to perform focused work (execute plans, research, verify, etc.)
- Location: `agents/gsd-*.md`
- Contains: YAML frontmatter (tools, color) + role definition, execution flow, and behavioral rules
- Depends on: `gsd-tools.cjs` CLI, project `.planning/` state files
- Used by: Workflows (spawned via `Task` tool with model selection from config)
- Key agents: `gsd-executor.md`, `gsd-planner.md`, `gsd-verifier.md`, `gsd-debugger.md`, `gsd-codebase-mapper.md`, `gsd-roadmapper.md`, `gsd-phase-researcher.md`, `gsd-project-researcher.md`, `gsd-research-synthesizer.md`, `gsd-plan-checker.md`, `gsd-integration-checker.md`

**Layer 4: CLI Tools (`gsd-tools.cjs`)**
- Purpose: Centralized Node.js CLI that replaces inline bash in ~50 command/workflow/agent files. Provides atomic operations for state management, phase lifecycle, roadmap parsing, verification, template filling, and git commits.
- Location: `get-shit-done/bin/gsd-tools.cjs` (router) + `get-shit-done/bin/lib/*.cjs` (modules)
- Contains: Command router with ~50 subcommands organized into domain modules
- Depends on: Node.js stdlib only (`fs`, `path`, `child_process`, `crypto`)
- Used by: Workflows and agents via `node ~/.claude/get-shit-done/bin/gsd-tools.cjs <command> [args]`
- Key pattern: All commands output JSON to stdout (or `@file:/tmp/gsd-*.json` for payloads >50KB). Supports `--raw` flag for single-value output.

**Layer 5: Hooks**
- Purpose: Event-driven integrations with the AI coding assistant runtime (session start, post-tool-use)
- Location: `hooks/gsd-*.js` (source), `hooks/dist/` (bundled for installation)
- Contains: Node.js scripts that read stdin JSON from the runtime and write to stdout/tmpfiles
- Depends on: Runtime hook system (Claude Code `settings.json` hooks), `os.tmpdir()` for IPC
- Used by: Claude Code/Gemini runtime hook system
- Key hooks: `gsd-statusline.js` (status bar display + context metrics bridge), `gsd-check-update.js` (version check on session start), `gsd-context-monitor.js` (inject context window warnings to agent)

**Layer 6: Installer**
- Purpose: Cross-platform installer that deploys GSD to Claude Code, OpenCode, and/or Gemini CLI config directories
- Location: `bin/install.js`
- Contains: Runtime detection, frontmatter conversion (Claude→OpenCode, Claude→Gemini), tool name mapping, settings.json configuration, file manifest for local patch detection
- Depends on: Node.js stdlib, `readline` for interactive prompts
- Used by: `npx get-shit-done-cc` (package.json `bin` entry)

**Layer 7: Templates & References**
- Purpose: Document templates for planning artifacts and reference docs for agent behavior
- Location: `get-shit-done/templates/*.md`, `get-shit-done/references/*.md`
- Contains: Templates for PROJECT.md, ROADMAP.md, STATE.md, PLAN.md, SUMMARY.md, etc.; references for git integration, model profiles, verification patterns, TDD
- Depends on: Nothing (static content)
- Used by: Workflows and agents when scaffolding new planning documents

## Data Flow

**Plan Execution Flow (primary):**

1. User runs `/gsd:execute-phase 3` → `commands/gsd/execute-phase.md` loads
2. Command references `workflows/execute-phase.md` and executes it
3. Workflow calls `gsd-tools.cjs init execute-phase 3` → gets JSON with phase info, model config, plans list, branching strategy
4. Workflow reads plan files from `.planning/phases/03-*/` and groups by `wave` frontmatter field
5. For each wave, workflow spawns `gsd-executor` agents via `Task` tool (parallel if config allows)
6. Each executor reads its PLAN.md, executes tasks with atomic git commits, produces SUMMARY.md
7. Workflow calls `gsd-tools.cjs state advance-plan` to update STATE.md after each plan
8. Workflow calls `gsd-tools.cjs roadmap update-plan-progress 3` to update ROADMAP.md
9. If `verifier_enabled`, workflow spawns `gsd-verifier` agent to verify phase completeness
10. Workflow calls `gsd-tools.cjs commit "gsd(phase-3): execution complete"` to commit planning docs

**State Management:**
- All state lives in `.planning/` directory as markdown/JSON files
- `STATE.md`: Current position (phase, plan, status, progress bar, decisions, blockers, session info)
- `ROADMAP.md`: Phase definitions with goals, dependencies, success criteria, progress tables
- `config.json`: Runtime configuration (model profile, commit settings, branching strategy, feature flags)
- `gsd-tools.cjs` provides atomic read-modify-write operations on these files via regex-based field extraction and replacement

**Context Engineering:**
- Workflows use `gsd-tools.cjs init <workflow>` to pre-compute all context needed for a workflow in a single JSON payload
- This "compound init" pattern avoids multiple file reads and gives workflows a structured context object
- Agents receive context via `<files_to_read>` blocks in their Task prompt and `@file` references

**Inter-process Communication (Hooks):**
- `gsd-statusline.js` writes context metrics to `/tmp/claude-ctx-{session_id}.json`
- `gsd-context-monitor.js` reads that bridge file to inject warnings when context window is low
- This bridge pattern enables data flow between hooks that run at different lifecycle points

## Key Abstractions

**Phase:**
- Purpose: A unit of work in a milestone, containing plans that are executed sequentially or in parallel waves
- Examples: `get-shit-done/bin/lib/phase.cjs`, `.planning/phases/NN-slug/`
- Pattern: Directory named `NN-slug` containing `*-PLAN.md`, `*-SUMMARY.md`, `*-RESEARCH.md`, `*-CONTEXT.md`, `*-VERIFICATION.md`
- Operations: `find-phase`, `phase add/insert/remove/complete`, `phase-plan-index`, `phases list`

**Plan:**
- Purpose: An atomic unit of execution within a phase, with structured tasks, dependencies, and verification criteria
- Examples: `.planning/phases/01-setup/01-01-PLAN.md`
- Pattern: YAML frontmatter with `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`. Body contains `<task>` XML elements with `<name>`, `<files>`, `<action>`, `<verify>`, `<done>`.

**Summary:**
- Purpose: Execution report for a completed plan, with frontmatter for dependency graph tracking
- Examples: `.planning/phases/01-setup/01-01-SUMMARY.md`
- Pattern: YAML frontmatter with `phase`, `plan`, `subsystem`, `tags`, `provides`, `affects`, `key-files`, `key-decisions`, `patterns-established`, `duration`, `completed`

**Frontmatter:**
- Purpose: YAML metadata at the top of markdown files, used as a lightweight structured data layer
- Examples: `get-shit-done/bin/lib/frontmatter.cjs`
- Pattern: Custom YAML parser (not a full YAML library) that handles nested objects, arrays, inline arrays, and quotes. CRUD operations via `frontmatter get/set/merge/validate` commands.

**Model Profile:**
- Purpose: Maps agent types to Claude model tiers (opus/sonnet/haiku) based on a quality/balanced/budget profile setting
- Examples: `get-shit-done/bin/lib/core.cjs` (MODEL_PROFILES table)
- Pattern: `resolve-model <agent-type>` returns the model name. `opus` maps to `inherit` (use parent model), others return as-is.

**Milestone:**
- Purpose: A release boundary that groups phases. When completed, phases are archived and a new roadmap begins.
- Examples: `get-shit-done/bin/lib/milestone.cjs`
- Pattern: `milestone complete <version>` archives ROADMAP.md, REQUIREMENTS.md, and optionally phase directories to `.planning/milestones/`

## Entry Points

**User Entry (npx install):**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc` or `npm install -g get-shit-done-cc`
- Responsibilities: Interactive/flag-based installer that deploys commands, workflows, agents, hooks, and templates to the target runtime's config directory

**Slash Commands (user interaction):**
- Location: `commands/gsd/*.md` (30+ commands)
- Triggers: User types `/gsd:command-name` in Claude Code, `/gsd-command-name` in OpenCode, or equivalent in Gemini
- Responsibilities: Define entry point metadata and delegate to workflows
- Key commands: `execute-phase`, `plan-phase`, `new-project`, `new-milestone`, `quick`, `debug`, `verify-work`, `health`, `progress`, `map-codebase`

**CLI Tools (programmatic):**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: `node gsd-tools.cjs <command> [args] [--raw]` called by workflows and agents
- Responsibilities: All atomic state operations — 50+ subcommands for state, phase, roadmap, verify, template, frontmatter, scaffold, milestone, progress, config, todo, and compound init operations

**Hooks (runtime events):**
- Location: `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`, `hooks/gsd-context-monitor.js`
- Triggers: Claude Code/Gemini runtime events (session start, post-tool-use, statusline refresh)
- Responsibilities: Status display, version checking, context window monitoring

**Tests:**
- Location: `tests/*.test.cjs`
- Triggers: `node --test tests/*.test.cjs` or `npm test`
- Responsibilities: Unit tests for CLI tools modules (commands, init, milestone, phase, roadmap, state, verify)

## Error Handling

**Strategy:** Fail-fast with informative error messages via `error()` helper that writes to stderr and exits with code 1. All JSON output uses `output()` helper that writes to stdout and exits with code 0.

**Patterns:**
- CLI tools: `error('descriptive message')` → stderr + exit(1). Success: `output(jsonResult, raw, rawValue)` → stdout + exit(0)
- File operations: `safeReadFile()` returns null on failure (no throw). Callers check for null.
- Git operations: `execGit()` wraps `execSync` in try/catch, returns `{ exitCode, stdout, stderr }` object
- Large output: JSON >50KB written to tmpfile, path returned as `@file:/path` prefix
- Workflow-level: Workflows check `phase_found`, `state_exists`, etc. from init JSON and report errors to user

## Cross-Cutting Concerns

**Logging:** No formal logging framework. Hooks use console.log for user-facing output. CLI tools use `output()` for JSON and `error()` for errors.

**Validation:** `verify.cjs` module provides plan structure validation, phase completeness checks, reference resolution, commit verification, artifact verification, and key-link verification. `frontmatter.cjs` provides schema-based frontmatter validation. `cmdValidateHealth` does full `.planning/` integrity checking with optional `--repair`.

**Authentication:** Not applicable — runs locally within AI coding assistant runtimes. Optional Brave Search API key stored in `~/.gsd/brave_api_key` or `BRAVE_API_KEY` env var.

**Configuration:** Layered config: hardcoded defaults in `core.cjs` → user-level defaults in `~/.gsd/defaults.json` → project-level config in `.planning/config.json`. Dot-notation key paths supported for nested access (`workflow.research`).

**Multi-runtime compatibility:** The installer (`bin/install.js`) handles three runtimes with these adaptations:
- **Claude Code:** Native format — markdown commands with YAML frontmatter, `commands/gsd/` directory, `settings.json` hooks
- **OpenCode:** Flat command structure (`command/gsd-*.md`), tool names lowercased, `allowed-tools` → `tools: { name: true }`, color names → hex, `AskUserQuestion` → `question`, `SlashCommand` → `skill`, permissions in `opencode.json`
- **Gemini CLI:** Commands converted to TOML, agents get `tools:` as YAML array with Gemini tool names (`Read` → `read_file`, `Bash` → `run_shell_command`), `color:` stripped, `${VAR}` → `$VAR` to avoid template conflicts, `<sub>` tags → italic

---

*Architecture analysis: 2026-02-21*
