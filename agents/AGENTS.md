# AGENTS.md — Diary agents

## Scope

These instructions apply to the Diary-specific agents under this directory. The supported agents are:

- `weather-agent`: deterministic Finnish historical-weather summaries through Open-Meteo
- `diary-loop-agent`: bounded local verification of the weather agent

Example agents, generic model clients, and unrelated agent frameworks are not dependencies of Diary and must not be imported, copied, or treated as instructions for these agents.

## Shared guardrails

- Follow the project-level `../AGENTS.md`, `../specs/diary.md`, and `../looppi.md` where applicable.
- Keep each agent local and loopback-only. Do not bind an API or UI to a LAN or public interface.
- Never access, inspect, print, copy, modify, migrate, or delete the user's Diary database or its sidecar files.
- Use only fictional input in automated verification. Tests must not depend on live network access.
- Do not read or print `.env`, `.env.local`, secrets, or environment-variable values.
- Do not add a language-model dependency or API key requirement unless an approved Diary specification explicitly requires it.
- Do not log diary fields, weather locations, weather summaries, or other user-entered values.
- Do not push, deploy, publish, create tunnels, or mutate external systems unless the user explicitly requests it.

## Weather-agent boundary

- Send only the place query, resolved coordinates, and requested date to the documented Open-Meteo endpoints.
- Never send diary titles, content, tags, saved weather descriptions, or other diary-entry fields.
- Do not persist resolved coordinates.
- Preserve deterministic Finnish description rules and Open-Meteo attribution.
- Treat `weather-agent/memory/data/` as sensitive local state and keep its contents out of version control.

## Diary-loop-agent boundary

- Verify only the weather agent. Do not select tasks, modify source code, edit `TASKS.md`, test the Diary browser UI, or access Diary data.
- Enforce at most two iterations, at most 15 minutes per iteration, and a stop after two consecutive errors.
- Store only non-sensitive verification state under `diary-loop-agent/memory/data/`.
- Report live network checks separately from deterministic test results.

## Verification

- Run `python -m pytest agents/weather-agent/tests -q` for weather-agent changes.
- Run `python -m pytest agents/diary-loop-agent/tests -q` for loop-agent changes.
- Report commands that could not be run; never claim unexecuted verification passed.
