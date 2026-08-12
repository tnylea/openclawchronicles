---
title: "OpenClaw Removes New Chat Startup Stalls"
excerpt: "OpenClaw merged a P1 startup fix that moves title generation after the first turn and avoids cold model catalog work on new chats."
coverImage: '/assets/images/posts/openclaw-2026-8-12-new-chat-startup-stalls.png'
date: '2026-08-12T08:01:00.000Z'
dateFormatted: August 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-12-new-chat-startup-stalls.png'
---

OpenClaw merged a P1 performance fix for new chat creation and first-turn dispatch. [PR #122471](https://github.com/openclaw/openclaw/pull/122471), titled "fix: remove new-chat startup stalls," targets a delay path where cosmetic title work and cold runtime preparation could block the user from getting a response.

The fix is especially relevant for Control UI users who create new dashboard chats or managed-worktree sessions. Those actions could previously wait on title generation and model catalog preparation before the actual user turn had a chance to run.

## The Startup Problem

The PR identifies two related stalls. First, managed-worktree creation synchronously awaited a model-generated title. Second, dashboard chats started title runtime work before dispatching the user's turn. On top of that, turn startup and isolated completions eagerly built a live model catalog, repeatedly scanning plugin metadata.

That combination made a new chat feel slower than it needed to be. The user-facing work was simple: create a session and answer the first prompt. But OpenClaw was also doing naming and catalog preparation in the hot path.

The PR includes timing evidence from a managed Gateway. Before the fix, an ordinary `sessions.create` call took just over five seconds, and prepared-runtime startup consumed about 25 seconds. CPU profiling attributed much of that time to repeated filesystem checks while building and normalizing the catalog.

## What Changed

The merged change moves title generation out of the blocking path. `sessions.create` no longer runs title inference synchronously. Dashboard title generation is scheduled after the accepted user turn finishes, so the title can still appear without delaying the answer.

Model selection also avoids unnecessary live catalog work. Turns and exact-model isolated completions use prepared static catalogs, while the full live catalog stays lazy for consumers that need control-plane metadata.

The result is a cleaner split:

- Start the session quickly
- Dispatch the user's turn
- Answer first
- Generate cosmetic title metadata afterward
- Keep expensive live catalog work out of ordinary turn startup

## Why This Matters

New chat latency is one of those details that shapes trust. If the first interaction hangs, users assume the agent or Gateway is unstable even when the eventual answer is correct. Moving decorative work after the first completed turn is a straightforward product improvement: the interface can still become polished, but not at the expense of responsiveness.

The maintainers reported post-fix server-side `sessions.create` timing in the hundreds of milliseconds during instrumentation, with model selection loading its manifest catalog in 70ms. Final exact-head proof showed the user turn completing independently while title generation happened later.

## The Bottom Line

This is a good example of OpenClaw hardening the feel of the product, not just the runtime internals. [PR #122471](https://github.com/openclaw/openclaw/pull/122471) removes startup work that did not belong in front of the user's first response, making new chats feel more direct and less brittle.

For anyone running OpenClaw through Control UI, the practical takeaway is simple: new conversations should start faster, and title generation should no longer compete with the first real turn.
