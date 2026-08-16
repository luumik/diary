# AGENTS.md — Diary

## Project purpose

Diary is a single-user TypeScript web application that allows its user to create, read, update, and delete diary entries. Diary entries are private and may contain sensitive information, so data privacy remains a primary requirement.

The current goal is a local single-user MVP. Authentication, user accounts, authorization roles, password management, and multi-user support are explicitly out of scope. Do not add them unless the project requirements are updated.

The project is in its early stages. Do not assume a framework, database, or UI library unless it is present in the source code or project dependencies. Prefer small, well-justified changes and preserve existing decisions unless the task requires changing them.

## Current technical foundation

- TypeScript in strict mode
- Node.js and npm
- Vitest for testing
- ES modules are the target; keep `package.json` and `tsconfig.json` compatible when changing module settings

## Communication

- Respond to the user in Finnish unless they request another language.
- Keep source code, identifiers, comments, commit messages, and technical documentation in English.

## Instructions for agents

1. Before making changes, read at least `package.json`, `tsconfig.json`, `specs/diary.md`, and the source and test files relevant to the task.
2. Check the working tree before making broad changes. Do not remove or overwrite the user's work in progress.
3. Implement only the requested change. Avoid unrelated refactoring and new dependencies unless there is a clear need.
4. Update tests whenever behavior changes.
5. Run the checks relevant to the change and report what you ran and whether it passed.
6. If a required npm script has not been defined, do not claim to have run it. Add the script only when doing so is within the scope of the task.

## Architecture and future compatibility

- Keep the UI, application logic, and persistence layer separate.
- Use stable, globally unique identifiers for diary entries.
- Manage database schema changes through migrations.
- Keep authentication and multi-user support outside the MVP.
- Design application and persistence boundaries so that user context and entry ownership can be introduced later without rewriting the core diary functionality.
- Do not hard-code a global current user or add speculative authentication abstractions.
- Treat `specs/diary.md` as the source of truth for product behavior and MVP scope. Update it when requirements change.

## Commands

Prefer scripts defined in `package.json`. During the project's early stages, not all of the following scripts may be available:

- `npm test` — run tests
- `npm run lint` — run linting when the script is defined
- `npm run typecheck` — run TypeScript type checking when the script is defined
- `npm run build` — build the application when the script is defined
- `npm run dev` — start the development server when the script is defined

Do not assume `npm run start` is available unless it is defined in `package.json`.

## Coding conventions

- Keep TypeScript `strict` mode enabled.
- Do not use `any`. When an external API returns data of an unknown shape, use `unknown` and validate it before use.
- Define domain models clearly, including diary entries and tags. Do not introduce a user model while the application remains single-user. Avoid duplicating the same data structure unnecessarily.
- Prefer small, focused functions and descriptive names.
- Keep the user interface, application logic, and data persistence separate.
- Handle dates consistently. Store timestamps in UTC using ISO 8601 and format them in the user's time zone only in the UI.
- Validate all data from external sources at the server or another trust boundary. Client-side validation alone is not sufficient.
- Handle errors intentionally. Do not swallow exceptions or expose unnecessary implementation details to users.
- Add comments only when they explain a decision or a non-obvious reason; do not narrate self-explanatory code.

## Privacy and security

- Treat all diary entries as private even though the MVP has no authentication.
- The MVP is intended for local, single-user use. Document that it must not be exposed directly to an untrusted network in this form.
- Do not log diary content or other sensitive information.
- Do not add secrets, real personal information, or production data to source code, tests, example files, or version control.
- Use clearly fictional data in tests.
- Prevent stored XSS: do not render user-provided content as unprocessed HTML.
- Use parameterized database queries or safe ORM interfaces.
- Test data-deletion behavior carefully because deleted diary content may not be recoverable.
- When adding an environment variable, update a safe example file, but never add a real `.env` file or secret value.

## Testing requirements

- Use Vitest and name test files `*.test.ts` or `*.test.tsx`.
- Keep unit tests close to the code under test unless the project later establishes another convention.
- For every changed behavior, test at least the successful path and the relevant error or edge cases.
- For data-access behavior, verify create, read, update, delete, missing-entry, and invalid-input cases.
- Tests must be deterministic. Do not depend on the actual current time, the network, or shared external state without a controlled substitute.
- When fixing a bug, add a regression test that fails without the fix whenever practical.

## Definition of done

A change is complete when:

- the requested behavior works and the change is limited to the task
- TypeScript type checking passes when the project provides a command for it
- relevant tests pass
- linting and the build pass when their scripts are available
- new configuration or usage is documented when needed
- no sensitive data or secrets have been introduced

## Do not

- Do not bypass type errors with `any`, `@ts-ignore`, or unnecessary type assertions.
- Do not add authentication, user accounts, authorization roles, or multi-user behavior to the current MVP.
- Do not skip input validation at the application's trust boundary.
- Do not send diary content to analytics or print it in debug logs.
- Do not add a dependency for a trivial helper function.
- Do not edit generated files or the `node_modules` directory.
- Do not make a breaking database-schema change without a migration and a compatibility assessment.
