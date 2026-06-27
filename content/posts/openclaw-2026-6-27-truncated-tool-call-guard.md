---
title: "OpenClaw Blocks Truncated Tool Calls"
excerpt: "OpenClaw now ignores partial tool calls from truncated or failed model responses, preventing accidental execution after bad terminals."
coverImage: '/assets/images/posts/openclaw-2026-6-27-truncated-tool-call-guard.png'
date: '2026-06-27T08:02:00.000Z'
dateFormatted: June 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-27-truncated-tool-call-guard.png'
---

OpenClaw merged [PR #97140, "fix(agent-core): ignore truncated tool calls"](https://github.com/openclaw/openclaw/pull/97140), a P1 agent-core safety fix for model responses that end before their tool calls are complete.

The problem is subtle but important. A model response can hit a `length`, `error`, or aborted terminal while it is still emitting tool calls. If the runtime treats those partial calls as valid, an agent may execute work the model never fully completed.

PR #97140 makes `toolUse` the final authorization gate for tool dispatch and strips tool-call blocks from non-executable terminal messages before events, persistence, return values, and next-turn replay.

## What Changed

The patch focuses on incomplete tool calls produced near bad response terminals. According to the PR, OpenClaw now:

- Preserves explicit `length` and `error` terminals instead of reclassifying them from parsed calls.
- Removes tool-call blocks from terminal messages that are not executable.
- Requires an observed provider terminal before recovered DSML calls can execute.
- Sends provider failures through the shared `error` terminal path.
- Keeps completed tool-call behavior unchanged.

That last point is the practical balance. Complete tool calls still run normally. The change is about refusing to treat partial, truncated, or failed generations as a valid instruction to call tools.

## Why It Matters

Tool calls are where an agent crosses from language into action. In OpenClaw, those actions can include filesystem work, child-session spawns, provider calls, plugins, channel replies, or other operational steps.

If a model is cut off while forming a tool call, the safest default is to stop and surface the failure, not guess that the partial call was intended. PR #97140 moves OpenClaw closer to that posture across agent-core and provider normalization paths.

The PR body calls out Google, Ollama, shared OpenAI-compatible, and DeepSeek DSML normalization. That breadth matters because truncation behavior can vary by provider. A fix that only handles one adapter would leave the same class of bug alive elsewhere.

## Replay Safety

One of the most important pieces is next-turn replay. If a bad terminal message keeps a malformed tool-call block in persisted history, a future turn can inherit confusing or unsafe context.

This patch removes non-executable tool-call blocks before persistence and replay. That means OpenClaw is not just preventing immediate dispatch; it is also preventing partial calls from becoming durable transcript state that influences later turns.

For operators, that reduces the chance of an agent loop getting stuck around a phantom tool call, replaying an invalid action, or spawning child work from an incomplete provider response.

## Validation

The PR reports 451 tests passing across focused shards covering `agent-loop`, shared provider streams, Google shared transport, OpenAI transport stream, Google extension transport stream, and Ollama stream behavior.

Formatting and lint checks passed for the changed files, `git diff --check` passed, and a fresh autoreview reported no findings with high confidence.

This is a strong morning signal because it protects the core execution boundary. OpenClaw agents can still use tools normally, but truncated or failed generations no longer get to smuggle incomplete tool calls into execution or future replay.
