---
title: "OpenClaw's Browser and Dependency Security Gets a Major Overhaul"
excerpt: "Eleven security-focused PRs merged on April 10th lock down SSRF escapes, tighten browser navigation guards, pin axios against CVE-2025-27152, and add a plugin dependency denylist."
coverImage: '/assets/images/posts/openclaw-browser-security-hardening-april-2026.png'
date: '2026-04-10T23:00:00.000Z'
dateFormatted: April 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-browser-security-hardening-april-2026.png'
---

If you follow the OpenClaw `main` branch, April 10th, 2026 was a significant day for security. A wave of hardening PRs landed in a single push, touching browser navigation guards, SSRF quarantine logic, sender-scoped media policy, and the plugin dependency install surface. Here is what changed and why it matters for self-hosters.

## Browser Navigation Guards: Three New Phases

The most active contributor in this batch was [@eleqtrizit](https://github.com/eleqtrizit), who merged four tightly related browser security PRs.

**[#64370](https://github.com/openclaw/openclaw/pull/64370) — Guard existing-session navigation**
Browser sessions that were already open could be steered into forbidden destinations via same-session navigations. This fix re-evaluates the SSRF blocklist on any navigation that happens inside an active session, not just on session creation.

**[#64371](https://github.com/openclaw/openclaw/pull/64371) — Handle subframe document navigations**
OpenClaw's browser tool previously evaluated navigation guards only on the main frame. Subframe document navigations — used by many real-world pages — could be used to silently pivot to a private-network destination. This PR extends the three-phase check to subframe navigations.

**[#63889](https://github.com/openclaw/openclaw/pull/63889) — `pressKey` and `type(submit)` guards**
Interaction-driven navigations triggered by `pressKey` and `type` with a submit action were not being re-evaluated against the blocked-destination list. An adversarial page could use a form submit to navigate the browser to a local network address. Now the same three-phase interaction navigation guard that already covered `click` and `evaluate` covers these paths too.

**[#64367](https://github.com/openclaw/openclaw/pull/64367) — Strict hostname navigation tightening**
Strict browser hostname mode now correctly handles edge cases where Playwright does not flag a redirect as `isNavigationRequest()`. Combined with the existing SSRF redirect fix from v2026.4.9, private network pivots via redirect chains are now blocked across all supported navigation paths.

## Sender Policy for Host Media Reads

**[#64459](https://github.com/openclaw/openclaw/pull/64459) — Honor sender policy for host media reads**
Before this fix, the sender's channel policy (e.g., untrusted workspace restrictions) was not applied when the agent read media files directly from the host filesystem. An untrusted sender could trick the agent into reading files they should not have access to. This PR routes all host media reads through the same sender-scoped policy checks that govern other tool calls.

## axios Pinned to 1.15.0 + Plugin Dependency Denylist

**[#63891](https://github.com/openclaw/openclaw/pull/63891) — Pin axios and add dependency denylist**
This is the most broadly impactful security PR in the batch. It does two things:

1. **Pins axios to 1.15.0**, which includes the fix for [CVE-2025-27152](https://github.com/advisories/GHSA-jr5f-v2jv-69x6) — a credential-leaking SSRF vulnerability where axios would follow cross-origin redirects and forward Authorization headers to the redirected host.
2. **Adds a plugin dependency denylist**: when you install a skill or plugin via `openclaw plugins install`, OpenClaw now checks each transitive dependency against a maintained denylist of known-dangerous packages. Plugins that pull in denylist entries are blocked before installation.

The denylist infrastructure is a meaningful step toward supply-chain hardening for the plugin ecosystem — comparable to what npm's advisory feed does, but integrated directly into the install flow.

## Agent Hook Trust Normalization

**[#64372](https://github.com/openclaw/openclaw/pull/64372) — Normalize agent hook system event trust handling**
Agent hook-triggered system events were not consistently marked with the correct trust level. In edge cases this allowed hook output to be treated as operator-trusted content rather than user-level input. This fix ensures hook system events pass through the same trust normalization as other system events.

## Gmail Log Redaction

**[#62661](https://github.com/openclaw/openclaw/pull/62661) — Redact Gmail watcher startup args from log tail**
The `openclaw logs` tail could expose Gmail OAuth credentials that were passed as startup arguments to the watcher process. These are now redacted before log output is surfaced, preventing accidental credential leakage when sharing debug logs.

## What You Should Do

Most of these fixes are already shipping in the pre-release `main` builds and will land in the next tagged release. If you are running a public-facing OpenClaw instance — particularly one with browser tools enabled or plugin installation allowed — updating promptly is advisable.

For the axios CVE specifically: if your custom skills or plugins depend on axios directly, audit your version pins and update to 1.15.0 or later.

All fixes are tracked in the [OpenClaw security tracker](https://github.com/openclaw/openclaw/security).
