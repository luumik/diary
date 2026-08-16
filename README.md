# Diary

Diary is a local, single-user diary application for creating, reading, updating, and permanently deleting private diary entries. Authentication, user accounts, sharing, and deployment to an untrusted network are deliberately outside the MVP scope.

The current MVP targets desktop and laptop browsers at widths of 1024 px and above. Full phone and tablet responsiveness is deferred to [INBOX.md](INBOX.md).

The product requirements and acceptance criteria are in [specs/diary.md](specs/diary.md). Deferred ideas are collected in [INBOX.md](INBOX.md).

## Current status

The diary domain, persistence layer, application services, local HTTP API, and browser UI are implemented and covered by automated tests. The development command starts a loopback-only Express API with SQLite persistence and a Vite browser server that proxies `/api` requests to it.

Implemented:

- TypeScript domain model, input validation, and tag normalization
- application services for creating, listing, reading, updating, and deleting entries
- SQLite repository with a versioned initial migration and validation when reading stored data
- API factory with these routes:
  - `POST /api/entries`
  - `GET /api/entries`
  - `GET /api/entries/:id`
  - `PUT /api/entries/:id`
  - `DELETE /api/entries/:id`
- React browse, read, create, edit, delete, confirmation, loading, and error-state components
- save-error recovery that keeps the new-entry form and its values available for retry
- browser-to-API integration through a validated HTTP client
- a local development runtime: SQLite at `data/diary.sqlite`, API at `127.0.0.1:3000`, and Vite at `127.0.0.1:5173`
- unit, component, SQLite integration, and API integration tests, including privacy and keyboard-focus coverage

Not yet complete:

- manual desktop and laptop layout verification at 1024 px and 1280 px (AC-21)
- end-to-end browser workflow tests against the local runtime
- lint and production-build scripts

## Technology

- React, Vite, and TypeScript for the browser UI
- Express for the local HTTP API
- SQLite with Drizzle ORM and versioned migrations for persistence
- Zod for API-boundary input validation
- Vitest and React Testing Library for automated tests

The planned runtime is local-only. Because the MVP has no authentication, it must never be exposed through a LAN address, tunnel, reverse proxy, or public network.

## Prerequisites

- A current Node.js LTS release
- npm

## Commands

Install dependencies:

```sh
npm install
```

Run the local development stack:

```sh
npm run dev
```

This starts the Express API at `http://127.0.0.1:3000` and Vite at `http://127.0.0.1:5173`, both on loopback only. Open the Vite address in a browser. The browser forwards `/api` requests to the local API, and the API creates or reuses `data/diary.sqlite`.

Run all automated tests:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

Run TypeScript checking until a dedicated script is added:

```sh
npx tsc --noEmit
```

Linting and production-build commands have not been configured yet, so they must not be assumed to be available.

## Local data and privacy

The local runtime stores its SQLite database under `data/`. That directory and SQLite sidecar files are ignored by Git, because they may contain private diary content.

Do not commit real diary data, secrets, or local database files. Treat all entry titles, content, and tags as sensitive; do not log or send them to analytics.

## Recommended next steps

1. Improve the desktop and laptop visual design without changing the specified product behavior.
2. Manually verify all primary workflows at 1024 px and 1280 px without horizontal scrolling.
3. Add end-to-end browser workflow tests against the local runtime.
4. Add linting and production-build setup, then complete final verification.

## Development rules

Read [AGENTS.md](AGENTS.md) before making changes. It defines the project's privacy, architecture, testing, and coding requirements.
