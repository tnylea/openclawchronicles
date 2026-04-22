---
title: "OpenClaw at Scale: 60x More Security Reports Than curl"
excerpt: "At AIE 2026, Peter Steinberger delivered a sober engineering assessment: OpenClaw faces 60x more security incidents than curl, with an estimated 20% of skill submissions flagged as malicious."
coverImage: '/assets/images/posts/openclaw-2026-4-22-security-scale-aie-talk.png'
date: '2026-04-22T23:05:00.000Z'
dateFormatted: April 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-22-security-scale-aie-talk.png'
url: '/posts/openclaw-2026-4-22-security-scale-aie-talk/'
---

While Peter Steinberger's TED talk this week told the inspiring origin story of OpenClaw to a general audience, a parallel talk at the AIE conference painted a considerably more complicated picture — one that anyone running OpenClaw in production should take seriously.

Speaking to an engineering audience, Steinberger described the hidden operational cost of maintaining what has become the fastest-growing open-source project in history. The numbers he shared are striking.

## The Security Reality at 247K Stars

OpenClaw now receives roughly **60 times more security incident reports than curl** — a comparison Steinberger made deliberately, given curl's reputation as one of the most widely-deployed network libraries in existence and its well-documented security track record.

The sheer surface area is part of the problem. OpenClaw's skill ecosystem means third-party code runs inside users' local environments with access to messaging platforms, filesystem tools, and in many cases connected home infrastructure. Every skill is a potential attack vector.

More troubling: Steinberger estimated that **at least 20% of skill submissions to ClawHub are malicious**. That figure aligns with the ClawHavoc incident reported earlier this month, in which a coordinated campaign of weaponized skills was discovered in the skill marketplace. But the AIE disclosure suggests ClawHavoc was less of an anomaly and more of a visible peak in an ongoing problem.

## What This Means for Self-Hosters

For users running OpenClaw with community skills installed, this is a useful reminder to treat skill installation the same way you would treat adding an npm package to a production app — meaning: review what you're installing, prefer skills with strong maintenance histories and genuine community engagement, and don't assume ClawHub review processes catch everything.

Practical steps:

- **Audit installed skills.** Run `openclaw skills list` and review anything you haven't actively verified. Remove skills you no longer use.
- **Watch for unscoped storage keys.** The PR merged today ([#70362](https://github.com/openclaw/openclaw/pull/70362)) patched a medium-severity issue where local user identity was stored in an unscoped localStorage key, allowing identity data to bleed between gateway contexts on the same origin. If you run dev and prod on the same host, update.
- **Keep gateway logs.** The 2026.4.21 release improved logging for failed provider/model candidates at warn level — useful signal when chasing down compromised skill behavior.
- **Disable skill auto-updates** if you need stability. Manual review on each update is slower but safer in high-risk deployments.

## The Maintenance Burden

Beyond security, Steinberger's AIE talk touched on the general scaling challenges involved in maintaining a project at this velocity. The sessions/maintenance fix in 2026.4.20 ([#69404](https://github.com/openclaw/openclaw/pull/69404)) — which enforces an entry cap and age prune to prevent cron/executor session backlogs from OOM-ing the gateway — is a direct result of this scale. Real deployments were running out of memory.

The cron state split in 2026.4.20 ([#63105](https://github.com/openclaw/openclaw/pull/63105)) also reflects operational maturity: separating runtime execution state into `jobs-state.json` so the tracked `jobs.json` stays clean for version control is the kind of change you make when you have users who actually manage their configs in git.

## The Bigger Picture

OpenClaw's security posture is not a crisis — but it is a moving target. The project's community-driven skill ecosystem, which is one of its greatest strengths, is also its largest attack surface. The comparison to curl isn't meant to be alarming; it's meant to calibrate expectations. Steinberger is clearly taking it seriously.

The full AIE talk is available via the [Latent Space AINews digest](https://www.latent.space/p/ainews-the-two-sides-of-openclaw), alongside the moderated AMA that followed.

---

**Related:**
- [OpenClaw PR #70362 — Personalize local user identity (security notes)](https://github.com/openclaw/openclaw/pull/70362)
- [OpenClaw 2026.4.21 Release Notes](https://github.com/openclaw/openclaw/releases/tag/v2026.4.21)
- [Latent Space: The Two Sides of OpenClaw](https://www.latent.space/p/ainews-the-two-sides-of-openclaw)
