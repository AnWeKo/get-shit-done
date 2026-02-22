/**
 * GSD Tools Tests - E2E Spec-From-File
 *
 * Part A: Cross-runtime source validation (CMD-03)
 *   Verifies command and workflow source files follow patterns that the installer
 *   can convert correctly for Claude Code, OpenCode, and Gemini CLI.
 *
 * Part B: Artifact structure validation (SC3)
 *   Creates mock pipeline output artifacts, then verifies GSD tooling can parse them.
 *   The full pipeline requires an LLM and can't run in tests — this proves that
 *   correctly-structured artifacts are compatible with downstream commands.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// Paths to source files under test
const COMMAND_PATH = path.join(__dirname, '..', 'commands', 'gsd', 'new-project-from-spec.md');
const WORKFLOW_PATH = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'new-project-from-spec.md');
const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'spec-e2e');

// --- Part A: Cross-Runtime Source Validation ---

describe('cross-runtime source validation', () => {
  test('command source file has valid frontmatter', () => {
    const content = fs.readFileSync(COMMAND_PATH, 'utf-8');

    // Must start with YAML frontmatter block
    assert.ok(content.startsWith('---\n'), 'Command file must start with YAML frontmatter delimiter');

    // Find closing delimiter (second ---)
    const secondDelimiter = content.indexOf('---', 4);
    assert.ok(secondDelimiter > 0, 'Command file must have closing frontmatter delimiter');

    const frontmatter = content.slice(4, secondDelimiter);

    // Required fields for installer conversion
    assert.ok(/^name:\s*.+/m.test(frontmatter), 'Frontmatter must contain name: field');
    assert.ok(
      /^allowed-tools:\s*/m.test(frontmatter),
      'Frontmatter must contain allowed-tools: field (Claude Code format, converted to tools: for OpenCode)'
    );
    assert.ok(/^description:\s*.+/m.test(frontmatter), 'Frontmatter must contain description: field');
  });

  test('workflow source file exists and is substantial', () => {
    const stat = fs.statSync(WORKFLOW_PATH);
    assert.ok(stat.isFile(), 'Workflow file must exist');

    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    const lines = content.split('\n');
    assert.ok(lines.length > 500, `Workflow should be >500 lines, got ${lines.length}`);

    // Required structural tags for all workflows
    assert.ok(content.includes('<purpose>'), 'Workflow must contain <purpose> tag');
    assert.ok(content.includes('<process>'), 'Workflow must contain <process> tag');
  });

  test('command has no raw template variables outside bash blocks', () => {
    const content = fs.readFileSync(COMMAND_PATH, 'utf-8');

    // Extract content outside of fenced code blocks
    // Split on triple backtick boundaries and take even-indexed segments (outside code blocks)
    const segments = content.split(/```[^\n]*\n[\s\S]*?```/g);
    const proseContent = segments.join('\n');

    // Check for ${VAR} patterns that would break Gemini conversion
    // Skip $ARGUMENTS which is an intentional Claude Code variable
    const templateVarPattern = /\$\{(?!ARGUMENTS)[^}]+\}/g;
    const matches = proseContent.match(templateVarPattern);

    assert.strictEqual(
      matches,
      null,
      `Found raw template variables outside code blocks: ${JSON.stringify(matches)}. These break Gemini conversion.`
    );
  });

  test('workflow path references use canonical form', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

    // Check for hardcoded non-canonical runtime paths
    // The installer converts ~/.claude/ to the target runtime path
    const opencodePaths = content.match(/~\/\.opencode\//g);
    const geminiPaths = content.match(/~\/\.gemini\//g);

    assert.strictEqual(
      opencodePaths,
      null,
      'Workflow must not contain hardcoded ~/.opencode/ paths (installer converts from ~/.claude/ canonical form)'
    );
    assert.strictEqual(
      geminiPaths,
      null,
      'Workflow must not contain hardcoded ~/.gemini/ paths (installer converts from ~/.claude/ canonical form)'
    );
  });
});

// --- Part B: Artifact Structure Validation ---

