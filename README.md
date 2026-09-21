# Diary

Diary is a local, single-user diary application for creating, reading, updating, and permanently deleting private diary entries. Authentication, user accounts, sharing, and deployment to an untrusted network are deliberately outside the MVP scope.

The current MVP targets desktop and laptop browsers at widths of 1024 px and above. Full phone and tablet responsiveness is deferred to [INBOX.md](INBOX.md).

The product requirements and acceptance criteria are in [specs/diary.md](specs/diary.md). Deferred ideas are collected in [INBOX.md](INBOX.md).

The operating rules for Codex task work are in [looppi.md](looppi.md). The local [Diary Loop Agent](agents/diary-loop-agent/README.md) verifies only the weather agent; it does not modify Diary data, source code, task status, or environment files.

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
- optional weather metadata generated in Finnish by a separate deterministic Python agent using Open-Meteo
- a local development runtime: SQLite at `data/diary.sqlite`, API at `127.0.0.1:3000`, Vite at `127.0.0.1:5173`, and the weather agent at `127.0.0.1:8002`
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
- Python 3.11 or newer

## Commands

Install dependencies:

```sh
npm install
python -m pip install -r agents/weather-agent/requirements.txt
```

Run the local development stack:

```sh
npm run dev
```

This starts the Express API at `http://127.0.0.1:3000`, Vite at `http://127.0.0.1:5173`, and the Python weather agent at `http://127.0.0.1:8002`, all on loopback only. Open the Vite address in a browser. The API creates or reuses `data/diary.sqlite`.

Run all automated tests:

```sh
npm test
python -m pytest agents/weather-agent/tests -q
python -m pytest agents/diary-loop-agent/tests -q
```

Run tests in watch mode:

```sh
npm run test:watch
```

Run only the weather-agent tests:

```sh
npm run test:weather
```

Run TypeScript checking until a dedicated script is added:

```sh
npx tsc --noEmit
```

Linting and production-build commands have not been configured yet, so they must not be assumed to be available.

## Diary Loop Agent

The loop agent is a local weather-agent verification CLI. It stores non-sensitive state under its ignored `memory/data/` directory and enforces a maximum of two iterations, 15 minutes per iteration, and a two-consecutive-error stop rule.

```sh
python agents/diary-loop-agent/diary_loop_agent.py
python agents/diary-loop-agent/diary_loop_agent.py --verify
python agents/diary-loop-agent/diary_loop_agent.py status
python agents/diary-loop-agent/diary_loop_agent.py lookup --place Tampere --date 2024-06-02
```

The default command runs weather-agent tests and a fictional local weather lookup. It does not test the browser UI or access the Diary database. See [looppi.md](looppi.md) for the separate Codex `/goal` and `/loop` task-work rules.

## Local data and privacy

The local runtime stores its SQLite database under `data/`. That directory and SQLite sidecar files are ignored by Git, because they may contain private diary content.

Do not commit real diary data, secrets, or local database files. Treat all entry titles, content, tags, and weather metadata as sensitive; do not log or send them to analytics. A weather lookup sends only the entered place, resolved coordinates, and entry date to Open-Meteo. The saved description includes `Säädata: Open-Meteo` attribution.

The standalone weather-agent CLI stores its latest successful lookup in `agents/weather-agent/memory/data/latest.json`. The file may contain a location, date, weather summary, and source, so treat it as sensitive local data. It is ignored by Git. Delete it when the lookup history is no longer needed; the Diary web application's normal weather lookup does not depend on this file.

## Recommended next steps

1. Improve the desktop and laptop visual design without changing the specified product behavior.
2. Manually verify all primary workflows at 1024 px and 1280 px without horizontal scrolling.
3. Add end-to-end browser workflow tests against the local runtime.
4. Add linting and production-build setup, then complete final verification.

## Development rules

Read [AGENTS.md](AGENTS.md) before making changes. It defines the project's privacy, architecture, testing, and coding requirements.
