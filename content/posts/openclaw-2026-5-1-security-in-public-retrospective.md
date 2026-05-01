---
title: "How OpenClaw Got Safer in Public: A Security Retrospective"
excerpt: "OpenClaw's creator details 1,309 security advisories, enterprise partnerships with NVIDIA and Tencent, and why being open is how the project got safer."
coverImage: '/assets/images/posts/openclaw-2026-5-1-security-in-public-retrospective.png'
date: '2026-05-01T23:05:00.000Z'
dateFormatted: May 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-1-security-in-public-retrospective.png'
---

OpenClaw's creator Peter Steinberger published a sweeping security retrospective today on the official OpenClaw blog, laying out exactly how the world's most-watched AI agent project navigated a flood of security reports, tightened its core, and quietly became production-ready — all in public.

The post, titled ["OpenClaw Got Safer in Public"](https://openclaw.ai/blog/openclaw-security-in-public), covers everything from the raw numbers of the advisory firehose to the engineering decisions that shrank the attack surface without breaking the project.

## 1,309 Advisories and Counting

The headline figure is striking: as of April 30, GitHub shows 1,309 security advisories filed against OpenClaw since January 10. Of those, 535 were published as real issues. 746 were closed as invalid.

The closer a report sits to "critical," the more likely it is to be noise. Of 109 critical reports filed, only 14 were published — 87% were invalid. Steinberger attributes the flood partly to the curl effect: after curl killed its bug bounty over AI-generated slop reports, researchers redirected attention to OpenClaw as the highest-profile target. "Every CVE against OpenClaw is a career trophy," he writes.

The false positives follow a recognizable pattern: "the agent runs commands, therefore RCE," "plugins execute code," "this dangerous opt-in mode is dangerous," "if I already have the token I can do bad things." Real bugs were fixed; noise was triaged and closed.

## What Actually Changed

The team responded by building triage infrastructure rather than patching symptoms. [SECURITY.md](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) now formally defines the trust model and documents expected behavior — giving maintainers something concrete to point at when closing bad reports.

Real fixes shipped alongside the triage work: authentication bugs, privilege confusion, reconnect scope widening, sandbox bypasses, unsafe environment variable handling, and approval path mistakes were all addressed. Some changes cost users features. Allowlists were tightened. Regressions were accepted where single-machine use was fine but multi-user deployments could be hurt.

The plugin architecture was also restructured. More functionality was pushed out to [plugins](https://docs.openclaw.ai/plugins/sdk-overview), shrinking the core attack surface and shortening the dependency tree. A poisoned upstream package now has fewer paths to reach a user.

## Enterprise Partnerships

The retrospective names several organizations that contributed engineering time, not just goodwill:

- **NVIDIA** shipped engineering time on [NemoClaw](https://docs.nvidia.com/nemoclaw/latest/) and OpenShell
- **Microsoft and GitHub** provided support through the [GitHub Secure Open Source Fund](https://github.blog/open-source/maintainers/securing-the-ai-software-supply-chain-security-results-across-67-open-source-projects/)
- **Tencent** added full-time maintainers on security and stability, plus a direct vulnerability-sync line with their internal security team
- **Atlassian** pushed on deployment, auditability, identity boundaries, and secret handling
- **OpenAI** continues to provide inference and gave the team access to [Codex Security](https://openai.com/index/codex-security-now-in-research-preview/) for proactive vulnerability discovery

Steinberger also runs a team called Claw Labs inside OpenAI focused on shared product improvements.

## Addressing the "Agents of Chaos" Paper

The post takes direct aim at the [Agents of Chaos paper](https://arxiv.org/abs/2602.20021) from February, which made the rounds after twenty researchers attacked six OpenClaw agents and documented failures.

The critique: the researchers ran OpenClaw in sudo mode with disabled guardrails, broad shell access, and no sandboxing, then framed the results as if this reflected the default user experience. The paper has since added a note that guardrails were disabled; the headlines did not follow.

"OpenClaw is built for one trusted person per agent," Steinberger writes. "Share that agent with people you don't trust, and they share its tool access. That is the design, not a hidden auth bug."

## ClawHub Moderation at Scale

The retrospective also covers [ClawHub](https://clawhub.ai), OpenClaw's skill marketplace. In the last month alone the team closed more than 700 ClawHub moderation issues — around 460 of them were rescan appeals from skill authors whose work an automated suspicious-content flag had misfired on. More ClawHub security findings are promised in a future post.

## The Broader Point

The retrospective closes with a note on incentives in security culture: the industry rewards disclosure, not repair. Steinberger's ask to researchers is pointed — "I would much rather read your slightly broken report with a real reproduction than your perfectly formatted slop."

The core thesis holds up: open source security works because visibility accelerates fixes. OpenClaw's 1,309 advisories are a measure of scrutiny, not failure. The fixes that shipped because of that scrutiny are why companies are running it in production today.

Read the full post at [openclaw.ai/blog/openclaw-security-in-public](https://openclaw.ai/blog/openclaw-security-in-public).
