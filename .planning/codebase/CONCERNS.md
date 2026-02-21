# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Pervasive Empty Catch Blocks (36 occurrences):**
- Issue: 36 `catch {}` blocks across all library modules silently swallow errors with no logging, no fallback messaging, and no way to diagnose failures. This is the single largest category of tech debt.
- Files:
  - `get-shit-done/bin/lib/init.cjs` (11 empty catches at lines 140, 164, 253, 294, 423, 458, 460, 507, 509, 518, 557, 633, 641)
  - `get-shit-done/bin/lib/phase.cjs` (5 empty catches at lines 402, 471, 539, 597, 806)
  - `get-shit-done/bin/lib/verify.cjs` (7 empty catches at lines 428, 490, 510, 586, 627, 646, 668)
  - `get-shit-done/bin/lib/commands.cjs` (4 empty catches at lines 73, 75, 122, 422)
  - `get-shit-done/bin/lib/core.cjs` (2 empty catches at lines 236, 271)
  - `get-shit-done/bin/lib/milestone.cjs` (3 empty catches at lines 122, 125, 188)
  - `get-shit-done/bin/lib/roadmap.cjs` (1 empty catch at line 153)
  - `get-shit-done/bin/lib/state.cjs` (1 empty catch at line 16)
- Impact: Silent failures make debugging extremely difficult. Users get empty results or partial data with no indication something went wrong. A corrupt file or permission error becomes invisible.
- Fix approach: Replace empty catches with at minimum a stderr log when `process.env.GSD_DEBUG` is set. For user-facing operations, propagate errors into the JSON result's `warnings` field so callers can surface them.

**Custom YAML Parser Instead of Standard Library:**
- Issue: `get-shit-done/bin/lib/frontmatter.cjs` implements a hand-rolled YAML parser (lines 11-84) instead of using a proper YAML library. This parser handles basic key-value, arrays, and one level of nesting but does not support multi-line strings, quoted strings with colons, block scalars, anchors/aliases, or other standard YAML features.
- Files: `get-shit-done/bin/lib/frontmatter.cjs`
- Impact: Frontmatter with YAML edge cases (multi-line values, strings containing colons inside quotes, nested objects >2 levels deep) may silently parse incorrectly. The `extractFrontmatter` function is called from 8+ other modules so any parsing bug cascades everywhere.
- Fix approach: Either add a lightweight YAML parser dependency (like `yaml` or `js-yaml`) or thoroughly document the supported YAML subset and add fuzz tests. The project currently has zero dependencies, so adding one is a philosophical choice.

**Custom JSONC Parser in install.js:**
- Issue: `bin/install.js` lines 1056-1110 implement an inline JSONC parser (JSON with Comments). While functional, hand-rolled parsers are error-prone for edge cases like nested strings containing `//` or `/*`.
- Files: `bin/install.js` (function `parseJsonc`)
- Impact: Could fail on valid JSONC files with unusual string contents. Only affects OpenCode config file parsing during install.
- Fix approach: The parser exists to avoid adding dependencies. If a dependency is added for YAML, consider using the same ecosystem for JSONC, or add explicit test coverage for edge cases.

**install.js Monolith (1865 lines):**
- Issue: `bin/install.js` is a single 1865-line file handling installation for 3 runtimes (Claude Code, OpenCode, Gemini), uninstallation, interactive prompts, file manifest management, local patch persistence, frontmatter conversion, tool name mapping, and settings management.
- Files: `bin/install.js`
- Impact: Difficult to maintain and test. Changes to one runtime's install logic risk breaking others. No unit tests exist for this file (tests only cover `gsd-tools.cjs`).
- Fix approach: Extract into separate modules: `lib/convert-opencode.js`, `lib/convert-gemini.js`, `lib/manifest.js`, `lib/settings.js`. Add unit tests for conversion functions.

**Duplicated Code Between init.cjs and commands.cjs:**
- Issue: `cmdInitTodos()` in `init.cjs` (lines 429-486) duplicates the todo-listing logic from `cmdListTodos()` in `commands.cjs` (lines 44-79). Both scan the same directory, parse the same frontmatter fields, and build the same data structure.
- Files: `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/commands.cjs`
- Impact: Bug fixes or feature additions to todo listing must be applied in two places.
- Fix approach: Extract shared todo scanning into a helper in `core.cjs` and call from both locations.

