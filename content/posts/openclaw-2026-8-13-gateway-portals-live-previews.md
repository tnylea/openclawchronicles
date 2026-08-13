---
title: "OpenClaw Adds Gateway Portals for Live App Previews"
excerpt: "OpenClaw Portals let operators view agent-run development servers through the Gateway with live reload, proxying, and scoped access control."
coverImage: '/assets/images/posts/openclaw-2026-8-13-gateway-portals-live-previews.png'
date: '2026-08-13T08:02:00.000Z'
dateFormatted: August 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-13-gateway-portals-live-previews.png'
---

OpenClaw merged a genuinely visible developer-experience feature this morning: [PR #122536](https://github.com/openclaw/openclaw/pull/122536), titled "feat: portals - expose agent-run dev servers to the operator." The new Portals system gives agents a first-class way to expose a local HTTP development server through the Gateway so the operator can inspect the running app from Control UI.

The problem is familiar to anyone who has asked an agent to build a web app. The app starts on some local port, the agent reports a URL, and then the human still has to bridge the gap between the machine running the server and the place where the UI is open. That gets worse when Control UI is accessed remotely through a LAN, Tailscale, Serve, Funnel, or another reverse proxy. A `localhost:3000` link may be correct for the agent's machine and useless for the operator.

Portals turns that fragile handoff into an OpenClaw-managed path.

## What Portals Adds

The merged PR adds a Gateway portal service, reverse proxy, protocol methods, agent tool, Control UI page, and documentation. The portal proxy is designed for ordinary development servers rather than a special OpenClaw-only runtime. It rewrites the host, strips hop-by-hop headers, streams bodies, supports WebSocket passthrough for Vite and Next hot module reload, and dials targets through `localhost` with dual-stack behavior for Node versions that bind dev servers to IPv6 loopback.

The feature also adds an operator-facing Control UI route at `/portals`. The page lists open portals, embeds the selected preview, offers open-in-new-tab behavior, and lets the operator close a portal when it is no longer needed. Portal updates are driven by a new `portal.changed` broadcast.

For agents, the new `portal` tool supports open, list, and close operations. It is gated like terminal access: non-sandboxed sessions only, denied for HTTP `/tools/invoke`, and restricted to the sender owner.

## Security Boundaries Matter Here

The interesting part is not just that Portals works. It is that the feature was merged with several security and credential-boundary guardrails already in place.

Each portal gets a random bearer token in the URL. The first request converts that into an HttpOnly cookie, then strips the token before forwarding traffic upstream. Requests without the token or cookie get a private-portal notice rather than the app.

The PR also hardened cookie isolation after review. Gateway plugin-auth cookies should never leak to an agent-run app, and target app cookies should stay namespaced to the portal listener. To get there, OpenClaw prefixes portal cookies, strips domain attributes, and keeps portal sessions independent across concurrently open previews.

One late hardening fix is especially important: the portal URL carries a token in the query string, so the proxy now forces `Referrer-Policy: no-referrer` and drops inbound referrers that still carry the token before forwarding.

## Why Operators Will Notice

This should make web-app work feel much less clumsy. Instead of asking where the server is running, checking ports, and translating local URLs by hand, the operator can ask the agent to show the work in a portal.

The PR evidence includes a live Vite dev server rendered through the Control UI Portals page, hot reloaded through the proxied WebSocket, then closed from the UI. It also verifies unauthorized access behavior, cookie-only access after token exchange, and teardown after close.

## The Bottom Line

[PR #122536](https://github.com/openclaw/openclaw/pull/122536) is a major quality-of-life feature for agent-built web apps. Portals gives OpenClaw a native preview lane that works across local and remote operator setups while keeping the Gateway, portal proxy, and agent-run app on distinct authority boundaries.
