---
name: gsd:new-project-from-spec
description: Initialize a new project from spec files — reads markdown specs, produces all planning artifacts, and commits automatically
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

This is the spec-driven alternative to the interactive `/gsd:new-project` flow. Instead of deep questioning, it reads markdown spec files from a folder, classifies each file's role, synthesizes PROJECT.md, extracts config preferences, runs research, generates requirements, creates a roadmap, and commits everything automatically.
</context>

<objective>
Initialize a project by reading spec files from a folder and producing all planning artifacts.

Same output as `/gsd:new-project` but with automated spec reading instead of interactive questioning. Full pipeline: spec reading → classification → synthesis → config extraction → research → requirements → roadmap → atomic commit.

**Creates:**
- `.planning/PROJECT.md` — project context synthesized from spec files
- `.planning/config.json` — config preferences inferred from spec prose
- `.planning/research/` — 4 research dimensions + synthesis (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md)
- `.planning/REQUIREMENTS.md` — domain-specific categories with REQ-IDs and traceability
- `.planning/ROADMAP.md` — phased execution plan derived from requirements
- `.planning/STATE.md` — project state tracking

**After this command:** Run `/gsd-discuss-phase 1` to gather context before planning.
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
