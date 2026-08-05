---
title: "OpenClaw Fixes Tool Search Dotted Arguments"
excerpt: "OpenClaw PR #119464 repairs Tool Search calls from providers that flatten nested arguments into args.path-style fields."
coverImage: '/assets/images/posts/openclaw-2026-8-5-tool-search-dotted-args.png'
date: '2026-08-05T08:02:00.000Z'
dateFormatted: August 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-5-tool-search-dotted-args.png'
---

OpenClaw merged [PR #119464, "fix(tool-search): preserve dotted target arguments"](https://github.com/openclaw/openclaw/pull/119464), a P2 agent-runtime fix for Tool Search calls made through providers that flatten nested tool arguments.

The failure mode was noisy. Some providers emitted fields such as `args.path` or `args.command` instead of passing a nested `args` object. Those fields reached the selected target tool with the prefix still attached, so the target saw missing parameters and the model kept trying.

In the reproduced case, `github-copilot/gemini-3.1-pro-preview` made 172 tool calls and then timed out after 300 seconds. The patched flow completed in 8 to 17 seconds with only 2 to 3 tool calls.

## Provider Compatibility At The Wrapper

Tool Search sits between model output and actual callable tools. That makes it a natural compatibility boundary: it can accept provider-specific argument shapes without forcing every target tool to understand them.

PR #119464 updates the shared Tool Search call decoder so non-empty `args.*` compatibility fields are normalized at the wrapper boundary. A field like `args.path` can become the target argument `path` before the tool sees it.

The precedence rule is conservative. Correctly nested `args` still win, and the existing ordinary flattened-argument behavior remains unchanged. The new normalization only catches the dotted compatibility shape that was breaking affected providers.

## User Impact

The practical effect is less looping and fewer false tool failures. When a model finds a target through Tool Search, the selected tool should receive the arguments the model intended, even if the provider flattened a nested object along the way.

That matters for OpenClaw users running mixed provider stacks. Tool calling reliability is not just about whether a model can choose the right tool. It also depends on whether the runtime can preserve the argument contract between provider output, wrapper decoding, and the target tool schema.

For affected sessions, this fix changes a stalled retry spiral into a normal short tool sequence.

## Why It Fits OpenClaw's Direction

OpenClaw has been adding more dynamic tool discovery and provider-aware runtime behavior over the last several releases. Those features only work if the compatibility layer absorbs model-provider quirks cleanly.

This PR is a good example of that work at a small scale. The target tools do not need new schemas. The providers do not need special handling in every command. The shared decoder learns one more safe compatibility rule and keeps the rest of the runtime stable.

## Evidence

PR #119464 includes a direct before-and-after measurement: the broken provider path produced 172 tool calls and a 300-second timeout, while the patched flow completed with 2 to 3 tool calls and no provider fallback.

Focused validation passed 45 tests in `src/agents/tool-search-runtime.test.ts`. Formatting and lint checks also passed on the changed Tool Search runtime and test files.

For users, the headline is simple: Tool Search is better at understanding dotted argument fields, and affected provider sessions should stop burning time on avoidable missing-parameter retries.
