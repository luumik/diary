# Architecture decisions

## Initial MVP stack

The single-user MVP will use the following stack:

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

## Planned layout

The bootstrap implementation should keep these responsibilities separate:

- UI components and routes: browser-facing rendering and interaction
- API routes: HTTP parsing and response mapping
- application services: diary use cases and business rules
- repositories: persistence operations only
- migrations: versioned database schema changes

The exact directory names may be selected during bootstrap, but dependencies must flow inward: UI and API code may depend on application services; application services may depend on repository interfaces; repositories must not be used directly by UI components.

## Future compatibility

The MVP will not contain a user model, authentication, or authorization. A later multi-user version can add a user context to application services, a user table, an entry-owner reference, and server-side ownership checks through a database migration.
