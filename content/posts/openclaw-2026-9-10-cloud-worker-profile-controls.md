---
title: "OpenClaw Adds Cloud Worker Profile Controls"
excerpt: "OpenClaw now lets operators edit advanced cloud worker profiles, repository defaults, and prepared pool settings from the UI without manual config edits."
coverImage: '/assets/images/posts/openclaw-2026-9-10-cloud-worker-profile-controls.png'
date: '2026-09-10T08:02:00.000Z'
dateFormatted: September 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-10-cloud-worker-profile-controls.png'
---

OpenClaw's cloud worker settings are becoming less dependent on manual configuration edits.

[PR #143801](https://github.com/openclaw/openclaw/pull/143801), titled `feat(ui): edit advanced cloud worker profiles and repository defaults`, merged on September 10th at 07:51 UTC. The change adds UI controls for advanced profile fields, repository defaults, and the shared prepared-worker pool.

The problem was straightforward: Settings -> Cloud workers could edit only part of a profile. Operators who wanted to manage repository defaults or the shared prepared-worker cap still had to leave the UI and edit config directly.

## What Operators Can Edit

The new Advanced group covers warm-image selection, setup environment names, ready workers, and suspend-after duration. The PR says each duration field keeps its existing parser, including the one-minute minimum for suspend-after.

The change also adds a Prepared pool row and a Repositories section. Repository identities use the canonical normalizer, and selected defaults must point at configured profiles.

The user-facing result is a more complete settings page:

- Warm-image behavior can be managed from the profile editor.
- Setup environment names can be saved or removed through the existing config patch flow.
- Ready-worker and suspend-after values are exposed without inventing new config keys.
- Repository defaults can be added, edited, or deleted from the UI.
- The shared prepared-worker cap can be adjusted in the same area.

Profile deletion also gets clearer. If a profile is referenced by repository defaults, the confirmation now explains that deleting the profile removes those references too.

## Guardrails Stay In Place

This is not a loose form slapped onto internal config. The PR calls out several protections that keep the new controls aligned with existing behavior.

Optional empty fields remove their saved keys through the existing `config.patch` flow. Setup environment names use explicit array replacement intent. Repository edits and deletes reject mappings that changed since the editor or row was displayed, which helps prevent stale UI state from overwriting someone else's newer configuration.

The follow-up notes are also useful for operators. Clearing and retyping a setup command preserves its environment names. Removing a command while names remain shows an error until the names are explicitly removed. Explicit warm images are rejected for non-Linux profiles, including when an existing profile's operating system is changed. Auto and Off remain available.

## Why It Matters

Cloud workers are most valuable when they feel routine. If ordinary changes require hand-editing config, fewer teams will tune their worker pools, and more setups will drift into undocumented local conventions.

Moving profile details, repository defaults, and prepared pool settings into the UI makes the workflow more inspectable. It also reduces the chance that a small operational change accidentally touches unrelated provider, install, or config values.

The defaults remain conservative: one ready worker per eligible project and a shared cap of four. Setting values to zero disables the corresponding reserves, and saves continue showing the existing restart-required notice.

## Validation

The PR reports 94 focused tests across the cloud worker settings files and eight Chromium E2E tests against a mock Gateway. Coverage includes optional-key removal, duration and schema parity, setup-name validation, pool cap changes, repository CRUD, missing-profile refusal, stale mapping protection, and profile-delete cascade.

The author also reports passing changed-file checks, UI build, i18n baseline, performance checks, and `git diff --check`. The proof used a mock Gateway, with live Crabbox proof reserved for companion PRs.

For operators, this is a practical quality-of-life feature: more of the cloud worker setup can now be managed where people already expect to manage it.
