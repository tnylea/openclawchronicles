---
title: "OpenClaw Lands Official iOS and Android Apps"
excerpt: "OpenClaw's official mobile apps are now documented for iOS and Android, turning phones into paired companion nodes for Gateway control."
coverImage: '/assets/images/posts/openclaw-2026-6-29-ios-android-apps.png'
date: '2026-06-29T23:00:00.000Z'
dateFormatted: June 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-29-ios-android-apps.png'
---

OpenClaw's mobile story crossed a clearer line today: the project now has official platform documentation for both [Android](https://docs.openclaw.ai/platforms/android) and [iOS](https://docs.openclaw.ai/platforms/ios), and Hacker News picked up the news under the title ["OpenClaw Is Now on iOS and Android"](https://hn.algolia.com/?q=openclaw&sort=byDate). The HN thread is still tiny, but the source signal matters because mobile is becoming a first-class OpenClaw control surface rather than an experimental side path.

The Android docs say the official Android app is available on Google Play, acts as a companion node, and requires a running OpenClaw Gateway. The iOS docs describe a similar node role: the app connects to a Gateway over WebSocket, exposes capabilities, receives `node.invoke` commands, and reports node status events.

## Phones Become Nodes

The important word is "node." These apps are not just chat frontends. They let a phone pair with a Gateway and expose device-adjacent capabilities under the same node model OpenClaw uses elsewhere.

On Android, the documented command surface includes device status, permissions, health, camera, photos, contacts, calendar, call logs, SMS search, motion activity, and notification forwarding. Some of those are gated by settings and permissions, which is exactly where they belong. A self-hosted agent should not quietly inherit the whole phone.

iOS is more constrained, but still meaningful. The docs list Canvas, screen snapshot, camera capture, location, Talk mode, and voice wake as node capabilities. Official distributed builds use an external push relay instead of handing the raw APNs token to the Gateway, which keeps the mobile delivery path cleaner.

## Pairing Is Still Gateway-Centric

The docs keep the trust model anchored around the Gateway. Both platforms require a running Gateway on another machine. Both use pairing. Both expect the operator to approve the request from the Gateway side, unless they intentionally configure narrow auto-approval rules for controlled networks.

That is the right shape for mobile OpenClaw. Phones are sensitive devices. They carry location, notifications, contacts, cameras, and microphones. Making them useful as companion nodes is powerful, but only if the pairing and permission story stays explicit.

Android's connection runbook is especially detailed. It recommends secure `wss://` endpoints for Tailscale or public access, supports private-LAN `ws://` paths, and explains that mDNS discovery alone is not enough for remote pairing. That is a practical detail operators will appreciate the first time they try to connect a phone away from home.

## Why This Is Bigger Than Another Client

OpenClaw started as a chat-first agent runtime. Mobile apps change the center of gravity. They put approvals, wake events, voice, camera, location, and device presence closer to the person carrying the agent.

That makes several workflows more natural:

- Review Gateway action approvals from a phone.
- Use push-to-talk or continuous Talk mode while away from the main machine.
- Capture camera or screen context as part of an agent task.
- Forward carefully scoped notifications into an automation workflow.
- Keep a lightweight mobile status surface for an always-on Gateway.

It also raises the stakes. Mobile permissions are personal. The docs repeatedly frame the apps as companion nodes rather than standalone hosts, and that distinction helps keep the operational boundary understandable: the Gateway runs elsewhere, while the phone contributes selected capabilities.

## The Bottom Line

The official mobile docs make OpenClaw feel less like a desktop or server project with phone experiments attached, and more like a multi-device agent system. Android already has a broad documented capability surface, while iOS has the expected Apple-shaped limits plus official push relay handling.

The next thing to watch is adoption and hardening: how pairing UX, permission scopes, notification filtering, and Talk mode behave once more operators run these apps every day. For now, iOS and Android are no longer footnotes in the OpenClaw platform story.
