# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- Library modules: `kebab-case.cjs` (e.g., `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/state.cjs`)
- Test files: `kebab-case.test.cjs` (e.g., `tests/commands.test.cjs`, `tests/phase.test.cjs`)
- Hook files: `gsd-kebab-case.js` (e.g., `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`)
- Agent definitions: `gsd-kebab-case.md` (e.g., `agents/gsd-executor.md`, `agents/gsd-planner.md`)
- Command definitions: `kebab-case.md` (e.g., `commands/gsd/execute-phase.md`)
- Script files: `kebab-case.js` (e.g., `scripts/build-hooks.js`)

**Functions:**
- Use `camelCase` for all functions
- Public command functions: prefix with `cmd` + PascalCase (e.g., `cmdStateLoad`, `cmdPhaseAdd`, `cmdVerifySummary`)
- Internal helper functions: plain `camelCase` (e.g., `stateExtractField`, `normalizePhaseName`, `generateSlugInternal`)
- Functions exported for cross-module use: suffix with `Internal` (e.g., `findPhaseInternal`, `resolveModelInternal`, `pathExistsInternal`)

**Variables:**
- Use `camelCase` for local variables and parameters (e.g., `phaseDir`, `planCount`, `summaryCount`)
- Use `snake_case` for JSON output keys and config fields (e.g., `phase_number`, `commit_docs`, `model_profile`)
- Use `UPPER_SNAKE_CASE` for constants (e.g., `MODEL_PROFILES`, `FRONTMATTER_SCHEMAS`, `TOOLS_PATH`)

**Types:**
- No TypeScript — the codebase is pure CommonJS JavaScript
- Type documentation done via JSDoc comments sparingly, only in `bin/install.js`

## Code Style

**Formatting:**
- No formatter enforced (no Prettier/ESLint config files)
- 2-space indentation throughout all `.cjs` and `.js` files
- Single quotes for strings in JavaScript source
- Trailing newline at end of files
- JSON files formatted with 2-space indentation via `JSON.stringify(obj, null, 2)`

**Linting:**
- No linter configured — rely on Node.js built-in test runner and manual review
- Use strict equality (`===` / `!==`), never loose equality

**Line Length:**
- No enforced limit, but lines generally stay under ~120 characters
- Long regex patterns and template strings are exceptions

## Module System

**Format:** CommonJS (`.cjs` extension)

All modules use `require()` / `module.exports`:
```javascript
const fs = require('fs');
const path = require('path');
const { output, error } = require('./core.cjs');

// ... functions ...

module.exports = {
  cmdStateLoad,
  cmdStateGet,
  cmdStateUpdate,
};
```

**Why .cjs:** The installer creates a `{"type":"commonjs"}` package.json in the target config directory. Using `.cjs` extension ensures CommonJS regardless of the host project's module type.

**Never use:** ES modules (`import`/`export`), dynamic `import()`, or `.mjs` files.

## Import Organization

**Order:**
1. Node.js built-in modules (`fs`, `path`, `child_process`, `os`, `crypto`, `readline`)
2. Internal project modules (`./core.cjs`, `./frontmatter.cjs`, etc.)

**Pattern:** Destructured imports preferred for internal modules:
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { output, error, loadConfig, findPhaseInternal } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
```

**Path Aliases:** None — all imports use relative paths.

**No external runtime dependencies.** The only devDependency is `esbuild` (for build script). All runtime code uses Node.js built-ins only.

## Error Handling

**CLI Exit Pattern:**
- Use the centralized `error(message)` function from `get-shit-done/bin/lib/core.cjs` for fatal errors
- `error()` writes to stderr and calls `process.exit(1)`
- Use `output(result, raw, rawValue)` for successful responses — writes JSON to stdout and calls `process.exit(0)`

```javascript
// Fatal error — halts execution
if (!phase) {
  error('phase identifier required');
}

