---
title: "OpenClaw Restores Installed TUI Provider Auth"
excerpt: "OpenClaw PR #119283 fixes installed local TUI /auth by resolving the current package CLI instead of a broken relative bundle path."
coverImage: '/assets/images/posts/openclaw-2026-8-4-tui-provider-auth.png'
date: '2026-08-04T23:05:00.000Z'
dateFormatted: August 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-4-tui-provider-auth.png'
---

OpenClaw merged [PR #119283, "fix(tui): restore provider auth in installed local mode"](https://github.com/openclaw/openclaw/pull/119283), a P2 availability fix for users running the installed TUI without a Gateway-backed session.

The issue affected `/auth` in local TUI mode. Users could start provider authentication, but the real provider-auth child process failed before prompting because the built TUI bundle derived `../../openclaw.mjs` above the installed OpenClaw package.

Instead of completing auth and returning to a working local chat, the TUI interrupted the flow at the point where users were trying to connect a provider.

## One Owner for CLI Invocation

The fix creates a shared current-CLI invocation policy in `src/infra/openclaw-cli-invocation.ts`. Both TUI and auto-reply can now use the same owner for resolving how to launch the current OpenClaw package.

That shared policy preserves Node, Bun, source-checkout, built-package, `execArgv`, package-entry, and symlinked-launcher behavior. It resolves the package with `resolveOpenClawPackageRootSync` and returns the canonical package-root working directory.

The final repair also avoids trusting a launcher just because its basename looks right. A basename launcher is preserved only when `entryPackageRoot` proves it belongs to an OpenClaw package. A foreign `/other/openclaw.mjs` now falls back to the canonical current package CLI.

## Why It Matters

Local TUI mode is a direct path into OpenClaw for users who want a terminal-first experience. Provider authentication is part of that first-run and recovery loop.

When `/auth` breaks, the TUI can look much worse than it is. The local model may still be unchanged and chat may still be recoverable, but the user is stuck before the provider prompt. Fixing the package-resolution boundary keeps authentication tied to the installed OpenClaw package instead of a brittle relative wrapper guess.

The PR says rejected alternatives included a PTY-only cwd or environment workaround, keeping the relative `import.meta.url` wrapper guess, duplicating the launch policy in TUI, or importing auto-reply into TUI. The merged approach is cleaner because TUI and auto-reply need the same "current package" launch rule.

## User Impact

Installed local TUI users can complete provider `/auth`, resume the TUI on the unchanged primary model, and immediately complete a local model-backed turn.

Config repair and validation-abort recovery also remain functional without a Gateway. That is important for local-mode users who rely on the TUI precisely because they want a self-contained path to recover, authenticate, and keep working.

The PR notes this bug had been present since `v2026.4.22`, so the fix closes a long-lived paper cut in the installed TUI experience.

## Evidence

PR #119283 reports exact-source evidence plus multiple coverage IDs for installed local mode. The unique assertions included real local-backend steering through TUI PTY coverage, isolated config repair through the approved built CLI, Gateway-free recovery rendering a safe validation-abort prompt, provider authentication launched through the resolved current package CLI, and rejection of foreign package launchers.

The merged result is a focused availability fix: `/auth` in installed local TUI mode should now launch the right OpenClaw package, complete provider authentication, and return users to a working local chat.
