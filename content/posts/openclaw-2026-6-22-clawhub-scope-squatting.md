---
title: "OpenClaw ClawHub Scope Squatting Raises Alarms"
excerpt: "A Manifold Security report says 23 ClawHub plugins used official-looking OpenClaw or ClawHub scopes without verified ownership, raising supply-chain risk."
coverImage: '/assets/images/posts/openclaw-2026-6-22-clawhub-scope-squatting.png'
date: '2026-06-22T23:02:00.000Z'
dateFormatted: June 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-22-clawhub-scope-squatting.png'
---

Manifold Security published a new research note, ["Scope Squatting: Those @openclaw and @clawhub Plugins Aren't Officially Theirs"](https://www.manifold.security/blog/scope-squatting-clawhub-plugins), warning that official-looking ClawHub plugin scopes may not always mean official ownership.

The report says Manifold identified 23 code-executing ClawHub plugins published under ClawHub's `@openclaw/` and `@clawhub/` scopes by accounts that were not associated with either organization. It frames the issue as a supply-chain risk for AI asset registries: if users trust a namespace because it looks official, an unverified publisher can borrow that trust.

## What Manifold Found

According to the report, ClawHub documented a rule that a plugin's scope should match its owner, but the registry did not comprehensively enforce that rule. Manifold says 557 of 1,508 plugins carried an `@owner/` scope, and that not all of those scoped packages had verified ownership.

The worrying part is not only cosmetic naming. ClawHub plugins are executable assets. A plugin name that appears to come from `@openclaw/` or `@clawhub/` can influence install decisions, automation policies, and operator trust in a way that a random unscoped name would not.

Manifold notes that ClawHub also uses the `@openclaw/` scope for genuine plugins, including examples like `@openclaw/whatsapp` and `@openclaw/codex`. That makes unauthorized use of the same scope especially confusing for users scanning search results or installation commands.

## Why This Hits the OpenClaw Ecosystem

OpenClaw has been moving toward richer plugin and skill distribution. That is good for the ecosystem, but it also means package identity needs to be boring and strict. Namespaces, owners, verification badges, install commands, and publisher records all become part of the security boundary.

This issue lands shortly after OpenClaw merged owner-qualified ClawHub install work in [PR #94282](https://github.com/openclaw/openclaw/pull/94282), which made skill installs more explicit about publisher identity. The Manifold report is a reminder that the registry side of the trust model matters just as much as the CLI side.

For operators, the immediate lesson is straightforward:

- Treat official-looking plugin scopes as a signal, not proof.
- Prefer verified publisher metadata where available.
- Review plugin source, permissions, and setup requirements before installation.
- Pin known-good versions for production agents.
- Be careful with plugins that request credentials or broad filesystem access.

## Registry Trust Needs Enforcement

Scope squatting is an old software supply-chain problem in a newer packaging format. The twist with OpenClaw is that plugins are installed into agent runtimes that can hold credentials, run tools, send messages, and act on behalf of users.

That raises the stakes. A confusing namespace is not just a branding issue; it can become an authorization issue if an agent operator assumes the package came from the OpenClaw project.

Manifold's report is fresh and the public Hacker News thread had only minimal traction at the time of this nightly run, but the finding itself is significant. As ClawHub grows, scope enforcement and visible ownership verification need to become default infrastructure, not optional registry hygiene.
