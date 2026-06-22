---
title: "OpenClaw 2026.6.10 Beta 2 Adds Fast Talks"
excerpt: "OpenClaw 2026.6.10-beta.2 adds automatic fast mode for short talks, stronger routing, safer session state, and audited release evidence."
coverImage: '/assets/images/posts/openclaw-2026-6-22-v2026-6-10-beta2-release.png'
date: '2026-06-22T23:00:00.000Z'
dateFormatted: June 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-22-v2026-6-10-beta2-release.png'
---

OpenClaw published [v2026.6.10-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.6.10-beta.2), a second beta in the 2026.6.10 line that narrows the release story around fast conversational turns, model-routing correctness, and safer session state.

The release covers 11 merged pull requests since v2026.6.9. That is much smaller than the broad beta covered this morning, but it is still important because it moves a few operator-facing changes from scattered PRs into a tested package with npm evidence, publish workflow links, and a release SHA.

## Fast Mode for Short Talks

The headline feature is automatic fast mode for talks. The release notes say OpenClaw can now enable fast mode for short conversational turns, then return to normal mode for longer runs with bounded fallback and delivery behavior.

That distinction matters for voice, chat, and lightweight command flows. Short exchanges should feel responsive, but a long-running agent turn still needs the normal guardrails: retries, progress events, fallback transitions, and reliable final delivery. The release notes call out PR [#85104](https://github.com/openclaw/openclaw/pull/85104) as the core fast-talks change.

The practical read is that OpenClaw is treating conversational latency as a first-class runtime concern instead of a UI-only polish item. Fast mode is useful only if it does not erase the delivery guarantees that make agent sessions auditable and recoverable.

## Routing and Reasoning Controls

Beta 2 also focuses on model routing. The notes highlight Zai model synthesis, GLM overload failover, and native reasoning-level selection as areas that now follow the active model catalog more consistently.

Those fixes matter because modern OpenClaw deployments often rely on live-discovered provider catalogs instead of a single static model string. If a provider exposes a new GLM or DeepSeek-style route, the channel menu, fallback classifier, and payload builder all need to agree on what that model can do.

The release groups PRs [#94461](https://github.com/openclaw/openclaw/pull/94461), [#93241](https://github.com/openclaw/openclaw/pull/93241), [#94067](https://github.com/openclaw/openclaw/pull/94067), and [#94136](https://github.com/openclaw/openclaw/pull/94136) under that routing theme.

## Session and Policy Safety

The release also includes session and policy correctness work:

- Cron delivery awareness stays attached to the target session.
- Channel switches reset stale per-channel origin fields.
- Trusted tool policies survive hook registry composition.
- Core doctor health checks remain ordered.
- SDK transcript identity targets are available for runtime integrations.

Those are not flashy changes, but they protect the parts of OpenClaw that decide where a reply goes, which policy applies, and whether an operator can trust the recorded transcript.

## Release Evidence

As with recent OpenClaw releases, beta 2 ships with verification metadata. The release page links to the npm package, registry tarball, integrity hash, release SHA `87b40c7160da1e9d470f86520f64ff1642a55b66`, full release CI report, release publish run, npm preflight, full release validation, plugin publish jobs, and Telegram beta E2E coverage.

That evidence is increasingly part of the product story. OpenClaw is a runtime for autonomous tools, so the release process itself has to be inspectable. Beta 2 is a good example of that direction: a smaller package than beta 1, but with a clear focus on conversational speed, catalog-aware routing, and session-bound delivery safety.
