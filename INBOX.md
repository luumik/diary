# Product inbox

This file collects ideas and capabilities that are intentionally outside the current single-user MVP. Items in the inbox are not committed work, are not ordered by priority, and must not be implemented unless they are moved into an approved specification.

The current MVP scope and acceptance criteria are defined in `specs/diary.md`.

## How to use this inbox

- Add an item when an idea should be preserved but is not part of the current MVP.
- Keep descriptions focused on the user need rather than a predetermined implementation.
- Before implementation, clarify the requirements, risks, dependencies, migration needs, and acceptance criteria.
- Move an accepted item into a versioned or feature-specific specification instead of treating this file as implementation instructions.
- Update `specs/diary.md` and `AGENTS.md` when an accepted item changes the product scope or permanent engineering constraints.

## Identity and multi-user support

### User accounts and authentication

Allow people to create an account and sign in securely.

Consider before implementation:

- authentication method or provider
- account registration and sign-in flows
- session lifecycle and secure cookie settings
- password storage and recovery if passwords are managed by the application
- protection against common authentication attacks

### Entry ownership and authorization

Associate every diary entry with an owner and enforce ownership for every read and write operation on the server.

Consider before implementation:

- adding a user model and an owner reference to entries
- migrating existing single-user entries to the initial account
- preventing enumeration and access to another user's entries
- authorization and migration tests

### Sharing and permissions

Allow selected entries to be shared with other users under explicit permissions.

Consider before implementation:

- read-only versus edit access
- invitation, revocation, and audit behavior
- accidental exposure of private content

## Data portability and resilience

### Export

Allow the user to export diary entries in a documented, portable format.

Possible formats include JSON, Markdown, and PDF. Define how timestamps, tags, and sensitive metadata are represented before implementation.

### Backup and restore

Allow the user to create backups and restore entries without silently overwriting newer data.

Consider integrity validation, duplicate handling, version compatibility, and recovery from a failed restore.

### Cloud synchronization

Synchronize entries between trusted devices after authentication and ownership are available.

Consider conflict resolution, offline changes, encryption, deletion propagation, and operational monitoring that does not expose diary content.

## Finding and organizing entries

### Search

Allow the user to search entry titles, content, and tags.

Privacy implications of search indexes and cached results must be evaluated before implementation.

### Filtering and sorting

Allow entries to be filtered by date range and tags and sorted using supported criteria.

### Richer tag management

Allow tags to be renamed, merged, listed, and removed across entries.

## Entry capabilities

### Markdown or rich-text editing

Support formatted diary content while preserving safe rendering and a reliable storage format.

Sanitization, migrations, accessibility, export behavior, and backward compatibility must be specified first.

### Attachments and images

Allow files or images to be attached to entries.

Consider storage limits, supported file types, malware risks, metadata privacy, deletion, backup, and orphan cleanup.

### Reminders and notifications

Allow the user to schedule private reminders related to diary activity or entries.

Notification content must not reveal sensitive diary information on a locked or shared device by default.

## Operations and deployment

### Secure hosted deployment

Deploy the application beyond the local machine after authentication, authorization, managed persistence, transport security, secrets management, backups, and an operational security review are in place.

### Privacy-preserving observability

Add operational metrics and error reporting without collecting diary titles, content, tags, or other sensitive values.

## Unscheduled ideas

Add newly proposed out-of-scope ideas here until they have enough context for a dedicated section:

- comments or annotations on entries
- collaborative editing
