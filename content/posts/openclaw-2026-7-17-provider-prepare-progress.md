---
title: "OpenClaw Streams Provider Setup Progress"
excerpt: "OpenClaw now streams provider preparation progress so long local model downloads are visible across CLI, macOS, and web."
coverImage: '/assets/images/posts/openclaw-2026-7-17-provider-prepare-progress.png'
date: '2026-07-17T08:03:00.000Z'
dateFormatted: July 17th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-17-provider-prepare-progress.png'
---

OpenClaw's guided setup flow is getting a better progress story for local model providers. [PR #109764](https://github.com/openclaw/openclaw/pull/109764), `feat(setup): stream provider prepare progress to every surface`, merged at 07:55 UTC on July 17.

The problem was especially visible for local providers. Long provider preparations, including multi-gigabyte model pulls, could run behind a request/response setup call with little or no visible progress. Web and macOS users might see a spinner, while machines with Ollama installed but no tools-capable model had no clear structured path forward.

That is the kind of onboarding gap that makes setup feel broken even when the system is still working.

## What Changed

OpenClaw added a new `openclaw.setup.prepare.start` command that runs provider preparation over the existing `WizardSession` transport. The command uses the same parameter shape and validator as `auth.start`, and it is scoped to `operator.admin`.

The session prompter's `progress()` now bridges to Gateway-owned progress steps. Those steps are non-blocking, bounded, cancellable, and compatible with the existing wizard renderers.

The PR notes several defensive details:

- Progress delivery keeps the oldest label and newest snapshot between polls.
- Legacy acknowledgement tolerance uses a capped delivered-ID set.
- Cancellation is locked before persistent effects.
- Authored-shape config writes sit behind snapshot-hash concurrency.
- Large downloads get a two-hour session budget.

Because web and macOS already render wizard progress steps, the change does not need a renderer rewrite to become visible.

## Ollama Gets A Guided Path

Ollama receives targeted setup handling. OpenClaw now performs an explicit tools-capability scan and fails closed if the capability is not available.

When an Ollama server is present but has no tools-capable model, the structured flow can offer to pull `gemma4:e4b` with consent. The PR says the real size is stated and layer progress streams during the pull.

Discovery remains read-only, so merely checking the local Ollama state does not mutate the machine.

## Why This Matters

Provider setup is one of the highest-friction parts of running an agent system. Cloud providers have keys and auth flows. Local providers have servers, model availability, disk space, and long downloads. If OpenClaw hides that work behind a static spinner, users cannot tell whether setup is progressing, stalled, or waiting for consent.

Streaming provider preparation progress makes the experience more honest. It also gives every surface a shared progress model instead of building one-off status paths for CLI, macOS, and web.

## Evidence

The PR reports focused Vitest coverage across Gateway, provider, wizard, and Ollama paths: 24 Gateway tests, 11 provider tests, 19 wizard tests, and 36 Ollama tests.

It also reports green remote TypeScript checks across core, extensions, and tests, plus clean oxlint, formatting, diff checks, and autoreview.

The implementation is additive, so existing setup flows should keep their shape while provider preparation gains a visible progress channel.

## Operator Takeaway

PR #109764 is a setup polish change with real operational impact. Users pulling local models should no longer stare at an empty wait state while OpenClaw prepares the provider.

For anyone onboarding Ollama-backed agents, the new behavior is particularly useful: OpenClaw can detect the missing tools-capable model, ask for consent, and stream the model pull instead of leaving the user to discover the missing step alone.
