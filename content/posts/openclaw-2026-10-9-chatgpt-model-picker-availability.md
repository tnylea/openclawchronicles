---
title: "OpenClaw Tightens ChatGPT Model Availability"
excerpt: "OpenClaw PR #167975 keeps ChatGPT-only users from selecting pro OpenAI models their signed-in account does not actually list."
coverImage: '/assets/images/posts/openclaw-2026-10-9-chatgpt-model-picker-availability.png'
date: '2026-10-09T23:01:00.000Z'
dateFormatted: October 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-9-chatgpt-model-picker-availability.png'
---

OpenClaw merged [PR #167975](https://github.com/openclaw/openclaw/pull/167975), a focused OpenAI model-catalog fix for users who sign in with a ChatGPT account but do not also have an OpenAI API key configured.

The problem was easy to miss until a user picked the wrong model. The default model list could show `openai/gpt-5.4-pro` and `openai/gpt-5.5-pro` for a ChatGPT-only account even when that account's live model listing did not include those models. Selecting one of them then failed later, after the UI had already implied the model was available.

## What Changed

OpenClaw now records the exact model IDs returned by a successful ChatGPT account listing as private catalog provenance. That list includes hidden rows when the account is entitled to them, but it is not projected publicly through the normal provider outcomes view.

The picker then uses that account-specific list when deciding whether a model should be available through the selected ChatGPT profile. If a model can be served by both a subscription route and an API-key route, but the signed-in ChatGPT account did not list it, OpenClaw no longer treats the subscription route as usable. The model remains available when a working non-subscription credential, such as an OpenAI API key, can serve it.

The PR also keeps the check scoped to the selected profile. One account's model listing does not narrow or widen another account's picker. When OpenClaw does not have a ready listing for a profile, it keeps the existing behavior rather than inventing a denial.

## Why It Matters

Model pickers are trust surfaces. If the UI says a model is available, users expect the next request to work or at least fail for a runtime reason, not because the picker offered something the account could never access.

This is especially relevant as OpenClaw supports more provider routes, account types, hidden entitlement rows, and plugin-discovered catalog entries. A single model ID can exist in several places, but the availability decision still has to respect the credential that will actually handle the request.

For ChatGPT-only users, the practical result is cleaner:

- Unlisted pro models stop appearing as usable default choices.
- Hidden models that the account actually lists remain available.
- Users with an OpenAI API key still see API-key-served pro models.
- Unavailable models show a neutral unavailable state instead of misleading sign-in guidance.

The change is intentionally limited to the picker. If an operator manually types an unlisted ID, the request can still reach OpenAI and fail with OpenAI's own response.

## Evidence From The PR

The PR includes a real ChatGPT account comparison on a loopback Gateway. Before the fix, the default provider view showed 11 rows for a ChatGPT-only profile: eight listed rows plus `gpt-5.4-pro`, `gpt-5.5`, and `gpt-5.5-pro`. After the fix, the view showed nine rows: the eight listed rows plus `gpt-5.5`.

The API-key control case still showed both pro models as present and available. Regression tests cover unlisted dual-route IDs, hidden listed IDs, API-key fallback, unavailable listings, and multi-account profile isolation.

## Bottom Line

PR #167975 makes OpenClaw's OpenAI picker more honest about what a ChatGPT account can actually run. It is not a flashy feature, but it removes a confusing failure path right where users make their model choice.

For anyone using ChatGPT sign-in without an API key, this should make the default model list feel less optimistic and more accurate.
