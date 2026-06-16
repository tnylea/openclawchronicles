---
title: "OpenClaw 2026.6.8 Beta 2 Ships Richer Channels"
excerpt: "OpenClaw 2026.6.8-beta.2 improves Telegram, WhatsApp, agent recovery, provider routing, usage footers, state diagnostics, and verified beta packaging today."
coverImage: '/assets/images/posts/openclaw-2026-6-16-v2026-6-8-beta2-release.png'
date: '2026-06-16T08:00:00.000Z'
dateFormatted: June 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-16-v2026-6-8-beta2-release.png'
---

OpenClaw published [v2026.6.8-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.6.8-beta.2) early Tuesday, extending the 2026.6.8 beta train with a broad channel, provider, runtime, and diagnostics sweep. The release landed at 01:50 UTC and includes npm package verification, release validation, plugin publishing, ClawHub package checks, and Telegram beta E2E evidence.

This is not a single-feature beta. It is a consolidation release: richer message delivery, sharper agent and gateway recovery, broader model catalog handling, safer tool-schema boundaries, more useful usage footers, and steadier UI and mobile flows.

## Channel Delivery Gets Richer

The headline channel work is Telegram and WhatsApp. The release notes say Telegram delivery can now handle richer structured output, including tables, lists, expandable blockquotes, preserved intentional line breaks, and better rich-media boundaries. WhatsApp also now honors configured ACP bindings.

For OpenClaw operators, that matters because channel adapters are where polished agent output often breaks down. A response that looks fine in the model stream can become hard to read when it reaches Telegram, WhatsApp, Slack, or a CLI-backed handoff. This beta keeps more of the agent's intended formatting intact while tightening delivery boundaries around media and prompt-preserving backend flows.

The release also calls out channel fixes for account-scoped direct messages, generated media completions, Feishu dynamic-agent routes, Slack outbound hooks, thread remapping, surrogate-pair chunking, and rich Telegram final replies.

## Recovery and Providers Move Forward

OpenClaw's runtime recovery work is spread across agent sessions, cron, gateway restarts, subagents, heartbeats, and generated media. The release notes mention fixes for restart shutdown aborts, yielded subagent pauses, trusted subagent thinking fallback, heartbeat dedupe, reset archive fallback reads, and unknown OpenAI agent selector rejection.

Provider handling also gets a meaningful update. The beta adds GLM-5.2 support and Claude Haiku 4.5 catalog rows, while normalizing provider-qualified model IDs for OpenRouter and Google Vertex paths. Other fixes cover managed SecretRef auth, OAuth image-default routing through Codex, LM Studio binary thinking-off delivery, storeless OpenAI Responses replay gating, and recovery from invalid reasoning or thinking signatures.

The security-adjacent provider item is tool-schema quarantine. The release includes the OpenAI and Anthropic-family schema quarantine work from PRs such as [#92908](https://github.com/openclaw/openclaw/pull/92908), keeping unreadable or post-hook tool schemas from broadening allowed tool choices.

## Usage, Memory, and UI Polish

The `/usage` stack gets a native full footer renderer, default template, fixed-decimal formatting, credential-aware limits, and warnings for broken templates. That turns usage reporting into a more reliable operator surface instead of a brittle template exercise.

Memory and state recovery also improve. The beta splits oversized OpenAI embedding batches before 431 errors, keeps QMD memory search available in transient mode, avoids SQLite WAL on NFS state volumes, preserves full-reindex rollback and cache recovery, and prevents raw Memory Wiki source pages from looking malformed.

The UI and mobile side is quieter but useful: workspace files can start collapsed, WebChat backscroll survives streaming, dashboard session parent lineage is preserved, the desktop session picker stays interactive, and iOS can reconnect stale foreground gateways.

## Release Verification

The official release notes include the npm package URL, registry tarball, integrity hash, release SHA, release publish workflow, npm preflight, full release validation, plugin publish workflows, OpenClaw npm publish workflow, and Telegram beta E2E run.

That verification matters because beta releases move quickly. OpenClaw is not just tagging a commit; the release notes document package publication and downstream plugin checks after registry propagation.

Read the full release on GitHub: [openclaw 2026.6.8-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.6.8-beta.2).
