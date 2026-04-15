---
title: "OpenClaw Hardens Install Path: Dist Integrity Checks and pnpm Runner Fix"
excerpt: "Two PRs merged April 15 tighten OpenClaw's install and update infrastructure, adding dist inventory verification and securing the pnpm binary runner."
coverImage: '/assets/images/posts/openclaw-2026-4-15-install-security-hardening.png'
date: '2026-04-15T08:05:00.000Z'
dateFormatted: April 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-15-install-security-hardening.png'
---

Two infrastructure-focused pull requests landed in OpenClaw's `main` branch this morning, both targeting the install and update pipeline. Together they address reliability gaps around stale dist files and how OpenClaw invokes the pnpm binary at install time.

## PR #66959: Prune Stale Dist Chunks After npm Upgrades

Contributor **obviyus** merged [PR #66959](https://github.com/openclaw/openclaw/pull/66959) to tackle a longstanding annoyance: stale hashed dist chunks left behind after `npm install -g openclaw@latest` upgrades.

OpenClaw bundles its runtime into hashed chunk files under `dist/`. When a new version ships with differently-named chunks, the old files linger — and in some cases the old entrypoint could reference the wrong chunk at runtime. This is the root cause behind the infamous `ERR_MODULE_NOT_FOUND` errors after upgrades that have appeared in community reports.

The fix introduces a **dist inventory file** (`dist/postinstall-inventory.json`) that records which files belong to a given release. During postinstall, any `dist/` file not listed in the inventory is pruned. This keeps the installed dist clean across upgrades without requiring users to manually wipe their global install.

### Security Analysis Findings

The Aisle Security bot flagged three medium-severity considerations in this PR, all related to how the new inventory mechanism handles edge cases:

- **Missing inventory causes install failure** (CWE-703): If `postinstall-inventory.json` is absent (e.g., upgrade from a pre-inventory release), the postinstall script would throw instead of skipping the prune step gracefully.
- **Inventory file trusted as integrity authority** (CWE-345): The inventory is a local file — in a compromised-package scenario, an attacker could tamper with both the dist tree and the inventory to evade verification checks.
- **Fail-open when inventory is missing** (CWE-693): Without the inventory, unexpected files in `dist/extensions/` (which OpenClaw scans for bundled plugins) would go undetected.

The maintainers merged despite these findings. Likely follow-up work will address the fallback and signing concerns in subsequent PRs.

## PR #66987: Avoid Running Native pnpm Binaries Through Node

[PR #66987](https://github.com/openclaw/openclaw/pull/66987) by **obviyus** refines how OpenClaw's `pnpm-runner.mjs` script decides whether to invoke pnpm via Node or as a native binary. Previously, it read `process.env.npm_execpath` to determine if the available pnpm entrypoint was a Node-runnable script (`.js`/`.cjs`/`.mjs`) or a native binary — and if native, it was mistakenly being routed through Node anyway in some environments.

The fix narrows the detection logic so native pnpm binaries (installed via Corepack or system package managers) are invoked directly, rather than being wrapped by Node — which could cause them to silently fail or behave unexpectedly.

### Security Analysis Findings

Aisle Security raised two medium concerns here as well:

- **DoS via blocking I/O on attacker-controlled `npm_execpath`** (CWE-400): The shebang-detection helper performs synchronous `openSync`/`readSync` on the path from `npm_execpath` without checking if it's a regular file first. A FIFO or slow network FS path could block indefinitely.
- **Arbitrary code execution via untrusted `npm_execpath`** (CWE-94): The validation for whether to run a file via Node only checks the basename and file extension/shebang marker — not the actual resolved path — meaning a crafted file named `pnpm` with a `.js` extension in an attacker-controlled location could be executed.

Again, the maintainers reviewed and merged. These are install-time risks that require attacker control of the environment, so the practical blast radius is narrow — but worth watching for follow-up hardening.

## What This Means for Users

Neither change is user-visible in normal operation. But if you've hit:

- `ERR_MODULE_NOT_FOUND` errors after `openclaw` upgrades
- Broken pnpm invocations during install in non-standard npm environments

…these fixes are aimed squarely at your pain points. Both land in the next OpenClaw release. Follow the [GitHub repository](https://github.com/openclaw/openclaw/releases) for the release announcement.
