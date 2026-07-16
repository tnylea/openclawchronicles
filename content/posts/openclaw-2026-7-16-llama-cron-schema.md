---
title: "OpenClaw Makes Cron Schemas Work With llama.cpp"
excerpt: "OpenClaw removed an incompatible model-facing cron schema pattern so llama.cpp-backed models can compile and use cron tools."
coverImage: '/assets/images/posts/openclaw-2026-7-16-llama-cron-schema.png'
date: '2026-07-16T08:03:00.000Z'
dateFormatted: July 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-16-llama-cron-schema.png'
---

OpenClaw merged a small but important model-compatibility fix for cron tools just before the morning cutoff. [PR #108360](https://github.com/openclaw/openclaw/pull/108360), `fix(agents,cron): remove pattern field from model-facing cron tool schema`, merged at 07:59 UTC on July 16.

The bug affected llama.cpp-backed models. The model-facing cron tool schema exposed an unanchored JSON Schema pattern for `declarationKey`: `\S`. llama.cpp's schema-to-grammar converter rejects patterns that do not start with `^` and end with `$`, so the entire cron tool schema could fail to compile.

## What Changed

OpenClaw removed the incompatible `pattern` field only from the model-facing cron schema. The PR keeps the existing `minLength: 1` and `maxLength: 200` constraints.

Server and gateway validation remain unchanged. The runtime still rejects whitespace-only declaration keys where it already did before. In other words, this is a schema presentation fix for model compatibility, not a broad loosening of cron validation.

The PR also refreshes the affected Codex prompt snapshots and derived token counts, then adds a direct regression assertion so this exact boundary stays locked.

## Why llama.cpp Compatibility Matters

OpenClaw operators increasingly mix hosted models, local models, and specialized inference backends. Tool schemas become part of that portability layer. A schema accepted by one provider but rejected by another can make a feature look broken even when the runtime implementation is fine.

Cron is especially sensitive because it is an automation tool. If a local model cannot compile the cron tool schema, it cannot reliably create, inspect, or reason over scheduled work through that model-facing interface.

The safer fix is the one this PR takes: keep runtime validation where it belongs, but avoid feeding a stricter backend a schema pattern it cannot convert.

## Evidence

The PR cites the official llama.cpp `json_schema_to_grammar.py` converter at commit `a320cbfcb7056b7b81fb854d97fe01d0ea77c4b5`. Before the patch, the converter rejected the schema with a pattern-format error. After the patch, it accepted the schema and produced grammar output.

The focused prepared-head test run included:

- 19 passing cron tool schema tests
- 160 passing cron tool tests
- 15 passing flat-params tests
- 12 passing prompt snapshot tests

The changed-surface gate also passed formatting, TypeScript checks, lint, policy guards, and boundary checks. The PR reports a clean fresh autoreview with no accepted or actionable findings.

## Operator Takeaway

If you run OpenClaw with llama.cpp-backed models and saw cron tools fail at schema compilation time, this is the fix to watch. It should make the cron tool usable without changing the underlying server-side cron validation contract.

The broader pattern is healthy: OpenClaw is treating model-facing schemas as compatibility surfaces in their own right. That matters as agent runtimes move across hosted APIs, local inference stacks, and provider-specific grammar converters.
