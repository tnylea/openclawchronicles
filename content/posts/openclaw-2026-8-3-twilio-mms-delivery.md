---
title: "OpenClaw Expands Twilio MMS Delivery Safety"
excerpt: "OpenClaw adds Twilio MMS support, delivery-status tracking, and retry-safe transient media handling for the SMS channel."
coverImage: '/assets/images/posts/openclaw-2026-8-3-twilio-mms-delivery.png'
date: '2026-08-03T23:04:00.000Z'
dateFormatted: August 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-3-twilio-mms-delivery.png'
---

OpenClaw's Twilio SMS channel picked up a full MMS and delivery-observation upgrade in three closely related merged PRs: [PR #118664](https://github.com/openclaw/openclaw/pull/118664), [PR #118665](https://github.com/openclaw/openclaw/pull/118665), and [PR #118994](https://github.com/openclaw/openclaw/pull/118994).

Together, they move the SMS integration from text-only messaging toward a more complete transport: inbound MMS, outbound attachments, carrier delivery status, and retry-safe handling when media downloads fail temporarily.

## MMS Becomes A First-Class SMS Capability

[PR #118664, "feat(sms): add Twilio MMS support"](https://github.com/openclaw/openclaw/pull/118664), teaches the SMS channel to parse bounded Twilio media fields after signature validation. That includes `NumMedia`, `MediaUrlN`, and `MediaContentTypeN`.

The channel now authorizes the sender before downloading media, then applies URL, count, byte, redirect, timeout, and content-type limits. Mixed text/media and media-only inbound messages can enter the normal channel context, while outbound attachments are hosted through the existing public webhook boundary and sent as Twilio `MediaUrl` values.

Text-only SMS behavior remains unchanged. Invalid or oversized media now fails visibly instead of being silently discarded.

## Delivery Status Gets Durable Evidence

[PR #118665, "feat(sms): track Twilio delivery status"](https://github.com/openclaw/openclaw/pull/118665), addresses a separate operator problem. Twilio's synchronous response can prove that a message was accepted or queued, but it does not prove final carrier delivery.

OpenClaw now generates a validated public `StatusCallback` URL when the SMS webhook is reachable. It verifies callback signatures and account ownership, stores bounded account-scoped delivery observations, deduplicates atomically, and exposes recent outcomes through SMS diagnostics.

That means operators can see whether messages were sent, delivered, undelivered, failed, or conflicted, instead of treating provider acceptance as the final answer.

The PR also adds a 3,000-callback-per-minute account-route fuse. Overflow returns HTTP 503 before any durable acceptance marker is written, allowing Twilio's retry behavior to do its job without letting callback floods consume unbounded state.

## Transient MMS Failures Now Retry Correctly

[PR #118994, "fix(sms): retry transient MMS failures before durable adoption"](https://github.com/openclaw/openclaw/pull/118994), closes a sharp edge introduced by MMS media ingestion.

Before the fix, a transient Twilio HTTP 429, 5xx, or transport outage during attachment download could be swallowed before durable adoption. The already-acknowledged callback would be tombstoned, and the attachment would be lost permanently.

The repair classifies only genuine transient media-fetch failures and recognized network or deadline causes as retryable. SSRF and permanent failures such as auth errors, 404s, oversize media, and local-storage failures remain visible permanent degradation.

For transient cases, OpenClaw throws before durable adoption so the existing SQLite sender lane retries the original event, preserves FIFO order, cleans already-downloaded partial attachments, and processes the callback exactly once.

## Evidence

The MMS support PR reports 306 focused tests. The delivery-status PR reports a 314-test SMS suite, plus focused signed-admission and callback-contract proof. The transient-retry PR reports 252 SMS tests and an independent 158-test owner/security rerun.

More importantly, the latest fix used a real HMAC-signed Twilio webhook, an authenticated MMS endpoint, production media fetch, and a SQLite durable queue to demonstrate the before-and-after behavior.

For anyone using OpenClaw over SMS, this is a meaningful capability and reliability step. MMS messages can carry real media, outbound delivery can be observed after provider acceptance, and temporary provider failures no longer have to mean permanent attachment loss.