**Duplicated Roadmap/Phase Consistency Logic:**
- Issue: `cmdValidateHealth()` in `verify.cjs` (lines 648-685) duplicates much of `cmdValidateConsistency()` (lines 396-513) in the same file. Both parse ROADMAP.md, compare disk phases, and check for mismatches.
- Files: `get-shit-done/bin/lib/verify.cjs`
- Impact: Two code paths that should produce consistent results. Fixes to one may not be applied to the other.
- Fix approach: Have `cmdValidateHealth()` call `cmdValidateConsistency()` internally or extract shared logic into a helper.

## Known Bugs

**Regex-Based ROADMAP.md Editing is Fragile:**
- Symptoms: Phase removal/renumbering in `cmdPhaseRemove()` uses regex replacement on markdown content. Complex roadmap structures with non-standard formatting can lead to partial updates or mangled content.
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 600-662)
- Trigger: Roadmaps with custom formatting, extra whitespace, or non-standard heading levels.
- Workaround: The `cmdValidateConsistency()` command can detect disk/roadmap mismatches after the fact, but doesn't fix them.

**Phase Renumbering Uses Hardcoded Upper Bound:**
- Symptoms: Phase removal renumbers subsequent phases by iterating from 99 down to the removed phase number (line 624: `const maxPhase = 99`). Projects with phase numbers >99 would not be renumbered.
- Files: `get-shit-done/bin/lib/phase.cjs` (line 624)
- Trigger: A project with more than 99 phases (unlikely but not impossible across milestones).
- Workaround: None. Phase >99 renumbering silently fails.

**Global `fetch` Assumed Available:**
- Symptoms: `cmdWebsearch()` in `commands.cjs` (line 351) uses the global `fetch()` API without checking availability. Node.js only added global `fetch` in v18. The `engines` field in `package.json` requires only `>=16.7.0`.
- Files: `get-shit-done/bin/lib/commands.cjs` (line 351), `package.json` (engines: `>=16.7.0`)
- Trigger: Running `websearch` on Node.js 16 or 17.
- Workaround: The websearch is a secondary feature and gracefully returns an error, but the `TypeError` message is confusing.

## Security Considerations

**Shell Command Injection Surface in execGit:**
- Risk: `execGit()` in `core.cjs` (lines 127-146) concatenates git arguments into a shell string via `execSync('git ' + escaped.join(' '))`. While it does shell-escape arguments with single quotes and has an allowlist regex (`/^[a-zA-Z0-9._\-/=:@]+$/`), the shell string concatenation approach is inherently riskier than passing args as an array to `execFile`.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 127-146)
- Current mitigation: Arguments are escaped with single quotes, and safe characters pass through unquoted. The function is only called with controlled arguments (commit messages, file paths from `.planning/`).
- Recommendations: Switch to `execFileSync('git', args)` which avoids shell interpretation entirely. This is a straightforward change that eliminates the injection surface.

**Shell Command in isGitIgnored:**
- Risk: `isGitIgnored()` in `core.cjs` (line 117) uses `execSync('git check-ignore -q -- ' + targetPath.replace(...))` with a character allowlist sanitizer. The `targetPath` comes from function callers (typically `.planning`), not user input.
- Files: `get-shit-done/bin/lib/core.cjs` (line 117)
- Current mitigation: Character stripping via `/[^a-zA-Z0-9._\-/]/g` removes shell metacharacters.
- Recommendations: Use `execFileSync` to eliminate shell entirely.

**Platform-Specific `find` Command in init.cjs:**
- Risk: `cmdInitNewProject()` runs `execSync('find . -maxdepth 3 ...')` (line 158) which is POSIX-specific. This fails silently on Windows (caught by empty `catch {}`).
- Files: `get-shit-done/bin/lib/init.cjs` (line 158)
- Current mitigation: Wrapped in try/catch so failure is silent. The feature degrades gracefully (brownfield detection falls back to package file checks).
- Recommendations: Replace with `fs.readdirSync` recursive glob or use Node.js built-in `fs.globSync` (available in Node 22+). For now, the degraded behavior is acceptable.

**Temp File Metrics Shared Between Sessions:**
- Risk: The statusline hook writes context metrics to `/tmp/claude-ctx-{session_id}.json` (predictable path). A malicious process could write fake metrics to trigger early context warnings or suppress them.
- Files: `hooks/gsd-statusline.js` (lines 33-44), `hooks/gsd-context-monitor.js` (lines 42-49)
- Current mitigation: Session IDs are random, reducing collision risk. The worst case is a false context warning—no data exfiltration or code execution possible.
- Recommendations: Low priority. Consider using a file descriptor with `O_EXCL` or randomized filenames if paranoid.

