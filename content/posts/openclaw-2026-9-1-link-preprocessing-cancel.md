---
title: "OpenClaw Cancels Link Preprocessing on Stop"
excerpt: "OpenClaw reply cancellation now reaches link fetches and processors, preventing stopped replies from continuing into hooks."
coverImage: '/assets/images/posts/openclaw-2026-9-1-link-preprocessing-cancel.png'
date: '2026-09-01T08:04:00.000Z'
dateFormatted: September 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-1-link-preprocessing-cancel.png'
---

OpenClaw merged a P1 reply-lifetime fix this morning for link understanding and configured preprocessing. [PR #132883](https://github.com/openclaw/openclaw/pull/132883), `fix(link-understanding): cancel preprocessing with reply lifetime`, closes a gap where stopping a reply could still leave link work running or allow later hooks to start after cancellation.

The change is aimed at a very practical operator expectation: when a reply is stopped, the work owned by that reply should stop too. That now includes guarded HTTP link fetches, configured link processors, and the final boundary before pre-agent hooks and session routing.

## The Failure Mode

The PR describes three related problems. Link preprocessing could continue fetching a response body after a reply had been stopped. A configured processor wrapper could be canceled while its child process survived. A cleanup-window race could also allow hooks and session routing to begin after the reply was already canceled.

That is the kind of bug that can make a stopped turn feel less final than it should. Even if the visible answer is gone, background fetches or processors may still be consuming resources, and later side effects could start from a turn the operator already canceled.

## What Changed

OpenClaw now passes the existing reply-owned `AbortSignal` through the link context adapter, guarded HTTP fetch, and configured command runner. The command runner uses its existing process-tree termination owner, so ordinary child processes share the cancellation lifetime.

After preprocessing finishes, the reply owner checks cancellation immediately before pre-agent hooks. If the reply was canceled during asynchronous cleanup, OpenClaw raises the canonical abort error with the original cause instead of continuing into hooks, session initialization, or routing.

The PR says ordinary link timeouts still recover to the next link, and existing protections remain in place:

- SSRF guards.
- Bounded reads.
- Argument-based command execution.
- Prepared model text enrichment from current main.
- Existing cancellation ownership for runners and transports.

The result is narrower and more predictable: stop cancels reply-owned preprocessing, while normal recoverable per-link failures still behave like recoverable link failures.

## Why It Matters

OpenClaw agents often run inside long-lived channels where links, page summaries, and configured processors can add useful context. Those same capabilities need strong lifetime ownership. A canceled reply should not keep fetching, keep processing, or later enter the agent hook pipeline.

This fix strengthens that boundary without adding a new user-facing setting. Operators do not need to configure a new timeout or rewrite workflows. The existing stop action now reaches more of the work that was already logically part of the reply.

## Proof From The Merge

The PR includes failure-first evidence. The original contributor head passed its existing link tests, but an independent real Node wrapper/worker reproduction left a worker alive 500 ms after cancellation. Using the process-tree termination owner repaired that leak.

A separate regression on unchanged published head reproduced the cleanup race: preprocessing resolved after a custom abort, returned a reply, and invoked hooks, session initialization, and routing. The repaired code passed both resolved and rejected cancellation cases while preserving the custom cause and ordinary failure recovery.

Final integration passed 119 runtime tests covering link/transport, process-owner, and reply-entrypoint behavior, with one Windows-only skip. Real streaming HTTP cancellation closed the connection in 8 ms, timeout-to-next-link recovery completed in 1055 ms, and a processor descendant exited in 383 ms. Hosted CI for the integrated head passed with 246 checks and the required gate green.

## Operator Takeaway

This is a lifecycle repair for anyone relying on stop to mean stop. OpenClaw now carries reply cancellation through link fetches and processors, then fences the final hook/session boundary so a canceled preprocessing path cannot continue into a new agent turn.
