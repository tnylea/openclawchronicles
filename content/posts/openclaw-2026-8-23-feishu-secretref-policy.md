---
title: "OpenClaw Tightens Feishu SecretRef Policy"
excerpt: "OpenClaw now prevents disallowed Feishu environment credentials from authenticating requests when SecretRef provider policy rejects them."
coverImage: '/assets/images/posts/openclaw-2026-8-23-feishu-secretref-policy.png'
date: '2026-08-23T23:00:00.000Z'
dateFormatted: August 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-23-feishu-secretref-policy.png'
---

OpenClaw landed a high-priority Feishu security-boundary fix in [PR #127682](https://github.com/openclaw/openclaw/pull/127682), preventing disallowed ambient environment credentials from being treated as valid during account inspection.

The issue lived in a subtle place: Feishu operators using SecretRef provider policy could configure an account in a way that should reject an environment-backed credential, but account inspection could still see that ambient credential as configured. From there, the credential could reach authenticated document-comment delivery or live directory lookup paths, even when the provider alias was unconfigured, pointed at the wrong source, or blocked by an allowlist.

That is exactly the kind of bug credential policy is supposed to rule out. The new fix moves Feishu account inspection back under the same canonical Plugin SDK read-only SecretRef policy used elsewhere, so the configured policy gets the final say before any environment variable is read.

## What Changed

The Feishu account snapshot owner now delegates provider authorization to the shared SecretRef policy path before resolving environment credentials. The PR also removes an obsolete relaxed-resolution option instead of layering a second credential path downstream.

The repair covers four important cases:

- an unconfigured provider;
- a provider with the wrong credential source;
- allowlist rejection;
- explicitly allowed environment access.

Those cases now apply consistently across account inspection, live directory lookup, authenticated document-comment delivery, and message-tool discovery.

The last point matters because discovery paths can become accidental back doors. If the runtime can expose a capability during discovery with a credential the configured provider policy rejected, downstream send paths may look correct while the system still advertises behavior it should not enable. [PR #127682](https://github.com/openclaw/openclaw/pull/127682) closes that fallback by passing the full root config into the same inspection owner.

## Why It Matters

OpenClaw's channel plugins increasingly depend on structured credential policies rather than loose environment-variable convention. That shift only works if every read path obeys the policy, including read-only status and discovery calls.

For Feishu users, the practical outcome is clearer: rejected ambient credentials stay rejected. Valid literal credentials, configured provider defaults, and explicitly allowed environment references continue to work, while strict runtime snapshots remain fail-closed when a reference cannot be resolved.

This is not a new Feishu feature. It is a credential-boundary repair that makes existing configuration rules mean what operators expect them to mean.

## Validation

The PR reports 10 pre-fix regressions that reproduced denied provider-policy cases reaching configured account and authenticated boundaries. Focused Feishu tests then passed across accounts, directory lookup, and outbound delivery, with 170 tests passing in the native target set.

Additional caller-level discovery regressions cover file-backed default providers, allowlist rejection, and explicitly allowed environment access. The PR also reports formatting, lint, import-cycle, plugin-boundary, max-lines, and assertion-safety checks, plus a clean focused security review and green exact-head hosted CI.

## Bottom Line

OpenClaw's Feishu integration now follows SecretRef provider policy at account inspection time, capability discovery time, and authenticated use time. That keeps ambient environment credentials from quietly bypassing the authorization rules operators configured.
