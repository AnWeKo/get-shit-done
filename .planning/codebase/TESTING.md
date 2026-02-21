# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`) — no external test framework
- Config: None — no config file needed; uses built-in runner
- Node.js requirement: `>=16.7.0` (per `package.json` engines)

**Assertion Library:**
- `node:assert` (built-in strict assertions)

**Run Commands:**
```bash
npm test                            # Run all tests
node --test tests/*.test.cjs       # Run all tests directly
node --test tests/phase.test.cjs   # Run single test file
```

## Test File Organization

**Location:**
- All tests in a dedicated `tests/` directory at the project root (NOT co-located with source)

**Naming:**
- Pattern: `{domain}.test.cjs` matching the source module domain
- Examples: `phase.test.cjs`, `state.test.cjs`, `commands.test.cjs`, `roadmap.test.cjs`

**Structure:**
```
tests/
├── helpers.cjs           # Shared test utilities
├── commands.test.cjs     # Tests for commands.cjs + misc commands
├── init.test.cjs         # Tests for init.cjs compound commands
├── milestone.test.cjs    # Tests for milestone.cjs
├── phase.test.cjs        # Tests for phase.cjs (largest file, 1013 lines)
├── roadmap.test.cjs      # Tests for roadmap.cjs
├── state.test.cjs        # Tests for state.cjs
└── verify.test.cjs       # Tests for verify.cjs validation
```

**Test-to-source mapping:**
| Test File | Source Module |
|-----------|--------------|
| `tests/commands.test.cjs` | `get-shit-done/bin/lib/commands.cjs` |
| `tests/init.test.cjs` | `get-shit-done/bin/lib/init.cjs` |
| `tests/milestone.test.cjs` | `get-shit-done/bin/lib/milestone.cjs` |
| `tests/phase.test.cjs` | `get-shit-done/bin/lib/phase.cjs` |
| `tests/roadmap.test.cjs` | `get-shit-done/bin/lib/roadmap.cjs` |
| `tests/state.test.cjs` | `get-shit-done/bin/lib/state.cjs` |
| `tests/verify.test.cjs` | `get-shit-done/bin/lib/verify.cjs` |

## Test Structure

**Suite Organization:**
```javascript
/**
 * GSD Tools Tests - {Domain}
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('{command name} command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('descriptive behavior statement', () => {
    // Arrange: set up filesystem state
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Setup\n`
    );

    // Act: run CLI command
    const result = runGsdTools('roadmap get-phase 1', tmpDir);

    // Assert: check output
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, true, 'phase should be found');
    assert.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');
  });
});
```

**Patterns:**
- Every `describe` block has its own `tmpDir` with `beforeEach`/`afterEach` lifecycle
- Test names are descriptive behavior statements (e.g., "removes phase directory and renumbers subsequent")
- Assertion messages are always provided as the last argument for clarity on failure
- Section comments (`// ─────`) separate `describe` blocks within files

## Test Helper Module

**Location:** `tests/helpers.cjs`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOOLS_PATH = path.join(__dirname, '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

// Run gsd-tools as a subprocess and capture output
function runGsdTools(args, cwd = process.cwd()) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}

// Create temp project with .planning/phases structure
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Cleanup temp directory
function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
```

## Testing Approach

**Type: Integration tests via CLI subprocess execution.**

Tests run the full `gsd-tools.cjs` CLI as a child process using `execSync`. This tests the complete stack:
- CLI argument parsing (in `gsd-tools.cjs`)
- Router/dispatch logic (switch/case in `main()`)
- Business logic in library modules
- JSON output serialization
- Error handling and exit codes

There are **no unit tests** that import and test individual functions directly. All tests exercise the public CLI interface.

## Test Data Setup

**Pattern: Inline filesystem fixtures created per-test.**

Tests create temporary `.planning/` directory structures with `fs.mkdirSync()` and `fs.writeFileSync()`:

```javascript
test('extracts phase section from ROADMAP.md', () => {
  // Create test fixtures inline
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'ROADMAP.md'),
    `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Set up project\n`
  );

  const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
  fs.mkdirSync(phaseDir, { recursive: true });
  fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');
  fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');

  // ... act and assert
});
```

**YAML frontmatter fixtures** are written as template literal strings:
```javascript
fs.writeFileSync(
  path.join(phaseDir, '01-01-SUMMARY.md'),
  `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
tech-stack:
  added:
    - "prisma"
key-decisions:
  - "Use Prisma over Drizzle"
---

# Summary content here
`
);
```

**Location:** All fixtures are created inline within each test — no shared fixture directory.

## Mocking

**Framework:** None — no mocking framework is used.

**Approach:** Instead of mocking, tests create isolated temporary filesystem environments. Each test gets a fresh `tmpDir` with a minimal `.planning/phases/` structure. The CLI runs against this real filesystem.

**What is NOT mocked:**
- File system operations (real fs in temp directories)
- The CLI process (real subprocess execution)
- JSON parsing/serialization

**What is effectively isolated:**
- Git operations: some tests that touch git commands may fail in non-git temp dirs, but most commands handle git gracefully with try/catch
- External services: `cmdWebsearch()` is not tested (requires `BRAVE_API_KEY`)

## Assertion Patterns

**Strict assertions only:**
```javascript
// Equality
assert.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');

