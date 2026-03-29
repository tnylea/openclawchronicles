---
title: "OpenClaw v2026.3.23: Qwen API, UI Overhaul, and 18 Fixes"
excerpt: "OpenClaw v2026.3.23 ships Alibaba Cloud Qwen API support, a polished Knot theme with WCAG contrast, CSP hardening, and 15+ critical auth and plugin fixes."
coverImage: '/assets/images/posts/openclaw-2026-3-23-release.png'
date: '2026-03-24T08:00:00.000Z'
dateFormatted: March 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-23-release.png'
url: '/posts/openclaw-2026-3-23-release/'
---

OpenClaw v2026.3.23 landed late Monday night (March 23, 23:15 UTC) with a notable feature addition, a substantial UI refresh, a security hardening improvement, and a stack of fixes targeting auth, plugins, and browser automation. Here's everything that changed.

## New: Alibaba Cloud Qwen API Support

The biggest addition in this release is first-class support for **Qwen (Alibaba Cloud Model Studio)** via standard DashScope endpoints. Previously, OpenClaw only supported DashScope through its Coding Plan subscription tier. v2026.3.23 adds pay-as-you-go endpoints for both the **China region** and **global Qwen API keys**, and relabels the provider group to "Qwen (Alibaba Cloud Model Studio)" throughout the UI ([#43878](https://github.com/openclaw/openclaw/pull/43878)).

If you've been waiting to route Qwen models through OpenClaw without a Coding Plan subscription, this is your unlock.

## UI Overhaul: Knot Theme, WCAG Contrast, and Tighter Components

A sweeping UI polish pass ([#53272](https://github.com/openclaw/openclaw/pull/53272), credit: [@BunsDev](https://github.com/BunsDev)) touched multiple areas:

- **Knot theme** now uses a refined black-and-red palette with **WCAG 2.1 AA contrast** throughout
- Button primitives consolidated into `btn--icon`, `btn--ghost`, and `btn--xs` — cleaner and more consistent
- **Config icons** added for Diagnostics, CLI, Secrets, ACP, and MCP sections so you know at a glance what section you're in
- The roundness slider is gone — replaced with **discrete stops**, which is more predictable
- `aria-labels` added across usage filters for better screen-reader accessibility

It's not a redesign, but the Knot theme now feels noticeably more intentional.

## Security: CSP Hardening for Inline Scripts

The Control UI now computes **SHA-256 hashes** for all inline script blocks in the served `index.html` and injects them into the `script-src` CSP directive ([#53307](https://github.com/openclaw/openclaw/pull/53307), credit: [@BunsDev](https://github.com/BunsDev)). Inline scripts remain blocked by default — only explicitly hashed bootstrap code gets through.

This closes a common CSP gap where bootstrap scripts had to be whitelisted broadly. If you run OpenClaw in a security-sensitive environment, this one matters.

## Notable Fixes

v2026.3.23 is dense with fixes. The highlights:

**Auth & Tokens**
- **OpenAI token revert bug fixed** ([#53207](https://github.com/openclaw/openclaw/issues/53207)): Live gateway auth-profile writes were overwriting freshly saved credentials with stale in-memory values. Configure, Onboard, and token-paste flows no longer snap back to expired tokens.
- **Operator scopes preserved** through device-auth bypass ([#53110](https://github.com/openclaw/openclaw/pull/53110)): Operator sessions stopped failing or blanking on read-backed pages when scopes weren't carried through correctly.

**Plugins & ClawHub**
- **ClawHub version check fixed** ([#53157](https://github.com/openclaw/openclaw/pull/53157)): Plugin installs were failing because the compatibility checker was hardcoded against a stale `1.2.0` constant instead of the active runtime version. Fixed.
- **Bundled plugin runtimes restored**: WhatsApp `light-runtime-api.js`, Matrix `runtime-api.js`, and other plugin runtime entry files are back in the npm package. Global installs were failing silently without them.
- **`openclaw plugins uninstall clawhub:` works again**: ClawHub-pinned package names are now accepted as valid uninstall targets.
- **macOS ClawHub auth fixed** ([#52949](https://github.com/openclaw/openclaw/issues/52949)): Skill browsing now correctly reads the login token from `Application Support` (and honors XDG on macOS), so you stay signed in instead of silently falling back to unauthenticated mode.

**Browser Automation**
- **Chrome MCP attach timeouts reduced** ([#52930](https://github.com/openclaw/openclaw/issues/52930)): OpenClaw now waits for existing-session tabs to become usable before treating the MCP handshake as ready, cutting down repeated consent prompts on macOS Chrome.
- **Headless Linux browser regressions fixed** ([#53004](https://github.com/openclaw/openclaw/issues/53004)): Second-run browser starts on slower headless Linux setups no longer fall back to relaunch detection after a brief reachability miss.

**CLI & Cron**
- **`openclaw cron add --at --tz` now respects local wall-clock time** ([#53224](https://github.com/openclaw/openclaw/pull/53224)): DST boundaries are handled correctly for offset-less one-shot datetimes.
- **False "newer OpenClaw" warnings suppressed**: If a config was written by a correction release like `2026.3.23-2`, reading it with `2026.3.23` no longer triggers a spurious upgrade warning.

**Agents**
- **`web_search` provider respects active config** ([#53020](https://github.com/openclaw/openclaw/pull/53020)): Agent turns were hitting a stale/default provider instead of the one you actually configured.
- **Mistral max-token defaults fixed** ([#52599](https://github.com/openclaw/openclaw/issues/52599)): Bundled Mistral providers were carrying context-sized output limits, causing deterministic 422 rejects. `openclaw doctor --fix` can now repair existing configs.

## How to Update

```bash
npm install -g openclaw@latest
openclaw doctor --fix
```

The `--fix` flag is particularly useful in this release to patch any stale Mistral provider configs.

Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases).
