---
title: "OpenClaw Stops False No-Reply Channel Notices"
excerpt: "OpenClaw now recognizes successful message-tool sends to the current conversation, avoiding misleading no-reply fallbacks."
coverImage: '/assets/images/posts/openclaw-2026-7-30-message-tool-reply-receipts.png'
date: '2026-07-30T23:04:00.000Z'
dateFormatted: July 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-30-message-tool-reply-receipts.png'
---

OpenClaw merged a channel-delivery fix tonight for a confusing automatic-mode edge case. [PR #116560](https://github.com/openclaw/openclaw/pull/116560), titled `fix(outbound): recognize current-source message-tool sends`, teaches the shared outbound runner to count a successful `message.send` to the exact source conversation as a real reply.

Before this change, an agent could use the message tool to send a valid response back to the current Slack conversation or a Discord thread adopted during the active turn. The user would receive the response, but OpenClaw could still append a misleading no-visible-reply fallback because the send was not classified as satisfying the source reply.

That is a small accounting bug with a very visible symptom: the system says nothing was sent after it already sent something.

## How Receipts Work Now

The shared outbound runner now records successful, authorized sends to the current source in every reply mode. Core and plugin-backed `message.send` transports use the same route and receipt classifier, so the behavior is channel-agnostic.

Discord keeps one narrow adapter for mid-turn adopted threads, where the newly created route does not exist in the original turn context. Generic Discord sends, uploads, and thread replies reuse that active route only after a positive runtime delivery receipt.

The PR is intentionally receipt-based rather than token-based. A successful send to the current conversation can suppress the fallback. A failed send, a send to another account, or a send to an unrelated thread must leave the fallback eligible.

## Why Operators Should Care

Automatic-mode channel behavior is trust-sensitive. Users need to know whether an agent answered, stayed silent, or failed. A false no-reply notice after a successful answer creates noise and can make operators chase a failure that did not actually happen.

The fix also mirrors confirmed automatic-mode current-source sends into Control UI chat history, so the browser view aligns with what happened in the channel.

## Validation

The PR reports a red-to-green Slack reproduction: automatic-mode `message.send` to a trusted current conversation failed before the shared change and passed afterward. It also includes projection-level coverage showing the successful Slack receipt in Control UI history.

Additional tests cover shared downstream source-reply classification, Discord adopted-thread behavior, and negative controls for other accounts, other threads, unrelated targets, failed adopted-thread results, and unconfirmed projection routes. The latest focused Blacksmith Testbox proof passed 54 tests, with formatting and diff checks clean.

For teams using OpenClaw across Slack, Discord, and other message surfaces, this is one of those fixes that makes the assistant feel less haunted: when it replied, the platform now knows it replied.
