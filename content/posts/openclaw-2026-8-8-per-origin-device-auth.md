---
title: "OpenClaw Persists Device Auth Per Gateway Origin"
excerpt: "OpenClaw PR #120533 lets remote CLI users reconnect without shared secrets while keeping every persisted device token scoped to one exact Gateway origin."
coverImage: '/assets/images/posts/openclaw-2026-8-8-per-origin-device-auth.png'
date: '2026-08-08T23:05:00.000Z'
dateFormatted: August 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-8-per-origin-device-auth.png'
---

OpenClaw merged [PR #120533, "feat(gateway): persist per-origin device auth"](https://github.com/openclaw/openclaw/pull/120533), adding a safer way for remote CLI users to reconnect to known Gateways.

Before this change, the CLI could not safely remember device credentials for a Gateway selected with `--url`. Operators often had to keep passing a shared `--token` or `--password`. The existing unscoped device-token store was not safe to reuse across arbitrary targets because a token for one Gateway could not be allowed to leak into another origin.

## What Changed

The PR adds an additive SQLite store keyed by normalized Gateway origin, device, and role. Gateway client host callbacks are bound to that exact origin, and explicit token or password auth remains authoritative for the full connection lifetime.

After a successful pairing, OpenClaw can persist the issued device token for later tokenless reconnects to that same origin. A token stored for one origin is not visible to another origin.

That per-origin boundary is the key design choice. It improves convenience without turning remote Gateway auth into a shared credential cache.

## How It Works For Operators

The intended workflow is straightforward:

- Connect to a remote Gateway once with an explicit shared credential.
- Approve the device in the Gateway's Control UI or on the Gateway host.
- Retry so the issued device token can be persisted for that exact origin.
- Reconnect later with `openclaw tui --url ...` without repeatedly supplying the shared secret.

The TUI still requires explicit auth for first contact. It also surfaces pairing approval guidance from structured `PAIRING_REQUIRED` errors, which should make the failure mode clearer when a Gateway is waiting for approval.

Invalid explicit credentials remain terminal. The PR explicitly avoids silently falling back to stored auth when a user supplied a bad token or password.

## Why It Matters

Remote Gateway usage is becoming a normal OpenClaw pattern: cloud workers, home servers, lab machines, and secondary devices all benefit from command-line access. Requiring a shared secret every time is awkward, but caching credentials without strict origin boundaries would be worse.

PR #120533 makes the common path smoother while preserving a security boundary that operators can reason about. Device auth is remembered for the place where it was approved, not for any Gateway that happens to be contacted later.

## Validation

The PR reports focused coverage across Gateway client calls, origin scoping, the device-auth store, TUI Gateway chat, Control UI settings, database type checks, plugin SDK surface checks, and full build validation.

The source-blind built-CLI validation is the strongest signal: explicit-token pairing worked, exact-ID approval worked, same-origin tokenless reopen worked, a second origin could not see the first token, and invalid explicit auth failed without fallback reconnect during a 20-second observation window.

There is no protocol change, schema-version bump, polling loop, confirmation-code flow, config key, or new environment variable. The feature is additive, but it closes a real usability gap for remote OpenClaw operators.
