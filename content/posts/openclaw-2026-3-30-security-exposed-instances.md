---
title: "OpenClaw Security Crisis: 42,000 Exposed Instances and What to Do"
excerpt: "SecurityScorecard found over 42,000 exposed OpenClaw instances online, with 63% vulnerable to RCE. Here is how to check your setup and lock it down now."
coverImage: '/assets/images/posts/openclaw-2026-3-30-security-exposed-instances.png'
date: '2026-03-30T23:05:00.000Z'
dateFormatted: March 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-30-security-exposed-instances.png'
---

Security researchers have published findings that should make every OpenClaw self-hoster stop and audit their setup today.

SecurityScorecard's STRIKE Threat Intelligence team identified **more than 42,000 publicly exposed OpenClaw instances** on the internet. Of those, an estimated **63% were vulnerable to Remote Code Execution** — many leaking API keys, credentials, and private message content to anyone who knew where to look.

The research has been circulating on [r/pwnhub](https://www.reddit.com/r/pwnhub/comments/1s0omzi/is_openclaw_the_biggest_unsecured_attack_surface/) under the headline "Is OpenClaw the biggest unsecured attack surface of the year?" — and it's getting traction beyond the security community.

## How We Got Here

OpenClaw grew from a hobby project to over 250,000 GitHub stars in a matter of months. The onboarding experience optimizes for speed: get your agent talking to WhatsApp in 20 minutes. That's genuinely impressive — but it also means many installations followed "just get it running" guides that skipped authentication, firewall rules, and update hygiene.

The result: tens of thousands of gateway instances sitting exposed on port 58080 (or custom ports) with no authentication required.

## The Vulnerabilities That Matter Most

Several CVEs are active and relevant if you haven't updated recently:

**CVE-2026-25253** (CVSS 9.8 — Critical)
A one-click RCE flaw where any website could silently connect to a running OpenClaw agent via WebSocket. The local server wasn't validating the `Origin` header, meaning a malicious page could execute arbitrary commands on your machine with a single visit. **Patched in v2026.3.11.**

**CVE-2026-32051** (High)
Authorization mismatch in versions prior to v2026.3.1 — attackers with `operator.write` scope could escalate to owner-level actions on gateway and cron endpoints. **Patched in v2026.3.1.**

**CVE-2026-32042** (High)
Privilege escalation in v2026.2.22–2026.2.25 allowing bypass of operator pairing requirements. **Patched in v2026.3.1.**

If you're running anything older than **v2026.3.11**, you are vulnerable to at least one of these.

## The ClawHavoc Factor

Compounding the CVE exposure is the ongoing ClawHavoc campaign: over 824 malicious skills were identified on ClawHub, primarily delivering Atomic macOS Stealer (AMOS) to credential-harvest targets. If you've installed community skills in the last few months without auditing them, your machine may already be compromised.

The OpenClaw team has been pulling malicious packages as they're reported, but the marketplace remains an active attack vector.

## What to Do Right Now

**1. Update to v2026.3.28 immediately**

```bash
openclaw update
```

This patches all known CVEs through the release date. Run `openclaw --version` to confirm.

**2. Enable gateway authentication**

If your gateway is exposed beyond localhost, authentication must be enabled:

```bash
openclaw configure --section gateway
```

Set `gateway.auth.required: true` and generate a strong token.

**3. Audit your installed skills**

```bash
openclaw skills list
```

For any non-bundled skill, check its source. The safest approach is to only install skills from sources you can review. Run `openclaw doctor` — it now includes a skill security audit pass.

**4. Firewall your gateway port**

Your OpenClaw gateway should not be accessible from the public internet unless you have a specific, authenticated use case. Restrict access to localhost or your VPN/tailnet:

```bash
# Block port 58080 from external access (Linux)
sudo ufw deny 58080
sudo ufw allow from 100.64.0.0/10 to any port 58080  # Tailscale range
```

**5. Run `openclaw doctor --fix`**

The doctor command catches misconfigurations and applies safe automatic fixes:

```bash
openclaw doctor --fix
```

## The Bigger Picture

OpenClaw's "lethal trifecta" — access to private data, exposure to untrusted content, and external communication capabilities — makes security non-negotiable. A compromised agent isn't just a data leak; it's a foothold into your email, messaging apps, files, and potentially your home network.

The project has responded quickly to each disclosed vulnerability. But the pace of growth means the gap between "project audience" and "casual user" closed faster than the security posture could adapt.

Run the update. Enable auth. Audit your skills. Don't assume your setup is fine because nothing has gone wrong yet.

For the full SecurityScorecard report, see their [blog post on exposed OpenClaw deployments](https://securityscorecard.com/blog/how-exposed-openclaw-deployments-turn-agentic-ai-into-an-attack-surface/). The Conscia writeup at [conscia.com/blog/the-openclaw-security-crisis/](https://conscia.com/blog/the-openclaw-security-crisis/) is also worth reading for a practitioner's view.
