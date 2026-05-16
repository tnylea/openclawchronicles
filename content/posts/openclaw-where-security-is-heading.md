---
title: "Where OpenClaw Security Is Heading: The Official Roadmap"
excerpt: "The OpenClaw team published its security roadmap: fs-safe boundaries, Proxyline egress control, ClawHub trust tiers, smarter approvals, and 148 OpenGrep rules in CI."
coverImage: '/assets/images/posts/openclaw-where-security-is-heading.png'
date: '2026-05-16T08:05:00.000Z'
dateFormatted: May 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-where-security-is-heading.png'
url: '/posts/openclaw-where-security-is-heading/'
---

Yesterday, the OpenClaw team published [a detailed security roadmap post](https://openclaw.ai/blog/where-openclaw-security-is-heading) — the most comprehensive public accounting of where OpenClaw's security architecture is headed, and crucially, what has already shipped versus what is still in progress.

The post is notable for its honesty. It explicitly separates "landed," "rolling out," "in flight," and "research" — which is more than most security roadmaps do. Here's what they're building.

## fs-safe: Filesystem Boundary Enforcement

OpenClaw runs on real machines with access to real files. The team's answer to filesystem boundary bugs is [fs-safe](https://fs-safe.io/), a shared library of [safe filesystem primitives](https://docs.openclaw.ai/gateway/security/secure-file-operations) that core code, plugins, and adjacent services can all use.

The library enforces root-bounded operations: writes inside a plugin's workspace succeed; traversal and absolute-path writes outside that workspace are refused. The team is explicit that **this is not a sandbox** — a plugin with shell execution can still do arbitrary things via the shell. What fs-safe addresses is boundary-crossing bugs in *filesystem code*, not the full execution surface.

The next phase is making these primitives the expected standard for ClawHub plugins. Using bypass patterns won't necessarily be blocked, but it will count against a plugin's trust posture.

A related in-flight project: migrating runtime state (sessions, transcripts, scheduler state, plugin state) into SQLite. That would eliminate whole categories of filesystem access from the runtime path — the safest file access is the one that never happens.

## Proxyline: Egress-Level Network Control

SSRF is harder to prevent in agentic systems than in traditional web services. When fetching user-supplied URLs is *normal product behavior*, URL validation alone isn't sufficient — DNS can resolve differently between validation time and fetch time.

[Proxyline](https://proxyline.dev/) addresses this by moving the control point closer to egress. It installs process-global routing for Node networking surfaces, funneling traffic through a [configured proxy](https://docs.openclaw.ai/security/network-proxy) where policy can be enforced at connect time: metadata addresses, private ranges, loopback canaries, whatever your environment needs blocked.

The division of responsibility is clean: **Proxyline routes; the proxy enforces.** This also gives operators observability — if you're already running a managed proxy, you can route OpenClaw through it and watch destinations, rates, and blocked attempts from infrastructure you already control.

The team acknowledges limits here too: raw sockets, native modules, and child processes that aren't managed by OpenClaw can still bypass a Node-level guardrail. For ordinary OpenClaw network paths, though, this is a meaningfully better shape than per-call validation.

## ClawHub Trust Tiers

The post outlines how ClawHub is evolving as the authority for plugin trust:

- The ClawHub pipeline combines **ClawScan, VirusTotal, static analysis, metadata checks, source provenance, and manual moderation**
- Each package version gets **trust evidence attached**: clean, suspicious, held, quarantined, revoked, or malicious
- Malicious or quarantined releases are **blocked from download** through the ClawHub install path
- Higher-trust tiers are being explored: official packages, trusted publishers, packages held to stricter review

The team is also exploring extending scanning to plugins that come from outside ClawHub (GitHub, private registries, local files). The product shape for that isn't finalized, but the direction is clear: the safe path should have visible evidence, and that evidence should influence install decisions.

## Smarter Command Approvals

The approval prompt problem is real: prompts arrive faster than anyone can read them, users flip on YOLO mode, and the prompts become training for users to stop reading.

The fix is fewer *and better* prompts. Two improvements are in the release:

1. **Shell parsing with Tree-sitter**: The shell approval path now evaluates inner command chains inside common `shell -c` wrappers. A policy that can see `rm` but not `bash -c "rm -rf ~/something"` isn't a real policy. The command highlighter now surfaces what's inside wrapper payloads.

2. **Contextual approval (experimental)**: Instead of static allow/deny lists, contextual approval aims to ask *only when a command doesn't fit the current task*. The goal is that prompts mean something — so when one appears, the user stops and reads. For OpenAI users, [Auto Review](https://developers.openai.com/codex/concepts/sandboxing/auto-review) is exposed as a codex-specific variant that replaces manual approval with a reviewer agent at the sandbox boundary.

## 148 OpenGrep Rules in CI

After each security advisory is patched, the team now creates an **OpenGrep rule tied to that advisory**. The rules run on PR diffs and the full scan can be run manually. The goal is twofold: regression detection (same vulnerable shape doesn't come back) and variant detection (nearby versions of the same mistake get caught).

The current rulepack has **148 rules**. CodeQL runs alongside for deeper semantic coverage.

The team's framing here is worth quoting directly: "A noisy rule is worse than no rule, because it teaches the team to ignore the channel." Precision is the design constraint.

## The Bottom Line

The post ends with a commitment that OpenClaw isn't becoming less powerful — the goal is making the boundaries easier to see and defend. No promises of risk-free agents; an explicit acknowledgment that anyone making that promise is "selling something, or has not shipped enough yet."

For users following OpenClaw's security posture, this post is the clearest statement yet of where the project is heading. Worth [reading in full](https://openclaw.ai/blog/where-openclaw-security-is-heading).
