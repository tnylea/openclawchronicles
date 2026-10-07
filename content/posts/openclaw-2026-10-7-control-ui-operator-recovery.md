---
title: "OpenClaw Fixes Control UI Restart Authority"
excerpt: "OpenClaw now preserves authenticated Control UI operator authority after Gateway restarts without broadening admin scope or bypassing revocation."
coverImage: '/assets/images/posts/openclaw-2026-10-7-control-ui-operator-recovery.png'
date: '2026-10-07T23:10:00.000Z'
dateFormatted: October 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-7-control-ui-operator-recovery.png'
---

OpenClaw merged a P1 authority-boundary fix tonight for Control UI turns that are interrupted by a Gateway restart.

[PR #166553](https://github.com/openclaw/openclaw/pull/166553), "fix: preserve operator access after Control UI restart recovery," addresses a failure where an authenticated Control UI turn could resume after restart but lose the operator authority needed to finish automation work.

The visible symptom was blunt: automation creation could fail with `missing scope: operator.admin` even though the original user had already been authenticated for the Control UI session. That is exactly the kind of recovery bug that feels random to operators, because the user did the right thing and the task only broke after process replacement.

## What Changed

The key change is not simply "give recovered work more scope." The PR is careful about that boundary.

Before the fix, recovery could dispatch through an unprofiled system principal with `operator.write`. Automation management correctly requires stronger operator authority, so the resumed work hit the scope fence. The dangerous shortcut would have been to grant every recovered system path admin-like access. OpenClaw did not do that.

Instead, the source admission path now records bounded, credential-free authorization facts alongside the private recovery claim. When the Gateway recovers the interrupted source, it re-admits that exact source under the current policy and binds the replacement run to its current session, claim, runtime, and registration.

That means the resumed turn can continue the authorized operation it already owned, while stale or invalid authority still stops at the boundary.

## Why Operators Should Care

Gateway restarts are normal in real deployments. Operators update OpenClaw, restart services, recover crashed processes, and run long Control UI workflows while other maintenance is happening.

For those setups, this fix makes recovery less brittle in a high-value place: automation management. If a Control UI task is creating or changing an automation, it should not lose its verified authority merely because the Gateway process was replaced mid-turn.

At the same time, authority recovery cannot become a hidden privilege escalation path. The PR keeps several revocation paths intact:

- Credential rotation
- Device removal
- Profile or role changes
- Grant revocation
- Stale recovery claims
- Replacement or closed run owners

Older interrupted turns without the private source record remain restricted. The practical fallback is explicit and human-readable: send a fresh authenticated message to continue privileged work.

## What The Proof Shows

The PR includes real Gateway UI scenarios. One authenticated Control UI turn survives process replacement, automatically creates one disabled hourly automation through the actual tool and RPC scope fence, preserves the original session and user input, and clears the original recovery claim.

It also covers negative cases. Public token rotation and device changes revoke retained authority, source-less claims do not become privileged fallbacks, and delegated execution remains excluded by execution metadata.

That testing matters because this is not a simple UI bug. It touches Gateway recovery, session ownership, Control UI admission, automation scope checks, device-bound authority, and runtime cleanup.

## Bottom Line

This is a meaningful reliability and security-boundary repair for OpenClaw operators. Authenticated Control UI work can now survive a Gateway restart without silently dropping the authority it already had, while revocation and stale-claim checks still have teeth.
