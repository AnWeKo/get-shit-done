---
name: gsd:new-project-from-spec
description: Initialize a new project from spec files — reads markdown specs and produces PROJECT.md
argument-hint: "[path/to/specs/]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Arguments:**
- Optional path to spec folder (default: `./specs/`). Example: `/gsd:new-project-from-spec ./my-specs/`

This is the spec-driven alternative to the interactive `/gsd:new-project` flow. Instead of deep questioning, it reads markdown spec files from a folder, classifies each file's role, and synthesizes PROJECT.md automatically.
</context>

<objective>
Initialize a project by reading spec files from a folder and synthesizing PROJECT.md.

Same output as `/gsd:new-project` but with automated spec reading instead of interactive questioning. Creates `.planning/PROJECT.md` (Phase 1 scope). Pipeline automation (config, research, requirements, roadmap) is Phase 2.

**Creates:**
- `.planning/PROJECT.md` — project context synthesized from spec files

**After this command:** Run `/gsd:plan-phase 1` to start execution.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-project-from-spec.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
</execution_context>

<process>
Execute the new-project-from-spec workflow from @~/.claude/get-shit-done/workflows/new-project-from-spec.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
