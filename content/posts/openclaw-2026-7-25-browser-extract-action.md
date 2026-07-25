---
title: "OpenClaw Browser Extract Reads Pages With Less Context"
excerpt: "OpenClaw adds a browser extract action that answers page questions through a bounded sub-model call instead of full snapshots."
coverImage: '/assets/images/posts/openclaw-2026-7-25-browser-extract-action.png'
date: '2026-07-25T23:06:00.000Z'
dateFormatted: July 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-25-browser-extract-action.png'
---

OpenClaw merged [PR #113861](https://github.com/openclaw/openclaw/pull/113861), adding a browser `extract` action for answering questions about the current page with a bounded sub-model call.

The goal is straightforward: when a user asks "read this page and answer X," OpenClaw should not always need to pull page snapshots through the main model context. On long pages, snapshot-and-scroll loops are slow and expensive, especially when the answer is a single fact.

## What Extract Does

The new action captures page HTML from the resolved Playwright tab, converts it through the same web-content extraction helpers used by OpenClaw's web-fetch pipeline, and sends the normalized page content to a simple completion model.

The PR describes a deliberately constrained flow:

- page HTML is sanitized and converted to Markdown-like content
- input is capped at 80,000 characters with context-window-aware scaling
- truncation is surrogate-safe
- the sub-model is instructed to answer only from page content
- absent answers return `NOT_FOUND`
- page text is treated as data for prompt-injection hardening
- completion runs under a plugin-side deadline

The result comes back as a short answer wrapped as external untrusted content, with model attribution and details including URL, character count, truncation status, and model.

## Why It Matters

Snapshots are still the right tool for navigation, clicking, and choosing browser refs. But not every page-reading task needs a full visual or accessibility snapshot in the main transcript.

`extract` gives agents a cheaper path for focused reading tasks. A long-lived browser session can ask one question about the current page and receive only the answer, rather than dragging the page body into the main model's context.

That matters for context hygiene. It also matters for skill authors who want repeatable browser workflows without making every reading step compete with the user's main conversation history.

## Where It Shows Up

The PR wires the action across the browser tool surface:

- schema enum and `query` parameter
- output schema
- dispatch and control-server route
- node-proxy allowlist
- CLI support through `openclaw browser extract "<question>"`
- browser tool description
- docs and bundled browser automation skill

Existing-session profiles return the standard Playwright-required 501, and completion failures tell the caller to fall back to `snapshot` rather than leaking partial dumps.

## Validation

OpenClaw reports 146 focused tests passing across handler behavior, `NOT_FOUND`, truncation flags, completion-failure fallback, existing-session limits, missing-query validation, and schema coverage.

The full browser shard reported 2,040 passing tests with one pre-existing skip. The PR also records live verification against a local 120-section fixture using `openai/gpt-5.6-luna`, where buried-fact questions returned the expected answers and a missing fact returned `NOT_FOUND`.

The headline is not that `extract` replaces snapshots. It gives OpenClaw a more precise reading tool, and that should make browser sessions cleaner when the task is to answer, not to act.
