---
title: "OpenClaw Security Alert: ClawHavoc Supply Chain Attack Targets Users"
excerpt: "Cisco researchers found OpenClaw skills silently exfiltrating data. Here is what the ClawHavoc supply chain attack means and how to protect yourself now."
coverImage: '/assets/images/posts/openclaw-2026-3-27-clawhavoc-supply-chain-attack.png'
date: '2026-03-27T23:00:00.000Z'
dateFormatted: March 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-27-clawhavoc-supply-chain-attack.png'
url: '/posts/openclaw-2026-3-27-clawhavoc-supply-chain-attack/'
---

A coordinated supply chain campaign called **ClawHavoc** has planted more than 800 malicious skills in ClawHub, OpenClaw's official skill marketplace, distributing infostealers disguised as legitimate tools. Simultaneously, Cisco's AI security research team has published findings showing that third-party OpenClaw skills have been quietly performing data exfiltration and prompt injection without any indication to users. If you run OpenClaw with community skills installed, this is required reading.

## What Is ClawHavoc?

ClawHavoc is the name security researchers have given to a coordinated campaign that uploaded hundreds of malicious packages to ClawHub. The packages appeared to be standard utility skills — automations for Trello, calendars, file management — but contained hidden payloads that:

- Searched Slack history for API keys and tokens
- Read private messages and local files
- Executed arbitrary shell commands
- Silently exfiltrated collected data to attacker-controlled endpoints

The skills exploited OpenClaw's trust model, which grants installed skills broad access to the agent's environment. Because OpenClaw agents run with elevated local permissions by design, a single malicious skill can achieve full workstation compromise.

## Cisco's Findings: Silent Exfiltration in the Wild

Cisco's AI security team tested third-party OpenClaw skills as part of their ongoing AI Defense research and confirmed instances of skills performing **prompt injection and silent data exfiltration** without user awareness. Their report notes that OpenClaw's architecture — spanning messaging platforms, the Control UI, and tool permissions — creates multiple direct paths for prompt injection if a skill is not properly vetted.

Cisco also demonstrated that multi-turn prompt attacks against the large language models powering OpenClaw agents were highly successful, enabling attackers to override system instructions, extract hidden prompts, and manipulate agent behavior in ways invisible to users.

A related critical remote code execution vulnerability, **CVE-2026-25253**, was separately disclosed by security researchers. It allowed a malicious website to open a WebSocket connection to the OpenClaw gateway, brute-force authentication due to missing rate limits, and register malicious scripts — granting full control of the developer's machine in milliseconds, with no plug-ins or extensions required.

## OpenClaw's Response

The OpenClaw core team has been shipping security-focused releases throughout March. The v2026.3.25 release included a fix that closes the `mediaUrl`/`fileUrl` alias bypass (PR [#54034](https://github.com/openclaw/openclaw/pull/54034)), which prevented outbound tool actions from escaping media-root restrictions. The team also aligned outbound media access with the configured filesystem policy to ensure strict workspace-only agents remain properly sandboxed.

Cisco has released an open-source **Skill Scanner** tool to help users vet skills before installation, and they've published their full research on how malicious skills exploit the trust model through prompt injection, credential theft, and silent exfiltration.

## What You Should Do Right Now

**If you have community skills installed:**

1. **Audit your installed skills immediately.** Run `openclaw skills` and review every non-official entry. If you don't remember installing it or can't verify its source, remove it.
2. **Run Cisco's Skill Scanner** before installing any new skill from ClawHub until the marketplace completes its audit and remediation.
3. **Update to v2026.3.25 or later.** This release contains multiple sandbox and media-access security fixes.
4. **Restrict your agent's filesystem permissions.** In your config, set `workspaceOnly: true` unless you have a specific reason to grant broader access.
5. **Avoid exposing OpenClaw to the internet without authentication.** Tens of thousands of instances are currently publicly accessible and vulnerable to CVE-2026-25253. Use a reverse proxy with strong auth, or bind only to localhost.

## The Bigger Picture

OpenClaw's product documentation itself acknowledges that "there is no 'perfectly secure' setup." That's not a cop-out — it's a realistic statement about the nature of agents that can read files, run commands, and call APIs. The power is the point, and the power is also the risk.

The security community is actively building tooling to close the gap. Cisco's DefenseClaw, NVIDIA's NemoClaw with its OpenShell sandbox, and the OpenClaw team's own improvements to the Control UI's skill management (status-filter tabs, one-click dependency installation, granular permission visibility) are all steps in the right direction.

For now, treat every third-party skill like you'd treat a random script from the internet — because that's exactly what it is.

**Sources:** [Cisco Blog](https://blogs.cisco.com/ai/cisco-announces-defenseclaw) · [Dark Reading](https://www.darkreading.com/application-security/critical-openclaw-vulnerability-ai-agent-risks) · [SecurityWeek](https://www.securityweek.com/openclaw-vulnerability-allowed-malicious-websites-to-hijack-ai-agents/) · [r/openclaw](https://www.reddit.com/r/openclaw/comments/1rz23za/cisco_found_openclaw_skills_doing_silent_data/) · [OpenClaw GitHub](https://github.com/openclaw/openclaw/releases)
