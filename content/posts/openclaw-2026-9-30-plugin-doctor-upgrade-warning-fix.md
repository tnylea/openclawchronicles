---
title: "OpenClaw Fixes Plugin Doctor Upgrade Warnings"
excerpt: "OpenClaw PR #162065 prevents plugin Doctor compatibility warnings from blocking otherwise valid updates while keeping failures fatal."
coverImage: '/assets/images/posts/openclaw-2026-9-30-plugin-doctor-upgrade-warning-fix.png'
date: '2026-09-30T23:00:00.000Z'
dateFormatted: September 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-30-plugin-doctor-upgrade-warning-fix.png'
---

OpenClaw merged a P0 update fix Wednesday night that keeps plugin Doctor compatibility warnings from turning a valid upgrade into a failed activation. The change landed in [PR #162065](https://github.com/openclaw/openclaw/pull/162065), titled "fix(update): keep plugin Doctor warnings from blocking upgrades."

This is not a flashy feature, but it is exactly the kind of update-path work operators notice when it is missing. The pull request targets a narrow moment in the update lifecycle: an installed updater may reach the candidate package's post-plugin Doctor after the new package is already active. If a plugin-owned compatibility hook throws at that point, OpenClaw needs to preserve the authoritative input configuration, report the plugin issue, and avoid treating a typed warning as a fatal package activation failure.

## What Changed

The fix preserves the authoritative input config before plugin compatibility hooks run. A hook receives a clone, so it cannot partially mutate the real configuration before throwing. If the compatibility hook produces a typed plugin warning, Doctor can carry that warning through the update result without blocking activation.

That does not mean update checks became permissive. The PR is careful about the boundary:

- Raw execution failures still block activation.
- Refused config writes remain fatal.
- Required migrations still stop the update.
- Invalid final config still fails.
- Missing or malformed receipts still fail.
- Timeouts, cancellations, signals, and max-buffer failures still fail.

The softer path is reserved for a specific, typed plugin-hook warning that comes back through the expected update-time IPC receipt.

## Why It Matters

Plugin compatibility checks sit in a sensitive place. They are close enough to update admission that a bug can strand an installation, but broad enough that OpenClaw cannot blindly trust every warning or thrown value.

The new behavior tries to keep both sides honest. A plugin compatibility issue can be surfaced as a warning when the rest of the activation is valid, but the parent updater still requires a matching typed completion receipt. It cannot infer safety from a raw zero exit or from an unrelated Doctor notice.

For self-hosted operators, that distinction matters. A warning about a plugin compatibility hook should not automatically make the whole update look broken. But a real migration, config, process, or receipt failure should still stop the upgrade before it mutates state in unsafe ways.

## Backport Scope

The PR notes that this is an adapted backport for `extended-stable/2026.8.33`, related to earlier work in [#154423](https://github.com/openclaw/openclaw/issues/154423) and [#154543](https://github.com/openclaw/openclaw/pull/154543). That context is useful because extended-stable lines are where update correctness becomes especially important. Users running those lines are often choosing lower churn, and update failures carry a higher operational cost.

## Validation

The author reports passing core TypeScript checks, changed-file lint, and diff checks on the exact head. Focused validation covered channel compatibility normalization, typed receipt parsing and merging, and updater warning boundaries. The PR also says accepted review findings now have direct coverage for warning propagation through legacy normalization, preservation across the pre-plugin handoff, composition with an existing advisory, and exclusion of unrelated config warnings from the plugin-warning receipt.

The broader takeaway is simple: OpenClaw is tightening the update contract around plugin Doctor warnings. Valid activations should no longer be blocked by the wrong class of compatibility warning, while the dangerous failure modes remain fatal.
