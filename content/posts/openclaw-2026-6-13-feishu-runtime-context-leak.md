---
title: "OpenClaw Fixes Feishu Runtime Context Leak"
excerpt: "OpenClaw merged a P1 fix for a Feishu privacy leak that exposed runtime context, sender metadata, and relevant memories in streaming card replies."
coverImage: '/assets/images/posts/openclaw-2026-6-13-feishu-runtime-context-leak.png'
date: '2026-06-13T08:01:00.000Z'
dateFormatted: June 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-13-feishu-runtime-context-leak.png'
---

OpenClaw merged a P1 privacy fix today for a Feishu channel bug that could expose internal runtime context in user-visible streaming card replies.

The fix landed in [PR #92593](https://github.com/openclaw/openclaw/pull/92593), which closes [issue #92589](https://github.com/openclaw/openclaw/issues/92589). The reported leak involved Feishu/Lark streaming cards rendering pieces of OpenClaw's system-injected runtime context, including relevant memories, sender metadata, conversation metadata, and system envelope lines.

That matters because runtime context is not ordinary assistant output. It can contain routing hints, memory retrieval results, sender identifiers, and other metadata that helps the agent answer correctly but should remain hidden from the person reading the reply.

## What Was Leaking

The issue report says affected replies could include the runtime context block associated with the immediately preceding user message. The most sensitive part was memory retrieval: relevant memories could include personal information from prior conversations, including information about other users.

The report also called out exposed sender and conversation fields such as names, open IDs, chat IDs, message IDs, sender IDs, timestamps, and channel envelope text.

The bug was reported against OpenClaw `2026.5.28` with the Feishu channel enabled in streaming cards mode. The report described the behavior as intermittent, which is exactly the kind of channel bug that can slip through if sanitization only works on the common rendering path.

## The Root Cause

PR #92593 narrows the root cause to how OpenClaw built hidden runtime context prompt blocks.

According to the PR, `buildRuntimeContextMessageContent` produced a prompt-preface format where the header and notice were recognizable by the stripping code, but the body was not wrapped in the internal context delimiters that `stripInternalRuntimeContext` already knew how to remove.

That meant an echoed runtime context block could be only partially stripped: the recognizable preface could disappear, while the sensitive body remained visible in downstream user-facing surfaces such as Feishu streaming cards.

The patch is deliberately small. It wraps the runtime context body with the existing `INTERNAL_RUNTIME_CONTEXT_BEGIN` and `INTERNAL_RUNTIME_CONTEXT_END` markers, letting the existing stripping path remove the whole block before it reaches users.

## Why a Small Patch Is Important

The changed code adds only a few lines, but it sits on a high-value boundary: the divide between internal agent context and user-visible channel output.

OpenClaw routes messages through many surfaces, including chat apps, web UI, mobile nodes, and plugin channels. The safest pattern is not for every renderer to rediscover how to scrub internal context. The safer pattern is to make internal context recognizable as a complete block, then strip it consistently before any channel presents it.

That is the design this fix reinforces.

## Verification

The PR includes a focused behavior proof. The contributor built a runtime context containing sender metadata, conversation metadata, and a relevant-memories block, then simulated a leaked reply and confirmed that `stripInternalRuntimeContext` removed the sensitive context while preserving normal reply text.

The regression test plan also lists passing coverage for:

- `runtime-context-prompt.test.ts`
- `replay-history.test.ts`
- `sanitizeuserfacingtext.test.ts`
- `internal-runtime-context.test.ts`

The PR notes that a live Feishu gateway with streaming cards was not tested because it requires real channel credentials. That leaves some channel-level residual risk, but the core stripping behavior was verified against the production runtime-context path.

## What OpenClaw Users Should Do

Anyone running Feishu/Lark streaming cards should update once this fix is included in their installed OpenClaw build. Teams using memory retrieval in shared or semi-shared environments should treat this as a meaningful privacy hardening fix, not a cosmetic channel cleanup.

It is also a reminder for operators to think carefully about where memory is enabled. Relevant memories make agents more useful, but they also raise the stakes for output sanitization, channel isolation, and auditability.

The encouraging part is the response speed: the issue was opened on June 13th, PR #92593 was created minutes later, and the fix merged the same morning. For a privacy boundary bug, that is the pace users should want to see.
