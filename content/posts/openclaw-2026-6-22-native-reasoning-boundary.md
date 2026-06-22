---
title: "OpenClaw Fixes Native Reasoning Boundaries"
excerpt: "OpenClaw now seals native reasoning before answer text for DeepSeek-style providers, keeping thought and response blocks separate."
coverImage: '/assets/images/posts/openclaw-2026-6-22-native-reasoning-boundary.png'
date: '2026-06-22T08:02:00.000Z'
dateFormatted: June 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-22-native-reasoning-boundary.png'
---

OpenClaw merged [PR #95283](https://github.com/openclaw/openclaw/pull/95283), a provider-boundary fix for OpenAI-compatible reasoning streams that could merge an answer into the reasoning block when `/reasoning on` was enabled.

The bug affected DeepSeek-style providers using the `openai-completions` adapter with native reasoning enabled. Those providers can stream thought through `reasoning_content` deltas and then switch to visible answer text through `content` deltas without sending a separate boundary event.

That missing boundary mattered. OpenClaw opened a native thinking block while reasoning content streamed, but did not close it until the end-of-stream cleanup loop. In the PR's summary, the event order became `thinking_start`, then answer `text_start` and `text_delta`, and only later `thinking_end`. Channels that render a reasoning lane saw the answer arrive while the reasoning block was still open.

## The User-Visible Problem

For users, this showed up as a confusing message shape: the thought and final answer could run together inside the same reasoning block. The answer was not missing, but it was delivered in the wrong lane.

That is especially painful for assistants where reasoning display is a deliberate workflow choice. If a user turns reasoning on, they expect two clean phases:

- The model's reasoning stream appears in the reasoning lane.
- The final answer appears separately as answer text.

When those streams collapse into one block, the transcript becomes harder to audit and harder to reuse. It can also make downstream channel renderers look broken even though the underlying provider was simply missing a transition event.

## What OpenClaw Changed

The fix lives in `src/llm/providers/openai-completions.ts`, where OpenClaw owns the transition from native reasoning deltas to visible answer deltas for OpenAI-compatible providers.

The new behavior treats the first visible text lane, or the first tool-call lane, as the boundary for native reasoning. `sealNativeReasoningBeforeText()` closes the open native thinking block before OpenClaw emits `text_start` or `toolcall_start`.

The implementation is intentionally narrow:

- It applies to native reasoning blocks from OpenAI-compatible completions streams.
- It leaves tag-based `<think>` reasoning to the existing partitioner.
- It makes `finishBlock` idempotent so the same reasoning block is not closed twice at stream end.
- It avoids changing providers that already emit a discrete reasoning-end event.

That scope is the right shape for this bug. The broken behavior was not in channel rendering or transcript storage; it was at the provider adapter boundary where OpenClaw first knew the answer lane had begun.

## Proof From a Real Provider

The PR includes live DeepSeek verification against `api.deepseek.com` using `deepseek-reasoner`. Before the fix, the answer text started before the thinking block closed. After the fix, `thinking_end` arrived immediately before `text_start`.

The PR also adds deterministic regression coverage in `src/llm/providers/openai-completions.test.ts`, checking both answer text and following tool calls. The test asserts that `thinking_end` precedes `text_start`, `text_delta`, and `toolcall_start`, and that it is emitted exactly once.

The impact is small but important: OpenClaw's reasoning transcript now matches the user's mental model. Thought gets sealed as thought, answer text gets delivered as answer text, and DeepSeek-style providers no longer leak the provider's missing boundary event into every channel downstream.
