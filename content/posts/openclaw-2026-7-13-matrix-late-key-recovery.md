---
title: "OpenClaw Fixes Matrix Late-Key Delivery"
excerpt: "OpenClaw now retries exhausted Matrix encrypted-message decryptions when late room keys arrive, restoring delivery without manual restarts."
coverImage: '/assets/images/posts/openclaw-2026-7-13-matrix-late-key-recovery.png'
date: '2026-07-13T08:01:00.000Z'
dateFormatted: July 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-13-matrix-late-key-recovery.png'
---

OpenClaw merged a P1 Matrix fix Monday morning for encrypted rooms where a missing room key could leave messages undelivered until a manual Element login and Gateway restart. The pull request, `fix(matrix): handle event decryption errors during sync`, repairs the retry path for Matrix E2EE events that fail decryption first but become decryptable later.

The bug is subtle and exactly the kind that matters in long-running chat agents. A Matrix room key can arrive after OpenClaw has already exhausted per-event decrypt retries. Before this fix, retrying through the guarded `MatrixClient.decryptEventIfNeeded` path could still no-op after the Matrix SDK marked the event with a failed clear-event state.

Source: [OpenClaw PR #94416](https://github.com/openclaw/openclaw/pull/94416)

## What Changed

The patch moves recovery through the Matrix SDK's event retry path. For retained retry entries, OpenClaw now prefers `MatrixEvent.attemptDecryption(getCrypto(), { isRetry: true })`, falling back only when the event retry API or crypto backend is unavailable.

The PR also updates Matrix tests to cover:

- Exhausted retry entries being requeued after later crypto-key signals.
- The Matrix SDK `clearEvent` and `shouldAttemptDecryption` guard behavior.
- Duplicate crypto signals not starting duplicate in-flight retries.
- Bridge shutdown clearing retained exhausted state.
- The decrypted event reaching OpenClaw's normal `room.message` delivery path.

The implementation does not change Matrix login, auth, provider routing, session storage, wire format, schemas, config defaults, or ordinary fatal sync-error behavior.

## Why It Matters

Matrix E2EE is unforgiving for agents because delivery depends on both channel plumbing and encryption state. If a bot misses a room key on first sync, the user may see an apparently healthy OpenClaw instance that simply never responds to a message.

This fix keeps the retry ownership inside the Matrix decrypt bridge. When a later crypto key signal indicates the missing Megolm room key may now be available, OpenClaw requeues the exhausted event and retries it through the SDK route designed for failed decrypt recovery.

In practical terms, this should reduce a frustrating operator pattern: "open the bot in Element, restart the Gateway, and hope the message catches up."

## Verification

The PR includes both focused regression coverage and a live local Synapse proof. The live proof used a real encrypted Matrix direct room, withheld the bot device's to-device room-key event, drained OpenClaw retries into the exhausted bucket, imported the late room key through Rust Crypto, emitted a Matrix crypto key signal, and observed the original message delivered as `room.message`.

The PR labels it P1 with message-delivery and session-state risk, and ClawSweeper marked the proof sufficient. For Matrix operators, this is a strong reliability fix: late keys now get a recovery path that does not depend on manual restart rituals.
