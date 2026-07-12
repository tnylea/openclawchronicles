---
title: "OpenClaw Retires Flat Streaming Keys"
excerpt: "OpenClaw is moving six channel integrations to nested streaming config, with doctor migrations and SDK warnings for plugin authors."
coverImage: '/assets/images/posts/openclaw-2026-7-12-channel-streaming-config.png'
date: '2026-07-12T23:02:00.000Z'
dateFormatted: July 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-12-channel-streaming-config.png'
---

OpenClaw is cleaning up one of its channel configuration rough edges before the next release train. A newly merged PR retires flat streaming keys across six bundled channel schemas and moves them to the nested `streaming` shape, with `openclaw doctor --fix` handling migrations.

The pull request, `refactor(config): retire flat streaming keys from the last six channel schemas via doctor migration`, targets Signal, IRC, Nextcloud Talk, WhatsApp Web, Google Chat, and Mattermost. The goal is to stop shipping two config dialects for channel streaming behavior.

Source: [OpenClaw PR #105709](https://github.com/openclaw/openclaw/pull/105709)

## What Changed

The affected channels now use nested keys such as `streaming.chunkMode`, `streaming.block.enabled`, and `streaming.block.coalesce`. Mattermost also moves away from its scalar or boolean streaming form and keeps `streaming.mode` inside the nested object.

For bundled channels, schemas now reject the flat keys. Existing configs are not left stranded: the PR adds channel-specific doctor migration contracts so `openclaw doctor --fix` can rewrite the old shape into the new one while preserving behavior.

The migration is not a blind text rewrite. Account seeding follows each channel's merge behavior, and WhatsApp gets custom handling for its `accounts.default` shared layer, including case-insensitive default account resolution.

The change also removes bespoke flat reads from several channel runtime paths and updates documentation across streaming concepts, message concepts, channel pages, and Gateway config references.

## SDK Compatibility

Third-party SDK plugins get a softer landing. The SDK resolver fallback for flat streaming keys remains for one more train, but now emits a once-per-process warning per key. That makes lingering plugin configs visible without breaking every external integration immediately.

The PR explicitly calls out known residual work: Matrix, Feishu, and QQBot still have flat or scalar forms to retire before the fallback-removal train. In other words, this is a major cleanup step, not the final deletion of every legacy spelling.

## Why It Matters

Configuration compatibility work rarely looks glamorous, but it has real operator impact. Multiple config dialects make docs harder to trust, make migrations harder to reason about, and force shared SDK code to carry fallback behavior long after the core product has moved on.

By finishing most bundled channel migrations before these changes ship in a release tag, OpenClaw gives users one migration event instead of a staggered series of small breaking changes. The doctor path is the key part: operators get a canonical config shape without needing to manually audit every channel account by hand.

## Verification

The maintainers reported per-channel semantic review, generated config metadata updates, plugin SDK baseline regeneration, focused tests for doctor contracts and deprecation warnings, and multiple autoreview rounds. The PR also notes that a WhatsApp account-layering issue was caught and fixed during review.

For anyone maintaining OpenClaw channel configs, the message is clear: nested streaming config is becoming the canonical shape. Flat keys are now legacy, visible, and on the way out.
