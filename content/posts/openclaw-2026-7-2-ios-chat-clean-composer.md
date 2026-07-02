---
title: "OpenClaw iOS Chat Gets a Cleaner Composer"
excerpt: "OpenClaw refined the iOS chat screen with cleaner assistant typography, a compact composer, and tappable Liquid Glass controls."
coverImage: '/assets/images/posts/openclaw-2026-7-2-ios-chat-clean-composer.png'
date: '2026-07-02T08:04:00.000Z'
dateFormatted: July 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-2-ios-chat-clean-composer.png'
---

OpenClaw merged [PR #98953, "feat(ios): refine the chat experience"](https://github.com/openclaw/openclaw/pull/98953) on July 2nd, continuing the iOS app polish that started landing around the public mobile release.

This one is a user-interface change, but it is not just visual cleanup. Chat is the primary surface where a mobile user talks to an agent, watches it stream, sees tool activity, and sends follow-up instructions. Small layout mistakes become daily friction.

The PR body says the previous iOS chat felt "visually heavy and mechanically assembled" because of duplicate intro cards, a large status badge, generic assistant containers, and a composer that used more vertical space than necessary.

## What Changed

The refined chat interface keeps user messages in clear bubbles, but lets assistant content use more open typography. Transient assistant states keep the same geometry, so loading and streaming do not feel like a separate visual system.

The header also gets quieter. Instead of a large text status badge competing with the agent identity, connection status moves into a compact semantic icon.

The composer is the other major part of the change. Attachment, text, voice, and send controls now form one adaptive surface on iOS 26 using Liquid Glass, with a material fallback on older systems.

The composer starts at 44 points tall, grows through four lines as the user types, and preserves 44-point hit regions for attachment, voice, and send. That last detail matters on mobile: a compact UI is only better if it remains easy to tap.

## Why It Matters

OpenClaw's mobile apps are no longer just remote controls for a terminal agent. The public iOS and Android release shifted them toward first-class app surfaces, and the UI now has to carry more responsibility.

For chat, the central design problem is density. The app needs to show context, message history, agent state, tool activity, and controls without making every response look like a boxed widget.

PR #98953 moves the interface in that direction. Assistant text becomes easier to scan, the idle state stops competing with operational feedback, and the input area takes less space until the user actually needs more room.

## Proof and Accessibility

The PR includes before-and-after screenshots, compact and expanded composer screenshots, light appearance proof, and a live Gateway round-trip. In that live test, the app paired to an isolated local Gateway, sent a unique marker through a deterministic OpenAI Responses endpoint, rendered the echoed marker, relaunched with paired credentials, and opened Control Overview.

The validation also includes a UI test asserting that attachment, Talk, and Send each expose at least a 44 by 44 point hittable region.

That is the right kind of proof for this sort of change. A chat redesign should not just look cleaner in a static screenshot; it needs to preserve pairing, live sending, accessibility, dynamic type expectations, and interaction targets.

## Related Mobile Work

This PR landed shortly after [PR #98811](https://github.com/openclaw/openclaw/pull/98811), which modernized iOS navigation and settings, and [PR #98736](https://github.com/openclaw/openclaw/pull/98736), which simplified Talk controls and composer alignment.

Together, these changes show the native app moving away from dense custom panels and toward a more conventional iOS experience: standard navigation, clearer hierarchy, compact controls, and less visual noise around the core agent interaction.

## Bottom Line

OpenClaw's iOS chat screen now feels more like a place to work with an agent and less like a stack of status containers.

That is a meaningful step for the mobile app. As OpenClaw moves more everyday workflows onto phone surfaces, the chat composer and message presentation need to be fast, quiet, and hard to mis-tap. PR #98953 pushes the app in exactly that direction.
