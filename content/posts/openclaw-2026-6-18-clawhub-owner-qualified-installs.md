---
title: "OpenClaw Clarifies ClawHub Skill Installs"
excerpt: "OpenClaw now supports owner-qualified ClawHub skill installs, making namespaces explicit and ambiguous skill slugs easier to resolve."
coverImage: '/assets/images/posts/openclaw-2026-6-18-clawhub-owner-qualified-installs.png'
date: '2026-06-18T08:02:00.000Z'
dateFormatted: June 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-18-clawhub-owner-qualified-installs.png'
---

OpenClaw's ClawHub install flow gained a cleaner namespace model overnight. [PR #94282](https://github.com/openclaw/openclaw/pull/94282), titled "Support owner-qualified ClawHub skill installs," lets users install ClawHub skills with refs like `@owner/slug` while preserving legacy slug-only compatibility.

That may sound like a small CLI parser update. It is actually a useful trust and usability improvement for a growing skill registry.

## What Changed

The PR accepts owner-qualified ClawHub skill refs such as:

```bash
openclaw skills install @owner/weather
```

It keeps existing git, local, and slug-only parsing behavior, but the documented ClawHub install form now points users toward the owner-qualified version.

The change also propagates `ownerHandle` through the ClawHub install pipeline:

- Skill detail lookup
- Install resolution
- Archive download
- Verification
- Origin metadata
- Workspace lock tracking

That last part matters. If OpenClaw records where a skill came from, future update and verify flows need to stay scoped to that same owner namespace. PR #94282 rejects owner-qualified update requests that do not match the tracked install.

## Why Namespaces Matter

ClawHub has become more active over the last week. Recent scans surfaced workflow skills, audit skills, Google Workspace operations skills, verification tools, and a large stream of personal or domain-specific packages.

As any registry grows, plain slugs become less reliable. Two people can publish skills with similar names. A familiar slug can point to more than one package. A user may intend a specific publisher, but a generic install command cannot always express that intent.

Owner-qualified refs fix that ambiguity without making the install command complicated. The user can say exactly which publisher and skill they want, and OpenClaw can carry that owner through verification and lockfile metadata.

## Better Error Guidance

The PR also improves ambiguous slug responses. When a slug is not enough to identify the intended package, the CLI can render actionable guidance that points users toward the `@owner/slug` form.

That is the right failure mode. Instead of guessing, the installer can ask for a precise namespace. It is a small but important distinction for an ecosystem where skills can carry instructions, scripts, setup requirements, and external tool integrations.

## Related Docs Work

This landed alongside [PR #94332](https://github.com/openclaw/openclaw/pull/94332), which adds ClawHub namespace claims to the documentation sidebar. That docs PR pairs with a ClawHub source docs page referenced from the OpenClaw PR thread.

The pairing is notable because it frames this as more than a CLI nicety. Namespaces, install refs, and namespace claims are all parts of the same registry trust story: who published this skill, which package did I install, and how will future updates stay tied to that origin?

## Tested Coverage

PR #94282 reports focused tests across ClawHub infrastructure, skill lifecycle handling, and CLI command behavior:

```bash
node scripts/run-vitest.mjs src/infra/clawhub.test.ts src/skills/lifecycle/clawhub.test.ts src/cli/skills-cli.commands.test.ts
```

The PR also includes CLI help output showing the new `@owner/slug` guidance and says an earlier review caught missing owner propagation paths before merge.

For OpenClaw users, the practical advice is simple: prefer owner-qualified ClawHub installs when you know the publisher. It is clearer today, and it gives future verify/update flows a better identity to preserve.

Sources: [OpenClaw PR #94282](https://github.com/openclaw/openclaw/pull/94282), [OpenClaw PR #94332](https://github.com/openclaw/openclaw/pull/94332), and [ClawHub](https://clawhub.com).
