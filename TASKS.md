# Implementation tasks

This file tracks implementation work for the approved single-user MVP. It is a worklist, not a product specification: `specs/diary.md` remains the source of truth for product behavior and acceptance criteria.

## Working rules

- Keep at most one task `In progress`.
- Mark a task `Done` only after its relevant verification has passed.
- Add new MVP work here before implementation. Add deferred ideas to `INBOX.md` instead.
- Keep implementation commits focused. Reference the task identifier in a commit message when practical.
- Open tasks use `Priority: High`, `Priority: Medium`, or `Priority: Low`. A loop agent selects the highest-priority open task; `In progress` takes precedence over `Todo` at the same priority.

## T-01 - Bootstrap the application

Status: Done

Completed:

- React, Vite, Express, TypeScript, Vitest, and React Testing Library are configured.
- `dev`, `dev:api`, `dev:web`, `test`, and `test:watch` npm scripts are available.
- The local API and Vite development server bind to loopback only.
- TypeScript checking is available with `npx tsc`.

Verification:

- `npm run dev`, `npm test`, and `npx tsc` work.
- Server-start tests verify loopback-only binding.

## T-02 - Implement the diary domain and validation

Status: Done

Completed:

- The diary-entry model, controlled clock and ID boundaries, validation rules, and tag normalization are implemented.
- Entry content is handled as plain text.

Verification:

- Deterministic domain and application tests cover AC-03, AC-04, AC-05, AC-14, and AC-18.

## T-03 - Add SQLite persistence and migrations

Status: Done

Completed:

- SQLite storage is created under the ignored `data/` directory.
- A versioned initial migration, Drizzle schema, and SQLite repository are implemented.
- Data read from persistence is validated before application use.

Verification:

- Repository integration tests cover create, read, update, delete, ordering, missing entries, and persistence across reopen.
- `.gitignore` excludes the database and its sidecar files.

## T-04 - Implement diary application services

Status: Done

Completed:

- Create, list, read, update, and delete use cases use the repository boundary.
- Updates preserve `id` and `createdAt` and change `updatedAt` only after a successful update.
- Missing-entry and persistence-failure results are intentional and non-sensitive.

Verification:

- Controlled unit tests cover AC-02, AC-06, AC-07, AC-08, AC-11, AC-13, and AC-17.

## T-05 - Implement the local HTTP API

Status: Done

Completed:

- The local API implements diary CRUD endpoints and validates request payloads at the API boundary.
- Expected failures map to non-sensitive responses.
- API error paths do not log diary titles, content, or tags.

Verification:

- API integration tests cover success, validation failures, missing entries, persistence failures, and AC-19 privacy behavior.

## T-06 - Build browse and read views

Status: Done

Completed:

- The entry list, empty state, loading states, retry states, detail view, and not-found state are implemented.
- Diary content and tags are rendered as text.

Verification:

- Component tests cover AC-01, AC-06, AC-07, AC-13, AC-15, and AC-18.

## T-07 - Build create and edit flows

Status: Done

Completed:

- New-entry and edit forms provide field validation, local-date defaults, and success feedback.
- Failed validation and failed creation preserve entered values; a failed creation can be retried from the same form.
- Editing can be cancelled without persisting changes.

Verification:

- Component and application tests cover AC-02, AC-03, AC-04, AC-05, AC-08, AC-09, AC-14, AC-15, and the save portion of AC-17.

## T-08 - Build the deletion flow

Status: Done

Completed:

- A semantic destructive-action confirmation dialog identifies the target entry.
- Deletion requires confirmation and provides success or non-sensitive error feedback.

Verification:

- Component, application, and API tests cover AC-10, AC-11, AC-12, AC-13, AC-15, and the deletion portion of AC-17.

## T-09 - Accessibility, desktop layout, and privacy review

Status: Todo

Priority: High

Completed:

- Form controls have programmatic labels and validation associations.
- Automated component coverage verifies keyboard focus after CRUD actions, cancellation, validation failures, and error recovery.
- API tests verify that failed operations do not log sensitive diary fields.

Remaining:

- Manually verify all primary workflows at 1024 px and 1280 px without horizontal scrolling to complete AC-21.

## T-10 - Final verification and handoff

Status: Todo

Priority: Medium

Scope:

- Add linting and production-build commands.
- Run the full test suite, type checking, linting, and production build.
- Confirm every acceptance criterion, including the manual AC-21 verification.
- Keep README and architecture documentation aligned with the final runtime.

