---
title: "OpenClaw Enforces the Web Search Kill Switch"
excerpt: "OpenClaw now keeps globally disabled web search off in Chat and New Session, even when stale session overrides are still present in older saved sessions."
coverImage: '/assets/images/posts/openclaw-2026-9-10-web-search-disable-kill-switch.png'
date: '2026-09-10T08:03:00.000Z'
dateFormatted: September 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-10-web-search-disable-kill-switch.png'
---

OpenClaw has closed a UI gap around globally disabled web search.

[PR #121557](https://github.com/openclaw/openclaw/pull/121557), titled `fix(ui): honor global web-search disable as session kill switch`, merged on September 10th at 07:54 UTC. The fix makes the Chat and New Session composers respect `tools.web.search.enabled: false` consistently.

Before the change, users could still appear to turn web search on in the UI even when the global setting disabled it. Existing Chat sessions could send an enable request or display an older `webSearch: true` override as active. The Gateway already stripped new enable overrides and kept runtime search disabled, but the composer state could still tell the wrong story.

## What Changed

The shared menu now applies the global setting to both display and selection. When web search is globally off, the composers keep the checkbox off and explain the global setting.

The fix also handles stale state carefully. If an old session still has a web-search enable override, the UI permits one authorized clear. Explicit suppression and sibling settings are preserved, and normal global-on toggles continue to work when the global kill switch is not active.

The important behavior is direct:

- Chat cannot re-enable web search when the global setting disables it.
- New Session follows the same rule.
- Existing stale `webSearch: true` overrides no longer display as active capability.
- Users can clear old enable overrides once.
- Permissions, connectors, skills, managed search-disable controls, native search-disable controls, and offline behavior remain intact.

## Why It Matters

Global tool settings are trust boundaries. When an administrator or local operator disables web search, the interface should not imply that a session can casually turn it back on.

Even if the Gateway already rejects the request, a misleading composer still creates confusion. Users may think a model has live web access when it does not. Operators may think a policy is weaker than it is. In regulated or private environments, that ambiguity is enough to erode confidence.

This PR aligns the UI with the runtime rule. The composer now treats the global setting as the source of truth and keeps session-level controls inside that boundary.

## Validation

The PR reports a built-Gateway Chromium reproduction against pinned main before the fix. The rebuilt UI then passed real-Gateway cases covering omitted, false, and stale overrides, plus New Session behavior, global-on toggles, and offline behavior.

The author also reports 64 product and capability tests, 45 workflow and test-partition checks, formatting, focused lint, UI build, translations, workflow checks, and changed documentation checks. The proof did not require a search provider or model call.

This is a small but important policy-consistency repair. OpenClaw's Gateway was already enforcing the global web-search setting; now the composer makes that enforcement visible and harder to misunderstand.
