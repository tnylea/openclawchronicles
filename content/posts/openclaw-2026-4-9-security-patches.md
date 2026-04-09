---
title: "OpenClaw v2026.4.9: Critical Security Patches — Upgrade Now"
excerpt: "OpenClaw v2026.4.9 ships a major security batch covering SSRF bypasses, dotenv injection, exec sanitization, and more. Upgrade immediately."
coverImage: '/assets/images/posts/openclaw-2026-4-9-security-patches.png'
date: '2026-04-09T23:00:00.000Z'
dateFormatted: April 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-9-security-patches.png'
---

🔒 **This is a must-upgrade release.** OpenClaw v2026.4.9 lands with one of the largest security batches in recent memory — ten distinct fixes spanning browser SSRF quarantine bypasses, dotenv injection vectors, exec event sanitization, allowlist authorization gaps, and dependency-level vulnerabilities. If you are running any prior version, stop reading and upgrade now. Come back for the details.

---

## What Was Fixed

### Browser / SSRF Quarantine Bypasses

Two separate SSRF-related issues have been closed in this release.

**[PR #63226](https://github.com/openclaw/openclaw/pull/63226)** — Browser interactions (clicks, `evaluate` calls, hook-triggered clicks, and batched actions) that resulted in main-frame navigations were not re-running the blocked-destination safety checks. An attacker with access to a workspace could craft a page that navigates the browser to an internal address *after* the initial load check had already passed. This is now fixed: safety checks re-run on every interaction-driven navigation.

**[PR #62355](https://github.com/openclaw/openclaw/pull/62355)** — Document redirect hops during main-frame navigation were not being treated as navigations for the purposes of SSRF blocking. A 301/302/meta-refresh chain could walk the browser into a quarantined destination. Redirect hops are now treated as navigations and subject to the same destination checks.

### Network / Fetch Guard

**[PR #62357](https://github.com/openclaw/openclaw/pull/62357)** — Cross-origin 307 and 308 redirects were forwarding request bodies, which can expose sensitive POST data to unintended origins. OpenClaw now drops request bodies on cross-origin 307/308 redirects by default, matching the behavior browsers implement for safety.

### Dotenv / Runtime-Control Injection

**[PR #62660 & #62663](https://github.com/openclaw/openclaw/pull/62660)** — Untrusted workspace `.env` files could previously set runtime-control env vars, browser-control override vars, and skip-server vars that OpenClaw would then honor at startup. This created a privilege escalation path: a malicious repository could embed a `.env` that redirects browser control or bypasses the local server entirely. Both categories of vars are now blocked from untrusted workspace `.env` files, and unsafe URL-style browser control override specifiers are rejected outright.

### Gateway / Node Exec Event Sanitization

**[PR #62659](https://github.com/openclaw/openclaw/pull/62659)** — Remote node exec events (`exec.started`, `exec.finished`, `exec.denied`) were being enqueued as trusted system events, and their node-provided fields (command, output, reason) were passed through unsanitized. A compromised or malicious node could inject arbitrary content into the event stream. These events are now marked as untrusted and all node-provided text fields are sanitized before enqueueing.

### Gateway Tool / Exec Config Write Protection

**[PR #62001](https://github.com/openclaw/openclaw/pull/62001)** — Model-facing config write operations could be used to change exec approval paths — effectively allowing a model to grant itself broader execution permissions. This vector is now blocked: model-facing config writes cannot modify exec approval paths.

### Host Exec / Environment Sanitization

**[PR #59119, #62002, #62291](https://github.com/openclaw/openclaw/pull/59119)** — A broad sweep of dangerous environment variable overrides has been blocked from host exec contexts. This covers Java (`JAVA_TOOL_OPTIONS`, `_JAVA_OPTIONS`), Rust/Cargo (`CARGO_HOME`, `RUSTUP_HOME`), Git (`GIT_SSH_COMMAND`, `GIT_PROXY_COMMAND`, `GIT_EXEC_PATH`), Kubernetes (`KUBECONFIG`), and cloud credential env vars (`AWS_SHARED_CREDENTIALS_FILE`, `GOOGLE_APPLICATION_CREDENTIALS`, and others). Any of these could be abused to intercept toolchain calls or redirect credential lookups.

### Commands / Allowlist Authorization

**[PR #62383](https://github.com/openclaw/openclaw/pull/62383)** — The `/allowlist add` and `/allowlist remove` commands previously did not require owner-level authorization. Any session with command access could expand or contract the allowlist. Owner authorization is now required for both commands.

### Plugins / Onboarding ID Collision

**[PR #62368](https://github.com/openclaw/openclaw/pull/62368)** — Untrusted workspace plugins could register provider auth-choice IDs that collided with bundled provider auth IDs, potentially hijacking auth flows. ID collision between workspace plugins and bundled providers is now prevented at the onboarding layer.

### Dependency Audit

The `basic-ftp` dependency has been force-pinned to `5.2.1` to pick up the upstream CRLF command-injection fix. Hono and `@hono/node-server` have also been bumped. If you run a custom OpenClaw deployment with pinned dependencies, update your lock files accordingly.

---

## Severity Assessment

The SSRF quarantine bypass (PR #63226) and the dotenv injection issues (PR #62660/#62663) are the highest-severity items in this batch. Both are exploitable by a workspace that a user opens — no additional attacker access is required beyond convincing a user to open a malicious workspace or repository. The exec event sanitization issue (PR #62659) is high severity for multi-node deployments.

The remaining fixes are medium-severity hardening items that close legitimate attack paths but require more specific preconditions.

---

## How to Upgrade

Update via your standard package manager or pull the latest Docker image. If you are running a self-hosted deployment, check the [GitHub releases page](https://github.com/openclaw/openclaw/releases) for build artifacts and migration notes.

Do not delay. Several of these fixes address issues that are exploitable without elevated access.