## Performance Bottlenecks

**Synchronous File I/O Throughout:**
- Problem: Every operation uses synchronous `fs.readFileSync`, `fs.writeFileSync`, `fs.readdirSync`, and `execSync`. For a CLI tool this is generally acceptable, but compound commands like `init execute-phase` and `roadmap analyze` perform dozens of synchronous file reads.
- Files: All modules in `get-shit-done/bin/lib/`
- Cause: Design choice for simplicity. Each CLI invocation runs a single command and exits.
- Improvement path: Not a real issue for the current use case. Only becomes relevant if the tool is used as a library in a long-running process. Async would add complexity with minimal user-visible benefit since commands complete in <100ms.

**Repeated ROADMAP.md Parsing:**
- Problem: Multiple commands read and re-parse `ROADMAP.md` in the same execution path. For example, `cmdValidateHealth()` reads ROADMAP.md and then the inline consistency check reads it again.
- Files: `get-shit-done/bin/lib/verify.cjs` (lines 409, 651)
- Cause: Functions are designed to be standalone and don't share parsed state.
- Improvement path: Pass parsed content between functions when called in sequence. Minor optimization since the file is typically <50KB.

**File Manifest Hashing During Install:**
- Problem: `writeManifest()` in `bin/install.js` (line 1260) computes SHA256 hashes for every installed file. For large installations this adds a few hundred milliseconds.
- Files: `bin/install.js` (function `generateManifest`)
- Cause: Necessary for local patch detection.
- Improvement path: Acceptable cost for install-time operation. No action needed.

## Fragile Areas

**Regex-Based Markdown Manipulation:**
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 600-662, `cmdPhaseRemove`), `get-shit-done/bin/lib/roadmap.cjs` (lines 220-292, `cmdRoadmapUpdatePlanProgress`), `get-shit-done/bin/lib/state.cjs` (all `stateReplaceField` calls)
- Why fragile: All state mutations rely on regex pattern matching against markdown content. If the markdown format deviates (extra whitespace, different heading levels, user edits that break the expected pattern), the regex silently fails to match and the update is skipped.
- Safe modification: Always run `validate consistency` after bulk operations. When adding new regex-based updates, ensure the pattern is tested with both standard and slightly non-standard formatting.
- Test coverage: `verify.test.cjs` tests verification commands. `phase.test.cjs` tests phase operations. However, regex robustness against format variations is not explicitly tested.

**Custom YAML Frontmatter Parser:**
- Files: `get-shit-done/bin/lib/frontmatter.cjs` (lines 11-84)
- Why fragile: Supports only a subset of YAML. Adding new frontmatter features (e.g., nested arrays of objects, multi-line strings) may require parser modifications that risk breaking existing parsing.
- Safe modification: Always add a test case for the new YAML pattern before modifying the parser. The `extractFrontmatter` return value is consumed by many modules.
- Test coverage: No dedicated frontmatter parser tests exist. The parser is tested indirectly through higher-level commands.

**Cross-Runtime Frontmatter/Tool Conversion:**
- Files: `bin/install.js` (functions `convertClaudeToOpencodeFrontmatter`, `convertClaudeToGeminiAgent`, `convertClaudeToGeminiToml`)
- Why fragile: Three separate conversion functions transform Claude Code markdown into OpenCode and Gemini formats. Each handles frontmatter parsing, tool name mapping, and content rewriting. Changes to the source Claude format must be reflected in all three converters.
- Safe modification: When modifying agent frontmatter format, verify output for all three runtimes. Consider adding a test that converts a sample agent file and validates the output for each runtime.
- Test coverage: No tests for conversion functions. Install.js has zero test coverage.

**STATE.md Field Extraction:**
- Files: `get-shit-done/bin/lib/state.cjs` (function `stateExtractField`, all `stateReplaceField` calls)
- Why fragile: Relies on the exact markdown pattern `**Field Name:** value` with precise whitespace. If STATE.md is manually edited and formatting changes (e.g., extra spaces, different bold syntax), field extraction silently returns null.
- Safe modification: Use `state-snapshot` command to verify all fields are extractable after manual edits.
- Test coverage: `state.test.cjs` covers basic operations (156 lines, 6 tests). Does not test edge cases like misformatted field patterns.

## Scaling Limits

