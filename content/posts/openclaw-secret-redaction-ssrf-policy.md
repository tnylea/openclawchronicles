---
title: "OpenClaw Unifies Secret Redaction and SSRF Policy"
excerpt: "OpenClaw merged a P1 security fix that centralizes secret redaction and SSRF policy ownership across ACP, memory-host, and network boundaries safely now."
coverImage: '/assets/images/posts/openclaw-secret-redaction-ssrf-policy.png'
date: '2026-08-10T08:02:00.000Z'
dateFormatted: August 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-secret-redaction-ssrf-policy.png'
---

OpenClaw merged a P1 security-boundary fix this morning: [PR #121335, "fix(security): unify secret-redaction and SSRF policy ownership"](https://github.com/openclaw/openclaw/pull/121335). The patch is not about adding another redaction rule. It is about removing duplicate security policy so sensitive data gets handled by one canonical owner.

The PR body describes four different secret-redaction paths that had drifted apart. The canonical implementation lived in `src/logging/redact.ts`, while ACP and memory-host packages carried their own tables or hooks. That created an uncomfortable kind of bug: whether a secret was redacted could depend on which package formatted the error and which module loaded first.

## What Changed

The memory-host SDK now formats error messages through OpenClaw's canonical redactor, preserving the old unconditional tool-mode behavior while deleting its local `SECRET_PATTERNS` table. The PR specifically calls out that the old memory-host copy had no coverage for card numbers, CVVs, or payment credential keys.

ACP keeps a smaller standalone fallback for structured authorization headers, but the load-order issue is closed by routing ACP error imports through the wired runtime barrel. Five direct importers were moved behind that owner so the canonical redactor is configured before ACP error text can be formatted.

The same ownership repair applies to SSRF policy. A copied `SsrFPolicy` type inside `memory-host-sdk` is deleted, and package-internal users now consume the canonical type through the runtime network facade. The duplicate type had missed the newer per-request `allowedOrigins` field, which meant structurally compatible types could silently diverge on security meaning.

## Why It Matters

Security helpers are easy to duplicate because they look small. The danger is that they do not stay small. A table that starts as "just the patterns this package needs" becomes a stale policy boundary as providers, payment fields, and internal transports evolve.

For OpenClaw operators, the concrete impact is clearer: memory-host error paths now use the same secret-redaction coverage as the rest of the runtime, including payment credentials and provider token families. ACP error redaction no longer depends on module load order. SSRF policy callers use one type that carries the same fields everywhere.

That is the right direction for a system where agents touch credentials, logs, remote HTTP services, and long-running host processes.

## Verification

The PR includes targeted regression tests for card-number-bearing memory-host errors, asserting that both the card value and BIN prefix stay out of output. It also reports:

- 9 memory-host error utility tests passing
- 68 ACP core tests passing
- 205 affected ACP tests passing
- 52 SSRF tests passing
- A clean Codex autoreview

The production diff is also encouraging: the PR reports a net reduction in production lines while increasing tests. That is usually a good sign for a security ownership fix because the duplicate local policy is being removed instead of patched in place.

## Bottom Line

[PR #121335](https://github.com/openclaw/openclaw/pull/121335) is a quiet but important hardening change. OpenClaw now has less duplicated redaction logic, a cleaner SSRF policy contract, and stronger guarantees that sensitive error text follows the same rules across package boundaries.
