# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
get-shit-done/
├── agents/                     # Agent definitions (spawned subprocesses)
│   ├── gsd-codebase-mapper.md
│   ├── gsd-debugger.md
│   ├── gsd-executor.md
│   ├── gsd-integration-checker.md
│   ├── gsd-phase-researcher.md
│   ├── gsd-plan-checker.md
│   ├── gsd-planner.md
│   ├── gsd-project-researcher.md
│   ├── gsd-research-synthesizer.md
│   ├── gsd-roadmapper.md
│   └── gsd-verifier.md
├── assets/                     # Logo and branding assets
├── bin/
│   └── install.js              # Package entry point and installer (1865 lines)
├── commands/
│   └── gsd/                    # Slash command definitions (30+ commands)
│       ├── add-phase.md
│       ├── add-todo.md
│       ├── audit-milestone.md
│       ├── check-todos.md
│       ├── cleanup.md
│       ├── complete-milestone.md
│       ├── debug.md
│       ├── discuss-phase.md
│       ├── execute-phase.md
│       ├── health.md
│       ├── help.md
│       ├── insert-phase.md
│       ├── join-discord.md
│       ├── list-phase-assumptions.md
│       ├── map-codebase.md
│       ├── new-milestone.md
│       ├── new-project.md
│       ├── pause-work.md
│       ├── plan-milestone-gaps.md
│       ├── plan-phase.md
│       ├── progress.md
│       ├── quick.md
│       ├── reapply-patches.md
│       ├── remove-phase.md
│       ├── research-phase.md
│       ├── resume-work.md
│       ├── set-profile.md
│       ├── settings.md
│       ├── update.md
│       └── verify-work.md
├── docs/                       # User-facing documentation
│   ├── context-monitor.md
│   └── USER-GUIDE.md
├── get-shit-done/              # Core skill package (deployed to config dirs)
│   ├── bin/
│   │   ├── gsd-tools.cjs      # CLI router (553 lines)
│   │   └── lib/
│   │       ├── commands.cjs    # Utility commands (556 lines)
│   │       ├── config.cjs      # Config CRUD (162 lines)
│   │       ├── core.cjs        # Shared utilities, model profiles (377 lines)
│   │       ├── frontmatter.cjs # YAML frontmatter parser & CRUD (299 lines)
│   │       ├── init.cjs        # Compound init commands (694 lines)
│   │       ├── milestone.cjs   # Milestone lifecycle (215 lines)
│   │       ├── phase.cjs       # Phase CRUD & lifecycle (877 lines)
│   │       ├── roadmap.cjs     # Roadmap parsing & updates (298 lines)
│   │       ├── state.cjs       # STATE.md operations (490 lines)
│   │       ├── template.cjs    # Template selection & fill (222 lines)
│   │       └── verify.cjs      # Verification suite (772 lines)
│   ├── references/             # Agent behavior reference docs
│   │   ├── checkpoints.md
│   │   ├── continuation-format.md
│   │   ├── decimal-phase-calculation.md
│   │   ├── git-integration.md
│   │   ├── git-planning-commit.md
│   │   ├── model-profile-resolution.md
│   │   ├── model-profiles.md
│   │   ├── phase-argument-parsing.md
│   │   ├── planning-config.md
│   │   ├── questioning.md
│   │   ├── tdd.md
│   │   ├── ui-brand.md
│   │   └── verification-patterns.md
│   ├── templates/              # Document templates
│   │   ├── codebase/           # Codebase analysis templates
│   │   │   ├── architecture.md
│   │   │   ├── concerns.md
│   │   │   ├── conventions.md
│   │   │   ├── integrations.md
│   │   │   ├── stack.md
│   │   │   ├── structure.md
│   │   │   └── testing.md
│   │   ├── research-project/   # Research synthesis templates
│   │   │   ├── ARCHITECTURE.md
│   │   │   ├── FEATURES.md
│   │   │   ├── PITFALLS.md
│   │   │   ├── STACK.md
│   │   │   └── SUMMARY.md
│   │   ├── config.json         # Default config template
│   │   ├── context.md
│   │   ├── continue-here.md
│   │   ├── DEBUG.md
│   │   ├── debug-subagent-prompt.md
│   │   ├── discovery.md
│   │   ├── milestone-archive.md
│   │   ├── milestone.md
│   │   ├── phase-prompt.md
│   │   ├── planner-subagent-prompt.md
│   │   ├── project.md
│   │   ├── requirements.md
│   │   ├── research.md
│   │   ├── roadmap.md
│   │   ├── state.md
│   │   ├── summary.md
│   │   ├── summary-complex.md
│   │   ├── summary-minimal.md
│   │   ├── summary-standard.md
│   │   ├── UAT.md
│   │   ├── user-setup.md
│   │   ├── VALIDATION.md
│   │   └── verification-report.md
│   └── workflows/              # Workflow orchestration logic
│       ├── add-phase.md
│       ├── add-todo.md
│       ├── audit-milestone.md
│       ├── check-todos.md
│       ├── cleanup.md
│       ├── complete-milestone.md
│       ├── diagnose-issues.md
│       ├── discovery-phase.md
│       ├── discuss-phase.md
│       ├── execute-phase.md
│       ├── execute-plan.md
│       ├── health.md
│       ├── help.md
│       ├── insert-phase.md
│       ├── list-phase-assumptions.md
│       ├── map-codebase.md
│       ├── new-milestone.md
│       ├── new-project.md
│       ├── pause-work.md
│       ├── plan-milestone-gaps.md
│       ├── plan-phase.md
│       ├── progress.md
│       ├── quick.md
│       ├── remove-phase.md
│       ├── research-phase.md
│       ├── resume-project.md
│       ├── set-profile.md
│       ├── settings.md
│       ├── transition.md
│       ├── update.md
│       ├── verify-phase.md
│       └── verify-work.md
├── hooks/                      # Runtime event hooks (source)
│   ├── gsd-check-update.js     # Version check on session start
│   ├── gsd-context-monitor.js  # Context window monitoring (PostToolUse)
│   └── gsd-statusline.js       # Status bar display
├── scripts/
│   └── build-hooks.js          # Copy hooks to dist/ for packaging
├── tests/                      # Unit tests (Node.js test runner)
│   ├── commands.test.cjs
│   ├── helpers.cjs
│   ├── init.test.cjs
│   ├── milestone.test.cjs
│   ├── phase.test.cjs
│   ├── roadmap.test.cjs
│   ├── state.test.cjs
│   └── verify.test.cjs
├── .github/                    # GitHub templates and workflows
│   ├── CODEOWNERS
│   ├── FUNDING.yml
│   ├── ISSUE_TEMPLATE/
│   ├── pull_request_template.md
│   └── workflows/
│       └── auto-label-issues.yml
├── package.json                # npm package definition
├── package-lock.json
├── CHANGELOG.md
├── README.md
├── SECURITY.md
├── LICENSE
└── .gitignore
```

## Directory Purposes

**`agents/`:**
- Purpose: Agent definitions that AI coding assistant runtimes register as subagent configurations
- Contains: Markdown files with YAML frontmatter defining tools, colors, role descriptions, and behavioral instructions
- Key files: `gsd-executor.md` (plan execution), `gsd-planner.md` (plan creation), `gsd-verifier.md` (verification)
- Naming: `gsd-{role}.md`

**`bin/`:**
- Purpose: npm package entry point
- Contains: `install.js` — the interactive/flag-based installer that deploys GSD to runtime config directories
- Key files: `bin/install.js` (1865 lines, the installer/cross-compiler)

**`commands/gsd/`:**
- Purpose: Slash command definitions that runtimes register as `/gsd:*` user commands
- Contains: Markdown files with YAML frontmatter (name, description, argument-hint, allowed-tools) and prompt body
- Key files: `execute-phase.md`, `plan-phase.md`, `new-project.md`, `quick.md`
- Naming: `{action}.md` or `{action}-{noun}.md` (kebab-case)

**`get-shit-done/`:**
- Purpose: Core skill package — everything that gets deployed to the runtime's config directory
- Contains: CLI tools (`bin/`), workflow definitions (`workflows/`), reference docs (`references/`), document templates (`templates/`)
- Key point: This entire directory is copied to `~/.claude/get-shit-done/` (or runtime equivalent) during installation

**`get-shit-done/bin/`:**
- Purpose: CLI tools that workflows and agents call for atomic state operations
- Contains: `gsd-tools.cjs` (router), `lib/*.cjs` (domain modules)
- Key files: `gsd-tools.cjs` (main entry, 553 lines), `lib/core.cjs` (shared utilities, 377 lines)

**`get-shit-done/bin/lib/`:**
- Purpose: Domain-organized modules for the CLI tools
- Contains: 11 CommonJS modules, each handling a specific domain
- Module map:
  - `core.cjs` — shared utilities, MODEL_PROFILES, output/error helpers, git/file/phase utilities
  - `state.cjs` — STATE.md read/write/patch/progression operations
  - `phase.cjs` — phase CRUD, find, list, add/insert/remove/complete
  - `roadmap.cjs` — ROADMAP.md parsing, phase extraction, progress updates
  - `verify.cjs` — verification suite (summary, plan structure, completeness, references, commits, artifacts, key-links, consistency, health)
  - `commands.cjs` — standalone utility commands (slug, timestamp, todos, commit, websearch, progress, scaffold, history-digest, summary-extract)
  - `config.cjs` — config.json CRUD operations
  - `frontmatter.cjs` — YAML frontmatter parser, serializer, CRUD, schema validation
  - `template.cjs` — template selection heuristics and template fill operations
  - `milestone.cjs` — milestone completion and requirements mark-complete
  - `init.cjs` — compound init commands that pre-compute all context for workflows

**`get-shit-done/workflows/`:**
- Purpose: Orchestration logic that commands execute step-by-step
- Contains: Markdown files with `<step>` elements, bash code blocks calling `gsd-tools.cjs`, and `Task` tool invocations for subagent spawning
- Key files: `execute-phase.md` (plan execution orchestration), `plan-phase.md` (plan creation), `new-project.md` (project initialization), `execute-plan.md` (single plan execution)
- Naming: `{action}.md` or `{action}-{noun}.md` (kebab-case, matches command names)

**`get-shit-done/references/`:**
- Purpose: Behavioral reference documents loaded by agents for consistent behavior
- Contains: Guidelines for git integration, model profiles, verification patterns, UI branding, TDD, checkpoint handling
- Key files: `model-profiles.md`, `verification-patterns.md`, `git-planning-commit.md`, `ui-brand.md`

**`get-shit-done/templates/`:**
- Purpose: Document templates used when scaffolding new planning artifacts
- Contains: Templates for all `.planning/` documents (PROJECT.md, ROADMAP.md, STATE.md, PLAN.md, SUMMARY.md, etc.)
- Key files: `project.md`, `roadmap.md`, `state.md`, `summary-standard.md`, `phase-prompt.md`
- Subdirectories: `codebase/` (codebase analysis templates), `research-project/` (research synthesis templates)

**`hooks/`:**
- Purpose: Runtime event hooks that integrate with AI coding assistant lifecycle events
- Contains: Node.js scripts that read JSON from stdin and produce output/side effects
- Key files: `gsd-statusline.js` (statusbar + context metrics bridge), `gsd-check-update.js` (version check), `gsd-context-monitor.js` (context window warnings)
- Build: `scripts/build-hooks.js` copies to `hooks/dist/` for npm packaging

**`tests/`:**
- Purpose: Unit tests for CLI tools modules
- Contains: CommonJS test files using Node.js built-in test runner (`node:test`)
- Key files: `helpers.cjs` (shared test utilities), one test file per `lib/*.cjs` module
- Naming: `{module}.test.cjs`

**`scripts/`:**
- Purpose: Build scripts
- Contains: `build-hooks.js` — copies hook source files to `hooks/dist/` for npm packaging

## Key File Locations

**Entry Points:**
- `bin/install.js`: npm package entry point and installer
- `get-shit-done/bin/gsd-tools.cjs`: CLI tools entry point
- `commands/gsd/*.md`: User-facing slash commands
- `hooks/gsd-*.js`: Runtime event hooks

**Configuration:**
- `package.json`: npm package definition, scripts, engine requirements
- `get-shit-done/templates/config.json`: Default config template for `.planning/config.json`
- `get-shit-done/bin/lib/core.cjs`: Hardcoded defaults and MODEL_PROFILES table

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: Shared utilities (output, error, loadConfig, execGit, findPhaseInternal, resolveModelInternal, normalizePhaseName)
- `get-shit-done/bin/lib/init.cjs`: Compound init commands (pre-compute all workflow context)
- `get-shit-done/bin/lib/phase.cjs`: Phase lifecycle (CRUD, find, complete)
- `get-shit-done/bin/lib/state.cjs`: STATE.md operations (load, update, patch, advance, record)
- `get-shit-done/bin/lib/verify.cjs`: Verification suite and health validation
- `get-shit-done/bin/lib/frontmatter.cjs`: YAML frontmatter parser and CRUD

**Testing:**
- `tests/helpers.cjs`: Shared test utilities (`runGsdTools`, `createTempProject`, `cleanup`)
- `tests/*.test.cjs`: One test file per module

## Naming Conventions

**Files:**
- Commands: `kebab-case.md` (e.g., `execute-phase.md`, `new-project.md`)
- Agents: `gsd-{role}.md` (e.g., `gsd-executor.md`, `gsd-planner.md`)
- Workflows: `kebab-case.md` matching command names (e.g., `execute-phase.md`)
- CLI modules: `{domain}.cjs` (e.g., `state.cjs`, `phase.cjs`, `verify.cjs`)
- Hooks: `gsd-{purpose}.js` (e.g., `gsd-statusline.js`, `gsd-check-update.js`)
- Tests: `{module}.test.cjs` matching the `lib/` module name
- References: `kebab-case.md` (e.g., `model-profiles.md`, `git-integration.md`)
- Templates: `kebab-case.md` (e.g., `summary-standard.md`, `phase-prompt.md`)

**Directories:**
- Top-level: `lowercase` or `kebab-case` (e.g., `agents/`, `commands/`, `get-shit-done/`)
- Nested: match parent convention

**Functions (in CLI tools):**
- Exported command handlers: `cmdVerbNoun` (e.g., `cmdStateLoad`, `cmdPhaseComplete`, `cmdFrontmatterGet`)
- Internal helpers: `camelCase` (e.g., `findPhaseInternal`, `normalizePhaseName`, `stateExtractField`)
- Output: `output(resultObj, raw, rawValue)` for success, `error(message)` for failure

**Planning artifacts (generated at runtime):**
- Phase directories: `NN-slug` (e.g., `01-foundation`, `02.1-hotfix`)
- Plans: `NN-MM-PLAN.md` (e.g., `01-01-PLAN.md`)
- Summaries: `NN-MM-SUMMARY.md` (e.g., `01-01-SUMMARY.md`)
- Other phase files: `NN-{TYPE}.md` (e.g., `01-CONTEXT.md`, `01-RESEARCH.md`, `01-VERIFICATION.md`)

## Where to Add New Code

**New Slash Command:**
- Create: `commands/gsd/{command-name}.md`
- Include: YAML frontmatter with `name`, `description`, `argument-hint`, `allowed-tools`
- Reference: Create corresponding workflow in `get-shit-done/workflows/{command-name}.md`
- The installer handles deployment to all runtimes automatically

**New Workflow:**
- Create: `get-shit-done/workflows/{workflow-name}.md`
- Structure: Use `<step>` elements, call `gsd-tools.cjs init` for context loading
- Pattern: Follow existing workflows — initialize, validate, execute, commit

**New Agent:**
- Create: `agents/gsd-{role}.md`
- Include: YAML frontmatter with `tools`, `color`, `description`
- Register: Add model mapping to `MODEL_PROFILES` in `get-shit-done/bin/lib/core.cjs`
- Add: Model resolution entry in `get-shit-done/references/model-profiles.md`

**New CLI Tools Command:**
- Add handler function in appropriate `get-shit-done/bin/lib/{domain}.cjs` module
- Export from the module
- Add `case` in `get-shit-done/bin/gsd-tools.cjs` main switch router
- Add test in `tests/{domain}.test.cjs`

**New CLI Tools Module:**
- Create: `get-shit-done/bin/lib/{domain}.cjs`
- Pattern: `const { output, error } = require('./core.cjs');` at top, export all command functions
- Import: Add `require('./lib/{domain}.cjs')` in `gsd-tools.cjs`
- Test: Create `tests/{domain}.test.cjs`

**New Hook:**
- Create: `hooks/gsd-{name}.js`
- Add to `HOOKS_TO_COPY` array in `scripts/build-hooks.js`
- Register in `bin/install.js` (settings.json hook configuration)
- Pattern: Read JSON from stdin, produce output/side effects

**New Template:**
- Create: `get-shit-done/templates/{name}.md`
- Reference: Update relevant workflow to use the template
- Pattern: Use `<template>` blocks with markdown code fences

**New Reference Document:**
- Create: `get-shit-done/references/{topic}.md`
- Reference: Add `@~/.claude/get-shit-done/references/{topic}.md` in relevant agent/command files

**New Test:**
- Create: `tests/{module}.test.cjs`
- Import: `const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');`
- Pattern: Use `describe`/`test`/`beforeEach`/`afterEach` from `node:test`, `assert` from `node:assert`
- Run: `node --test tests/{module}.test.cjs`

## Special Directories

**`hooks/dist/`:**
- Purpose: Built hook files ready for npm packaging
- Generated: Yes, by `scripts/build-hooks.js` (run via `npm run build:hooks`)
- Committed: Yes (included in `package.json` `files` array)

**`.planning/`:**
- Purpose: Project planning state directory (created in user projects by `/gsd:new-project`)
- Generated: Yes, by GSD workflows at runtime
- Committed: Configurable via `config.json` `commit_docs` setting
- Not present in GSD's own repo (it's created in user project repos)

**`.github/`:**
- Purpose: GitHub repository configuration
- Generated: No
- Committed: Yes
- Contains: Issue templates, PR template, CODEOWNERS, funding config, auto-labeling workflow

**`assets/`:**
- Purpose: Branding assets (logos in PNG/SVG)
- Generated: No
- Committed: Yes
- Not shipped in npm package (not in `package.json` `files` array)

---

*Structure analysis: 2026-02-21*