describe('artifact structure validation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('gsd-tools can parse valid ROADMAP.md structure', () => {
    const minimalRoadmap = `# Roadmap: TaskFlow CLI

## Overview

Build a CLI task management tool in 3 phases.

## Phases

- [ ] **Phase 1: Foundation** - Core task CRUD and storage
- [ ] **Phase 2: Projects** - Project organization and milestones
- [ ] **Phase 3: Reporting** - Analytics and export

## Phase Details

### Phase 1: Foundation
**Goal**: Set up core task management with local SQLite storage
**Depends on**: Nothing (first phase)
**Requirements**: TASK-01, TASK-02
**Success Criteria** (what must be TRUE):
  1. User can create and list tasks from CLI
  2. Tasks persist across sessions in SQLite
**Plans:** 2 plans

Plans:
- [ ] 01-01: CLI scaffolding and argument parsing
- [ ] 01-02: SQLite storage layer and task CRUD

### Phase 2: Projects
**Goal**: Add project organization
**Depends on**: Phase 1
**Requirements**: PROJ-01
**Success Criteria** (what must be TRUE):
  1. Tasks can be grouped into projects
**Plans:** 1 plan

Plans:
- [ ] 02-01: Project management commands

### Phase 3: Reporting
**Goal**: Generate reports and export data
**Depends on**: Phase 2
**Requirements**: RPT-01
**Success Criteria** (what must be TRUE):
  1. Weekly report command works
**Plans:** 1 plan

Plans:
- [ ] 03-01: Report generation and export

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Projects | 0/1 | Not started | - |
| 3. Reporting | 0/1 | Not started | - |
`;

    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), minimalRoadmap);

    const result = runGsdTools('roadmap analyze', tmpDir);
    assert.ok(result.success, `roadmap analyze failed: ${result.error}`);

    const parsed = JSON.parse(result.output);
    assert.ok(Array.isArray(parsed.phases), 'phases should be an array');
    assert.ok(parsed.phases.length >= 3, `Expected at least 3 phases, got ${parsed.phases.length}`);
    assert.strictEqual(parsed.phases[0].name, 'Foundation', 'First phase name should be Foundation');
  });

  test('gsd-tools can parse valid STATE.md structure', () => {
    const minimalState = `# Project State

**Current Phase:** 01
**Current Phase Name:** Foundation
**Total Phases:** 3
**Current Plan:** 01-01
**Total Plans in Phase:** 2
**Status:** In progress
**Progress:** 10%
**Last Activity:** 2026-02-22
**Last Activity Description:** Started Phase 1
`;

    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), minimalState);

    const result = runGsdTools('state-snapshot', tmpDir);
    assert.ok(result.success, `state-snapshot failed: ${result.error}`);

    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.current_phase, '01', 'current phase should be 01');
    assert.strictEqual(parsed.current_phase_name, 'Foundation', 'phase name should be Foundation');
    assert.strictEqual(parsed.status, 'In progress', 'status should be In progress');
    assert.strictEqual(parsed.progress_percent, 10, 'progress should be 10');
  });

  test('gsd-tools can validate frontmatter in PLAN.md', () => {
    const minimalPlan = `---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
---

# Plan content here

<objective>Build the foundation</objective>
`;

    const planPath = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(planPath, { recursive: true });
    const planFile = path.join(planPath, '01-01-PLAN.md');
    fs.writeFileSync(planFile, minimalPlan);

    const result = runGsdTools(`frontmatter get ${planFile} phase`, tmpDir);
    assert.ok(result.success, `frontmatter get failed: ${result.error}`);

    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.phase, '01-foundation', 'phase field should be 01-foundation');
    assert.strictEqual(parsed.plan, '01', 'plan field should be 01');
    assert.strictEqual(parsed.type, 'execute', 'type field should be execute');
  });

  test('test fixture spec files are valid', () => {
    const expectedFiles = ['prd.md', 'tech-spec.md', 'user-stories.md'];

    for (const file of expectedFiles) {
      const filePath = path.join(FIXTURE_DIR, file);
      assert.ok(fs.existsSync(filePath), `Fixture file ${file} must exist`);

      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 100, `Fixture file ${file} must have substantial content (got ${content.length} bytes)`);

      // All fixture files should have markdown headings
      assert.ok(/^#\s+.+/m.test(content), `Fixture file ${file} must contain markdown headings`);
    }
  });
});