Verification:

- All available checks pass.
- Every AC in `specs/diary.md` has automated coverage or documented manual verification.
- The documentation matches the implemented application.

## T-11 - Add the Diary weather agent

Status: Done

Completed:

- Added a separate Python agent with CLI, FastAPI, Flask UI, a standalone JSON tool, a subagent, local memory, a skill document, and deterministic Finnish weather rules.
- Added an Open-Meteo geocoding and historical-weather boundary without API keys or language models.
- Added optional weather location, summary, and source fields to diary entries through a versioned SQLite migration.
- Added the weather lookup to the create and edit forms, including editable results, attribution, removal, loading, and retryable error states.
- Kept diary content out of weather requests and omitted resolved coordinates from persistence.

Verification:

- TypeScript type checking and the full Vitest suite pass.
- Python tests cover the description rules, thresholds, lookup contract, and FastAPI boundary without making network calls and pass on Python 3.13.
- A live lookup through the Python agent and the Diary proxy returned a Finnish Open-Meteo summary for a fictional Helsinki/date example.

## T-12 - Cancel creation and verify weather in existing entries

Status: Done

Completed:

- Added Cancel creation to discard a new draft and return focus to the new-entry action.
- Confirmed that the existing edit form supports fetching and saving weather for entries without prior weather metadata.
- Added application tests for cancellation in empty and populated diaries, weather updates, and failed weather lookup followed by cancellation.

Verification:

- All 62 targeted App, DiaryBrowser, DiaryList, and NewEntryForm tests pass; `npx tsc` passes.
- Browser checks confirm draft cancellation without saving, keyboard focus restoration, and successful weather lookup and saving while editing a previously saved fictional entry.

## T-13 - Add the safe Diary loop CLI agent

Status: Done

Priority: High

Scope:

- Add a deterministic CLI orchestrator that selects the highest-priority open task and records local loop state atomically.
- Enforce at most two iterations, a 15-minute iteration limit, and stopping after two consecutive errors.
- Keep the CLI read-only with respect to Diary data, task status, and environment files.
- Run only explicit local verification commands; do not test the Diary browser UI.

Verification:

- Python tests cover task selection, priority validation, atomic state writing, and guardrails.
- CLI planning and status commands run without reading environment settings or modifying Diary data.

Completed:

- Added the local `diary-loop-agent` CLI, its atomic JSON state store, task selection, guardrails, and deterministic verification runner.
- Added agent tests, usage documentation, and registration in the shared agent catalog.

## T-14 - Fix the Diary loop agent Windows command launcher

Status: Done

Priority: High

Scope:

- Make the CLI verification runner invoke `npm.cmd` and `npx.cmd` on Windows.
- Add a regression test for Windows and non-Windows command selection.

Verification:

- The loop-agent Python tests pass.
- A one-iteration `--verify` run reaches the browser-verification blocker instead of failing to start npm.

Completed:

- Added Windows-specific `npm.cmd` and `npx.cmd` selection to the verification runner.
- Added regression coverage and verified the CLI runs the full JavaScript test suite and TypeScript check before reporting the browser blocker.

## T-15 - Focus CLI verification on the weather agent

Status: Done

Priority: High

Scope:

- Make `--verify` run the weather-agent tests and a fictional local HTTP weather lookup only.
- Remove browser verification from the CLI weather-check path.

Verification:

- The loop-agent Python tests cover successful weather verification without a browser.
- A CLI `--verify` run returns `weather_verified` after the local weather lookup succeeds.

Completed:

- Changed CLI verification to run only weather-agent tests and a fictional local weather lookup.
- Removed browser verification from the CLI weather-check path.

## T-16 - Separate Codex task loops from weather CLI verification

Status: Done

Priority: High

Scope:

- Keep `looppi.md` as the operating rules for Codex `/goal` and `/loop` task work.
- Remove task selection and generic task verification from the weather CLI agent.
- Preserve the documented guardrails independently in the Codex workflow and weather verification CLI.

Verification:

- CLI tests cover weather verification and its guardrails without task-list parsing.
- CLI documentation and `looppi.md` describe separate responsibilities.

Completed:

- Kept `looppi.md` as the Codex task-work procedure for `/goal` and `/loop`.
- Reduced the CLI agent to weather-agent verification only, with independent local state and guardrails.
