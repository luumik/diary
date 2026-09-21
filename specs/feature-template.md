# Feature: [Name]

## Status

- **State:** Draft
- **Approved by:** Pending
- **Created:** YYYY-MM-DD
- **Related task:** Pending

`Draft` specifications are not implementation authorization. Move an approved feature into `TASKS.md` before implementation.

## Problem statement

[Describe the user problem and why it matters.]

## Current behavior

[Describe verified current behavior and reference relevant product documentation, code, or tests.]

## Proposed behavior

[Describe observable behavior after the change.]

## Non-goals

- [Explicitly excluded behavior]

## Acceptance criteria

### AC-01 — [Descriptive name]

Given [precondition]  
When [action]  
Then [observable result]

### AC-02 — [Error or edge case]

Given [precondition]  
When [failure or boundary condition]  
Then [safe observable result]

## Privacy and security boundaries

- [Sensitive data involved]
- [Trust boundaries and required validation]
- [Permitted external data flow]
- [Logging and error-message constraints]
- [Destructive or high-impact actions requiring confirmation]

## Expected impact area

| Area or file | Expected change |
|---|---|
| `[path or subsystem]` | [Reason for change] |

This table is a forecast, not permission for unrelated changes. Unexpected necessary files must be justified during implementation.

## Persistence and compatibility

- **Schema change:** Yes / No
- **Migration:** [Required migration or N/A]
- **Backward compatibility:** [Assessment]
- **Existing-data behavior:** [Assessment]
- **Rollback or recovery:** [Safe recovery approach]

Never edit an already-applied migration. Test schema changes with a temporary database, not the user's Diary database.

## Failure behavior

| Failure | User-visible behavior | Data integrity requirement |
|---|---|---|
| [Failure case] | [Non-sensitive response] | [What must remain unchanged] |

## Verification strategy

### Automated

- [Unit behavior and relevant edge cases]
- [Integration boundary and failure cases]
- [Regression test for a bug, if applicable]

### Manual

- [Only behavior that materially requires manual or visual verification]

### Required commands

- [Existing project command]

Do not invent unavailable scripts. Tests must use fictional data, controlled time where needed, temporary persistence, and no live network unless explicitly separated and approved.

## Documentation impact

- [Documents that must change if implementation is approved]

## Open questions

- [Decision that must be resolved before approval]

## Readiness checklist

- [ ] The problem and proposed behavior are unambiguous.
- [ ] Acceptance criteria cover success and relevant failure paths.
- [ ] Non-goals prevent accidental scope expansion.
- [ ] Privacy, logging, and external-data boundaries are explicit.
- [ ] Migration and compatibility effects are assessed.
- [ ] Verification maps to behavior rather than only a coverage percentage.
- [ ] Open questions are resolved.
- [ ] The feature has explicit approval and an implementation task.