**Phase Numbering:**
- Current capacity: Two-digit zero-padded phase numbers (01-99), with decimal sub-phases (01.1, 01.2, etc.)
- Limit: The renumbering logic in `cmdPhaseRemove()` iterates up to phase 99. Phase numbers >99 would not be renumbered on removal.
- Scaling path: Change `const maxPhase = 99` to dynamically detect the actual maximum phase number from disk.

**Large JSON Output:**
- Current capacity: Output helper in `core.cjs` writes JSON to stdout, with a 50KB threshold that triggers temp-file fallback (line 34).
- Limit: Projects with hundreds of plans could exceed this in `roadmap analyze` or `history-digest` commands.
- Scaling path: Already handled—the temp file fallback works correctly. The 50KB threshold could be configurable but is adequate.

## Dependencies at Risk

**Zero Runtime Dependencies (by Design):**
- The project has zero runtime dependencies (`dependencies: {}` in `package.json`). Only devDependency is `esbuild ^0.24.0` for hook bundling.
- Risk: This is actually a strength—no supply chain risk, no transitive dependency issues.
- Impact: The tradeoff is custom implementations of YAML parsing and JSONC parsing that would normally be handled by libraries.
- Migration plan: If a YAML parser is added, `js-yaml` (4.2M weekly downloads, well-maintained) is the standard choice.

**Node.js Version Floor:**
- Risk: `engines.node >= 16.7.0` is set but Node 16 reached end-of-life in September 2023. The code uses `fetch()` (requires Node 18+) and `fs.rmSync` (available since Node 14.14). The mismatch between the declared floor and actual requirements could cause confusing errors.
- Impact: Users on Node 16 or 17 will get `fetch is not defined` when running websearch.
- Migration plan: Bump `engines.node` to `>=18.0.0` to match actual requirements.

## Missing Critical Features

**No Test Coverage for install.js:**
- Problem: The largest file in the codebase (`bin/install.js`, 1865 lines) has zero test coverage. It handles installation, uninstallation, file conversion, settings management, and interactive prompts for three different runtimes.
- Blocks: Confident refactoring of the installer, safe addition of new runtimes.

**No Dedicated Frontmatter Parser Tests:**
- Problem: The custom YAML frontmatter parser in `frontmatter.cjs` is tested only indirectly. No tests exercise edge cases like deeply nested objects, inline arrays, quoted strings with special characters, or malformed YAML.
- Blocks: Safe parser improvements or extensions.

## Test Coverage Gaps

**install.js (1865 lines, 0 tests):**
- What's not tested: All installation logic including file copying, path replacement, frontmatter conversion (Claude→OpenCode, Claude→Gemini), settings.json management, uninstallation, interactive prompts, manifest generation, and local patch persistence.
- Files: `bin/install.js`
- Risk: Regression in cross-runtime conversion could ship broken agent files. Settings.json manipulation could corrupt user configurations.
- Priority: High

**Frontmatter Parser Edge Cases (0 dedicated tests):**
- What's not tested: Multi-level nested YAML, inline arrays with special characters, empty frontmatter blocks, frontmatter with no trailing newline, values containing colons or hashes.
- Files: `get-shit-done/bin/lib/frontmatter.cjs`
- Risk: Subtle parsing bugs could corrupt plan/summary metadata silently.
- Priority: High

**Phase Renumbering (limited coverage):**
- What's not tested: Integer phase renumbering after removal (only decimal tested), renumbering with >10 phases, renumbering when files inside phases have phase-prefixed names.
- Files: `get-shit-done/bin/lib/phase.cjs` (`cmdPhaseRemove`)
- Risk: Phase removal in a large project could leave inconsistent numbering.
- Priority: Medium

**Hook Scripts (0 tests):**
- What's not tested: Statusline output formatting, context monitor threshold logic, update check caching, bridge file reading/writing.
- Files: `hooks/gsd-statusline.js`, `hooks/gsd-context-monitor.js`, `hooks/gsd-check-update.js`
- Risk: Low—hooks are designed to fail silently, and broken hooks only affect status display.
- Priority: Low

**Regex-Based ROADMAP Manipulation (limited coverage):**
- What's not tested: Regex patterns against non-standard markdown formatting, roadmap updates when multiple phases have similar names, concurrent updates to ROADMAP.md.
- Files: `get-shit-done/bin/lib/phase.cjs`, `get-shit-done/bin/lib/roadmap.cjs`
- Risk: Roadmap corruption is the highest-impact failure since it's the central project document.
- Priority: Medium

---

*Concerns audit: 2026-02-21*
