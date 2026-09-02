---
title: "OpenClaw Restores Ultra for Native Codex"
excerpt: "OpenClaw configured native Codex account models now expose their account-supported reasoning effort choices, including Ultra."
coverImage: '/assets/images/posts/openclaw-2026-9-2-codex-ultra-native-models.png'
date: '2026-09-02T08:07:00.000Z'
dateFormatted: September 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-2-codex-ultra-native-models.png'
---

OpenClaw merged a Codex integration fix this morning with [PR #136061](https://github.com/openclaw/openclaw/pull/136061), `fix(codex): restore Ultra for configured native account models`. The change repairs a Control UI capability problem for users selecting configured native Codex account models.

The issue affected reasoning effort choices. A configured native account model could lose discovery metadata, especially when it was hidden but explicitly configured. In the Control UI, that meant the model could appear unavailable or show no supported reasoning-effort control, even though the native account advertised capabilities such as Ultra, Maximum, or an explicit no-effort mode.

## What Changed

OpenClaw now treats the native catalog as the owner for capability and readiness metadata. Core prepares normalized configured model references using the existing selected-agent collector. The Codex plugin requests hidden metadata, but publishes only visible models and models explicitly configured for that agent.

The OpenAI plugin then consumes native effort metadata without inventing a host transport or copying static API capabilities into native rows. That distinction matters because native account models are not the same as direct Responses API model rows.

The user-visible result is direct:

- Configured native models expose their actual account-supported effort choices.
- Ultra is available when the account advertises it.
- Models that advertise no reasoning effort remain off-only.
- Other agents' hidden models stay excluded.
- Stale readiness can still be revoked by discovery refresh.

## Why This Matters

Reasoning effort is one of the controls users actually feel. Losing Ultra support in the UI makes a configured model look less capable than it is, and hidden-but-configured rows can look broken even when they are intentionally present in the account catalog.

The PR avoids a brittle shortcut. It does not patch the slider, add model-name exceptions, or publish a static catalog update. Instead, it repairs the discovery and policy path so the native runtime's advertised metadata flows into the UI and effort policy.

That keeps the boundary cleaner: Codex owns native app-server capability discovery, OpenClaw filters it for the selected agent, and the OpenAI policy consumes the published effort metadata.

## Proof From The Merge

The PR includes both regression tests and live UI proof. Pre-fix native-catalog coverage showed the explicitly configured hidden row was absent. Native-policy regressions showed API-less unknown account models ignored Ultra, Maximum, and explicit empty effort metadata.

After the fix, Codex and OpenAI policy tests passed across the affected suites. The changed-file gate passed formatting, production and test type checks, dead-export scans, linting, import-cycle checks, and selected architectural guards.

The live proof used a real isolated development Gateway, separate state directory and port, a real browser, and native Codex 0.151.0. The after state exposed a configured model with `off, low, medium, high, xhigh, max, ultra`, selected Ultra in the slider, and retained it after session reload. A runnable flow with `gpt-5.6-sol` submitted a prompt, received `ULTRA_OK`, and observed native turn-start events with Ultra set.

## Operator Takeaway

PR #136061 restores the Control UI's view of native Codex account capabilities. If your configured native model supports Ultra, OpenClaw can now show and persist that choice instead of hiding it behind incomplete discovery metadata.
