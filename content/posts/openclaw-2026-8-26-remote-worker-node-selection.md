---
title: "OpenClaw Keeps Remote Worker Runs on Selected Nodes"
excerpt: "OpenClaw merged a P1 worker fix that prevents unavailable remote nodes from silently falling back to Local and preserves explicit permission modes today."
coverImage: '/assets/images/posts/openclaw-2026-8-26-remote-worker-node-selection.png'
date: '2026-08-26T08:01:00.000Z'
dateFormatted: August 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-26-remote-worker-node-selection.png'
---

OpenClaw's remote worker flow picked up a P1 reliability and permission-boundary fix this morning. [PR #129929, "fix(workers): keep remote execution on its selected node"](https://github.com/openclaw/openclaw/pull/129929), addresses a sharp edge in paired-node work: a session meant for a remembered remote node could silently run locally if that node was offline or full.

That failure mode is subtle but serious. Users choose a remote node for a reason, often because it has the right hardware, network access, workspace, or permission shape. Falling back to Local without an explicit choice can change both where the work runs and which operational assumptions apply.

## What Changed

The fix keeps the operator's selected paired-node destination visible and selected when it cannot accept work. Instead of quietly switching to Local, OpenClaw now blocks the unavailable destination until the user explicitly chooses a different one.

The same PR also repairs nested remote worker permission inheritance. The maintainer notes describe cases where child workers could lose the parent session's explicit permission mode. In practice, that meant guarded sessions could become less restrictive, while Full Access sessions could unexpectedly lose their no-approval contract.

The new behavior propagates only the authoritative parent permission mode into nested worker session creation. Read-only, guarded, workspace, and Full Access policies are meant to survive remote work boundaries without being weakened or accidentally downgraded.

## Gateway Worker Cleanup

PR #129929 also tightens worker shutdown and deadline handling. Concurrent Gateway worker shutdown could abandon healthy sibling tunnels and shared workspace resources after one failure. Expired node operations could still accept privileged input before a delayed timeout callback fired.

The repair drains all tunnel owners and admitted operations before releasing shared resources, and centralizes absolute-deadline decisions across invoke stream boundaries. That gives remote worker sessions a cleaner ending, especially when a Gateway is juggling multiple worker tunnels.

## Why This Is User-Facing

Remote execution is not just a backend detail. In the Control UI, the selected destination is part of the user's intent. If a remembered node is unavailable, keeping it visibly blocked is more honest than doing the work somewhere else.

The permission fix is just as important. OpenClaw's approval and access modes are part of the trust model. A nested worker should not become more permissive because it crossed a node boundary, and a deliberately Full Access remote workflow should not suddenly ask for approvals because inherited state got lost.

## Verification

The PR reports failures before the repair across four explicit child permission modes, two tunnel shutdown owners, an expired invoke-input boundary, and two real Chromium remote-destination cases. After the fix, the maintainer lists 185 targeted Gateway and worker tests, 19 real Chromium scenarios, a full `pnpm build`, and a Docker worker E2E path.

The live proof is especially relevant: browser session creation dispatched to a selected device, completed two real Docker worker turns, and produced zero approval requests, zero pending overlays, and zero leaked worker containers.

## Bottom Line

OpenClaw remote sessions now better respect the destination the user actually selected. When a paired node is unavailable, the UI should say so; it should not quietly move the work to Local.

For teams running OpenClaw across paired devices or remote worker hosts, [PR #129929](https://github.com/openclaw/openclaw/pull/129929) is a meaningful reliability and permission-boundary improvement.
