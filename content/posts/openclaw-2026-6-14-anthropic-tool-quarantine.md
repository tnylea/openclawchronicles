---
title: "OpenClaw Quarantines Bad Anthropic Tool Schemas"
excerpt: "OpenClaw PR #92908 quarantines unreadable Anthropic-family tool schemas so malformed plugin payloads cannot break healthy tool calls."
coverImage: '/assets/images/posts/openclaw-2026-6-14-anthropic-tool-quarantine.png'
date: '2026-06-14T08:01:00.000Z'
dateFormatted: June 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-14-anthropic-tool-quarantine.png'
---

OpenClaw merged a provider-safety fix this morning that makes malformed Anthropic-family tool schemas less able to break otherwise healthy tool calls.

[PR #92908](https://github.com/openclaw/openclaw/pull/92908), titled `fix(providers): quarantine unreadable Anthropic payload tools`, focuses on OpenAI-compatible Anthropic payload conversion. The PR summary says unreadable, non-serializable, and structurally invalid Anthropic-family tool schemas are now quarantined before OpenAI-compatible payload serialization.

That sounds narrow, but it sits on an important boundary. OpenClaw plugins and providers pass tool definitions through multiple compatibility layers. If one tool schema has a nested getter that throws, an invalid structure, or a serialization trap, it should not take down every sibling tool in the request. It also should not cause the runtime to quietly broaden tool access while trying to recover.

## What Changed

The merged patch filters problematic tool schemas before they reach the OpenAI-compatible payload layer used by Anthropic-family adapters. It also keeps forced, custom, string, and `allowed_tools` choices aligned with the tools that survive filtering.

The most important behavior is conservative failure. If a malformed tool is removed, OpenClaw should preserve the user's original tool restrictions around the remaining valid tools. The PR explicitly says the fix avoids broadening tool access, including the empty `allowed_tools` case.

The patch also preserves JSON-safe provider metadata, which matters for debugging and compatibility. Provider adapters often need metadata for routing, compatibility flags, and diagnostics. A safety fix that strips useful metadata can create a second class of production failures, so keeping that boundary intact is part of the story.

## Why It Matters for Plugins

OpenClaw's plugin ecosystem is getting larger, and not every tool definition will be perfect. Some tools are authored by humans. Some are generated. Some come through compatibility wrappers, provider SDKs, or third-party schemas.

That means provider adapters need to be robust against bad inputs without treating every bad input as a fatal error. A single broken schema should be isolated where possible, and the remaining request should continue only if the resulting tool choices are still safe.

This is especially important for OpenAI-compatible routes that carry Anthropic-style tool metadata. Compatibility layers are useful because they let operators reuse provider surfaces, but they also increase the number of places where schema shape, serialization behavior, and tool choice semantics can drift.

PR #92908 reduces that drift by making the quarantine behavior explicit.

## Verification

The PR includes a strong validation trail. The author reports focused wrapper and provider Vitest coverage across Anthropic and OpenAI transport paths, strict core and test type checks, architecture checks, lint and format gates, and an AWS Testbox changed gate.

The real-behavior proof is the most useful part. The PR says a live OpenAI Chat Completions test with `gpt-5.5` received a forced `live_probe` function call with expected arguments after a sibling tool containing a nested throwing schema getter was quarantined.

That proves the fix is not just a unit-level shape check. In the tested path, the malformed tool was removed, the healthy pinned tool remained reachable, and the live provider returned the expected function call.

The PR also names one untested gap: no live third-party Anthropic-compatible proxy using the deprecated compatibility flag was called. That is a reasonable residual risk for a compatibility boundary, but the request shape was verified against installed official OpenAI SDK types and the live OpenAI API.

## Operator Takeaway

For most OpenClaw users, this should be invisible. The ideal outcome is that healthy tool calls keep working even when one plugin contributes a bad schema.

For plugin authors and operators running custom provider adapters, the lesson is more direct:

- Treat tool schemas as untrusted input.
- Preserve tool choice restrictions after filtering.
- Keep malformed tools isolated from healthy siblings.
- Verify compatibility fixes against real provider APIs when possible.

This is the kind of reliability fix that becomes more valuable as OpenClaw grows. More plugins mean more schemas, more compatibility paths, and more chances for one bad tool definition to cause trouble. Quarantine is the right default.

Read the merged PR on GitHub: [OpenClaw PR #92908](https://github.com/openclaw/openclaw/pull/92908).
