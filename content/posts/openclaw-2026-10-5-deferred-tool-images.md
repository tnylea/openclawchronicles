---
title: "OpenClaw Fixes Deferred MCP Tool Images"
excerpt: "OpenClaw PR #165762 makes deferred MCP image results visible to models, fixing base64-only tool output from tool_search workflows."
coverImage: '/assets/images/posts/openclaw-2026-10-5-deferred-tool-images.png'
date: '2026-10-05T23:03:00.000Z'
dateFormatted: October 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-5-deferred-tool-images.png'
---

OpenClaw merged [PR #165762](https://github.com/openclaw/openclaw/pull/165762), a focused fix for image results returned by MCP tools discovered through `tool_search` and then invoked through `tool_call`.

Before the fix, an MCP image block from a deferred tool was serialized into JSON text as base64. That meant the model received a text envelope containing encoded image data, not an actual model-visible image part. Direct tool calls already handled image blocks correctly, so the bug created an odd split: the same underlying MCP tool could work visually in one invocation path and become invisible in another.

## What Changed

The fix forwards the target tool's already-projected image blocks through the control result formatter. Text still arrives beside the image, and the full target result remains available in details.

OpenClaw deliberately keeps the existing owners in place:

- MCP projection still owns the image block shape.
- Downstream image handling still owns provider-facing image content.
- Tool policy is unchanged.
- MIME handling is unchanged.
- Codex custom tools are unchanged.
- Storage formats are unchanged.

That narrowness is the point. The bug was not that OpenClaw lacked an image pipeline. It was that the deferred `tool_call` wrapper flattened the result into text before the model could see the image.

## Why It Matters

Deferred tools are becoming a more important part of OpenClaw's tool surface. A model may discover a tool dynamically, call it later, and need the returned media to reason about what happened.

If an image result is reduced to base64 text, the workflow technically "returns" data but practically loses the image. That is the worst kind of failure for users: the tool ran, the bytes exist, but the agent cannot see the thing it was supposed to inspect.

This matters for screenshots, generated previews, diagrams, UI captures, document renders, camera snapshots, and any MCP server that returns images as first-class content.

## Validation

The PR proof used a built isolated Gateway, a local stdio MCP server returning text plus a PNG, and a scripted OpenAI-compatible model that called `tool_search` and then `tool_call`.

On the baseline, the next model request contained JSON text with base64 and no image part. With the fix, the request contained an `image_url` part plus text, without base64 being stuffed into the JSON text envelope.

The controls are important. Text-only deferred results remained unchanged. Direct image results remained unchanged. Invalid base64 remained rejected in both direct and deferred paths.

The author reports that all 119 tests in the focused tool-search files passed, with a new regression failing on the baseline and passing after the fix. The PR also includes a live Gateway gate using `gpt-5-mini`, where the model described the deferred PNG as a bright red square.

## The Practical Takeaway

For users, this should make dynamic MCP workflows feel less arbitrary. If a discovered tool returns an image, OpenClaw now passes that image to the model as image content instead of hiding it inside text.

For tool authors, it is another reminder that result shape matters as much as result bytes. Returning media through a structured tool interface only helps if every wrapper preserves that structure all the way to the model.

PR #165762 is small compared with tonight's beta release, but it fixes a real gap in OpenClaw's dynamic-tool story. A deferred tool image should be an image, not a string with a secret inside.
