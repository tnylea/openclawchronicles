---
title: "OpenClaw Control UI Replies Honor Outbound Hooks"
excerpt: "OpenClaw Control UI replies now run the same outbound plugin hooks used by other reply surfaces before content becomes visible."
coverImage: '/assets/images/posts/openclaw-2026-7-27-control-ui-outbound-hooks.png'
date: '2026-07-27T23:10:00.000Z'
dateFormatted: July 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-27-control-ui-outbound-hooks.png'
---

OpenClaw merged an important Control UI consistency fix tonight in [PR #114351, "fix: honor outbound hooks in Control UI chat replies"](https://github.com/openclaw/openclaw/pull/114351). The change makes Control UI replies follow the same outbound plugin contract that operators expect from other reply paths.

Before this patch, Control UI chat replies could run `reply_payload_sending` but bypass `message_sending`. That meant a plugin could rewrite or cancel a message for other surfaces, yet see Control UI content become visible in WebChat and durable in chat history without the same final policy pass.

Media-only cancellation had a similar gap. A policy plugin could intend to cancel an outbound media projection, while durable or visible state still reflected content that should have been suppressed.

## What Changed

The core auto-reply owner now has an internal projected-dispatch mode that composes both modifying hooks before delivery. Gateway passes the delivery and capture options into that owner, so WebChat capture and transcript-media side effects stay behind the cancellation decision.

The public Plugin SDK surface did not change. The PR explicitly avoids changing shipped Plugin SDK constructors, protocol, config, or storage. Instead, it makes the existing contract apply in the Control UI path where it previously did not.

The accepted policy decision is direct: Control UI chat is an outbound reply surface, so it should honor the established outbound hook contract.

## Operator Impact

For plugin authors and operators, the behavior is now easier to reason about:

- `message_sending` handlers can rewrite Control UI replies before they appear.
- Rewritten content becomes the exact visible and durable content.
- Text cancellation produces no assistant message, preview, or history entry.
- Media-only cancellation also avoids durable transcript-media side effects.
- Hook exceptions remain best-effort and fail open, so a broken plugin does not suppress the reply.

That gives policy plugins one clear place to enforce outbound rules. If a plugin rewrites sensitive wording, appends required disclosure text, or cancels a reply based on policy, Control UI now follows that result instead of creating a mismatch between visible state and durable history.

## Why It Matters

Control UI is not a side channel for operators. It is one of the main places people inspect, steer, and reply through OpenClaw. If it bypasses outbound policy, organizations have to treat it differently from Slack, Telegram, Matrix, or other message surfaces.

This fix reduces that mental tax. The same outbound contract applies whether a reply is headed through a provider-owned finalization path, a core-managed transport, or the Control UI chat flow.

## Verification

The PR includes live before-and-after evidence on a frozen base with a real built Gateway, production plugin loader, built Control UI, Chromium, and isolated state. Before the fix, test rows ran `reply_payload_sending` but never ran `message_sending`; rewritten and forbidden content could still appear and persist.

After the fix, rewrites flowed through `reply_payload_sending` and `message_sending`, and the exact composed content appeared and persisted. Text and media-only cancellation each ran both hooks and left assistant counts unchanged in the UI and chat history.

The maintainers also reran a sibling matrix on exact head covering Control UI with no hooks, Control UI with throwing hooks, the legacy Plugin SDK dispatcher, Matrix media replies, Telegram provider-owned finalization, and Telegram durable sends.

## Bottom Line

[PR #114351](https://github.com/openclaw/openclaw/pull/114351) closes a policy gap in OpenClaw's Control UI reply path. Outbound plugin hooks now get a consistent chance to rewrite or cancel content before it becomes visible or durable.
