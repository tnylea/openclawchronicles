---
title: "OpenClaw Browser Tools Prefer Local Control"
excerpt: "OpenClaw browser automation now prefers a usable local host browser before routing actions to connected nodes."
coverImage: '/assets/images/posts/openclaw-2026-9-13-browser-local-node-routing.png'
date: '2026-09-13T23:02:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-browser-local-node-routing.png'
---

OpenClaw merged a browser-routing compatibility fix at the end of tonight's window. [PR #147446](https://github.com/openclaw/openclaw/pull/147446), `fix(browser): prefer local control over connected nodes`, changes how OpenClaw chooses where browser actions run when both the Gateway host and connected nodes appear to support browser capability.

The old behavior could send browser actions to a connected node even when the Gateway host had a usable local browser. Worse, a node could advertise browser support without having an installed executable, making otherwise working local automation fail.

## What Users Get

Browser tools and the browser CLI now prefer the host when the selected host profile is usable. Automatic node routing still exists when local browser capability is absent, and explicit host or node requests keep their meaning.

The PR calls out several preserved behaviors:

- Configured node pins still work through `gateway.nodes.browser.node`.
- Explicit remote execution remains available.
- Sandbox routing is unchanged.
- Existing-session, extension, attach-only, and remote-CDP profiles keep their connection identity.
- Launch, permission, and page-action failures stay with the selected owner instead of replaying elsewhere.

There is no configuration migration. Operators who intentionally relied on implicit node preference should set the existing node pin or explicitly select the node before upgrading.

## Why It Matters

Browser automation is highly stateful. Cookies, local sessions, extension profiles, remote CDP endpoints, and permissions can all differ between the host and a connected node. If OpenClaw silently moves an action to a different machine, the failure can look like a website problem, a missing login, or a broken browser install.

Preferring a known-good local browser makes the default path more predictable. It also avoids unnecessary node-discovery work on the happy path, which should help the browser CLI and browser tools feel less surprising in mixed host/node setups.

This is not a flashy feature, but it touches a daily workflow for users who ask agents to inspect pages, test web apps, capture screenshots, or automate browser-backed tasks.

## Compatibility Notes

The compatibility note is worth reading closely. The maintainer accepted an intentional routing behavior change: unpinned installations can switch execution location after upgrade. For most users, that means actions are more likely to run locally when a local browser is available.

For operators who need node-local login continuity, the answer is to make that preference explicit with the existing node pin or an explicit node request. The stored configuration shape does not change.

## Verification

The PR reports seven new regression cases that failed against the original selector because it chose the node over the usable host. The fixed version passed 364 focused tests across host availability, agent tools, Gateway requests, node proxy ownership, shared control state, and request timeouts.

It also passed a full `pnpm build` and `node scripts/check-changed.mjs`, including core, plugin, and test type checking, lint, configuration-doc consistency, and import-cycle checks. Independent review found no actionable P0-P2 findings.

For OpenClaw users running both local and connected-node browser capability, this should make browser automation choose the place they expect more often.
