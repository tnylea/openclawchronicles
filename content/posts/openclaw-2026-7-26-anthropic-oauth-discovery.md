---
title: "OpenClaw Fixes Anthropic OAuth Discovery"
excerpt: "OpenClaw now authenticates Anthropic live model discovery with OAuth bearer tokens, helping Claude subscription users see new models sooner."
coverImage: '/assets/images/posts/openclaw-2026-7-26-anthropic-oauth-discovery.png'
date: '2026-07-26T23:02:00.000Z'
dateFormatted: July 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-26-anthropic-oauth-discovery.png'
---

OpenClaw's Anthropic live model discovery now works for Claude subscription users. [PR #113906](https://github.com/openclaw/openclaw/pull/113906), merged July 26, fixes a header mismatch that kept OAuth credentials from reading Anthropic's `/v1/models` endpoint.

The runtime path already knew how to use Claude subscription credentials. Model discovery did not. It sent every credential as `x-api-key`, but subscription credentials are OAuth access tokens and need an `Authorization: Bearer` header instead.

## The Failure Mode

Before this change, a Claude subscription user could successfully stream completions through OpenClaw while live model discovery failed in the background.

That created a quiet catalog gap. Discovery returned 401, the advisory catch swallowed the error, and OpenClaw fell back to the shipped model catalog. The failure was not obvious in logs, which meant newly published Anthropic models could remain invisible until OpenClaw shipped an updated manifest.

The PR author says this surfaced while investigating why live discovery had not avoided a manual Claude Opus 5 rollout.

## The Fix

OpenClaw now selects the auth header based on credential shape:

- API keys still use `x-api-key`.
- OAuth access tokens use `Authorization: Bearer`.

The two headers are mutually exclusive. Anthropic rejects requests that carry both an OAuth bearer token and an API-key header, so the OAuth branch replaces the previous header rather than adding to it.

The implementation reuses the existing Anthropic OAuth token detector instead of adding another token-shape check. Discovery credential normalization still filters non-secret markers before the header builder sees input.

## Catalogs Can Add Without Taking Away

Fixing authentication exposed a second risk: live discovery could replace the seeded catalog with a response that omitted shipped-but-supported model ids.

The PR handles that by preserving manifest models that Anthropic's live response does not publish. Discovered rows still win when ids overlap, and the existing contract gate still hides unknown models whose advertised capabilities conflict with OpenClaw's request shaping.

That turns live discovery into an additive path for Anthropic users. It can reveal newly published models without removing entries OpenClaw already knows how to route.

## Why It Matters

Model catalogs are now a fast-moving operational surface. OpenClaw users expect new models to appear quickly, but they also need stable fallbacks and accurate token-limit behavior. A discovery path that works only for API-key users leaves subscription users waiting on manual releases even when their runtime credentials are valid.

This fix narrows that gap. Claude subscription users should see live Anthropic catalog updates sooner, while OpenClaw keeps the safer manifest entries that do not appear in live discovery.

## Verification

The PR reports live API validation against Anthropic's models endpoint: `x-api-key` failed for the OAuth credential, bearer auth succeeded, and sending both headers failed. An end-to-end gateway check showed three additional live-discovered model ids while preserving shipped entries such as `claude-mythos-5`.

Automated coverage includes Anthropic live-discovery auth tests, provider catalog runtime tests, test-type checks, formatting, linting, and a clean autoreview.
