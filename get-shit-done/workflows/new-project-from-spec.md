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
<!-- Plan 02 adds synthesis logic here -->
<!-- This step will: -->
<!--   - Merge and deduplicate content across classified spec files -->
<!--   - Detect contradictions between files (cite file + section) -->
<!--   - Detect critical gaps (missing information) -->
<!--   - Batch all contradictions/gaps and ask user in one round -->
<!--   - Classify extracted requirements as CLEAR / INFERABLE / AMBIGUOUS -->

## 7. PROJECT.md Generation
<!-- Plan 02 adds generation logic here -->
<!-- This step will: -->
<!--   - Synthesize classified + resolved content into PROJECT.md template -->
<!--   - Include inline traceability (which spec file each point came from) -->
<!--   - Import decisions from specs into Key Decisions table -->
<!--   - Note that PROJECT.md was generated from specs (with source file list) -->
<!--   - Preserve content that doesn't map to PROJECT.md as supplementary files -->

## 8. Done
<!-- Plan 02 adds completion logic here -->
<!-- This step will: -->
<!--   - Commit PROJECT.md -->
<!--   - Display completion summary -->
<!--   - Show next steps -->

</process>

<output>

- `.planning/PROJECT.md` — project context synthesized from spec files

</output>

<success_criteria>

- [ ] Spec folder validated (exists, contains .md files)
- [ ] All .md files read from spec folder
- [ ] Each file classified by content role
- [ ] Non-markdown files warned about (not errored)
- [ ] Actionable error messages for missing folder / no .md files
- [ ] Existing .planning/ detection asks before overwriting
- [ ] Brownfield detection and mapping offer works
- [ ] PROJECT.md synthesized from spec content (Plan 02)

</success_criteria>
