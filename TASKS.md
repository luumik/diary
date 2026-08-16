# Implementation tasks

This file tracks implementation work for the approved single-user MVP. It is a worklist, not a product specification: `specs/diary.md` remains the source of truth for product behavior and acceptance criteria.

## Working rules

- Keep at most one task `In progress`.
- Mark a task `Done` only after its relevant verification has passed.
- Add new MVP work here before implementation. Add deferred ideas to `INBOX.md` instead.
- Keep implementation commits focused. Reference the task identifier in a commit message when practical.

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

Status: In progress

Completed:

- Form controls have programmatic labels and validation associations.
- Automated component coverage verifies keyboard focus after CRUD actions, cancellation, validation failures, and error recovery.
- API tests verify that failed operations do not log sensitive diary fields.

Remaining:

- Manually verify all primary workflows at 1024 px and 1280 px without horizontal scrolling to complete AC-21.

## T-10 - Final verification and handoff

Status: Todo

Scope:

- Add linting and production-build commands.
- Run the full test suite, type checking, linting, and production build.
- Confirm every acceptance criterion, including the manual AC-21 verification.
- Keep README and architecture documentation aligned with the final runtime.

Verification:

- All available checks pass.
- Every AC in `specs/diary.md` has automated coverage or documented manual verification.
- The documentation matches the implemented application.
