# Diary

Diary is a local, single-user web application for creating, reading, updating, and permanently deleting private diary entries.

The current product scope and acceptance criteria are defined in [specs/diary.md](specs/diary.md). Deferred ideas are collected in [INBOX.md](INBOX.md).

## Status

The project is in its planning and bootstrap stage. Application source code and runnable development scripts have not been created yet.

## Selected technical direction

- Frontend: React, Vite, and TypeScript
- Local server: Node.js and Express
- Persistence: SQLite with Drizzle ORM and versioned migrations
- Validation: Zod at the application boundary
- Testing: Vitest, React Testing Library, and integration tests for persistence behavior
- Runtime scope: local loopback access only; do not expose the unauthenticated MVP to an untrusted network

These choices are intentionally lightweight for the single-user MVP while preserving a clear path to future authentication and entry ownership.

## Prerequisites

- A current Node.js LTS release
- npm

## Planned commands

The bootstrap task will add these npm scripts:

- `npm run dev` — start the local development server
- `npm test` — run tests
- `npm run typecheck` — run TypeScript type checking
- `npm run lint` — run linting
- `npm run build` — create a production build

Until that task is complete, the placeholder `npm test` script is expected to fail and no development server is available.

## Local data

The application will store its SQLite database under `data/`. The directory is intentionally ignored by Git because diary entries are private. Backup and restore are not part of the current MVP.

## Development rules

Read [AGENTS.md](AGENTS.md) before making changes. It defines coding, privacy, testing, and architecture requirements for this repository.
