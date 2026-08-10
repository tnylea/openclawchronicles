---
title: "OpenClaw Tightens Claude Live Exec Restrictions"
excerpt: "OpenClaw fixed a P0 Claude live-session policy gap so native tool approvals honor global, agent, and session exec restrictions."
coverImage: '/assets/images/posts/openclaw-2026-8-10-claude-live-exec-restrictions.png'
date: '2026-08-10T23:01:00.000Z'
dateFormatted: August 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-10-claude-live-exec-restrictions.png'
---

OpenClaw merged a P0 security-boundary fix tonight for Claude live sessions. [PR #121678](https://github.com/openclaw/openclaw/pull/121678) repairs a policy gap where live-session native tool approval could ignore restrictive exec settings in some configurations.

The issue was specific but serious: a Claude live session could allow a native tool call even when the session was configured with `execSecurity=deny`, or when a partial per-agent exec block should have inherited a stricter global policy.

## What changed

The bug came from policy drift. Claude live-session approval had its own exec-policy resolution path. That path could replace a global block with a partial agent block, miss the session-level override, and then fill missing values with permissive defaults.

The merged fix moves Claude live native-tool approval back onto OpenClaw's canonical `resolveExecDefaults` flow. That shared path preserves the intended precedence:

- global defaults
- per-agent settings
- session-level overrides
- approval behavior

The PR also removes the duplicate resolver and an obsolete test-only accessor, reducing the chance that the Claude live path drifts again from the shared exec-policy owner.

## Operator impact

For operators, this is the kind of fix that matters more than its line count suggests. Exec policy is one of the highest-trust boundaries in an agent runtime. If a session says native execution is denied, live provider features have to respect that same rule.

After this change, a Claude live session marked `deny` stays denied. A partial agent override no longer wipes out a stricter global security policy. That keeps live sessions aligned with the rest of OpenClaw's native-tool approval behavior.

The fix is especially relevant for teams using Claude live sessions alongside per-session controls, stricter global defaults, or mixed agent profiles. Those setups are exactly where a duplicate policy resolver can create surprising behavior.

## Evidence from the PR

The PR includes a pre-fix reproduction where two tests in `src/agents/cli-runner.spawn.test.ts` expected `deny` and received `allow`. After the fix, that suite passed 130 tests.

The author also ran owner and sibling policy proof across `src/agents/exec-defaults.test.ts` and `src/agents/cli-runner/claude-live-session-policy.test.ts`, with 17 tests passing. Targeted formatting, linting, and diff checks passed, and structured Codex autoreviews reported no actionable findings.

There was one live-proof limitation: an isolated loopback Gateway persisted the target session row with `execSecurity=deny`, but the end-to-end live turn did not reach Claude because unrelated prepared model-runtime startup did not converge before supersession. The PR therefore relies on exact-head CI as the broad gate.

## Why this is worth a security note

OpenClaw is increasingly a multi-provider runtime. That makes consistency across provider-specific live paths critical. A policy that works in one code path but not another is exactly the kind of gap operators cannot reasonably audit by hand.

By centralizing Claude live-session approval on the same exec-default resolver as the rest of the runtime, OpenClaw reduces that burden. The takeaway is direct: live Claude tool calls now honor the configured exec restrictions instead of using a looser parallel policy path.
