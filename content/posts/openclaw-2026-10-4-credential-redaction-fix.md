---
title: "OpenClaw Patches Long-Text Credential Redaction"
excerpt: "OpenClaw merged a P1 logging security fix so long tool output masks credentials across chunk boundaries and avoids redaction stalls in agent runs cleanly."
coverImage: '/assets/images/posts/openclaw-2026-10-4-credential-redaction-fix.png'
date: '2026-10-04T08:05:00.000Z'
dateFormatted: October 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-4-credential-redaction-fix.png'
---

OpenClaw merged an important P1 logging security fix this morning: [PR #161480, "fix(logging): long tool text could leak unmasked credentials and stall redaction"](https://github.com/openclaw/openclaw/pull/161480). The patch targets the redaction layer that masks sensitive values in agent-processed text before that text can enter model context or telemetry capture.

The problem was not a simple missing pattern. It was a set of long-text failure modes that appeared when credentials landed at awkward offsets, when repeated strings triggered expensive matching behavior, or when very large values pushed the regex engine into a stack overflow.

## What Went Wrong

According to the PR, OpenClaw's bounded redaction path sliced text into chunks. When a credential crossed a chunk boundary, it could fail to match either slice and pass through unmasked. That matters for command output, file content, tool results, and other large payloads where secrets can appear far from the start of the text.

The PR also describes performance failures in the built-in default rules. Some credential patterns could rescan repeated runs over and over, causing multi-second main-thread stalls. Very long values could also throw `RangeError: Maximum call stack size exceeded`, which meant the redaction call failed instead of masking.

## What Changed

The fix moves the built-in default rules to linear matcher generators for complete text scanning. In practice, that means OpenClaw can inspect long payloads without depending on chunk-local regex behavior for the default credential families.

The PR is careful to preserve operator-configured regex behavior. Custom regexes still use the bounded chunked execution path and keep their configured language. The more aggressive internal optimization is reserved for canonical built-in rules whose shapes OpenClaw controls.

The patch covers several practical failure modes:

- Credentials that straddle chunk boundaries
- Long API key or assignment values
- Repeated base64-like and percent-escape runs
- Oversized bearer or password values that previously threw
- Byte-identical behavior for short text under the existing threshold

## Why It Matters

OpenClaw's logging and tool-result surfaces are high-trust boundaries. Operators expect the default redaction rules to hold even when a tool emits a huge response, a command prints a long environment dump, or a file contains secrets at unlucky offsets.

This fix is especially relevant because the PR says finalized tool-result text is documented as masked after middleware and before entering live model context. A boundary miss there is not just noisy logs; it can become sensitive text moving into places it should never reach.

## Verification

The PR includes concrete before-and-after measurements. Examples that previously returned clear text, stalled for seconds, or threw now mask or complete quickly. The author reports 854 logging tests passing, 56 ACP-core tests passing, and new coverage for default rule families at multiple chunk-boundary placements.

There are no new configuration keys and no public API changes. The bottom line is straightforward: OpenClaw's default secret masking is now more reliable on the exact kind of long, messy text agents regularly handle.

For anyone running OpenClaw against shell-heavy, file-heavy, or telemetry-enabled workloads, [PR #161480](https://github.com/openclaw/openclaw/pull/161480) is one to watch for the next release train.
