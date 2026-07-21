---
title: "OpenClaw Adds Explicit macOS Privacy Consent"
excerpt: "OpenClaw now requires clearer macOS consent for Automation, Voice Wake, and active-computer presence before sensitive access begins."
coverImage: '/assets/images/posts/openclaw-2026-7-21-macos-privacy-consent.png'
date: '2026-07-21T23:01:00.000Z'
dateFormatted: July 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-21-macos-privacy-consent.png'
---

OpenClaw merged a privacy-focused macOS update tonight that tightens how the desktop app handles sensitive local capabilities. [PR #112321](https://github.com/openclaw/openclaw/pull/112321), titled "fix(macos): require explicit consent for privacy-sensitive access," closes three related privacy gaps around Automation prompts, Voice Wake recognition, and active-computer presence reporting.

The practical theme is straightforward: viewing settings should not surprise users with a system permission prompt, passive wake features should keep their on-device promise, and activity reporting should be opt-in rather than implied by another permission.

That matters because macOS permissions can feel noisy even when an app is behaving correctly. OpenClaw is trying to distinguish inspection from activation, and permission awareness from permission use.

## What Changed

The patch changes the Permissions flow so opening the page no longer triggers an unsolicited Terminal Automation prompt. Instead, OpenClaw now uses a non-prompting Apple Event probe to check status and reserves launch-and-consent behavior for an explicit Grant action.

Voice Wake also gets a stricter boundary. The PR says Voice Wake and its tester now require on-device recognition and fail closed when the selected language is unavailable. Interactive speech features keep their existing Apple Speech behavior, but the passive wake path no longer silently drifts into network recognition.

The third change is active-computer presence. Physical-input activity reporting is now off by default behind its own Privacy toggle. If users turn it off, OpenClaw stops collection and sends a socket-bound clear so retained active-computer state does not survive opt-out.

## Why It Matters

OpenClaw increasingly bridges local apps, Gateway state, voice interfaces, and connected agents. That power makes permission boundaries more important, not less.

This update reduces a class of privacy surprises:

- Users can inspect permissions without causing an Automation prompt.
- Passive Voice Wake stays local or stays unavailable.
- Activity presence is not sampled or shared until the user opts in.
- Opting out actively clears retained activity state.

The active-computer change is especially useful for operators who run OpenClaw across multiple nodes. Presence can be helpful context, but it should not be a side effect of enabling Accessibility for another reason.

## Proof From The PR

The PR is broad: it touches macOS app code, OpenClawKit protocol models, Gateway node-session handling, docs, and tests. The author reports 120 focused gateway/protocol tests, 77 node-registry tests, 61 macOS presence/coordinator/relocation tests, 19 Settings smoke tests, Swift lint/format checks, protocol regeneration, dependency audit cleanup, and exact-head CI with 74 green jobs.

The merged commit set includes targeted changes named "avoid passive Automation prompts," "keep Voice Wake recognition on device," "require consent for activity presence," "preserve presence clears across gateway versions," and "prioritize activity privacy opt-out."

This is not a new headline feature, but it is an important trust fix. For a local-first agent platform, the permission story needs to be as deliberate as the automation story.
