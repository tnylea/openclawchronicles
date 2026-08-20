---
title: "OpenClaw Fixes Managed Tailscale Funnel Access"
excerpt: "OpenClaw now preserves managed Tailscale Funnel access for public and tailnet users while cleaning up routes after interruption."
coverImage: '/assets/images/posts/openclaw-2026-8-20-managed-tailscale-funnel-fix.png'
date: '2026-08-20T23:02:00.000Z'
dateFormatted: August 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-20-managed-tailscale-funnel-fix.png'
---

OpenClaw's managed Tailscale path picked up an upgrade-focused repair today in [PR #126519](https://github.com/openclaw/openclaw/pull/126519), a Gateway fix that matters for operators exposing a local agent through Tailscale Serve or Funnel.

The merged change addresses two regressions found during cross-platform release testing: authenticated tailnet peers could be rejected when they opened a managed Funnel URL, and an interrupted interactive Gateway could leave a Tailscale route claimed after shutdown.

## What Changed

The heart of the fix is attribution. Tailscale handles public Funnel traffic and authenticated tailnet traffic differently, even when both use the same Funnel hostname. Public requests carry the Funnel request marker, while tailnet requests use the Serve identity-header path. OpenClaw's managed listener now accepts both upstream-defined forms while still requiring the configured Gateway password.

That is a narrow but important distinction. The PR says the missing-marker acceptance stays scoped to the dedicated managed Funnel listener. Malformed markers and unattributable proxy traffic on ordinary listeners continue to fail closed.

The second half of the change is lifecycle cleanup. The route-owner worker now drains its detached Tailscale child when the worker receives a terminal signal, so pressing Ctrl-C or interrupting an interactive managed Serve/Funnel Gateway no longer leaves the foreground route stuck in claimed state.

## Why Operators Should Care

Managed Tailscale is one of the cleaner ways to reach a self-hosted OpenClaw Gateway without punching broad holes through a network. That means regressions at this boundary are both usability bugs and trust bugs: users need the public and private paths to behave consistently, and they need shutdown to release the route they think they just stopped.

The user impact from the PR is direct:

- Managed Funnel URLs now work from both the public internet and the tailnet.
- The configured Gateway password remains required in both paths.
- Interactive Gateway shutdown cleans up the managed Tailscale port claim.
- Ordinary listener spoofing and forged Tailscale headers remain rejected.

The security posture is worth calling out because this was labeled as a P1 with compatibility, security-boundary, and availability risk markers. The repair widens acceptance only for the authenticated tailnet form that Tailscale itself defines; it does not turn missing Funnel markers into general trust.

## Tested Across Platforms

The PR includes unusually broad release-candidate proof. The author reports focused Gateway attribution/auth tests, route-owner worker tests, package creation, installed-package import graph validation, and a cross-platform installed-package campaign across macOS, Ubuntu, and Windows Server with current Node and Tailscale versions.

The proof also checked public and tailnet paths, HTTP and WebSocket health, IPv4 and IPv6 tailnet requests, ordinary-listener rejection, and non-destructive behavior when an existing stable-managed route already owns the target.

For OpenClaw users running agents behind Tailscale, this is the kind of fix that will mostly be noticed by what stops happening: fewer mysterious `403 proxy_attribution_required` failures, fewer stale route claims, and less anxiety around upgrading managed Gateway setups.
