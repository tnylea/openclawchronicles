---
title: "OpenClaw Adds GPT-6 Sol and Luna Model Support"
excerpt: "OpenClaw PR #155967 adds GPT-6 Sol and GPT-6 Luna support across OpenAI API and embedded ChatGPT routes."
coverImage: '/assets/images/posts/openclaw-2026-9-22-gpt-6-sol-luna-support.png'
date: '2026-09-22T23:02:00.000Z'
dateFormatted: September 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-22-gpt-6-sol-luna-support.png'
---

OpenClaw merged [PR #155967](https://github.com/openclaw/openclaw/pull/155967), adding support for the newly available `openai/gpt-6-sol` and `openai/gpt-6-luna` models.

Model support in OpenClaw is more than putting a new name in a picker. The runtime has to resolve the model consistently across API-key routes, embedded ChatGPT transport, account discovery, reasoning levels, context limits, pricing metadata, request serialization, and compatibility behavior.

This PR updates that route and catalog plumbing so users can select either model on the OpenAI API or embedded ChatGPT transport with the right context limits, reasoning levels, and token pricing. Existing selections and the Astra default remain unchanged.

## What Changed

The OpenAI plugin catalog now knows about GPT-6 Sol and GPT-6 Luna. The PR extends the existing model route owners, including resolution before discovery and preservation of account-specific metadata.

Both models support `reasoning.effort=none` on Platform and embedded ChatGPT transports. Native Codex behavior remains account-reported, so OpenClaw preserves the picker choices returned by the account rather than flattening every route into one static table.

The PR also keeps Azure deployments on their own track. Configured models without compatibility metadata can preserve `max` and omit unsupported sampling fields, while Azure deployments retain their sampling settings. That is the sort of detail that prevents a broad model-catalog update from accidentally changing unrelated provider behavior.

## One Caveat

The PR notes that subscription discovery still needs a bundled Codex or client-version upgrade. In the tested account, the 0.154.0 catalog omitted both GPT-6 models, while 0.155.1 exposed them. This merge retains the current dependency while leaving that separate upgrade decision for later.

That means direct OpenAI and embedded ChatGPT routing support has landed, but some discovery surfaces may still depend on the client catalog available in a given account and bundle.

## Evidence Behind the Merge

The proof is unusually complete for a model-catalog PR. Route, model-resolution, and request-serialization regressions failed before their corresponding fixes. Independent autoreview was clean through P2 after Azure sampling and embedded ChatGPT `none` findings were fixed and reproduced.

Both provider live tests completed through the OpenAI Responses API: Sol in 2.265 seconds and Luna in 1.176 seconds. Separate authenticated ChatGPT Responses requests with `reasoning.effort=none` returned HTTP 200 and `response.completed` for both models.

Focused checks included 115 initial tests, 92 Azure and Responses tests after the sampling correction, and 92 ChatGPT, Responses, and thinking-policy tests after the final reasoning correction. The full provider suite later passed all 83 tests after build serialization, and real `pnpm openclaw agent exec` runs with isolated config and state returned the expected synthetic verification value for both models.

For OpenClaw users tracking the latest OpenAI model family, this merge is the first concrete support layer: GPT-6 Sol and Luna can now resolve through OpenClaw's OpenAI routes without upsetting existing model selections.
