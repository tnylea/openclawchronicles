---
title: "OpenClaw Locks Browser CDP to Its Host"
excerpt: "OpenClaw now isolates CDP control host policy so browser discovery cannot pivot control traffic to another allowed navigation host."
coverImage: '/assets/images/posts/openclaw-2026-7-6-browser-cdp-host-policy.png'
date: '2026-07-06T23:10:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-browser-cdp-host-policy.png'
---

OpenClaw merged [PR #101171, "fix(browser): keep CDP discovery on the configured host"](https://github.com/openclaw/openclaw/pull/101171), a browser automation hardening fix around Chrome DevTools Protocol discovery and host policy.

The affected path is specific, but the boundary is important. Users can configure browser navigation policies that allow certain hosts. CDP control is different from page navigation: it is the control channel for browser automation itself. The PR fixes a case where discovery could follow a returned debugger WebSocket to a host other than the configured browser endpoint under permissive or multi-host policies.

## What Changed

CDP control now receives a dedicated exact-host policy. OpenClaw still preserves the existing remote `hostnameAllowlist` gate, and configured local relays keep their loopback control exception.

The key distinction is that discovered endpoints cannot claim a loopback exception just because a page-navigation policy allows broader hosts. Persistent Playwright tab creation and permission routes also use the control policy only for CDP connections while retaining the page policy for actual navigation.

That keeps two concerns separate: where pages may go, and where OpenClaw may send browser-control traffic.

## Why It Matters

Browser automation is powerful because it can read pages, control tabs, grant permissions, and drive workflows that look like a human using a browser. That also means the CDP endpoint deserves a tighter trust model than ordinary web navigation.

If a permissive navigation policy can influence CDP discovery, a malicious or misconfigured endpoint may be able to move control traffic or CDP URL credentials somewhere the operator did not intend. The PR closes that gap by binding browser control back to the configured host.

This is not meant to block legitimate managed-browser setups. The PR body notes that managed and extension loopback profiles still work under strict navigation rules, and explicitly allowed remote CDP profiles remain supported.

## Validation

The PR reports regressions for strict, permissive, wildcard, trailing-dot, extension-loopback, discovered-endpoint, persistent Playwright, and permission-route cases. It also includes a live run with real Chrome 150, Gateway, and an `openai/gpt-5.4` agent: CDP open/list worked under a restrictive navigation allowlist, while direct and agent navigation to `openai.com` were policy-blocked.

## Bottom Line

OpenClaw now treats CDP discovery as browser-control traffic, not ordinary browsing. That keeps navigation flexibility while making the control plane stick to the configured browser endpoint.

