---
title: "OpenClaw Control UI Adds a Reasoning Slider"
excerpt: "OpenClaw's Control UI now replaces a crowded reasoning list with a Faster-to-Smarter slider and quieter composer controls."
coverImage: '/assets/images/posts/openclaw-2026-7-4-reasoning-slider.png'
date: '2026-07-04T08:03:00.000Z'
dateFormatted: July 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-4-reasoning-slider.png'
---

OpenClaw merged [PR #99838, "feat: declutter the Control UI shell"](https://github.com/openclaw/openclaw/pull/99838) just before the July 4th morning scan, continuing the Control UI cleanup that started with the session-first sidebar work.

This pass focuses on the chat composer and model picker. The PR says the chat surface carried chrome that competed with the content: bordered model and usage controls inside an already framed composer, a seven-item reasoning text-button list, and a persistent boxed version pill in the sidebar.

The goal is not a new navigation model. It is a quieter shell around the conversation.

## What Changed

Composer controls now become quieter text controls. The model picker trigger and provider-usage pill lose their filled, bordered treatment at rest, then get a soft hover or open state. The visible trigger shows just the model name unless a reasoning override is active, while accessibility text keeps the full model and level pair.

The bigger change is reasoning selection. Instead of a text-button list, OpenClaw now shows a native range input that runs from Faster to Smarter across the ordered reasoning levels the Gateway offers.

The slider includes stop dots, a filled track segment, a marker for the inherited default, a live value label, and a reset action for returning to the default. The PR says selection commits on release, not on every drag tick.

There are also edge-case fixes. A model with a single reasoning level renders a selectable toggle instead of a useless slider, and models without reasoning levels no longer show a dead Default-only control.

## Sidebar Metadata Gets Quieter

The persistent sidebar version pill is replaced by a slim connection status line with a connection dot and Online or Offline state. The Gateway version is still visible in Settings, where the Quick Settings footer already reports the connected assistant and version.

That moves version metadata out of the primary workspace while keeping it one click away when it is actually needed.

## Why It Matters

Reasoning effort is becoming a normal part of agent operation. If the control is buried in a long list, users have to parse the labels every time. A Faster-to-Smarter slider makes the tradeoff more legible: speed on one side, deeper reasoning on the other.

The quieter composer also helps the chat surface feel less crowded. A model picker, quota signal, reasoning control, connection status, and version metadata are all useful, but they do not need equal visual weight during every conversation.

## Validation

The PR includes before-and-after captures from the mock-Gateway E2E harness. Its validation reports 258 focused tests passing across chat views, model selection state, navigation, app rendering helpers, and responsive chat behavior.

New coverage checks that the slider drives `sessions.patch` with the selected level, that singleton level lists remain selectable, that no-reasoning models do not render a dead control, and that the sidebar no longer shows version text.

The PR also reports clean `tsgo`, `oxfmt --check`, `oxlint`, and Control UI i18n checks. One automated review finding about singleton levels was accepted and fixed with a regression test.

## Bottom Line

OpenClaw's Control UI is getting calmer without hiding the controls operators need. The reasoning slider makes model effort easier to adjust, and the composer/sidebar cleanup reduces visual noise around active sessions.

For daily users, this should make the web UI feel more like an agent workspace and less like a settings panel wrapped around chat.
