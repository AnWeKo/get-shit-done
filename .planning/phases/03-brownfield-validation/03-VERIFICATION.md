---
phase: 03-brownfield-validation
verified: 2026-02-22T09:30:00Z
status: passed
score: 11/11 must-haves verified
---

# Phase 3: Brownfield & Validation — Verification Report

**Phase Goal:** The command correctly handles existing codebases and validates spec assumptions against research findings
**Verified:** 2026-02-22T09:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When run in a directory with existing code AND a codebase map already exists, the workflow offers to use existing map or refresh it | ✓ VERIFIED | Step 3a (lines 86-103): `has_codebase_map` true → AskUserQuestion with "Use existing" / "Refresh map" options |
| 2 | When user has a codebase map, existing capabilities from the codebase appear as Validated requirements in PROJECT.md | ✓ VERIFIED | Step 3b (lines 128-145): extracts `codebase_capabilities` from ARCHITECTURE.md/STACK.md. Step 7 (lines 401-421): PROJECT.md template has `{If codebase_capabilities is not empty}` → Validated section with `✓ [cap] — existing` items |
| 3 | Validated capabilities propagate to REQUIREMENTS.md as pre-satisfied items that don't get roadmap phases | ✓ VERIFIED | Step 11b (lines 1054-1058): Validated items get checked status `[x]`, N/A phase, "Validated" status. Step 11c template (lines 1088-1134): shows `{If Validated items exist}` → `CAT-01 | N/A | Validated` in traceability table |
| 4 | Codebase map context is fed to research agents so they investigate relative to what already exists | ✓ VERIFIED | All 4 researcher prompts (lines 725-737, 771-783, 817-829, 863-875) have `{If codebase_context_files is not empty}` blocks injecting ARCHITECTURE.md, STACK.md, and "Brownfield: Existing codebase uses..." context |
| 5 | When user declines mapping (Skip), the workflow proceeds as greenfield without blocking | ✓ VERIFIED | Step 3a alt (line 122): `"Skip mapping"` → sets `codebase_capabilities` and `codebase_context_files` to empty lists, continues to Step 4 |
| 6 | After research completes, spec assumptions are compared against research findings | ✓ VERIFIED | Step 10f (lines 931-952): reads PROJECT.md + all 4 research files, identifies contradictions across 4 categories (tech choice, deprecated deps, architectural mismatch, feasibility) |
| 7 | Major contradictions (high impact + high confidence) pause the pipeline for user input | ✓ VERIFIED | Step 10g (lines 966-992): major contradictions → AskUserQuestion per contradiction with spec quote + research finding side-by-side. Classification at line 951: major = high impact AND high confidence → "blocks pipeline" |
| 8 | Minor contradictions are noted as flags in PROJECT.md Key Decisions table without blocking | ✓ VERIFIED | Step 10g (lines 958-964): minor contradictions → add as Key Decisions flag with `Research disagrees:` rationale and `⚠️ Revisit` outcome, continue without blocking |
| 9 | User can resolve major contradictions by choosing: Keep spec / Accept research / Custom answer | ✓ VERIFIED | Step 10g (lines 985-992): three options — "Keep spec", "Accept research", "Custom" with freeform text input for Custom |
| 10 | Custom resolutions update PROJECT.md and flow through to requirements | ✓ VERIFIED | Step 10h (lines 1012-1018): Custom → updates PROJECT.md with user's answer, updates Key Decisions table with `— Custom` outcome, and "If this changes a requirement, update the requirement text" |
| 11 | Resolved contradictions ripple into REQUIREMENTS.md when they change a requirement | ✓ VERIFIED | Step 10h lines 1010, 1018: both "Accept research" and "Custom" paths include "If this changes a requirement in the Active list, update the requirement text to reflect the new choice" |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/workflows/new-project-from-spec.md` | Brownfield-aware spec-from-file workflow with codebase capability merging | ✓ VERIFIED | 1331 lines. Contains Step 3/3a/3b (brownfield detection + capability extraction), Step 7 (Validated in PROJECT.md), Step 10c (researcher context injection), Steps 10f/10g/10h (contradiction surfacing + resolution), Step 11b/11c (Validated propagation to REQUIREMENTS.md) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Step 3 (Brownfield Offer) | Step 7 (PROJECT.md generation) | `codebase_capabilities` variable passed through | ✓ WIRED | Step 3b stores `codebase_capabilities` (line 136). Step 7 uses `{If codebase_capabilities is not empty}` (lines 405, 420, 452) to conditionally populate Validated section |
| Step 7 (Validated requirements) | Step 11 (REQUIREMENTS.md) | Validated items from PROJECT.md flow into requirements as pre-satisfied | ✓ WIRED | Step 11b point 2 (line 1054): "Include Validated capabilities from PROJECT.md". Step 11c template (lines 1088-1089): shows checked items `[x]`. Traceability table (line 1122): `N/A | Validated` |
| Step 3 (codebase map context) | Step 10 (research agents) | `codebase_context_files` added to researcher `files_to_read` blocks | ✓ WIRED | Step 3b stores `codebase_context_files` (line 138). All 4 researchers have conditional `{If codebase_context_files is not empty}` blocks (lines 735-737, 781-783, 827-829, 873-875) with ARCHITECTURE.md and STACK.md |
| Step 10 (research completion) | Step 10.5 (validation) | Research findings compared against spec assumptions | ✓ WIRED | Step 10f (lines 931-938) reads PROJECT.md + all 4 research files. 4 contradiction categories defined (lines 942-945). Positioned after 10e (research completion) and before Step 11 |
| Step 10.5 (resolved contradictions) | Step 7 (PROJECT.md updates) | Custom resolutions update Key Decisions table | ✓ WIRED | Step 10h: "Keep spec" → Key Decisions `— Confirmed` (line 1002). "Accept research" → updates PROJECT.md + Key Decisions `— Updated` (lines 1005-1009). "Custom" → updates PROJECT.md + Key Decisions `— Custom` (lines 1013-1017) |
| Step 10.5 (contradiction resolutions) | Step 11 (REQUIREMENTS.md) | Resolved contradictions may change requirement wording | ✓ WIRED | Step 10h line 1010: "If this changes a requirement in the Active list, update the requirement text". Line 1018: "If this changes a requirement, update the requirement text" |

### Requirements Coverage

| Requirement | Status | Supporting Evidence |
|-------------|--------|---------------------|
| BRWN-01: Workflow detects existing code and offers codebase mapping before initialization | ✓ SATISFIED | Step 3 three-branch detection: existing map (3a, line 88), no map but code (3a alt, line 107), greenfield (3a greenfield, line 126) |
| BRWN-02: Existing codebase capabilities become Validated requirements in PROJECT.md | ✓ SATISFIED | Step 3b capability extraction (lines 130-138), Step 7 Validated section in PROJECT.md (lines 401-421), Step 11b/11c propagation to REQUIREMENTS.md (lines 1054-1058, 1088-1134) |
| PIPE-07: Workflow validates spec assumptions against research findings and surfaces contradictions | ✓ SATISFIED | Steps 10f/10g/10h (lines 931-1029): 4 categories, major/minor classification, user resolution options, ripple to PROJECT.md and REQUIREMENTS.md |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none found) | — | — | — | No stub patterns, TODOs, placeholders, or empty implementations detected |

### Human Verification Required

### 1. Brownfield Detection Flow
**Test:** Run `/gsd:new-project-from-spec` in a directory that has a `.planning/codebase/` map from a prior `/gsd:map-codebase` run
**Expected:** Step 3a triggers with "Use existing" / "Refresh map" options. Choosing "Use existing" populates Validated requirements in PROJECT.md
**Why human:** Three-branch detection depends on `gsd-tools.cjs init` returning correct JSON flags; can't verify the runtime init behavior statically

### 2. Contradiction Surfacing with Real Research
**Test:** Provide specs with a known-conflicting tech choice (e.g., spec says "use Express.js" when research would recommend Hono/Elysia), run through full pipeline
**Expected:** Step 10f detects the contradiction, Step 10g presents it with spec quote + research finding, user gets Keep/Accept/Custom options
**Why human:** Contradiction detection depends on actual research agent output, which varies per run. Can't verify the cross-referencing logic produces useful results without real data

### 3. Requirement Text Updates After Resolution
**Test:** Choose "Accept research" for a contradiction that directly changes a requirement (e.g., database technology)
**Expected:** PROJECT.md Active requirement text updates, REQUIREMENTS.md requirement text reflects the change
**Why human:** The ripple propagation is instruction-based ("If this changes a requirement, update the requirement text") — verifying it actually works requires observing real execution

### Gaps Summary

No gaps found. All 11 observable truths verified. All key links are wired. All three requirements (BRWN-01, BRWN-02, PIPE-07) satisfied.

The workflow file at 1331 lines contains substantive, detailed instructions for:
- Three-branch brownfield detection (existing map, needs map, greenfield)
- Codebase capability extraction and Validated requirement propagation through PROJECT.md and REQUIREMENTS.md
- Codebase context injection into all 4 research agent prompts
- Spec-vs-research validation with 4 contradiction categories
- Major/minor classification with user resolution (Keep/Accept/Custom)
- Resolution ripple into both PROJECT.md Key Decisions and REQUIREMENTS.md requirement text

The success criteria section (lines 1304-1330) and purpose section (lines 1-18) were updated to reflect brownfield and validation capabilities.

---
*Verified: 2026-02-22T09:30:00Z*
*Verifier: Claude (gsd-verifier)*
