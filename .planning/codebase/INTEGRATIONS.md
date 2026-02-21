# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Brave Web Search:**
- Purpose: Optional web search capability for GSD research workflows
- SDK/Client: Native `fetch()` API (no external package)
- Endpoint: `https://api.search.brave.com/res/v1/web/search`
- Auth: `BRAVE_API_KEY` env var or `~/.gsd/brave_api_key` file
- Implementation: `get-shit-done/bin/lib/commands.cjs` → `cmdWebsearch()`
- Auto-detection: `get-shit-done/bin/lib/config.cjs` checks for key at project init, sets `brave_search` config flag
- Fallback: When unavailable, agents fall back to built-in WebSearch tool of the host AI assistant

**npm Registry:**
- Purpose: Version checking for GSD update notifications
- SDK/Client: `npm` CLI via `child_process.execSync`
- Command: `npm view get-shit-done-cc version`
- Implementation: `hooks/gsd-check-update.js` (runs as background spawned process)
- Cache: Results written to `~/.claude/cache/gsd-update-check.json`
- Timeout: 10 seconds (`{timeout: 10000}` on execSync)
- Trigger: SessionStart hook, runs once per session

## Data Storage

**Databases:**
- None. All data stored as files on local filesystem.

**File Storage:**
- Local filesystem only
- Planning artifacts: `.planning/` directory in project root
  - `config.json` - Project configuration
  - `STATE.md` - Current project state
  - `ROADMAP.md` - Phase roadmap
  - `REQUIREMENTS.md` - Requirements tracking
  - `phases/` - Phase directories with plans and summaries
  - `todos/pending/`, `todos/completed/` - Todo tracking
  - `milestones/` - Archived milestone data
  - `codebase/` - Codebase analysis documents
- Version tracking: `get-shit-done/VERSION` file in config directory
- File manifests: `gsd-file-manifest.json` with SHA256 hashes for modification detection
- Local patches: `gsd-local-patches/` directory for user-modified file backup

**Caching:**
- Temp file bridge: `/tmp/claude-ctx-{session_id}.json` - Context window metrics shared between statusline and context monitor hooks
- Update cache: `~/.claude/cache/gsd-update-check.json` - npm version check results
- Warning debounce: `/tmp/claude-ctx-{session_id}-warned.json` - Tracks tool use count between context warnings

## Authentication & Identity

**Auth Provider:**
- None. GSD has no authentication system.
- All API keys are user-provided (Brave Search key via env var or file)

**AI Assistant Integration:**
- Claude Code: Hooks registered in `~/.claude/settings.json` (SessionStart, PostToolUse, statusLine)
- OpenCode: Permissions configured in `~/.config/opencode/opencode.json` (read, external_directory)
- Gemini: Experimental agents flag in `~/.gemini/settings.json`

## Monitoring & Observability

**Error Tracking:**
- None. All hooks use silent fail patterns (try/catch with `process.exit(0)`) to avoid breaking host AI assistant functionality.

**Logs:**
- No logging framework. Console output during installation only.
- Hooks are designed to be invisible on failure — never block the host application.

**Context Window Monitoring:**
- `hooks/gsd-statusline.js` writes context metrics to temp file bridge
- `hooks/gsd-context-monitor.js` reads metrics and injects warnings as `additionalContext` into the AI conversation
- Thresholds: WARNING at 35% remaining, CRITICAL at 25% remaining
- Debounce: 5 tool uses between warnings, severity escalation bypasses debounce
- Usage scaling: Raw usage scaled to 80% limit (80% real = 100% displayed)

## CI/CD & Deployment

**Hosting:**
- npm registry (`get-shit-done-cc` package)
- GitHub: `github.com/glittercowboy/get-shit-done`

**CI Pipeline:**
- GitHub Actions: `.github/workflows/auto-label-issues.yml` - Auto-labels new issues with "needs-triage"
- No automated test CI pipeline detected
- No automated npm publishing pipeline detected

**Release Process:**
- Manual `npm publish` (triggers `prepublishOnly` → `npm run build:hooks`)
- Version managed in `package.json` (currently 1.20.5)

## Git Integration

**Git CLI Usage (via `child_process`):**
- `get-shit-done/bin/lib/core.cjs` → `execGit()` - Safe git command execution with shell escaping
- `get-shit-done/bin/lib/core.cjs` → `isGitIgnored()` - Check if paths are gitignored via `git check-ignore`
- `get-shit-done/bin/lib/commands.cjs` → `cmdCommit()` - Stage and commit planning artifacts
- Branching operations: Create/checkout branches per phase or milestone strategy
- Commit verification: `get-shit-done/bin/lib/verify.cjs` → `cmdVerifyCommits()` validates commit hashes

**Git Operations:**
- `git add` - Stage planning files
- `git commit -m` - Create planning doc commits
- `git commit --amend --no-edit` - Amend previous commits
- `git rev-parse --short HEAD` - Get commit hash
- `git check-ignore -q` - Check gitignore status
- `git checkout -b` / `git checkout` - Branch creation/switching

## Environment Configuration

**Required env vars:**
- None required. All env vars are optional enhancements.

**Optional env vars:**
- `BRAVE_API_KEY` - Enables web search in research workflows
- `CLAUDE_CONFIG_DIR` - Custom Claude Code config directory
- `OPENCODE_CONFIG_DIR` - Custom OpenCode config directory
- `OPENCODE_CONFIG` - OpenCode config file path (directory derived)
- `XDG_CONFIG_HOME` - XDG base directory for OpenCode
- `GEMINI_CONFIG_DIR` - Custom Gemini config directory

**Secrets location:**
- `BRAVE_API_KEY` env var or `~/.gsd/brave_api_key` file
- No other secrets required

## Webhooks & Callbacks

**Incoming:**
- None. GSD has no server component.

**Outgoing:**
- None. GSD makes one outbound API call (Brave Search) which is optional and user-initiated.

## AI Assistant Hook System

**Claude Code / Gemini Hooks:**
- `SessionStart` hook: `hooks/gsd-check-update.js` - Background version check on session start
- `PostToolUse` hook: `hooks/gsd-context-monitor.js` - Context window monitoring after each tool use
- `statusLine` hook: `hooks/gsd-statusline.js` - Custom statusline showing model, task, context usage

**OpenCode:**
- No hooks (hook system not supported)
- Permissions configured in `opencode.json` for read access to GSD docs

**Hook Communication Pattern:**
- Statusline writes context metrics → temp file → Context monitor reads and injects warnings
- Bridge file: `/tmp/claude-ctx-{session_id}.json`
- All hooks read from stdin (JSON) and write to stdout (JSON or text)

## Discord Community

**Integration type:** Social/support only
- Invite link: `https://discord.gg/5JJgD5svVS`
- Displayed after installation and in `/gsd:join-discord` command
- No programmatic Discord integration

## GitHub Sponsorship

**Funding:**
- GitHub Sponsors: `glittercowboy` (`.github/FUNDING.yml`)

---

*Integration audit: 2026-02-21*
