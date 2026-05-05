---
title: "OpenClaw Patches Hidden Latency Bug in Modern Codex Models"
excerpt: "Every agent turn with gpt-5.5 or gpt-5.4 was burning a silent extra API call. PR #71980 fixes the thinking-level enum mismatch for good."
coverImage: '/assets/images/posts/openclaw-2026-4-26-codex-thinking-minimal-fix.png'
date: '2026-04-26T08:00:00.000Z'
dateFormatted: April 26th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-26-codex-thinking-minimal-fix.png'
---

If you have been running OpenClaw with a modern Codex model — gpt-5.5, gpt-5.4, gpt-5.4-mini, or gpt-5.2 — every single agent turn has been paying a hidden tax: a wasted API request followed by a silent retry. Merged on April 26, 2026, [PR #71980](https://github.com/openclaw/openclaw/pull/71980) by contributor hclsys closes that gap for good.

## The Root Cause

OpenClaw's CLI defaults to `--thinking minimal` when no thinking level is specified. The Codex extension passes that string through to the app server via `resolveReasoningEffort()`, which then forwards it to the model provider unchanged.

Older Codex models accepted `minimal` as a valid thinking level. Modern Codex models — the gpt-5.x family — do not. They expect one of five values: `none`, `low`, `medium`, `high`, or `xhigh`. Send them `minimal` and the provider rejects the request:

```
Unsupported value: 'minimal' is not supported with the 'gpt-5.5' model.
Supported values are: 'none', 'low', 'medium', 'high', and 'xhigh'.
```

## The Silent Retry Loop

OpenClaw already had a safety net: the `pi-embedded-runner` catches this rejection and re-runs the turn using `low` instead. So users saw correct results — but the fix was invisible. Every turn was spending one full round-trip to the API just to receive a rejection, then paying the latency and token overhead of a second request to actually do the work.

In a short interactive session this is tolerable. In autonomous setups or cron-driven agents running dozens of turns, it compounds fast. The [issue reporter](https://github.com/openclaw/openclaw/issues/71946) explicitly called out the retry loop and nominated provider-side adapter translation as the right fix.

## What Changed

The fix lands in `thread-lifecycle.resolveReasoningEffort` at **request build time**, before anything leaves OpenClaw:

- If the model is a modern Codex model — detected via the existing `isModernCodexModel()` helper in `provider.ts` — `"minimal"` is mapped to `"low"`.
- All other models continue to receive `"minimal"` unchanged.
- The retry fallback stays in place as belt-and-suspenders for any future enum changes.

The PR ships 16 new test cases covering modern-model translation, legacy preservation, case-variant model IDs, and non-effort thinking level values. It also exports the `isModernCodexModel` helper from `provider.ts` so `thread-lifecycle` can import it cleanly.

## Who Is Affected

You are impacted if all three of the following are true:

- You run OpenClaw with the Codex extension
- Your configured model is `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, or `gpt-5.2`
- You have not explicitly overridden `--thinking` to a non-`minimal` value

If you fall into this group, every agent turn until now has been paying a wasted first request. After this fix lands in a release, that overhead disappears automatically.

## When to Expect It

This fix will be bundled into the next formal OpenClaw release. If you want it today, build from `main`. The relevant commit is in [PR #71980](https://github.com/openclaw/openclaw/pull/71980).

## The Bottom Line

This is one of those quiet quality-of-life fixes that pays dividends over thousands of agent turns. It saves a real API call per turn, reduces latency for every modern Codex interaction, and eliminates unnecessary retry noise in logs. For anyone running autonomous agents with the gpt-5.x family, this is a meaningful improvement — and it required zero user-facing configuration changes to deliver it.
