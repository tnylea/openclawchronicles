---
title: "OpenClaw Fixes Outcome Labels for Codex Tools"
excerpt: "OpenClaw Control UI now shows accurate Codex tool states, replacing misleading Outcome unknown labels with running, completed, or failed results."
coverImage: '/assets/images/posts/openclaw-2026-10-3-authoritative-tool-outcomes.png'
date: '2026-10-03T23:02:00.000Z'
dateFormatted: October 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-3-authoritative-tool-outcomes.png'
---

OpenClaw's Control UI now reports Codex tool activity more accurately after [PR #163545](https://github.com/openclaw/openclaw/pull/163545) merged on October 3rd. The fix addresses a confusing state where active or authoritatively completed Codex tool calls could show up as **Outcome unknown**, even when OpenClaw had better information available.

This is a small-looking UI fix with an outsized effect on trust. When an agent is running tools, the operator needs to know whether work is still active, completed, failed, or genuinely ambiguous. A tool row that says "unknown" when it is actually running makes the system harder to read.

## What Was Going Wrong

The PR explains that a status-less history placeholder or discarded native terminal item could win projection over more authoritative facts. In practice, that meant Control UI sometimes treated the presence of a historical activity object as a terminal fact instead of falling through to the live run state.

The result was misleading labeling:

- Active tool rows could display **Outcome unknown** instead of **Running**.
- Wait, collaboration, and subagent actions could lose their exact completed or failed outcome.
- Some Codex projection cases retained unknown or false success when same-ID raw calls and terminal items arrived in different orders.

These are the kinds of edge cases that show up in real agent transcripts, especially when native runtime events, collaboration actions, and UI projection all meet at the same boundary.

## What Changed

The fix restores fact precedence in two places: Control UI's outcome resolver and the Codex transcript projector.

Control UI now falls through status-less history activity to the live run state, instead of treating object presence as decisive. The Codex projector correlates same-ID raw calls with collaboration and subagent terminal items, including cases where output and outcome arrive in different orders.

The PR also extends exact `Script completed` and `Script failed` handling to Wait as well as Exec. Yielded and unrecognized envelopes remain unknown, which is important: the fix does not erase ambiguity where OpenClaw truly does not have an authoritative answer.

## Why Operators Should Care

Tool state is operational telemetry. If a row says a tool is running, an operator can wait. If it says failed, they can inspect the failure. If it says completed, they can move on. If it says unknown, they may have to open logs, refresh context, or second-guess whether the agent is stuck.

By making the UI follow the strongest available fact, OpenClaw reduces that friction. The agent's work becomes easier to supervise without adding new protocol, persistence, or fallback behavior.

## Validation

The PR reports focused validation across the Codex event projector and Control UI tool-card tests, plus an isolated browser fixture comparing the before and after state. The exact-head CI run completed successfully.

The production delta is also narrow: the PR says the Codex projector gained 14 net lines, while Control UI stayed net zero. That is the right size for a correctness fix at this layer. It changes how existing facts are interpreted rather than introducing a new state model.

For anyone watching OpenClaw's operator experience, this is a useful polish point: fewer ambiguous tool rows, more faithful Codex state, and a Control UI that better reflects what the runtime already knows.
