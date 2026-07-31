---
title: "OpenClaw Preserves Outbound Message Policy"
excerpt: "OpenClaw now stores post-policy outbound batches before queueing, protecting recovered sends from stale redactions or repeated side effects."
coverImage: '/assets/images/posts/openclaw-2026-7-31-outbound-modifier-recovery.png'
date: '2026-07-31T08:01:00.000Z'
dateFormatted: July 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-31-outbound-modifier-recovery.png'
---

OpenClaw merged an important Gateway reliability and security-boundary fix this morning. [PR #116632](https://github.com/openclaw/openclaw/pull/116632), titled `fix: preserve outbound modifiers across recovery`, changes how durable outbound messages survive a restart after channel policy has already run.

The bug was subtle but risky. When a send recovered after a Gateway restart, OpenClaw could rerun `reply_payload_sending` and `message_sending` modifiers instead of replaying the already-approved post-policy output. That created three bad possibilities: content that had been cancelled could become eligible again, redacted content could be transformed differently, and plugin side effects could run more than once.

For an assistant that can talk through Slack, Telegram, Discord, email-style channels, and other message surfaces, outbound recovery is part of the trust boundary. A restart should not become a second chance to reinterpret what was allowed to leave the system.

## What Changed

The new design creates a versioned, typed post-policy batch before the outbound queue takes ownership. Recovery then resumes from that committed batch instead of reconstructing policy decisions from a live plugin/config environment that may have changed.

That matters because modifiers are allowed to do real work:

- redact sensitive text before delivery
- cancel a message entirely
- rewrite content for a channel-specific format
- emit audit or side-effect hooks

After this PR, a recovered send keeps the same policy result that existed when OpenClaw first accepted the outbound action. The queue can still deliver durably, but it does not reopen the policy decision.

## Why Operators Should Care

Durable messaging is useful only if it is deterministic. If a user approves or triggers an outbound response, and then the Gateway restarts, the resumed delivery path should honor the original decision rather than whatever the world looks like after boot.

This is especially important for redaction and cancellation flows. A plugin update, config change, or restarted process should not make a previously blocked message sendable. It should also not repeat external side effects just because the delivery queue had to replay.

The PR carries `P1`, `merge-risk: security-boundary`, and `merge-risk: compatibility` labels, which is the right framing: the visible feature is reliable recovery, but the core improvement is making outbound policy a committed artifact instead of a recomputed guess.

## Validation

The PR reports sufficient proof and lands as a large Gateway change. Its source description says the recovered send now uses a single precomputed post-policy batch before canonical queueing. That gives OpenClaw a cleaner recovery contract: decide once, persist the decision, then deliver exactly that decision.

For anyone running OpenClaw in production channels, this is a worthwhile hardening update. Restarts are normal. Policy drift during recovery should not be.
