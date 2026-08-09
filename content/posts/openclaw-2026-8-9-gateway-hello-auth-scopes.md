---
title: "OpenClaw Aligns Gateway Hello Auth Scopes"
excerpt: "OpenClaw Gateway hello responses now report live socket authority, keeping UI and plugin gating aligned with per-RPC authorization."
coverImage: '/assets/images/posts/openclaw-2026-8-9-gateway-hello-auth-scopes.png'
date: '2026-08-09T23:00:00.000Z'
dateFormatted: August 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-9-gateway-hello-auth-scopes.png'
---

OpenClaw's Gateway authorization story tightened again on Sunday with the merge of [PR #120888](https://github.com/openclaw/openclaw/pull/120888), a P1 fix that makes the `hello-ok.auth.scopes` field describe the authority of the current socket instead of a broader reusable device-token grant.

That sounds narrow, but it sits in an important trust boundary. The Control UI, plugin capability checks, snapshot sensitivity decisions, and auth telemetry all read the hello payload early in a connection. If that payload advertises more permission than the active socket can actually use, the interface can show actions that the RPC layer will later reject.

## What changed in Gateway hello

The PR describes the root problem as clients reconnecting with narrower scopes while receiving scopes from a wider saved grant. The repair makes Gateway hello report only the live scope set enforced by RPC dispatch.

The practical result is a cleaner contract:

- `auth.scopes` reflects the current socket.
- UI and plugin gating use that same live authority.
- Existing reusable device-token grants remain preserved on the client when the token identity truly matches.
- Rotated, different, or newly issued tokens cannot inherit stale local scope metadata.

That last point matters because OpenClaw has multiple clients that remember device-token state: browser, Node, Control UI, Android, Swift, and the generated browser-extension runtime. The merged fix keeps the preservation rule explicit: only the same primary token for the same stored identity can keep the broader stored grant.

## Why operators should care

Authorization bugs are not always about letting an action through. Sometimes the risk is that the product teaches users the wrong thing about what is allowed.

Before this fix, a reconnect with a narrower authority could still display broader capability hints because the hello response exposed reusable-grant metadata. Dispatch would reject unauthorized RPC calls, but the mismatch could make Control UI and plugin behavior feel inconsistent.

After the change, the first permission signal, the UI affordance layer, and the RPC enforcement layer point at the same active socket scope. That is easier to reason about during browser reconnects, plugin setup, mobile handoffs, and device-token rotation.

## Proof and release signal

The PR landed with exact-head CI passing for commit `42abbaca75c9eb8679e6a8f1233eae6ff5bfaefe`. The source proof lists 75 successful jobs, focused Gateway, Node, browser lifecycle, Control UI, generated browser-extension tests, workflow guards, protocol generation, plugin SDK checks, docs validation, and source-blind generated-runtime validation.

For OpenClaw Chronicles readers, the most important takeaway is that Gateway's hello response is now a live authorization view, not a historical grant summary. That makes reconnect behavior safer and keeps capability surfaces honest.
