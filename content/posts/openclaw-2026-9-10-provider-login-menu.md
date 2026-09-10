---
title: "OpenClaw Adds Provider Login Menu for Chat"
excerpt: "OpenClaw now separates credential-only provider login from model setup, giving chat users a clearer menu before saving OpenAI, xAI, or MiniMax access."
coverImage: '/assets/images/posts/openclaw-2026-9-10-provider-login-menu.png'
date: '2026-09-10T23:03:00.000Z'
dateFormatted: September 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-10-provider-login-menu.png'
---

OpenClaw is making provider authentication more deliberate in chat and Models.

[PR #144329](https://github.com/openclaw/openclaw/pull/144329), titled `feat(models): add credential-only sign-in and a provider login menu`, merged on September 10th at 22:48 UTC. The change separates credential-only login from model setup and gives chat users a shared provider menu before authentication begins.

The old flow could be too eager. A models sign-in could also run model setup, and model setup can activate a provider's starter model. A bare `/login` started OpenAI device authentication before the user had chosen a provider.

## What Changed

The new flow introduces credential-only provider login in Models and a provider-neutral menu for chat. Plugins can declare optional login choices in their manifests. Core OpenClaw resolves the provider and method, then presents command buttons or copyable commands through existing channel UI patterns.

The user-facing behavior is clearer:

- Bare `/login` asks which provider to use.
- `/login codex` keeps its device-code flow.
- API-key and local setup methods remain available through explicit provider commands.
- Credential-only login can save access without activating a starter model.
- OpenAI, MiniMax, and xAI declare supported credential-only choices.

The change also preserves selected models, restrictions, concurrent settings, and account pins. That matters because authentication should not casually rewrite unrelated model preferences.

## Recovery Gets Clearer Too

This feature landed alongside related refresh-outcome handling. The PR says rejected or unreachable refresh results now report that credentials were saved and give recovery guidance, instead of flattening everything into a generic failure.

That distinction matters. A failure before credentials are saved and a failure after credentials are saved are different operational states. Users need to know whether they should retry authentication, inspect provider settings, or fix Gateway reachability.

The flow also keeps authority checks at the credential and session commit boundaries. Disconnected clients cannot finish pending login, qualified choices reject stale or ambiguous plugin owners, and confirmed saves remain visible through later errors.

## Why It Matters

Provider authentication is one of the trust-sensitive parts of any agent system. OpenClaw users may connect accounts from multiple model providers, and those credentials determine what the agent can use during future work.

Making `/login` ask first is a small but healthy product decision. It prevents OpenAI from being the implicit default when the user may have meant another provider, and it reduces the chance that a sign-in flow quietly changes model activation state.

For plugin authors, optional manifest login choices give providers a cleaner way to advertise credential flows without forcing everything through full setup.

## Validation

The PR reports provider, chat, Models, Telegram, manifest, and recovery-path coverage, including Telegram end-to-end proof. It also preserves the shared refresh outcomes from PR #144436, which handled saved credentials and auth refresh failures.

No new database schema or configuration key is introduced. The result is a more explicit login experience: choose the provider, choose the method, save credentials, and keep setup as a separate intentional step.
