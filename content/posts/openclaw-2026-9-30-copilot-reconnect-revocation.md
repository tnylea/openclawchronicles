---
title: "OpenClaw Stops Revoked Copilot Reconnect Discovery"
excerpt: "OpenClaw PR #162165 fixes GitHub Copilot reconnects so revoked callers stop before starter-model discovery can continue."
coverImage: '/assets/images/posts/openclaw-2026-9-30-copilot-reconnect-revocation.png'
date: '2026-09-30T23:02:00.000Z'
dateFormatted: September 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-30-copilot-reconnect-revocation.png'
---

OpenClaw merged a GitHub Copilot authorization fix Wednesday night that stops revoked reconnects before starter-model discovery can continue. The change landed in [PR #162165](https://github.com/openclaw/openclaw/pull/162165), titled "fix(github-copilot): stop revoked reconnects before discovery."

The bug lived in a small but sensitive timing window. A GitHub Copilot reconnect could continue into starter-model discovery after its caller had been revoked while the saved token's `SecretRef` was still resolving. The new behavior rechecks authority around that asynchronous credential read, so a revoked reconnect stops before discovery begins.

## Why This Boundary Matters

Reconnect flows are easy to underestimate because they often look like routine convenience plumbing. A provider token already exists. A profile is being restored. The app is trying to make the experience smooth after an interruption.

But reconnects are still authorization events. If the caller loses authority while OpenClaw is resolving a saved credential, the provider path should not keep moving just because it had already started. Starter-model discovery may sound harmless, but it proves the system is still using a provider context after the caller should no longer be allowed to proceed.

This PR keeps the existing successful path intact while tightening the revoked path. Successful reconnects, the existing confirmation, and host-authorized account selection are unchanged.

## What Changed

The fix rechecks both the abort signal and caller authority before and after the asynchronous credential read. That closes the race between resolving a saved token and starting Copilot discovery.

The shared provider contract now supplies its seeded credential through the existing authorized-profile context. Test fixture setup for registered providers was moved into a shared helper, which allowed the new revocation regression to land without expanding an already oversized index test file.

In practical terms, the behavior becomes easier to reason about:

- A reconnect begins under an authorized caller.
- Credential resolution may take time.
- If the caller is revoked during that wait, the reconnect stops.
- Discovery only continues for a still-authorized caller.
- Normal authorized reconnects behave as before.

That is the right shape for a provider integration that handles saved credentials.

## Security Without UI Churn

The PR reports no UI code, prompt text, public API, credential storage, or timeout changes. That is a good sign for this kind of fix. The boundary changes where authority is checked, not how users are prompted or how provider credentials are stored.

The labels still mark this as a security-boundary risk area, and rightly so. GitHub Copilot integration touches credentials, provider profile selection, and model discovery. The safest repair is the one that narrows admission without inventing a new UX or storage contract.

## Verification

The author says the new revocation regression and existing provider contract both failed on canonical main for their intended reasons. After the repair, all 63 owning and sibling cases passed. A full-context review through P2 found no actionable issues.

The unchanged real Gateway and WebSocket replacement revocation case also passed on Linux with Node 24.19. Provider HTTP was synthetic, so this was not a live GitHub authorization test, but it did exercise the OpenClaw-side authority and reconnect boundary. Normal changed-file checks passed as well, including production and test types, scoped lint, SDK declarations, export and boundary guards, and source guards.

For operators using Copilot-backed workflows, this is the kind of fix that should be invisible when everything is healthy and decisive when access changes mid-flight. A revoked caller should stop being able to move the provider path forward, even during a reconnect.
