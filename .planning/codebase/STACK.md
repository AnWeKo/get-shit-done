# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- JavaScript (CommonJS) - All runtime code (`get-shit-done/bin/lib/*.cjs`, `get-shit-done/bin/gsd-tools.cjs`)
- JavaScript (ESM/CJS) - Installer and hooks (`bin/install.js`, `hooks/*.js`)
- Markdown - Commands, workflows, agents, references, templates (31 commands, 32 workflows, 11 agents, 13 references)

**Secondary:**
- YAML - Frontmatter in all `.md` command/agent files (parsed by custom `frontmatter.cjs`)
- JSON - Configuration files (`.planning/config.json`, `settings.json`)
- TOML - Gemini CLI command output format (generated from Markdown during install)

## Runtime

**Environment:**
- Node.js >= 16.7.0 (specified in `package.json` engines field)
- Uses native `fetch()` for Brave Search API (requires Node.js 18+ for global fetch, or polyfill)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`, lockfileVersion 3)

## Frameworks

**Core:**
- None. This is a zero-dependency tool at runtime. All code uses Node.js built-in modules only (`fs`, `path`, `os`, `child_process`, `crypto`, `readline`).

**Testing:**
- Node.js built-in test runner (`node --test`) - `package.json` scripts.test
- No assertion library - uses `node:assert` (via `node:test`)

**Build/Dev:**
- esbuild ^0.24.0 (devDependency) - Listed but only used for `scripts/build-hooks.js` which currently just copies files without bundling

## Key Dependencies

**Critical (runtime):**
- None. Zero production dependencies. All `dependencies` in `package.json` is `{}`.

**Development only:**
- `esbuild` ^0.24.0 - Build tool for hooks (currently just file copies via `scripts/build-hooks.js`)

**Implicit runtime dependencies:**
- `git` CLI - Used extensively via `child_process.execSync` for commits, status checks, branch operations (`get-shit-done/bin/lib/core.cjs` → `execGit()`)
- `npm` CLI - Used for version checking (`npm view get-shit-done-cc version`) in `hooks/gsd-check-update.js`

## Configuration

**Environment Variables:**
- `BRAVE_API_KEY` - Enables Brave web search integration (optional, checked in `get-shit-done/bin/lib/config.cjs` and `commands.cjs`)
- `CLAUDE_CONFIG_DIR` - Override Claude Code config directory (checked in `bin/install.js`)
- `OPENCODE_CONFIG_DIR` - Override OpenCode config directory
- `OPENCODE_CONFIG` - Alternative OpenCode config path (directory derived from dirname)
- `XDG_CONFIG_HOME` - XDG base directory for OpenCode (falls back to `~/.config`)
- `GEMINI_CONFIG_DIR` - Override Gemini config directory
- `HOME` - Used for path resolution in verify module (`get-shit-done/bin/lib/verify.cjs`)

**Project-level config:**
- `.planning/config.json` - Per-project GSD configuration
  - `model_profile`: `"quality"` | `"balanced"` (default) | `"budget"` - Controls agent model selection
  - `commit_docs`: `true` (default) - Whether to git-commit planning artifacts
  - `search_gitignored`: `false` (default) - Include gitignored files in searches
  - `branching_strategy`: `"none"` (default) | `"phase"` | `"milestone"`
  - `parallelization`: `true` (default) - Enable parallel plan execution
  - `brave_search`: auto-detected from `BRAVE_API_KEY` or `~/.gsd/brave_api_key`
  - `workflow.research`: `true` - Enable research phase
  - `workflow.plan_check`: `true` - Enable plan checking
  - `workflow.verifier`: `true` - Enable verification
  - `model_overrides`: Per-agent model overrides (e.g., `{"gsd-executor": "opus"}`)

**User-level defaults:**
- `~/.gsd/defaults.json` - Global defaults merged into new project configs (loaded in `get-shit-done/bin/lib/config.cjs`)
- `~/.gsd/brave_api_key` - File-based Brave API key storage

**Runtime-specific settings:**
- `~/.claude/settings.json` - Claude Code hooks and statusline config
- `~/.config/opencode/opencode.json` - OpenCode permissions and config (JSONC supported via custom parser in `bin/install.js`)
- `~/.gemini/settings.json` - Gemini hooks and experimental agent flags

**Build:**
- `scripts/build-hooks.js` - Copies hooks to `hooks/dist/` for npm publishing
- `package.json` `prepublishOnly` script runs `npm run build:hooks`

## Platform Requirements

**Development:**
- Node.js >= 16.7.0
- npm for package management
- git CLI (required for commit operations and version checks)

**Production/Runtime:**
- Distributed via npm: `npx get-shit-done-cc`
- Installs into one or more AI coding assistant config directories:
  - Claude Code: `~/.claude/` (global) or `.claude/` (local)
  - OpenCode: `~/.config/opencode/` (global) or `.opencode/` (local)
  - Gemini: `~/.gemini/` (global) or `.gemini/` (local)
- No server/cloud component - runs entirely on local filesystem
- Cross-platform: Windows path handling in `bin/install.js` (forward-slash normalization, `windowsHide` for spawned processes)

## NPM Package

**Name:** `get-shit-done-cc`
**Version:** 1.20.5
**Binary:** `get-shit-done-cc` → `bin/install.js`
**Published files:** `bin/`, `commands/`, `get-shit-done/`, `agents/`, `hooks/dist/`, `scripts/`

## Architecture Notes

**CommonJS enforcement:** The installer writes `{"type":"commonjs"}` to the target config directory to prevent ESM resolution issues when the user's project has `"type": "module"` in its own `package.json`.

**Zero-dependency philosophy:** All runtime code uses only Node.js built-ins. The `esbuild` devDependency exists for potential future bundling but currently `scripts/build-hooks.js` just copies files.

**Multi-runtime support:** The codebase is authored for Claude Code (canonical format). Install-time transformations adapt content for OpenCode and Gemini:
- OpenCode: YAML frontmatter `allowed-tools` → `permission` objects, tool name mapping, flat command structure, color name → hex conversion
- Gemini: YAML frontmatter → TOML commands, tool name mapping (Read → read_file, Bash → run_shell_command), `${VAR}` escaping, `<sub>` tag stripping

---

*Stack analysis: 2026-02-21*
