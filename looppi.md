# Loop agent operating plan

This document defines the operating rules for Codex task work started with `/goal` or `/loop`. It is not executed by the weather-agent CLI verifier.

## Task selection and scope

1. Read `TASKS.md` and select the highest-priority open task. `In progress` takes precedence over `Todo` at the same priority.
2. Work on one selected task only. Stop after the task reaches a terminal result; do not automatically begin the next task.
3. If the task specification is unclear, clarify it before implementation. Update the relevant specification only when the clarification is within the approved MVP scope.
4. Record potentially useful but unapproved features in `INBOX.md`. Do not implement them.

## One loop iteration

1. Add or correct a focused automated test before implementation when behavior changes.
2. Implement the selected task with the smallest justified change.
3. Run the relevant tests and fix reproducible failures.
4. Audit the finished change against this checklist:
   - TypeScript checking passes when TypeScript changed.
   - Relevant automated tests pass.
   - Validation, privacy, and data-handling boundaries remain intact.
   - The change is limited to the selected task.
   - No dependency is added without a task-specific justification.
   - The applicable acceptance criteria in `specs/diary.md` are met.
5. Browser verification belongs to a separate UI test workflow. The weather-agent CLI verification mode must not test the Diary browser UI.
6. Mark the task `Done` in `TASKS.md` only after its required audit and applicable verification have passed. Otherwise keep its status unchanged and report the blocker.

## Test-data and privacy boundaries

- Do not delete, edit, or create records in the user's Diary database.
- Use only a separate temporary test database and fictional test data for browser or end-to-end testing. The weather CLI verification mode does not access a Diary database.
- Do not read, write, rename, print, or otherwise access `.env`, `.env.local`, or other environment-setting files or their values. Do not modify `.env.example` unless a separately approved task requires it.
- Keep the weather agent's primary tests deterministic. A live Open-Meteo lookup is optional and must be reported separately from the deterministic test result.

## Runtime state

When `/loop` is used, its task conversation must report the following state after each completed invocation:

- current loop number;
- iteration start and finish times;
- selected task identifier;
- test and audit results;
- most recent error;
- consecutive-error count; and
- terminal stop reason.

Do not include diary content, secrets, or environment-variable values in the report.

## Guardrails and stopping rules

- Run at most two iterations per invocation.
- Stop an iteration after 15 minutes and record an `timeout` error.
- Stop the invocation after two consecutive errors.
- Classify failures as `test_failure`, `service_start_failure`, or `timeout`.
- Do not queue skipped or overdue iterations.
- Stop immediately after the selected task is completed and verified.

## Reporting

At the end of every invocation, report the selected task, completed work, verification results, iteration count, remaining blockers, and stop reason. Do not report unverified work as complete.
