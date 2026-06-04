---
title: "OpenClaw v2026.5.5 and v2026.5.6: The Recovery Releases"
excerpt: "OpenClaw ships two releases in a single day with sweeping fixes for Discord, iOS pairing, xAI/Grok, TUI, and a critical Codex OAuth route hotfix in v2026.5.6."
coverImage: '/assets/images/posts/openclaw-2026-5-6-release-notes.webp'
date: '2026-05-06T23:00:00.000Z'
dateFormatted: May 6th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-6-release-notes.webp'
---

OpenClaw shipped two releases today — v2026.5.5 (9 AM UTC) and v2026.5.6 (5:51 PM UTC) — and together they represent the most concentrated burst of bug fixes since the "rough week" post. Both releases went out on May 6th, and if you're still on v2026.5.4, there's a lot to catch up on.

Here's what landed.

## v2026.5.5: The Big Cleanup

This release touches almost every corner of the stack. Highlights below.

### Channel Fixes

**Feishu** now correctly hydrates missing native topic starter thread IDs before routing sessions, which fixes a long-standing issue where first turns and follow-ups would land in different topic threads ([#78262](https://github.com/openclaw/openclaw/issues/78262)).

**LINE** now properly validates `dmPolicy: "open"` configs — if `allowFrom` is missing a wildcard, the webhook DM fails validation instead of being silently dropped ([#78316](https://github.com/openclaw/openclaw/issues/78316)).

**Discord** got two important fixes:
- Heartbeat ACK timeouts are now measured from the actual heartbeat send time, preventing false reconnect loops on startup ([#77668](https://github.com/openclaw/openclaw/issues/77668)).
- Plain text control commands like `/steer` now route through the normal authorization and mention gate instead of being silently dropped before an agent session can see them ([#78080](https://github.com/openclaw/openclaw/issues/78080)).

**Telegram/Codex** no longer duplicates tool progress lines in progress drafts ([#75641](https://github.com/openclaw/openclaw/issues/75641)).

**Matrix approvals** now retry delivery up to 3 times with backoff, so transient send failures don't strand pending approval prompts ([#78179](https://github.com/openclaw/openclaw/pull/78179)).

**iOS pairing** now allows `setup-code` and manual `ws://` connects for private LAN and `.local` gateways while keeping Tailscale and public routes on `wss://`. It also prefers explicit gateway passwords over stale bootstrap tokens in mixed-auth reconnects ([#47887](https://github.com/openclaw/openclaw/issues/47887)).

### Provider Fixes

**xAI/Grok** received two important patches: OpenClaw no longer sends OpenAI-style reasoning effort controls to native Grok Responses models (so `xai/grok-4.3` stops failing with "Invalid reasoning effort" in Docker/Gateway runs), and the bundled xAI thinking profile is now clamped to `off` to prevent unsupported reasoning levels from leaking through.

**Fireworks/Kimi** K2.5 and K2.6 models are now exposed as thinking-off-only, preventing rejected `reasoning*` parameters from being sent ([#74289](https://github.com/openclaw/openclaw/pull/74289)).

### TUI and Doctor Improvements

The TUI got several fixes to address the heartbeat-poisoned session problem that tripped up many users during the rough week:
- TUI now skips the generic CLI respawn wrapper for interactive launches and exits cleanly on terminal loss.
- It refuses to restore heartbeat sessions as the remembered chat session, preventing stale heartbeat history and orphaned `openclaw-tui` processes.
- Session picker is now bounded to recent rows with exact-lookup refreshes, so dusty stores no longer cause TUI to hydrate weeks-old transcripts before becoming responsive.

**Doctor** gained new repair capabilities:
- `doctor --fix` now repairs heartbeat-poisoned main session store entries and clears stale TUI restore pointers.
- The Codex repair path now fixes legacy `openai-codex/*` routes across primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, and stale session pins.

### Gateway Performance

The Gateway startup path was significantly lightened:
- Model-catalog test helpers, QR pairing helpers, and TypeBox memory-tool schema construction are now kept off hot startup import paths.
- Non-readiness sidecars are deferred until after the ready signal.
- `jiti` is no longer imported on native-loadable plugin startup paths.

### Control UI Polish

Multiple Control UI improvements landed thanks to [@BunsDev](https://github.com/BunsDev):
- Chat tabs stay responsive while history payloads and channel probes are slow.
- Consecutive duplicate messages (like heartbeat ACKs) are collapsed into a single bubble with a count.
- Agent runtime is now shown in the Sessions table with runtime filter support.
- The cron New Job sidebar is now collapsible to reclaim space.
- Chat controls stay on one row on desktop with improved responsive behavior.

## v2026.5.6: The Hotfix

Released just hours after v2026.5.5, this patch reverts one of the `doctor --fix` changes from the previous release.

**The problem:** The v2026.5.5 doctor repair rewrote valid `openai-codex/*` ChatGPT/Codex OAuth routes to `openai/*`, which could break OAuth-only GPT-5.5 setups or accidentally move users onto the API-key route instead of the Codex OAuth route ([#78407](https://github.com/openclaw/openclaw/issues/78407)).

**If v2026.5.5 already changed your default model**, you can recover by running:

```bash
openclaw models set openai-codex/gpt-5.5
openclaw config validate
```

Full recovery docs: [docs.openclaw.ai/providers/openai#check-and-recover-codex-oauth-routing](https://docs.openclaw.ai/providers/openai#check-and-recover-codex-oauth-routing)

**Two other fixes** also landed in v2026.5.6:
- Plugin/runtime fetch no longer passes third-party symbol metadata from header dicts into native `fetch` or `Headers`, preventing SDK and guarded fetch rejections ([#77846](https://github.com/openclaw/openclaw/issues/77846)).
- Web fetch now bounds guarded dispatcher cleanup after request timeouts, so timed-out fetches return tool errors instead of leaving Gateway tool lanes stuck active ([#78439](https://github.com/openclaw/openclaw/pull/78439)).

## What to Do

If you're on v2026.5.4, **upgrade to v2026.5.6** directly — it includes all of v2026.5.5 plus the OAuth route fix. If you ran v2026.5.5 and use Codex OAuth, check your default model with `openclaw models list` and apply the recovery steps above if needed.

Given the pace of fixes, it's also a good moment to run `openclaw doctor --deep` and see what it surfaces.

---

*Sources: [v2026.5.5 release](https://github.com/openclaw/openclaw/releases/tag/v2026.5.5), [v2026.5.6 release](https://github.com/openclaw/openclaw/releases/tag/v2026.5.6), [Recovery docs](https://docs.openclaw.ai/providers/openai#check-and-recover-codex-oauth-routing)*