// Soft error — returns structured error in JSON output
if (!phaseInfo) {
  output({ error: 'Phase not found', phase }, raw);
  return;
}
```

**Try/Catch Pattern:**
- Use empty `catch {}` blocks (bare catch) for expected failures like missing files or directories
- Never throw errors from library functions — return `null` or structured error objects
- File read operations wrapped with `safeReadFile()` helper or try/catch:

```javascript
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
```

**Error Categories:**
1. **Fatal errors** → `error('message')` — invalid arguments, missing required files
2. **Soft errors** → `output({ error: '...' }, raw)` — missing optional data, graceful degradation
3. **Silent failures** → empty `catch {}` — optional directory scans, non-critical operations

## Output Format

**All CLI commands output JSON to stdout** (unless `--raw` flag is set):

```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      // Large payloads written to tmpfile with @file: prefix
      const tmpPath = path.join(require('os').tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

**Raw mode (`--raw`):** Returns a single value (string, boolean, path) for piping/scripting.

## Logging

**Framework:** None — no logging framework is used.

**Patterns:**
- `process.stdout.write(json)` for structured output (consumed by AI agents)
- `process.stderr.write('Error: ' + message)` for errors
- `console.log()` used only in the installer (`bin/install.js`) for user-facing messages with ANSI colors
- Hook scripts (`hooks/`) use silent failure — never log to stdout/stderr to avoid disrupting the AI workflow

## Comments

**When to Comment:**
- Module-level docblock: Every `.cjs` file starts with a `/** Module Name — Brief description */` comment
- Section separators: Use `// ─── Section Name ───` horizontal rules to organize related functions within a module
- Complex regex patterns: Brief explanation of what the pattern matches
- Non-obvious logic: Why something is done, not what

**Examples from codebase:**
```javascript
/**
 * State — STATE.md operations and progression engine
 */

// ─── State Progression Engine ────────────────────────────────────────────────

// Escape ${VAR} patterns in agent body for Gemini CLI compatibility.
// Gemini's templateString() treats all ${word} patterns as template variables
```

**JSDoc:**
- Used sparingly, primarily in `bin/install.js` for complex functions with multiple parameters
- Not used in library modules (`get-shit-done/bin/lib/*.cjs`)

## Function Design

**Size:** Functions range from 5 to ~100 lines. Most `cmd*` functions are 20-60 lines.

**Parameters:**
- First parameter is always `cwd` (current working directory) for filesystem operations
- Last parameter is always `raw` (boolean) for `--raw` output mode
- Options passed as plain objects: `{ phase, plan, duration, tasks, files }`

**Return Values:**
- Command functions (`cmd*`) never return values — they call `output()` or `error()` which call `process.exit()`
- Internal helpers return `null` on failure, a result object on success

## Module Design

**Exports:** Named exports via `module.exports = { ... }` object at end of file. All exported functions listed explicitly — no default exports.

**Barrel Files:** None — each module is imported directly by path.

**Architecture Pattern:** Each `.cjs` module in `get-shit-done/bin/lib/` corresponds to a CLI command domain:
- `core.cjs` — shared utilities, constants, file helpers, git helpers
- `state.cjs` — STATE.md operations and progression engine
- `phase.cjs` — phase CRUD and lifecycle
- `roadmap.cjs` — ROADMAP.md parsing and updates
- `verify.cjs` — verification suite and health validation
- `config.cjs` — config.json operations
- `commands.cjs` — standalone utility commands (slug, timestamp, todos, progress, etc.)
- `template.cjs` — template selection and filling
- `frontmatter.cjs` — YAML frontmatter parsing, serialization, and CRUD
- `milestone.cjs` — milestone and requirements lifecycle
- `init.cjs` — compound initialization for workflows

## CLI Argument Parsing

**No argument parser library.** Arguments are parsed manually from `process.argv.slice(2)`:

```javascript
const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

// Named flags parsed by finding index
const phaseIdx = args.indexOf('--phase');
const phase = phaseIdx !== -1 ? args[phaseIdx + 1] : null;

// Boolean flags checked by presence
const forceFlag = args.includes('--force');
```

## Filesystem Conventions

**All filesystem operations use synchronous APIs** (`readFileSync`, `writeFileSync`, `existsSync`, `mkdirSync`).

The only async code is `cmdWebsearch()` in `get-shit-done/bin/lib/commands.cjs` which uses `fetch()`.

**Path handling:** Always use `path.join()` — never string concatenation for paths.

**Directory creation:** Always use `{ recursive: true }` with `mkdirSync()` to avoid "directory not found" errors.

---

*Convention analysis: 2026-02-21*
