# Diary agents

Diary contains two self-contained local Python agents. Neither agent requires a language model or API key.

## Weather agent

[`weather-agent/`](weather-agent/) retrieves historical daily weather from Open-Meteo and creates a deterministic Finnish summary. It provides a CLI, a loopback-only FastAPI service, a standalone local UI, a JSON tool, a focused subagent, local memory, and tests.

The Diary application communicates with the FastAPI service over loopback and sends only a place and entry date. See [`weather-agent/README.md`](weather-agent/README.md) for commands and privacy details.

## Diary loop agent

[`diary-loop-agent/`](diary-loop-agent/) is a bounded local verifier for the weather agent. It runs deterministic weather tests and may perform a separate fictional lookup through the already-running loopback API. It does not select implementation tasks, modify source code, access the Diary database, or test the browser UI.

Codex task work is governed separately by [`../looppi.md`](../looppi.md).

## Privacy boundary

- Keep all services on loopback.
- Never access the user's Diary database from these agents.
- Never send diary titles, content, tags, or saved weather descriptions to Open-Meteo.
- Keep local memory and verification state ignored by Git.
- Use fictional data in tests and report live checks separately.
