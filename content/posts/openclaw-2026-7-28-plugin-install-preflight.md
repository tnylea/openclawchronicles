---
title: "OpenClaw Hardens Plugin Install Preflight"
excerpt: "OpenClaw now rejects malformed plugin install requests before leases, state writes, prompts, npm calls, or hook side effects."
coverImage: '/assets/images/posts/openclaw-2026-7-28-plugin-install-preflight.png'
date: '2026-07-28T23:02:00.000Z'
dateFormatted: July 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-28-plugin-install-preflight.png'
---

OpenClaw merged a plugin-install hardening change on Tuesday that moves invalid install requests out of the mutation path. [PR #115427](https://github.com/openclaw/openclaw/pull/115427), `fix(cli): reject invalid plugin installs before lifecycle mutations`, landed at 22:25 UTC.

The fix is about timing and authority. Invalid plugin installation requests previously could get far enough to acquire the persistent plugin lifecycle lease, create SQLite state, prompt for confirmation, or reach npm and hook installers before the bad source or incompatible options were rejected.

That is too late for a system where plugins can touch important local workflows. A malformed request should fail before OpenClaw mutates state, asks a user to confirm something, or invokes an external installer path.

## What The PR Fixes

The merged PR closes several related gaps:

- Invalid plugin sources are rejected before lifecycle mutation.
- Incompatible install options fail before persistent state or prompts.
- Failed bundled installs return a nonzero exit instead of appearing successful.
- Malformed explicit ClawHub selectors no longer fall through to npm in CLI and chat commands.
- Valid npm, ClawHub, git, local, official, bundled, marketplace, and hook-alias installs keep their existing behavior.

The malformed ClawHub selector case is worth calling out. Marketplace-style names can be convenient, but a selector that is explicitly meant for ClawHub should not silently become an npm package lookup because parsing failed.

## Cleaner Installer Ownership

[PR #115427](https://github.com/openclaw/openclaw/pull/115427) is also a refactor. The maintainer-directed cleanup separates mutation-free source and marketplace preflight, configuration recovery, hook-pack fallback, and exhaustive source execution into focused owners.

The former installer implementation was 1,122 lines. The new shape reduces that to 380 lines and removes a grandfathered max-lines suppression. That is not just tidying: smaller, clearer owners make it easier to see which phase is allowed to mutate state and which phase is only allowed to validate inputs.

For operators, the practical outcome is straightforward. Bad install requests should fail earlier, with fewer side effects and fewer misleading success states. Existing valid workflows should continue to work.

## Why This Matters

Plugin installation sits close to OpenClaw's trust boundary. It combines user intent, marketplace shorthand, local configuration, hook packs, npm, ClawHub, and chat-driven commands. A bug in that path can create confusing state at best and unsafe side effects at worst.

This PR does not claim a public vulnerability advisory. It does, however, make the installer fail closed much earlier for invalid requests. That is exactly the right direction for a tool ecosystem that expects users to add capabilities frequently.

The evidence is broad: 20 failing source and preflight regressions reproduced on main before the fix, 304 focused tests after the change, type-aware lint, full `pnpm check:changed`, full `pnpm build`, and a fresh independent Codex autoreview with no actionable findings.

For users installing plugins from the CLI, chat commands, bundled sources, or marketplace shorthand, the safest path is the boring one: validate first, mutate later.
