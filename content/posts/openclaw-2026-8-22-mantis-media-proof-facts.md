---
title: "OpenClaw Hardens Mantis Media Proofs"
excerpt: "OpenClaw now records structured Mantis media content facts, giving proof agents safer evidence for PDF and image attachment changes."
coverImage: '/assets/images/posts/openclaw-2026-8-22-mantis-media-proof-facts.png'
date: '2026-08-22T23:00:00.000Z'
dateFormatted: August 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-22-mantis-media-proof-facts.png'
---

OpenClaw merged a large testing and evidence-hardening change tonight: [PR #127830](https://github.com/openclaw/openclaw/pull/127830) adds structured provider media content facts for Mantis proof runs.

The immediate trigger was a blocked Telegram PDF proof. The candidate behavior had moved an attachment from a legacy inline media marker into a structured OpenAI Responses `input_file` item. That was the right product direction, but the proof harness did not expose enough structured evidence for an agent to compare the baseline and candidate lanes. The proof agent was left scraping redacted provider logs instead of asserting on a maintained contract.

That is brittle for ordinary tests. It is worse for media tests, where raw payloads can be large and sensitive.

## What Changed

The mock provider now records a bounded `contentFacts` summary for each request it parses. Instead of asking proofs to inspect raw message bodies, Mantis can assert on normalized facts such as:

- content item type;
- filename;
- MIME type;
- byte length for file and image inputs;
- legacy media markers parsed from older inline attachment text.

The request log also redacts data URLs with byte-count markers, so base64 media payloads are not retained in the recorded provider evidence. The facts ring is capped at the latest 128 records and carries an explicit truncation flag when needed.

Just as important, the PR tightens where that evidence lives. The mock provider now runs in its own container on an internal-only network, with its control and evidence directory separated from the candidate-writable runtime mount. The PR description is careful about the security claim: the facts record what the candidate runtime sent, and candidate code cannot rewrite those records after the fact. They are not a cryptographic proof of which process originated the request.

## Why It Matters

OpenClaw's Mantis lanes are meant to prove real behavior under realistic agent workflows. Media handling is one of the harder areas to prove because an attachment crosses several boundaries: chat input, session ownership, provider formatting, transport payloads, and redaction.

Before this change, a proof for a PDF or image attachment could fail because the evidence surface was too vague, not because the candidate behavior was wrong. That slows down fixes in exactly the places where confidence matters.

[PR #127830](https://github.com/openclaw/openclaw/pull/127830) turns media evidence into a contract. A proof can now say that a session-owned PDF became a provider `input_file` with the expected shape, without retaining or comparing the raw base64 body.

## Validation

The PR reports 44 passing tests across mock-provider config limits and Telegram Mantis lane coverage, then 139 passing tests across the touched isolation and workflow files. It also adds regressions for structured `input_file` facts, legacy media facts, truncation behavior, and absence of base64 payloads in serialized logs.

The changed-file gate passed formatting, typechecking, lint, guard checks, and import-cycle checks. A structured autoreview reported no accepted or actionable findings.

## Bottom Line

This is a foundation fix for OpenClaw's proof system. Media-related PRs should now be easier to validate, safer to inspect, and less dependent on improvised log scraping.
