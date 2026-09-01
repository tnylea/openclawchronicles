---
title: "OpenClaw Clarifies iMessage Bridge Timeouts"
excerpt: "OpenClaw iMessage sends now report actionable bridge-repair guidance when the private-API helper stops answering."
coverImage: '/assets/images/posts/openclaw-2026-9-1-imessage-timeout-guidance.png'
date: '2026-09-01T23:07:00.000Z'
dateFormatted: September 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-1-imessage-timeout-guidance.png'
---

OpenClaw merged a high-priority iMessage repair tonight with [PR #134572](https://github.com/openclaw/openclaw/pull/134572), `fix(imessage): sends keep failing with an opaque timeout after the private-API bridge dies`. The change addresses a frustrating failure mode for operators using the iMessage private-API bridge: every send could fail with an internal timeout, while health checks still appeared green.

The issue is specific but important. The bridge is a helper library injected into Messages.app. It can stop answering RPC while Messages.app stays alive and the helper remains mapped. That means process checks, channel status, and `imsg status` can still look healthy even though actual sends are stuck.

## The User-Visible Failure

Before the fix, operators could see an error like `Internal error: code=-32603 Timed out waiting for response to 'send-message'`. That message preserved the raw failure but did not explain the likely cause or the repair path.

The PR says the unavailable path already had better guidance: run `imsg launch`, then check `openclaw channels status --probe`. The problem was that normal outbound delivery did not consult the private-API capability cache. It built an RPC client and sent directly, so the actionable unavailable-path guidance never reached the first failed send.

## What Changed

OpenClaw now annotates the stall at `IMessageRpcClient.request()`, the shared choke point used by private-API actions and normal sends. When the bridge stops answering, the next iMessage send carries both the original timeout and the repair guidance.

The implementation preserves the original error rather than replacing it. That matters because existing consumers inspect disposition and retry-safety data, and one timeout detector still matches the original `imsg rpc timeout (send)` wording. The class, code, data, and original message text all survive, with guidance appended.

The PR also fixes capability-cache correctness. A successful private-API probe was cached as never expiring, while a failed probe got a time-to-live. That asymmetry meant a bridge that died after one successful probe might never be re-evaluated. The fix evicts the cached verdict on an observed stall and corrects a path-key mismatch that made eviction fail for `~`-relative CLI paths.

## What This Does Not Claim

The PR is explicit that cache eviction alone does not recover every stale-status case. The re-probe depends on `imsg status --json`, and the current upstream status path can still report advanced features from a static SIP-and-library check while discarding its own live bridge-probe result. The OpenClaw PR calls the eviction a necessary precondition for the corrected upstream signal, not standalone recovery.

It also deliberately avoids treating every timeout as a dead bridge. Client-side wrapper timeouts can happen when the local wrapper is slow or blocked while `imsg` is healthy, including documented SSH-wrapper buffering. Those cases are passed through without bridge-repair guidance.

## Proof From The Merge

The PR includes an incident-based root cause from August 31, 2026, where a flight-arrival notification composed valid messages but both sends failed with the opaque timeout. At the same time, `imsg status` reported the bridge connected and process inspection showed the helper still mapped into a live Messages.app.

The deterministic tests drive the real `IMessageRpcClient` over the existing mock-child harness. They verify cached-verdict eviction on an `imsg` wait timeout, the configured-path cache key, appended actionable guidance on stalled sends, unchanged behavior for client-side timeouts, and retained cache state for ordinary rejected requests.

The full `extensions/imessage` suite passed with 1,209 tests across 56 files. CI was green, and Codex autoreview on the committed branch reported no P0 issue.

## Operator Takeaway

OpenClaw now gives iMessage operators a clearer first failure when the private-API bridge stops answering. Instead of only surfacing an opaque `-32603` timeout, the send path preserves the original error and adds repair guidance at the point every private-API send already uses.
