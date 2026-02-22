---
name: gsd:plan-all
description: Batch-plan all unplanned phases in the current roadmap with zero interaction
argument-hint: "[--dry-run]"
agent: gsd-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
<objective>
Batch-plan all unplanned roadmap phases. Discovers which phases need planning,
then plans each one sequentially using the existing plan-phase pipeline.

**Default flow:** Discover unplanned phases -> Plan each sequentially -> Report

**Orchestrator role:** Initialize, discover unplanned phases, display summary,
plan each phase in order via Task subagents, commit after each, report results.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/plan-all.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Flags:
- `--dry-run` — Show discovery results and exit without planning

$ARGUMENTS passed through to workflow.
</context>

<process>
Execute the plan-all workflow from @~/.claude/get-shit-done/workflows/plan-all.md end-to-end.
Preserve all workflow gates (validation, discovery, reporting).
</process>
