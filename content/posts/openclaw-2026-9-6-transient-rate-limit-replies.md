---
title: "OpenClaw Keeps Rate-Limit Retries in One Reply"
excerpt: "OpenClaw keeps transient rate-limit retries inside one live reply, preserving tools and media while preventing split recovered answers in chat history."
coverImage: '/assets/images/posts/openclaw-2026-9-6-transient-rate-limit-replies.png'
date: '2026-09-06T08:10:00.000Z'
dateFormatted: September 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-6-transient-rate-limit-replies.png'
---

OpenClaw has merged a chat recovery fix for transient provider failures and rate limits. [PR #139465](https://github.com/openclaw/openclaw/pull/139465), "fix: keep rate-limit retries transient and prevent split chat replies," landed at 07:22 UTC on September 6, 2026.

The problem was visible where users feel it most: a recovered Control UI answer could be split into partial messages, while failed attempts left permanent assistant error rows. That makes a temporary provider issue look like a broken conversation, even when the final answer eventually succeeds.

This PR keeps those retries inside one logical run. The user should see a working retry state and then a single recovered reply, not a trail of failed fragments.

## What Changed

OpenClaw now buffers failed partial text and diagnostics for transient attempts. Tool calls and media facts are still preserved through the canonical transcript append path, but failed plain-text fragments are discarded when recovery succeeds.

If recovery does not succeed, terminal failure remains visible with the final diagnostic and latest partial text. That keeps real failures inspectable while preventing successful retries from leaving stale error clutter behind.

The retry limits are bounded. Rate limits can make at most ten total attempts, while smaller explicit `retry.provider.maxRetries` settings are honored. Other transient provider failures keep the existing eight-retry and 90-second policy. Cancellation remains effective during long waits.

The UI protocol addition is intentionally optional. A working status can carry retry details with an attempt count, maximum attempts, and a `rate_limit` reason. Existing clients can still show ordinary working status.

## Why It Matters

Provider rate limits are not rare. They are part of real-world agent operation, especially when an assistant is doing tool-heavy or media-heavy work.

The important thing is whether OpenClaw treats a temporary failure as a temporary failure. This merge makes that behavior clearer:

- Recovered replies stay as one reply.
- Failed attempts do not leave stray text or error rows.
- Tools and attachments survive recovery and transcript replay.
- Terminal errors remain visible when recovery truly fails.
- Delayed stale output cannot erase a genuine final failure.

That combination is especially useful for long-running tasks. A transient provider event should not make the transcript misleading, and it should not force the user to guess which partial answer is the real one.

## Evidence From The PR

The PR reports 1,322 focused tests across 44 files on the final base, plus an unfiltered changed-file gate covering typechecks, lint, repository guards, and 1,121 native, tooling, and boundary tests. Exact-head GitHub CI completed green.

The before-and-after proof includes retry parsing, Gateway status, gateway-client and UI sequence behavior, stale delta handling, and recovered final replies. Several regressions are explicitly called out as failing before their corrections, including oversized retry floors and stale or equal event sequences reopening diagnostics.

The release-note summary captures the practical result: keep rate-limit retries transient, preserve tool and media facts across recovery, prevent split live replies, and hide recovered historical attempt errors.

For users, that means fewer confusing chat histories when the provider is briefly overloaded. For operators, it keeps recovery behavior bounded and observable without adding a new configuration surface or database migration.
