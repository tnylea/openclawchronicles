---
title: "OpenClaw Adds Native Skills Management"
excerpt: "OpenClaw's iOS, Android, and macOS apps now share core Skills workflows for browsing, installing, enabling, and reviewing ClawHub packages."
coverImage: '/assets/images/posts/openclaw-2026-7-13-native-skills-management.png'
date: '2026-07-13T08:02:00.000Z'
dateFormatted: July 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-13-native-skills-management.png'
---

OpenClaw merged a native Skills management parity feature Monday morning, bringing iOS, Android, and macOS closer together around installed skills, ClawHub discovery, and risk review. The PR, `feat: add native Skills management parity`, closes a gap where Android had more native skill-management surface than the Apple apps.

This is a user-facing platform story: Skills are one of OpenClaw's main extension mechanisms, and managing them only from a subset of clients makes the system feel uneven.

Source: [OpenClaw PR #105814](https://github.com/openclaw/openclaw/pull/105814)

## What Changed

The merged work adds a shared Apple skill-management contract plus complete Installed and Browse surfaces on iOS and macOS. It also tightens Android installed-state detection.

According to the PR, all three native platforms now present the same core workflow:

- Search installed skills.
- Filter by readiness.
- Enable and disable skills.
- Search and review ClawHub releases.
- Inspect publisher and version details.
- Install exact reviewed versions.
- Read back installed state.
- Expand warning details before acknowledging Gateway risk.

The important architectural detail is where trust stays. The PR says exact reviewed ClawHub versions and publisher-qualified identities remain bound to one Gateway route, while the Gateway continues to own trust evaluation, installation, and configuration.

## Why It Matters

Skills are powerful because they turn repeated practices into reusable agent behavior. That same power makes install and enable flows sensitive. Users need to see what is installed, where it came from, which version they reviewed, whether it is ready, and what risk they are acknowledging.

Native parity helps in two ways. First, people can manage Skills from the device they are actually using instead of switching surfaces. Second, the Gateway remains the authority, so native clients are not each inventing their own trust model.

The PR explicitly notes that it does not introduce a new Gateway protocol, config surface, fallback path, or runtime state surface. That makes this a client parity layer over the existing Gateway-owned install and trust boundary.

## Verification

The PR reports a clean autoreview, Swift parser validation for the new shared iOS and macOS sources, regenerated native source inventory, and Android compile work that caught a missing import. It also notes pending broader native validation before merge, so this is worth watching in follow-up releases.

Even with that caveat, the product direction is clear. OpenClaw is treating Skills as a first-class native workflow, not just a web or CLI feature. For operators who live on phones and desktops throughout the day, that is a meaningful usability step.
