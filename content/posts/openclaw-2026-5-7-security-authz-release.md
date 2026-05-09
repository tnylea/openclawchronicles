---
title: "OpenClaw v2026.5.7: Authorization Hardening Across the Stack"
excerpt: "OpenClaw v2026.5.7 ships 25+ fixes tightening authorization from admin-gated memory toggles to Codex approval overhauls and Telegram sender allowlists."
coverImage: '/assets/images/posts/openclaw-2026-5-7-security-authz-release.png'
date: '2026-05-07T23:00:00.000Z'
dateFormatted: May 7th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-7-security-authz-release.png'
---

OpenClaw shipped v2026.5.7 late Thursday evening — the seventh maintenance release of the May 2026 cycle and, by my count, one of the more security-conscious patch notes the project has posted in a while. The release lands just as the "OpenClaw Had a Rough Week" retrospective continues making the rounds on Hacker News, so the timing feels deliberate.

## The Authorization Story

Three PRs from contributor [@pgondhi987](https://github.com/pgondhi987) form the spine of this release:

**Active Memory now requires admin scope for global memory toggles** ([#78863](https://github.com/openclaw/openclaw/pull/78863)). Previously, any channel-level message could flip memory-wide settings. Now those toggles are admin-gated, meaning a non-privileged user or an injected prompt can't silently change how your agent remembers things.

**Auto-reply skill dispatch goes through authorization hooks** ([#78517](https://github.com/openclaw/openclaw/pull/78517)). Inline skill tool calls triggered by auto-reply now pass through `before-tool-call` authorization checks — the same hooks that govern normal interactive tool use. This closes a gap where auto-reply could bypass authorization in ways a direct user request wouldn't.

**Native commands honor owner enforcement** ([#78864](https://github.com/openclaw/openclaw/pull/78864)). Owner-only native command handlers were being enforced inconsistently. That's now fixed.

## Codex Approvals Reworked

The Codex approval flow got a significant overhaul. The pre-guardian native `PermissionRequest` hook is no longer installed by default in Codex approval modes, so Codex's own reviewer gets first crack at safe commands before OpenClaw weighs in. The release also adds "allow-always" memory for identical Codex `PermissionRequest` payloads within a session window — so you're not clicking through the same approval over and over for the same command. Plugin approval requests now validate and render their actual allowed decisions, which means Telegram and other native approval UIs no longer show stale options.

## Telegram Gets Proper Sender Allowlists

Telegram's `accessGroup:*` sender allowlists now apply correctly to DMs, groups, native commands, and callback authorization — before the numeric sender-ID checks run ([#78660](https://github.com/openclaw/openclaw/issues/78660)). This also fixes a polling watchdog bug where unrelated outbound Bot API calls could mask a wedged inbound poller ([#78422](https://github.com/openclaw/openclaw/issues/78422)).

## Channels CLI Redesign

`openclaw channels list` is now channel-only by default. Pass `--all` to include bundled and catalog channels. The command now renders installed/configured/enabled state clearly, and model auth/usage details have moved to `openclaw models auth list`, `openclaw status`, and `openclaw models list` where they belong ([#78456](https://github.com/openclaw/openclaw/pull/78456), thanks [@sliverp](https://github.com/sliverp)).

## Cron and Discord Voice Improvements

`cron list --json` and `cron show --json` now include the computed cron status (`disabled/running/ok/error/skipped/idle`) so external tooling can read it without reimplementing the derivation logic ([#78701](https://github.com/openclaw/openclaw/pull/78701)).

Discord voice capture is noticeably less choppy: the default post-speech silence grace period has been extended to 2.5 seconds, and a new `voice.captureSilenceGraceMs` config key lets you tune it further for noisy Discord sessions.

## WhatsApp Ghost Chat Fix

A long-standing issue where proactive messages to LID-addressed WhatsApp contacts created sender-only ghost chats has been resolved ([#67378](https://github.com/openclaw/openclaw/issues/67378), [#74925](https://github.com/openclaw/openclaw/pull/74925)). Messages now route through Baileys LID forward mappings when available.

## Other Fixes Worth Noting

- **Gateway/sessions**: Cached skills snapshots are now cleared during `/new` and `sessions.reset`, so long-lived channel sessions rebuild the skill list after skills change ([#78873](https://github.com/openclaw/openclaw/pull/78873)).
- **Agents/compaction**: Compaction summary reserve tokens are clamped to each model's output limit, preventing invalid `max_tokens` requests on high-context compaction.
- **Cron/doctor**: Persisted cron jobs with `"default"`, `"null"`, blank, or JSON null model overrides are repaired during `openclaw doctor --fix` ([#78549](https://github.com/openclaw/openclaw/issues/78549)).
- **Model providers**: APNG sniffed PNG uploads are normalized, Gemini 3 tool-call thought-signature replay gets fallback signatures, and `__env__:VAR` custom-provider keys are accepted again.

## How to Update

```bash
openclaw update
```

The full changelog is on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.5.7). Run `openclaw doctor --fix` after upgrading if you've been on 2026.5.5 and had Codex OAuth routing issues — that fix from 2026.5.6 carries forward here too.
