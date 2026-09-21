# Diary Loop Agent

The Diary Loop Agent is a local CLI verifier for the weather agent. It stores non-sensitive local state atomically and applies its own iteration, timeout, and consecutive-error guardrails.

It does not change application code, modify `TASKS.md`, access environment files, create browser data, or access the user's Diary database. Its `--verify` mode checks only the weather agent; it does not test the Diary browser UI.

## Run

```sh
python agents/diary-loop-agent/diary_loop_agent.py
python agents/diary-loop-agent/diary_loop_agent.py verify
python agents/diary-loop-agent/diary_loop_agent.py --verify
python agents/diary-loop-agent/diary_loop_agent.py status
python agents/diary-loop-agent/diary_loop_agent.py lookup --place Tampere --date 2024-06-02
```

The default command and `verify` run the weather agent's deterministic Python tests, then send a fictional Helsinki/date request to the local weather-agent HTTP API. A successful run stops with `weather_verified`. `--verify` remains supported for existing scheduled commands.

`lookup` performs one user-requested lookup against the local weather-agent API. It requires an explicit place and ISO date and prints the validated JSON response; it does not update loop state or the Diary database. The printed location, date, and summary may be sensitive and must not be copied into logs or reports without the user's explicit request.

The default state file is `agents/diary-loop-agent/memory/data/loop_state.json`; it is ignored by Git.
