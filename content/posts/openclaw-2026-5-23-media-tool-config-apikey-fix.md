---
title: "OpenClaw Media Tools Now Honor Config API Keys"
excerpt: "A merged fix in OpenClaw ensures image generation, PDF, and media tools recognize API keys set in openclaw.json, not just environment variables."
coverImage: '/assets/images/posts/openclaw-2026-5-23-media-tool-config-apikey-fix.webp'
date: '2026-05-23T08:00:00.000Z'
dateFormatted: May 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-23-media-tool-config-apikey-fix.webp'
---

If you have ever configured a custom image-generation or PDF provider in `openclaw.json` using a `models.providers.*.apiKey` field, only to find that `image_generate` or the PDF tool reported the provider as unavailable, you were hitting a real bug — and it has now been fixed.

[Pull request #85570](https://github.com/openclaw/openclaw/pull/85570), merged on May 23 2026, closes the gap between how OpenClaw's runtime authorizes providers and how its media tool preflight checks those providers before offering them to agents.

## What Was Broken

OpenClaw supports two ways to supply an API key for a model provider: via an environment variable (for example, `OPENAI_API_KEY`) or directly in `openclaw.json` under `models.providers.*.apiKey`. The runtime auth path has always accepted both approaches — if you set a key in config, requests to that provider go through fine.

The preflight layer for media tools (`image_generate`, PDF generation, and related tools) was not as consistent. It called a helper named `hasAuthForProvider()` that only checked environment variables and named auth profiles, completely ignoring `models.providers.*.apiKey`. The result: a provider configured entirely through `openclaw.json` would be treated as unauthenticated during tool availability checks, so agents would either get an empty model list or skip the tool entirely, even though the underlying runtime calls would have worked perfectly.

## What Changed

The fix, contributed by [hxy91819](https://github.com/hxy91819), introduces a shared helper called `hasProviderAuthForTool()` that checks the existing env/profile paths first and then falls back to `hasUsableCustomProviderApiKey()` — the same method the runtime already uses for config-backed credentials.

The new helper is threaded through the image/PDF/media generation preflight and list-selection code paths, replacing the narrower `hasAuthForProvider()` calls. Provider-specific `isConfigured()` callbacks are still authoritative when present, so providers that supply their own readiness logic are unaffected.

The change ships with focused regression tests covering config-backed custom provider auth, auth-store compatibility, image/PDF model selection, and generation availability.

## Who Is Affected

This fix matters most for self-hosters and power users who:

- Configure third-party image or multimodal providers entirely through `openclaw.json` rather than shell environment variables.
- Use providers that are not one of the built-in first-party integrations but are available via the `models.providers` config array.
- Have noticed that `image_generate` or PDF tools show the provider as not configured despite requests to that provider succeeding in plain chat turns.

If you have been working around this by duplicating API keys into environment variables, you can drop that workaround once you update to the release that includes this merge.

## What This Does Not Change

The fix is intentionally narrow. It does not change how OpenClaw stores or loads credentials — API keys in `openclaw.json` are no safer or less safe than before. It also does not affect providers that already return correct availability through their own `isConfigured()` method. The only behavioral change is that config-backed keys now count as valid auth during tool preflight, matching the behavior they have always had at request time.

## Upgrading

The fix is in the `main` branch as of May 23 2026. Once it is bundled into the next tagged release, running `openclaw update` will pick it up. To verify the fix is active, configure a custom provider with only an `apiKey` field in `openclaw.json` and confirm that `image_generate` lists it as an available provider.

Track the PR and any linked follow-up work at [github.com/openclaw/openclaw/pull/85570](https://github.com/openclaw/openclaw/pull/85570).