// Deep equality for objects/arrays
assert.deepStrictEqual(output.directories, ['01-foundation', '02-api'], 'sorted correctly');

// Boolean checks
assert.ok(result.success, `Command failed: ${result.error}`);
assert.ok(!result.success, 'should fail');

// String containment
assert.ok(result.error.includes('not found'), 'error mentions not found');
assert.ok(roadmap.includes('Phase 3: User Dashboard'), 'roadmap updated');
```

**Pattern for CLI success check:**
```javascript
const result = runGsdTools('command args', tmpDir);
assert.ok(result.success, `Command failed: ${result.error}`);
const output = JSON.parse(result.output);
```

**Pattern for expected CLI failure:**
```javascript
const result = runGsdTools('phase remove 1', tmpDir);
assert.ok(!result.success, 'should fail without --force');
assert.ok(result.error.includes('executed plan'), 'error mentions executed plans');
```

## Filesystem Verification

Tests frequently verify side effects on the filesystem:
```javascript
// Verify directory created
assert.ok(
  fs.existsSync(path.join(tmpDir, '.planning', 'phases', '03-user-dashboard')),
  'directory should be created'
);

// Verify file NOT present
assert.ok(
  !fs.existsSync(path.join(tmpDir, '.planning', 'phases', '03-features')),
  'old 03-features should not exist'
);

// Verify file content
const roadmap = fs.readFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
assert.ok(roadmap.includes('### Phase 3: User Dashboard'), 'roadmap should include new phase');
```

## Coverage

**Requirements:** None enforced — no coverage tool configured.

**Current state:** 81 tests across 18 suites, all passing. Tests cover:
- All `init` compound commands
- Phase CRUD (add, insert, remove, complete)
- Phase listing and querying
- Roadmap parsing and analysis
- State snapshot and progression
- History digest and summary extraction
- Progress rendering
- Todo completion
- Scaffold operations
- Validation/consistency checks
- Milestone completion

**Untested areas:**
- `bin/install.js` (installer) — no automated tests
- `hooks/` (hook scripts) — no automated tests
- `get-shit-done/bin/lib/frontmatter.cjs` — tested indirectly through other commands
- `get-shit-done/bin/lib/template.cjs` — partially tested via scaffold tests
- `cmdWebsearch()` — requires external API key
- `cmdCommit()` — requires git repository (temp dirs are not git repos)
- Error path for `@file:` large JSON output

## Test Types

**Unit Tests:**
- None — no direct function-level unit tests

**Integration Tests:**
- All 81 tests are integration tests that exercise the CLI subprocess end-to-end
- Tests verify both stdout JSON output and filesystem side effects

**E2E Tests:**
- Not used — no browser/UI tests

## Common Patterns

**Testing CLI output JSON:**
```javascript
test('renders JSON progress', () => {
  // Setup
  fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0 MVP\n`);
  const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
  fs.mkdirSync(p1, { recursive: true });
  fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
  fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');

  // Execute
  const result = runGsdTools('progress json', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  // Assert structured output
  const output = JSON.parse(result.output);
  assert.strictEqual(output.total_plans, 2, '2 total plans');
  assert.strictEqual(output.percent, 50, '50%');
});
```

**Testing raw mode output:**
```javascript
test('renders bar format', () => {
  // ... setup ...
  const result = runGsdTools('progress bar --raw', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);
  assert.ok(result.output.includes('1/1'), 'should include count');
  assert.ok(result.output.includes('100%'), 'should include 100%');
});
```

**Testing error conditions:**
```javascript
test('rejects removal of phase with summaries unless --force', () => {
  // ... setup phase with SUMMARY ...

  // Should fail without --force
  const result = runGsdTools('phase remove 1', tmpDir);
  assert.ok(!result.success, 'should fail without --force');
  assert.ok(result.error.includes('executed plan'), 'error mentions executed plans');

  // Should succeed with --force
  const forceResult = runGsdTools('phase remove 1 --force', tmpDir);
  assert.ok(forceResult.success, `Force remove failed: ${forceResult.error}`);
});
```

**Testing filesystem mutations:**
```javascript
test('moves todo from pending to completed', () => {
  const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
  fs.mkdirSync(pendingDir, { recursive: true });
  fs.writeFileSync(path.join(pendingDir, 'add-dark-mode.md'), `title: Add dark mode\n`);

  const result = runGsdTools('todo complete add-dark-mode.md', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  // Verify source removed
  assert.ok(
    !fs.existsSync(path.join(tmpDir, '.planning', 'todos', 'pending', 'add-dark-mode.md')),
    'should be removed from pending'
  );
  // Verify destination created
  assert.ok(
    fs.existsSync(path.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md')),
    'should be in completed'
  );
});
```

## Adding New Tests

**To add tests for a new command:**

1. Create or extend a test file in `tests/` matching the source module domain
2. Import helpers: `const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');`
3. Create a `describe` block with `beforeEach`/`afterEach` for temp directory lifecycle
4. Set up the required `.planning/` filesystem state inline
5. Call `runGsdTools('command args', tmpDir)` to execute
6. Parse JSON output with `JSON.parse(result.output)` and assert
7. Verify filesystem side effects with `fs.existsSync()` and `fs.readFileSync()`

**Test file naming:** `{domain}.test.cjs` — must use `.cjs` extension for CommonJS compatibility.

---

*Testing analysis: 2026-02-21*
