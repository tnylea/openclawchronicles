---
title: "OpenClaw v2026.4.15 Beta: Six Security Fixes You Should Know"
excerpt: "The latest OpenClaw beta patches secret leaks in exec prompts, path traversal in memory tools, and a timing gap in MCP loopback auth. Here is what changed."
coverImage: '/assets/images/posts/openclaw-2026-4-15-security-hardening.png'
date: '2026-04-15T23:00:00.000Z'
dateFormatted: April 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-15-security-hardening.png'
---

OpenClaw v2026.4.15-beta.1 dropped today carrying one of the more security-dense changelogs in recent memory. Six distinct hardening fixes land in this release, spanning exec approvals, memory access controls, workspace file handling, MCP authentication, the Feishu channel, and gateway bearer token rotation. None carry a public CVE yet — but several patch meaningful exposure surfaces that operators should understand before the stable release lands.

## What Was Fixed

### 1. Secrets No Longer Leak in Exec Approval Prompts

**PR [#64790](https://github.com/openclaw/openclaw/pull/64790) — Issue [#61077](https://github.com/openclaw/openclaw/issues/61077)**

Inline approval review could previously render credential material that appeared in exec command arguments. The fix redacts secrets before the approval prompt is composed. If you use exec approval flows and your commands ever reference tokens or API keys, this matters directly.

### 2. QMD Memory Backend Path Traversal Closed

**PR [#66026](https://github.com/openclaw/openclaw/pull/66026)**

The `memory_get` tool on the QMD backend previously accepted arbitrary workspace markdown paths, effectively allowing it to be used as a generic file-read shim that bypassed the read tool's policy denials. The fix restricts reads to canonical memory files (`MEMORY.md`, `memory/**`, `DREAMS.md`) and exact paths of active indexed QMD workspace documents. Thanks to [@eleqtrizit](https://github.com/eleqtrizit).

### 3. Workspace File Access Routes Through fs-safe Helpers

**PR [#66636](https://github.com/openclaw/openclaw/pull/66636)**

`agents.files.get`, `agents.files.set`, and workspace listing now route through the shared `openFileWithinRoot` / `readFileWithinRoot` / `writeFileWithinRoot` helpers. The fix also rejects symlink aliases for allowlisted agent files and resolves opened-file real paths from the file descriptor before falling back to path-based `realpath` — closing a window where a symlink swap between open and realpath could redirect a validated path off its intended inode. Thanks to [@eleqtrizit](https://github.com/eleqtrizit).

### 4. MCP Loopback Bearer Comparison Is Now Constant-Time

**PR [#66665](https://github.com/openclaw/openclaw/pull/66665)**

The `/mcp` bearer comparison previously used a plain `!==` operator. It now uses `safeEqualSecret`, matching every other auth surface in the codebase. The fix also adds a `checkBrowserOrigin` guard to reject non-loopback browser-origin requests before the auth gate runs. Loopback origins (127.0.0.1, localhost, same-origin) still pass through — including the localhost↔127.0.0.1 host mismatch that browsers flag as `Sec-Fetch-Site: cross-site`. Thanks to [@eleqtrizit](https://github.com/eleqtrizit).

### 5. Feishu Webhook Fails Closed Without encryptKey

**PR [#66707](https://github.com/openclaw/openclaw/pull/66707)**

The Feishu webhook transport now refuses to start without an `encryptKey` and rejects unsigned requests when no key is present instead of accepting them. Blank card-action callback tokens are dropped before the dedupe claim and dispatcher. The fix is described as defense-in-depth over an already-closed monitor-account layer. Thanks to [@eleqtrizit](https://github.com/eleqtrizit).

### 6. Gateway Bearer Token Hot-Reload Takes Effect Immediately

**PR [#66651](https://github.com/openclaw/openclaw/pull/66651)**

After a `secrets.reload` or config hot-reload, the active gateway bearer token was only invalidated on the WebSocket path. HTTP remained valid until gateway restart. The fix resolves the active bearer per-request on both the HTTP server and the HTTP upgrade handler via `getResolvedAuth()`, matching the WebSocket path behavior. Thanks to [@mmaps](https://github.com/mmaps).

## Who Should Pay Attention

- **Self-hosters with exec approval flows** — upgrade path traversal and exec secret redaction are directly relevant.
- **Memory plugin users** — the QMD `memory_get` restriction matters if you use workspace documents as memory sources.
- **MCP integrations** — the constant-time comparison and browser-origin guard apply to anyone exposing the MCP endpoint.
- **Feishu deployments** — the webhook hardening is significant if your encryptKey configuration is incomplete.

## Status

This is a **pre-release**. The stable `v2026.4.15` has not yet been tagged. Track progress at the [OpenClaw releases page](https://github.com/openclaw/openclaw/releases). The full pre-release changelog includes additional bug fixes across BlueBubbles, Telegram, Slack, OpenRouter/Qwen3, and more.
