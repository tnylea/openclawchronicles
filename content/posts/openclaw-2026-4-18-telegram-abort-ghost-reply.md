---
title: "OpenClaw Patches Telegram Ghost Reply Bug After Session Aborts"
excerpt: "A race condition in OpenClaw's Telegram dispatcher could resurface old replies after a turn was aborted. PR #68100 seals the escape hatches with a per-session abort fence."
coverImage: '/assets/images/posts/openclaw-2026-4-18-telegram-abort-ghost-reply.png'
date: '2026-04-18T08:05:00.000Z'
dateFormatted: April 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-18-telegram-abort-ghost-reply.png'
---

Telegram users running OpenClaw have occasionally seen a strange ghost: after hitting abort, the agent sends the old reply anyway — or leaves stale reactions pinned to a message that was already superseded. [PR #68100](https://github.com/openclaw/openclaw/pull/68100) by **rubencu**, merged April 18th, tracks down every escape hatch and seals them.

## The Problem: A Race With Two Lanes

Telegram routes normal message traffic and abort commands through **separate control lanes**. That's by design, but it creates a window where an abort can overtake a reply that's already in flight.

The failure sequence looks like this:

1. Turn A starts — the agent begins composing a reply, possibly showing a preview
2. Turn B arrives on Telegram's control lane and aborts the active run
3. Telegram correctly displays ⚙️ *Agent was aborted.*
4. Stale finalization work from Turn A is still in flight — and it completes anyway, sending the old answer or leaving stale reactions behind

The bug had four distinct escape hatches, all in `extensions/telegram/src/bot-message-dispatch.ts`:

- **Pre-dispatch async work** could delay fence registration long enough for an abort to land and clear before the guard existed
- **Queued draft-lane callbacks** could miss an abort that arrived while they were waiting
- **Pre-dispatch setup errors** could exit before the `finally` cleanup, leaking abort-fence state for the session
- **Superseded cleanup** could still call `stream.stop()`, which final-flushes hidden short partials into a brand-new stale preview

## The Fix: A Per-Session Abort Generation Fence

The solution is a session-scoped generation counter keyed by `CommandTargetSessionKey` (falling back to `SessionKey`, then chat/thread). Here's the approach:

- **Fence is registered before any awaited pre-dispatch work** — no more window where an abort can land before the guard is in place
- **Only abort requests increment the generation** — normal replies don't interfere with each other
- **Stale same-session work becomes a no-op** after supersession, covering queued callbacks, late previews, final delivery/edit paths, and fallback sends
- **Supersession is re-checked after draining queued draft-lane work** so cleanup sees aborts that landed during the drain
- **Pre-dispatch errors release the fence** instead of leaking per-session state on throw
- A new **non-flushing `discard()` shutdown** prevents superseded hidden partials from materializing into stale previews

## Test Coverage

The PR adds comprehensive coverage to `bot-message-dispatch.test.ts`:

- Same-session abort suppresses stale old answer finalization
- Different-session abort does **not** suppress the older answer (important isolation case)
- Same-session abort on the control lane still supersedes via `CommandTargetSessionKey`
- Aborts during async pre-dispatch work still fence the older reply
- Aborts during queued draft-lane drain don't clear an already-visible preview
- Hidden short partials are discarded, not flushed, after abort

Plus new tests in `draft-stream.test.ts` covering the `discard()` behavior.

## What Changes for You

If you use OpenClaw over Telegram, this fix:

- Eliminates ghost replies appearing after you abort a turn
- Clears stale "thinking" or reaction states properly
- Keeps multi-session setups isolated — other sessions' aborts don't bleed over

No config changes required. The fix is scoped entirely to Telegram's dispatcher and does not touch shared reply or runtime contracts.

Track the release on [GitHub](https://github.com/openclaw/openclaw/releases) or pull from main if you need this immediately.
