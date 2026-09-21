# Continuous integration policy

## Status

Draft — no CI or deployment pipeline currently exists. This document defines a proposed CI contract only. It does not authorize pipeline implementation, repository-setting changes, releases, or deployment. Implementation requires an approved task in `TASKS.md`.

Continuous deployment remains outside the local single-user MVP. Define CD separately only after a deployment target, authentication, authorization, managed persistence, backup, transport security, and operational review are approved.

## Goals

- Reproduce the project's deterministic verification in a clean environment.
- Prevent unverified changes from being treated as merge-ready.
- Keep real diary data, secrets, and live external services out of CI.
- Run with the minimum repository and platform permissions.

## Proposed triggers

- Pull requests targeting the default branch.
- Pushes to the default branch.
- Optional manual dispatch for troubleshooting, with the same permissions and data restrictions.

Scheduled execution, release triggers, and deployment triggers are not part of this draft.

## Proposed environment

- Use pinned, supported Node.js and Python versions consistent with `README.md` and the lockfiles.
- Install JavaScript dependencies with `npm ci`.
- Install Python dependencies from the committed requirements files.
- Use an ephemeral runner and temporary test storage.
- Do not mount or restore a real `data/` directory.

## Proposed required checks

1. `npm test`
2. `npx tsc --noEmit`
3. `npm run test:weather`
4. `python -m pytest agents/diary-loop-agent/tests -q`
5. Linting after an approved task adds a lint script.
6. Production build after an approved task adds and documents a build script.

The final workflow must use scripts actually defined by the project. Missing lint or build scripts are implementation gaps, not commands CI may invent silently.

## Test and network boundaries

- Use only fictional fixtures and temporary databases.
- Tests must not read, copy, migrate, or modify a real Diary database.
- Deterministic test jobs must not call Open-Meteo or other live services.
- Dependency installation is distinct from test-time network access.
- Any future live integration check must be optional, separately reported, rate-limited, and unable to block deterministic verification unless explicitly approved.

## Permissions and secrets

- Default workflow permissions to repository-content read access.
- Do not grant package publication, release, deployment, issue-write, pull-request-write, or repository-administration permissions unless a separately approved workflow requires the minimum specific permission.
- Do not expose repository secrets to untrusted pull-request code.
- Do not print tokens, environment values, diary content, weather locations, or user-entered values.
- CI must not commit, push, merge, tag, publish, release, or deploy.

## Artifacts and logs

- Retain only non-sensitive test or build diagnostics needed to investigate failures.
- Never upload SQLite databases, `.env` files, local agent memory, coverage fixtures containing user data, or raw logs with request payloads.
- Define retention periods before enabling artifact upload.

## Merge gate

When CI is implemented, every required deterministic check must pass before merge. A human may review an infrastructure outage or explicitly approved exception, but tests must not be weakened or skipped merely to obtain a green result.

Branch protection and required-check settings are external repository changes and require explicit user authorization.

## Supply-chain considerations

- Keep lockfiles committed and use reproducible installation commands.
- Pin third-party workflow actions to reviewed immutable revisions when practical.
- Dependency vulnerability scanning requires a separate policy for network access, update cadence, false positives, and failure thresholds.
- Do not automatically update dependencies or create pull requests unless explicitly approved.

## Future CD boundary

A future CD specification must separately define environments, identities, approvals, artifacts, database migration and backup order, rollback, observability, incident handling, and protection of private diary data. CI success alone must never authorize deployment.
