---
title: "OpenClaw Shows Provider Models Right After Sign-In"
excerpt: "OpenClaw PR #167460 makes known provider models appear immediately after sign-in, even before live model discovery finishes."
coverImage: '/assets/images/posts/openclaw-2026-10-8-provider-models-after-signin.png'
date: '2026-10-08T23:02:00.000Z'
dateFormatted: October 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-8-provider-models-after-signin.png'
---

OpenClaw merged [PR #167460](https://github.com/openclaw/openclaw/pull/167460), fixing a frustrating model-picker delay after provider sign-in.

The bug was simple from a user's perspective: sign in to a provider, then wait while the picker still showed no models. OpenClaw already knew some of those models from the provider plugin manifest, but the UI could remain empty until live model discovery finished. If that discovery took many seconds, the new account looked unusable for longer than necessary.

## The New Behavior

After this change, OpenClaw shows the provider models it already knows from the plugin manifest as soon as sign-in completes. When the account's live listing arrives, that live data replaces the temporary manifest-backed rows.

That replacement is important. The manifest can tell OpenClaw what the provider generally supports, but the live account listing may add account-only models or remove models the signed-in account cannot actually use.

The failure path is also better. If the first live listing fails, the known manifest rows remain visible. Signing out still removes the rows, and a listing that started before sign-out is fenced so it cannot bring stale models back.

## Why It Was Broken

The PR explains that quick catalog publication after an auth change only seeded static rows for providers named in config. A provider that had just been signed in could get nothing until live discovery settled.

API-key sign-in made the problem sharper because it rewrites `auth.profiles`. That config reload rebuilt the quick catalog without the newly signed-in provider.

OpenClaw now captures manifest rows for every provider with current credentials. If a provider has env or stored credentials, it is treated as signed in for this purpose. At Gateway startup, those providers can show manifest rows until live discovery publishes a more exact account listing.

## No Extra Runtime Loading

The implementation uses already-loaded manifest metadata. The PR says it adds no network calls and no plugin runtime loading for this quick path. Ordering, replace mode, visibility filters, allowlists, and auth-generation fencing remain unchanged.

That is the right tradeoff. The picker becomes useful sooner without pretending the manifest is the final source of truth.

## The Proof

The regression coverage used a real Gateway with a fixture provider plugin whose model listing could be held or failed. Before the fix, the expected known row was missing while listing was held. After the fix, known models appeared while the listing was pending, stayed visible after an initial listing failure, disappeared on sign-out, and were replaced by live account rows once discovery succeeded.

The PR also reports isolated Gateway checks in a headless browser against the Control UI picker. The fixed branch showed known model rows while listing was held, then replaced them after the live listing completed.

## Bottom Line

PR #167460 makes model sign-in feel much less broken. OpenClaw no longer waits for live provider discovery before showing models it already knows are plausible for the signed-in provider.

For anyone regularly adding API keys, switching providers, or restarting Gateways with stored credentials, this should make the model picker feel immediate instead of oddly empty.
