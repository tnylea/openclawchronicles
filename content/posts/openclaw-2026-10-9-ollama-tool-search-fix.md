---
title: "OpenClaw Fixes Ollama Tool Search Calls"
excerpt: "OpenClaw PR #167933 repairs Ollama tool-call routing when Tool Search is enabled, preserving canonical tool history."
coverImage: '/assets/images/posts/openclaw-2026-10-9-ollama-tool-search-fix.png'
date: '2026-10-09T23:02:00.000Z'
dateFormatted: October 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-9-ollama-tool-search-fix.png'
---

OpenClaw merged [PR #167933](https://github.com/openclaw/openclaw/pull/167933), a P1 Ollama compatibility fix for a sharp edge between local models, Tool Search, and native tool calls.

The failure mode was specific but nasty. With Tool Search enabled, Ollama could turn valid native calls such as `exec` into malformed `tool_call` invocations. The model intended to call one tool, but the transport parser latched onto an envelope-like name first, causing the turn to fail before the real tool could run.

## What Changed

OpenClaw now aliases parser-sensitive tool names at the Ollama transport boundary. The important detail is where that aliasing lives: execution, policy decisions, catalog IDs, stored history, and replay keep the canonical OpenClaw tool names. Only the wire shape offered to Ollama changes.

That keeps the repair narrow. OpenClaw does not rewrite the user's system prompt, does not mutate core prompt sections, and does not store alias names as if they were the original tools. The adapter translates definitions, assistant replay, named tool results, selectors, streaming events, final messages, and result consumers across the same boundary.

The PR calls out several parser-sensitive names that need protection, including `tool_call`, `tool_calls`, `TOOL_CALLS`, `function`, `name`, `arguments`, and short substrings such as `ls` that can collide with known envelope formats.

## Why It Matters

Ollama is one of the most important local-model routes for OpenClaw users. Tool Search is also a natural fit for local models because it lets the assistant discover a smaller tool surface instead of carrying every possible tool definition all the time.

When those two features collide, the result can feel arbitrary: a simple request like running `echo hello` fails even though the model produced something close to a valid tool call. This fix keeps local model workflows usable without weakening OpenClaw's internal tool identity rules.

The user-facing impact is direct:

- Qwen3:8b and Qwen2.5:7b can execute real Gateway tools with default Tool Search.
- Ollama OpenAI-compatible chat-completions routing gets the same repair.
- Stored session history keeps canonical tool names.
- Policy and approval checks continue to see the real OpenClaw tool identities.
- No session migration or operator configuration is required.

The PR is also careful about limits. This is a compatibility repair for known envelope collisions, not a universal recovery system for arbitrary malformed tool intent.

## Evidence From The PR

The PR includes live Gateway probes against Ollama 0.40.1 with isolated state, default Tool Search, and local models. On main, Qwen3:8b and Qwen2.5:7b misparsed native wrapper calls for the `echo hello` prompt. On the fixed branch, both produced one `exec` call, returned the actual tool result, and delivered a visible reply with zero failures.

Deferred Tool Search smokes also passed for `agents_list`, and a Llama3.2 OpenAI-compatible route successfully executed `exec`. The PR reports 80 passing alias and plugin-boundary tests, a passing runtime build, and a clean scoped review through P2.

## Bottom Line

PR #167933 makes OpenClaw's Ollama path more dependable for tool-using local agents. The fix respects the boundary between provider wire quirks and OpenClaw's canonical tool system, which is exactly where this kind of compatibility code belongs.

For users running local models with Tool Search, this should turn a confusing parser failure into ordinary tool execution.
