---
title: "OpenClaw Preserves Structured Tool Results"
excerpt: "OpenClaw fixed provider replay so structured tool output stays readable instead of collapsing into empty or misleading media placeholders."
coverImage: '/assets/images/posts/openclaw-2026-7-1-structured-tool-result-replay.png'
date: '2026-07-01T08:10:00.000Z'
dateFormatted: July 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-1-structured-tool-result-replay.png'
---

OpenClaw merged [PR #97742, "fix(llm): preserve structured tool result text across providers"](https://github.com/openclaw/openclaw/pull/97742) on July 1st, closing a P1 provider-replay bug that could make structured tool output disappear or look like the wrong kind of attachment.

The issue is subtle but important. OpenClaw tools do not always return plain text. They may return structured JSON-like blocks, resource metadata, media references, or mixed content. When those results are replayed back through a model provider, the conversion layer has to preserve the useful text without leaking secrets or pretending that structured data is an image.

Before this fix, structured non-media content could collapse into placeholders such as `(see attached image)`, `(see attached media)`, or even empty output. That loses context and can mislead the model on the next turn.

## The User-Facing Bug

The PR body names the canonical problem as [issue #96857](https://github.com/openclaw/openclaw/issues/96857). The most visible symptom is that tool output with structured content could be replayed without its actual useful data.

That matters in practical workflows:

- A JSON resource result can be reduced to a generic media placeholder
- An audio-only result can be labeled like an image
- Structured-only output can become empty provider-bound text
- Follow-up model turns can make decisions without the data a tool actually returned

For an agent system, that is more than formatting polish. Tool output is part of the reasoning record. If provider replay drops or mislabels it, the model can answer confidently from a distorted transcript.

## What the Fix Does

The PR preserves explicit text first, then serializes structured non-media blocks as redacted JSON text. Media-only results still use placeholders, but the placeholders are now type-aware:

- image-only results become `(see attached image)`
- audio-only results become `(see attached audio)`
- mixed image and audio results become `(see attached media)`

The patch also redacts or omits risky fields before replay. The PR explicitly calls out secret-like fields, inline data URIs, opaque encrypted fields, and binary `data` fields.

That is the right balance: preserve useful structured context, but do not turn provider replay into a raw data exfiltration path.

## Provider Coverage Is Broad

This is not a one-provider patch. The implementation touches shared provider-side extraction and replay paths across OpenAI Responses, OpenAI Completions, Anthropic, Google shared provider handling, Mistral, OpenAI transport streams, and Anthropic transport streams.

The follow-up repair also closes a sibling gap in the bundled Google extension transport. The PR says `extensions/google/transport-stream.ts` still built `functionResponse.response.output` from explicit text or a media placeholder, so structured-only non-media results could still become empty output. The merged version gives Google transport the same structured replay behavior while keeping the helper boundary inside the private plugin SDK path.

That boundary detail matters for extension authors. The public Plugin SDK surface did not expand just to solve this internal replay issue.

## Validation

The regression coverage is targeted and detailed. The PR reports tests for explicit-text precedence, structured JSON serialization, media-only omission from text extraction, image/audio/mixed placeholder selection, inline data URI and binary-field redaction, OpenAI replay behavior, Anthropic transport behavior, Google function response output, xAI audio fallback handling, and plugin SDK alias boundaries.

It also reports `plugin-sdk:surface:check`, extension package-boundary compilation across 116 bundled extension packages, focused Vitest shards, linting, and `git diff --check`.

## Bottom Line

This is a reliability and safety fix for OpenClaw's tool transcript layer.

The important outcome is simple: if a tool returns structured, non-media information, OpenClaw should keep that information readable for the next model turn. If the tool returns media, OpenClaw should describe the media accurately. If the tool returns secrets or opaque binary fields, OpenClaw should not replay them raw.

PR #97742 moves provider replay closer to that standard across the main OpenClaw provider stack.
