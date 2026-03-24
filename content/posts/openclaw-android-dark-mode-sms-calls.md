---
title: "OpenClaw's Android App Gets Dark Mode, SMS Search, and Call Log Access"
excerpt: 'The March 22nd release brings a significant round of Android improvements — system-aware dark theme across all screens, the ability to search SMS messages and call history through the gateway, and a rearchitected Talk (TTS) system that moves synthesis off-device.'
coverImage: '/assets/images/posts/android-dark-mode-sms-calls.png'
date: '2026-03-22T11:11:00.000Z'
dateFormatted: March 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/android-dark-mode-sms-calls.png'
---

The `2026.3.22` release lands meaningful improvements for Android users — changes that make the mobile experience feel noticeably more polished and capable. Here's what's new on the Android side.

## System-Aware Dark Theme

After what felt like an overdue wait, the Android app now follows your device's system theme. The dark theme applies across **onboarding and post-onboarding screens** — setup, chat, and voice flows included.

Previously, the app had a fixed light appearance that clashed with dark-mode-first phone setups. If you've been living in a sea of blinding white while the rest of your apps respected your system preference, this update is for you.

Thanks to [@sibbl](https://github.com/sibbl) for contributing this fix.

## Search Your SMS Messages via the Gateway

OpenClaw nodes on Android can now search device text messages using the new `sms.search` capability. The gateway handles the query and routes results back through the standard tool interface — your SMS data stays on your device, accessed through the permission model.

Required permission: SMS read access (standard Android runtime permission).

This opens up practical use cases — ask your agent to find a confirmation code, look up a message thread, or surface SMS-based 2FA codes during an automated workflow.

Thanks to [@lixuankai](https://github.com/lixuankai) for the implementation.

## Search Call History via the Gateway

Same pattern, applied to your call log: `callLog.search` lets Android nodes query recent call history through the gateway. Useful for workflows where you want to verify a recent call, look up a number, or surface call data in a broader automation.

Required permission: Call Log read access.

Thanks again to [@lixuankai](https://github.com/lixuankai) for contributing both the SMS and Call Log capabilities together.

## Talk (TTS) Architecture Rework

The Talk system — OpenClaw's text-to-speech feature — got a significant under-the-hood change. Previously, Talk synthesis happened on-device via ElevenLabs streaming. That's been moved **to the gateway**.

**What this means in practice:**
- Talk secrets (API keys) now live on the gateway, not the Android device
- Playback switches to **final-response audio** rather than real-time ElevenLabs streaming
- The architecture aligns with how other gateway-proxied features work — secrets stay server-side

The trade-off: you lose the real-time streaming feel for a more predictable, fully-rendered audio response. For most use cases, the practical difference is minimal.

## Also Fixed: Android Contact Search SQL Injection

A small but worth-noting bug fix: contact-name searches containing `%` or `_` (e.g., searching for "100%" or a contact literally named "_id") would previously match unintended contacts due to unescaped SQL LIKE wildcards.

Those characters are now properly escaped. Thanks to [@Kaneki-x](https://github.com/Kaneki-x) for catching and reporting this.

## Updating

If you're using the Android companion app, check the Play Store or your sideload source for the latest build corresponding to `2026.3.22`. The SMS and Call Log features require granting the relevant permissions on first use — you'll be prompted automatically when your agent first attempts to use them.

---

*Source: [OpenClaw v2026.3.22 Release Notes](https://github.com/openclaw/openclaw/releases/tag/v2026.3.22)*
