---
title: 'Two Security Fixes in OpenClaw 2026.3.22: Voice Webhooks and Exec Approval Bypass'
excerpt: 'The March 22nd release patches two security vulnerabilities — one in voice-call webhook handling that could allow unauthenticated request flooding, and one in exec approval allowlists that could let approved commands be bypassed via the time wrapper.'
coverImage: '/assets/images/posts/security-fixes-voice-exec.png'
date: '2026-03-22T11:11:00.000Z'
dateFormatted: March 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/security-fixes-voice-exec.png'
---

The `2026.3.22` release includes two security-related fixes that self-hosters should know about. Neither appears to be critical severity, but both close real attack surfaces — and one came from a community reporter.

## Fix 1: Voice-Call Webhook Pre-Auth Flooding

**Reported by:** [@SEORY0](https://github.com/SEORY0)

The old voice-call webhook handler would buffer up to 1 MB of request body over 30 seconds *before* validating the provider signature. That means an unauthenticated caller could send repeated large requests and force OpenClaw to read and hold them in memory before rejecting them — a resource exhaustion vector.

**What changed:**
- Signature headers are now **validated before the body is read** — unauthenticated requests are rejected at the door
- Pre-auth body budget dropped from 1 MB / 30s to **64 KB / 5s**
- Concurrent pre-auth requests per source IP are now capped

If you're running voice integrations (e.g., Twilio, Vonage) on a publicly-accessible instance, this fix is worth having sooner rather than later.

## Fix 2: Exec Approval `time` Wrapper Bypass

**Reported by:** [@YLChen-007](https://github.com/YLChen-007)

The exec approval system lets you set allowlists — commands you've pre-approved so OpenClaw doesn't ask each time. The bug: wrapping an approved command in `time` (e.g., `time ls`) could cause the allowlist check to bind to `time` itself rather than the inner executable.

In practice this meant: if you'd approved `ls`, running `time ls` might persist `time` as approved — creating a broader-than-intended allowlist entry, since `time` can wrap *anything*.

**What changed:**
- `time` is now treated as a transparent dispatch wrapper during allowlist evaluation
- `allow-always` persistence now binds to the inner executable, not the wrapper path

## Also: JVM / .NET Environment Injection Blocked in Exec Sandbox

While not flagged as a CVE-level fix, this release also tightens the exec environment sandbox by blocking several injection vectors:

- `MAVEN_OPTS`, `SBT_OPTS`, `GRADLE_OPTS`, `ANT_OPTS` — blocked to prevent JVM-level build-tool injection
- `GLIBC_TUNABLES` — blocked to prevent glibc tunable exploitation
- `DOTNET_ADDITIONAL_DEPS` — blocked to prevent .NET dependency resolution hijacking
- `GRADLE_USER_HOME` — restricted as override-only so user-configured Gradle homes still propagate

These are the kinds of environment variable attack vectors that are easy to overlook in sandboxed exec contexts. Good to see them closed proactively.

## What You Should Do

Depending on your setup:

- **Running voice integrations** (Twilio, Vonage, etc.) on a public endpoint → update promptly
- **Using exec allowlists with `time` commands** → review your persisted allowlist entries after updating
- **Any exec sandbox** → no action required, the env blocks are passive hardening

Update via:

```bash
openclaw update
```

Or if you're tracking main:

```bash
openclaw update --tag main
```

---

*Source: [OpenClaw v2026.3.22 Release Notes](https://github.com/openclaw/openclaw/releases/tag/v2026.3.22)*
