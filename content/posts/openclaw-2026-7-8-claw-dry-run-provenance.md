---
title: "OpenClaw Previews Safer Claw Installs"
excerpt: "OpenClaw Claw plans now preview artifacts, provenance, consent, and rollback actions before any install mutates state."
coverImage: '/assets/images/posts/openclaw-2026-7-8-claw-dry-run-provenance.png'
date: '2026-07-08T08:30:00.000Z'
dateFormatted: July 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-8-claw-dry-run-provenance.png'
---

OpenClaw merged two related Claw lifecycle PRs just after the nightly cutoff: [PR #101842, "Add Claw artifact provenance preview"](https://github.com/openclaw/openclaw/pull/101842), and [PR #101874, "Add Claw dry-run apply lifecycle plan"](https://github.com/openclaw/openclaw/pull/101874).

Together, they move Claws closer to an install flow where operators can inspect what will happen before anything changes on disk, in automation, or in Gateway state.

## Artifact and Provenance Preview

PR #101842 adds artifact preview metadata to the existing read-only Claw plan output. It reuses OpenClaw's canonical selector parsers for `clawhub:`, `npm:`, git, file/local, and npm-pack style selectors.

The plan can now describe the expected install surface and provenance family for entries such as:

- Skills
- Plugins
- MCP servers
- Connectors

Unsupported package selector shapes are marked as blocked in the read-only plan. The PR is explicit about what it does not do: there is no artifact fetch, install, workspace mutation, automation enablement, provenance write, or Gateway state change.

That makes the feature a preview slice, not an installer.

## Dry-Run Apply Plans

PR #101874 builds on that preview with `openclaw.clawApplyPlan.v1`, a dry-run apply lifecycle plan derived from the read-only Claw plan.

It adds:

- `openclaw claws apply <manifest> --dry-run`
- `openclaw claws feed apply <feed> <claw> --dry-run`

The dry-run plan models install actions, consent-required workspace or automation actions, provenance records, rollback actions, and required-entry blockers. It still refuses real apply unless `--dry-run` is provided.

The PR's observed summaries show a five-entry plan with five install actions, two consent-required entries, zero blocked entries, five provenance records, and five rollback actions.

## Why It Matters

Claws are meant to bundle useful agent capabilities, but capability bundles are also a trust boundary. A manifest may ask for packages, workspace files, scheduled automations, or other pieces that affect how an agent behaves.

Previewing the install surface before mutation gives operators a way to ask better questions:

- Which package sources are involved?
- Which entries require explicit consent?
- What provenance records would be created?
- What rollback actions would exist?
- Which required entries block the plan?

That is the right shape for a feature that may eventually install skills, plugins, MCP servers, connectors, workspace files, and automations from a feed.

## Validation

Both PRs report focused Vitest coverage across Claw schema, feed, CLI, plugin install config, command registry, and root command descriptions. They also report `git diff --check` and conflict-marker checks.

PR #101842 includes a real read-only feed-plan proof against an isolated state directory. PR #101874 includes dry-run JSON proofs for both direct manifest apply and feed apply paths, with `mutationAllowed` set to `false`.

## Bottom Line

OpenClaw is adding the inspection layer before the install layer. Claw operators can now see more of the artifact, provenance, consent, and rollback shape before any future apply flow gets permission to mutate state.
