# Architecture decisions

## Implemented MVP stack

The single-user MVP uses the following stack:

- React with Vite and TypeScript for the browser UI
- Express on Node.js for the local HTTP API
- SQLite for durable local persistence
- Drizzle ORM and versioned migrations for schema access and change management
- Zod for validation of untrusted and persisted data
- Vitest and React Testing Library for automated tests

## Rationale

The project needs a browser interface and durable local storage without the operational complexity of a hosted service. SQLite is well suited to a private, local single-user MVP and supports a migration path for the future user and entry-ownership schema. Separating the React UI, Express API, application logic, and repository layer keeps authentication and multi-user support out of the MVP without making a later change unnecessarily disruptive.

## Local access boundary

The MVP server must bind only to a loopback interface during local use. It has no authentication and must not be exposed to a LAN, public address, tunnel, or reverse proxy.

## Implemented layout

The implementation keeps these responsibilities separate:

- `src/features/diary/`: browser components, domain rules, application services, and persistence implementation
- `src/features/diary/domain/`: input validation and tag normalization
- `src/features/diary/application/`: create, list, read, update, and delete use cases
- `src/features/diary/infrastructure/`: SQLite repository, Drizzle schema and migration, and browser API client
- `src/server/`: HTTP API factory and loopback-only local server startup
- `src/App.tsx` and `src/main.tsx`: browser composition and application startup

Dependencies flow inward: UI and API code may depend on application services; application services use the repository boundary; repositories are not used directly by UI components.

## Local runtime

- The Express API binds only to `127.0.0.1` on port `3000`.
- Vite binds only to `127.0.0.1` and proxies `/api` requests to the API.
- The local server creates `data/` as needed and stores the SQLite database at `data/diary.sqlite`.
- The initial diary-entry schema is applied through a versioned migration when the repository opens the database.

## Future compatibility

The MVP will not contain a user model, authentication, or authorization. A later multi-user version can add a user context to application services, a user table, an entry-owner reference, and server-side ownership checks through a database migration.
