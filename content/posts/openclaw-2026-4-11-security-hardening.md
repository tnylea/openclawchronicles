---
title: "OpenClaw v2026.4.10 Security Hardening: What Changed and Why It Matters"
excerpt: "OpenClaw v2026.4.10 ships the most comprehensive security hardening wave yet, covering browser SSRF, exec preflight, dotenv injection, node exec events, and more."
coverImage: '/assets/images/posts/openclaw-2026-4-11-security-hardening.png'
date: '2026-04-11T08:10:00.000Z'
dateFormatted: April 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-11-security-hardening.png'
---

Every OpenClaw release ships security fixes. v2026.4.10 is different — the security section of the changelog covers more than a dozen distinct hardening areas, many of them touching the surfaces most exposed to untrusted input: the browser, exec tools, workspace files, and remote node communication. Here is a breakdown of what changed and what threat it addresses.

## Browser and SSRF Hardening

The most extensive changes are in the browser/sandbox stack. Multiple PRs tighten SSRF defenses across:

- **Strict SSRF defaults** with hostname allowlists
- **Interaction-driven redirects** — safety checks now re-run after click, evaluate, hook-triggered click, and batched action flows, preventing browser interactions from bypassing the SSRF quarantine when they land on forbidden URLs ([#63226](https://github.com/openclaw/openclaw/pull/63226))
- **Subframes, CDP discovery, existing sessions, and tab actions** all get tighter navigation defenses
- **noVNC and marker-span sanitization**
- **Docker CDP source-range enforcement** ([#61404](https://github.com/openclaw/openclaw/pull/61404) and related)

The key fix here is the interaction-driven redirect bypass. Previously, a crafted page could trigger a click that redirected the browser to an SSRF-quarantined URL after the initial safety check had already passed. This is now closed.

## Exec Preflight Hardening

The exec tool surface receives several improvements:

- **Host env denylisting** — runtime-control environment variables are now blocked from untrusted workspace `.env` files
- **Node output boundaries** — exec outputs from remote nodes are sanitized before entering the turn context
- **Exec preflight reads** — tighter validation before commands are dispatched

A new `openclaw exec-policy` CLI command also lands in this release, providing `show`, `preset`, and `set` subcommands for synchronizing exec approvals config with a local file. The command includes rollback safety and sync conflict detection.

## Dotenv Injection Blocked

Workspace `.env` files are a natural target for privilege escalation: if an attacker can influence a workspace file, they might inject environment variables that alter runtime behavior. v2026.4.10 explicitly blocks:

- Runtime-control env vars
- Browser-control override env vars
- Skip-server env vars

from untrusted workspace `.env` files ([#62660](https://github.com/openclaw/openclaw/pull/62660), [#62663](https://github.com/openclaw/openclaw/pull/62663)). Unsafe URL-style browser control override specifiers are also rejected before lazy loading.

## Remote Node Exec Events Sanitized

When a remote node reports `exec.started`, `exec.finished`, or `exec.denied` events to the gateway, the command, output, and reason text fields are now **marked as untrusted and sanitized** before being enqueued into the session ([#62659](https://github.com/openclaw/openclaw/pull/62659)). Without this fix, a compromised or malicious remote node could inject trusted `System:` content into later turns — a prompt injection vector via the node execution surface.

## Plugin Onboarding Auth Isolation

Untrusted workspace plugins can no longer collide with bundled provider auth-choice IDs during non-interactive onboarding ([#62368](https://github.com/openclaw/openclaw/pull/62368)). This prevents a rogue workspace plugin from intercepting bundled provider setup flows and capturing operator secrets unless the plugin is explicitly trusted.

## Dependency Audit: basic-ftp CRLF Fix

A dependency audit bumps `basic-ftp` to 5.2.1, which addresses a **CRLF command injection** vulnerability in the FTP client library. Hono and `@hono/node-server` are also bumped in production resolution paths.

## Telegram Allowlist Tightening

Telegram sender validation is tightened — `allowFrom` checks are now properly synchronized with `/whoami` allowlist reporting so the command accurately reflects the actual auth boundary being enforced.

## Additional Tool Hardening

The security fixes in the tools layer include:

- Outbound host-media read restrictions
- Profile-mutation authorization checks
- Plugin install dependency scanning
- ACPX tool hook validation
- Gmail watcher token redaction
- Oversized realtime WebSocket frame handling

## WhatsApp Media Fix (Bonus)

In a related fix, a bug in gateway-mode outbound sends with `--media` is corrected: WhatsApp document and attachment sends were silently dropping the file while still delivering the caption ([#64492](https://github.com/openclaw/openclaw/pull/64492)). Now both the file and caption route correctly through the channel `sendMedia` path.

## Upgrading

```bash
openclaw update
openclaw gateway restart
```

If you use the exec tool with remote nodes, review your node trust configuration after upgrading. The dotenv hardening changes may affect deployments that relied on env vars to configure runtime behavior from workspace files.

Full release notes: [github.com/openclaw/openclaw/releases/tag/v2026.4.10](https://github.com/openclaw/openclaw/releases/tag/v2026.4.10).
