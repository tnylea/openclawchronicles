---
title: "OpenClaw Fixes Empty Agent Model Pickers"
excerpt: "OpenClaw's Control UI now refreshes configured model catalogs for cold secondary agents, helping multi-agent teams avoid empty model pickers in setup."
coverImage: '/assets/images/posts/openclaw-2026-8-28-model-picker-agent-catalog.png'
date: '2026-08-28T08:10:00.000Z'
dateFormatted: August 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-28-model-picker-agent-catalog.png'
---

OpenClaw's Control UI picked up a practical model-management fix in PR [#131151](https://github.com/openclaw/openclaw/pull/131151). The repair targets cold secondary agents whose configured provider has available models, but whose picker could still appear empty after an explicit refresh.

That is a frustrating class of bug because the provider is not actually missing models. The UI simply reused prepared startup facts instead of invoking the selected agent's catalog discovery owner. For users running multiple agents with different providers or model policies, the result was a model picker that looked like a dead end.

## The Failure Mode

The PR describes the affected path as an explicit configured refresh. A secondary agent could start with zero models in its metadata. When the user refreshed its configured catalog, OpenClaw did not make the provider request needed to discover that agent's available models.

The visible result was an empty model picker and a "No models available" state, even though the selected agent's provider was capable of returning chat models.

This matters because OpenClaw is increasingly a multi-agent system. The default agent's catalog is not enough. A secondary agent may have its own configured provider, runtime route, or policy. The UI needs to ask on behalf of the selected agent, not accidentally fall back to stale or unrelated startup data.

## The Fix

Explicit configured refreshes now route through the selected agent's prepared-runtime discovery owner. Once the discovery completes, the Control UI caches the complete configured-catalog result, including provider outcomes, and reuses it on the Models page.

The PR also preserves important lifecycle behavior:

- The default agent remains isolated from the secondary agent's catalog.
- Later implicit configured reads can reuse the completed result.
- Shared requests remain active until the final subscriber cancels.
- An immediate replacement starts a fresh producer.
- No extra all-catalog request is added.

That last point is useful. The fix does not paper over the issue by asking every provider for everything. It repairs the selected-agent ownership boundary and keeps the request shape focused.

## What Users Should Notice

Users opening the picker for a cold secondary agent should now see the models that agent can actually use. The PR's real-Gateway proof used OmniRoute and showed the before-and-after clearly: before the repair, the refresh made no provider request and returned zero models; after the repair, the same refresh discovered and displayed 311 chat-capable models for the secondary agent.

The default agent stayed at zero in that test, which is a good sign. The fix discovers the right catalog without leaking it into the wrong agent's metadata.

## Verification Notes

The PR reports focused Gateway tests, model catalog and Models page tests, real-browser end-to-end tests, changed-file checks, and `git diff --check`. It also includes real provider evidence from a live catalog response.

For OpenClaw operators who keep separate agents for different jobs, this is a meaningful Control UI repair. Model selection should now reflect the chosen agent's configured provider instead of getting stuck on an empty cold-start view.
