---
title: "OpenClaw Maps Ollama Thinking Levels Correctly"
excerpt: "OpenClaw PR #168166 sends Ollama models only the thinking values they advertise, keeping local reasoning controls aligned with discovery."
coverImage: '/assets/images/posts/openclaw-2026-10-10-ollama-thinking-levels.png'
date: '2026-10-10T08:01:00.000Z'
dateFormatted: October 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-10-ollama-thinking-levels.png'
---

OpenClaw merged [PR #168166](https://github.com/openclaw/openclaw/pull/168166), a local-model routing fix that makes Ollama thinking controls respect the exact values each model reports during discovery.

The issue sat in a subtle place: OpenClaw already fetched `/api/show` metadata from Ollama, but it dropped the model's thinking descriptor before request time. That meant native Ollama requests could receive values a model did not advertise. The PR body calls out two concrete examples: Qwen could receive the string `high` even though it advertised boolean thinking, while GPT-OSS could receive `false` even though it advertised tiered values like `low`, `medium`, and `high`.

## What Changed

OpenClaw now caches native thinking mappings from Ollama discovery and carries them through the model catalog, setup, runtime projection, and final native stream request. The shared thinking ladder still drives the user-facing choices, but the final payload is shaped for the specific model.

In practice, that means:

- Boolean models receive boolean thinking values.
- Graded models receive supported effort strings.
- Unsupported Minimal and XHigh controls are exposed only when advertised.
- Models that cannot disable thinking map Off to the model's lowest supported value.
- Explicit `params.think` and `params.thinking` remain respected until runtime selections intentionally override them.

The OpenAI-compatible Ollama route keeps its older behavior and does not receive native boolean mappings.

## Why It Matters

Local model providers are becoming less uniform. One Ollama model may represent reasoning as a simple on/off switch, while another exposes a ladder of effort levels. A single generic value can look reasonable in OpenClaw and still be wrong for the model behind the request.

This fix makes the model picker and request layer behave more like a contract with discovery data. If the model says it supports `low`, `medium`, and `high`, OpenClaw sends those. If it says thinking is boolean, OpenClaw sends `true` or `false`. That is a small but important reliability win for people running local models through OpenClaw rather than a hosted API.

It also keeps saved settings safer. The PR preserves mandatory-thinking floors for models that require some reasoning setting, while avoiding surprise changes to existing stored configuration.

## Evidence From The PR

The maintainers tested against Ollama 0.40.2 with a local Gateway profile, a `models.list` refresh, and real `chat.send` messages containing `/think <level>` followed by a strict pong request. A local proxy captured native `/api/chat` requests.

The proof covered `qwen3:8b`, advertised as boolean thinking, and `gpt-oss:20b`, advertised with low, medium, and high effort values. All eight tested requests completed. The PR also notes there were zero `/api/show` calls after catalog refresh, so turns reuse cached discovery rather than adding request-time discovery overhead.

Regression tests cover descriptor validation, mapping, projection, native-stream behavior, legacy transport isolation, malformed descriptors, mandatory-thinking floors, and the formerly rejected XHigh profile entry.

## Bottom Line

PR #168166 makes OpenClaw's Ollama integration less guessy. Local reasoning controls now follow the model's advertised contract, which should reduce odd request failures and make advanced local-model settings feel more predictable.
