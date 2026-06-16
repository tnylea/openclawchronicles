---
title: "OpenClaw Adds Codex Hosted Search Provider Routing"
excerpt: "OpenClaw PR #93446 adds Codex hosted web search routing, letting configured Codex workers handle bounded search calls for non-Codex parent runtimes safely."
coverImage: '/assets/images/posts/openclaw-2026-6-16-codex-hosted-web-search.png'
date: '2026-06-16T08:02:00.000Z'
dateFormatted: June 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-16-codex-hosted-web-search.png'
---

OpenClaw merged [PR #93446](https://github.com/openclaw/openclaw/pull/93446) this morning, adding Codex hosted web search as a managed provider path. The feature lets OpenClaw prefer native Codex hosted `web_search` when supported, while preserving the existing managed OpenClaw search fallback for providers that do not expose that capability.

The practical headline is configuration flexibility. Operators can select `tools.web.search.provider: "codex"` so a parent model or runtime can delegate search to a bounded Codex worker without changing the parent model itself.

## How the Routing Works

The PR introduces a Codex app-server web-search planner and registers the Codex plugin as an explicit managed web-search provider. When Codex hosted search is available, OpenClaw can use the provider's native hosted search item. When a different parent runtime is in charge, OpenClaw can still route the search portion through an isolated Codex worker.

That worker is intentionally constrained. The PR says explicit-provider searches run in an ephemeral Codex thread with shell environments, dynamic tools, apps, plugins, image generation, multi-agent behavior, and code mode disabled. The path fails closed unless Codex emits a native hosted-search item.

OpenClaw also keeps native hosted search and managed search mutually exclusive, applies domain, context, and location restrictions to the Codex thread config, and carries `/btw` side-question policy context into Codex side forks.

## Why It Matters

Search is a deceptively sensitive tool. It reaches outside the local workspace, can shape an agent's answer with fresh information, and often needs domain or location limits to stay relevant. OpenClaw already had managed search behavior, but PR #93446 adds a sharper routing option for environments where Codex hosted search is available and desirable.

The interesting design choice is delegation without runtime replacement. A user can keep a non-Codex parent model or an OpenClaw runtime, then configure Codex as the search provider for that one tool lane. That gives operators another way to compose model strengths without handing the whole session to a different runtime.

It also aligns with OpenClaw's recent pattern of bounded side workers. The same lifecycle approach used for media understanding is reused here so the search worker has a narrower tool surface than the parent session.

## Proof and Scope

The PR includes a large verification set: focused Vitest suites, core and extension type checks, plugin contract tests, build checks, and live proof runs. The live proof described a non-Codex parent model using `tools.web.search.provider: "codex"` and recording exactly one successful web-search call with Codex as the provider.

The change is large, touching 48 files with provider registration, app-server planner logic, contracts, tests, and documentation. It is still a merged main-branch feature, not a packaged release announcement by itself. Operators should watch the next release notes for when this lands in an installable OpenClaw version.

## Operator Takeaway

Codex hosted search routing gives OpenClaw a more explicit way to use search as a delegated capability. If your agent stack separates parent reasoning, tool policy, and external search, PR #93446 is one to track closely.

Read the merged source PR on GitHub: [OpenClaw PR #93446](https://github.com/openclaw/openclaw/pull/93446).
