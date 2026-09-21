# Agent workflows

This document provides focused procedures for AI-assisted work in Diary. Read only the workflow relevant to the current request. These procedures supplement `AGENTS.md`, `specs/diary.md`, `TASKS.md`, and `looppi.md`; they do not expand product scope or agent permissions.

## Workflow selection

| Request | Workflow |
|---|---|
| Explain, investigate, or compare without changing behavior | Research |
| Define a newly approved feature or major behavior change | Specification |
| Implement an approved change | Development |
| Diagnose a reported failure | Diagnosis and fix |
| Review existing changes without implementing fixes | Review |
| Decide whether completed work satisfies its contract | Final audit |

Do not narrate this classification unless it helps the user. A request can use more than one workflow, but each workflow retains its own authorization boundary: a request to review or diagnose does not authorize implementation.

## Research

Use research to understand a question or establish evidence before planning.

1. Read the product specification and the smallest set of relevant architecture, source, and test files.
2. Check the working tree so user work is not mistaken for baseline behavior.
3. Trace the relevant behavior from entry point through application and persistence boundaries.
4. Use external documentation only when the question requires current or authoritative information. Prefer primary sources and do not send diary data, secrets, or repository content to external services.
5. Separate verified facts, inferences, and unresolved questions.
6. Report the conclusion and supporting evidence. Do not modify files or external systems unless the user requested a change.

Documentation gaps do not prohibit code inspection. Treat undocumented behavior as something to verify from code and tests, not as an intended contract.

## Specification

Use a feature specification for a newly approved feature, API or schema contract change, architectural change, or multi-subsystem behavior change. Minor documentation, configuration, and mechanical changes usually do not need a separate feature specification.

1. Confirm that the requested behavior is approved rather than merely listed in `INBOX.md`.
2. Start from `specs/feature-template.md` and remove sections that genuinely do not apply.
3. Ground current behavior in existing product documentation, code, and tests.
4. Define observable acceptance criteria, non-goals, privacy boundaries, failure behavior, migration implications, and verification.
5. Treat the expected impact area as a forecast, not an inflexible file allowlist.
6. Leave the specification in `Draft` until the user or an established approval process accepts it.

An implementation agent must not weaken or rewrite an approved requirement merely to make an implementation pass. Material ambiguity or scope expansion requires user direction.

## Development

1. Read the approved specification or task and the relevant source and tests.
2. Check the working tree and preserve unrelated changes.
3. Make the smallest coherent change that satisfies the requested behavior.
4. Add or update tests when behavior changes. For a bug, add a regression test that fails without the fix whenever practical.
5. Use test-first development when it clarifies domain behavior or reproduces a bug. Documentation, mechanical refactoring, and configuration changes do not require artificial failing tests.
6. Run targeted checks during implementation and the relevant complete checks before handoff.
7. Update documentation that became inaccurate because of the change.
8. Report unexpected files outside the forecast impact area and explain why they were necessary.

Do not mark an approved specification `Done` until its acceptance criteria and required verification pass. The implementing agent may report readiness, but it must not silently change the approval standard.

## Diagnosis and fix

A diagnosis request authorizes investigation, not implementation. Apply a fix only when the user requested one or the task clearly includes repair.

1. Reproduce or otherwise establish the failure with the least invasive method.
2. Form one or two concrete hypotheses and test them against evidence.
3. Prefer tests, existing diagnostics, and non-sensitive metadata over temporary logging.
4. Never log diary values, weather locations, secrets, environment values, or database contents.
5. When authorized, implement the smallest root-cause fix and add regression coverage where practical.
6. Run relevant checks and distinguish the fixed cause from unrelated failures.

After three unsuccessful fix-and-verify cycles for the same cause, stop and request direction. Do not broaden scope or weaken tests to force a pass.

## Review

Review is read-only unless the user also requests changes. Inspect the requested diff, branch, or files and prioritize findings by impact.

Review in this order:

1. Product-specification and acceptance-criteria compliance.
2. Privacy, sensitive-data handling, trust-boundary validation, and external data flow.
3. Correctness, failure paths, deletion behavior, and compatibility.
4. Architecture boundaries and migration safety.
5. Test quality and missing behavioral coverage.
6. Accessibility and usability where the change affects UI behavior.
7. Documentation drift and operational assumptions.

Each actionable finding should identify the affected file and narrow line range, explain the concrete failure scenario, and state the expected correction. Do not inflate severity based only on style preference. If there are no actionable findings, say so and state any residual verification gaps.

Coverage percentage is supporting information, not proof of correctness. Prefer direct evidence that acceptance criteria, invariants, and relevant error paths are tested.

Dependency vulnerability scans may require network access and can change over time. Run them only when relevant and permitted, and report them separately from deterministic tests.

## Final audit

Use final audit after implementation, before marking an approved task complete.

1. Verify each applicable acceptance criterion with code, test, or documented manual evidence.
2. Confirm the change stayed within approved scope and explain necessary deviations.
3. Confirm relevant tests and TypeScript checks passed; report checks that could not run.
4. Confirm real diary data, environment files, secrets, and live network services were not used unexpectedly.
5. Confirm migrations are additive, versioned, and tested with a temporary database when schema changed.
6. Confirm documentation and task status match verified reality.
7. Inspect the final diff for unrelated changes and sensitive artifacts.

Use one verdict:

- `PASS`: required behavior and verification are complete.
- `REQUIRES ADJUSTMENT`: bounded corrective work remains.
- `FAIL`: a requirement, safety boundary, or required verification is not satisfied.

A failed audit may return to development at most three times for the same task before requiring human direction. Never report unverified work as complete.

## Tool gates

### Before a tool action

Require explicit user authorization for operations that push commits, publish releases, deploy services, create tunnels, expose a non-loopback port, access real diary data, inspect secret files, or materially delete user data. Follow environment approval prompts for sandbox escalation and dependency downloads.

### After a tool action

Check the exit status, inspect relevant output without exposing sensitive values, and verify that no unexpected file, data, network, or external-system change occurred. A successful command does not prove the requested behavior works.

### Completion gate

Before claiming completion, verify the applicable acceptance criteria, checks, documentation, and final diff. State failures and skipped checks explicitly.
