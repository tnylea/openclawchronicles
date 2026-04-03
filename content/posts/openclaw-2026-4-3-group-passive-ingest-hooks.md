---
title: "OpenClaw Now Passively Ingests Group Messages Without Replying"
excerpt: "A new ingest config flag lets OpenClaw plugins observe group messages on Telegram and Signal without triggering a reply, opening up silent automation workflows."
coverImage: '/assets/images/posts/openclaw-2026-4-3-group-passive-ingest-hooks.png'
date: '2026-04-03T08:00:00.000Z'
dateFormatted: April 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-3-group-passive-ingest-hooks.png'
---

One of the persistent friction points with running OpenClaw in group chats has been the all-or-nothing nature of message handling: if OpenClaw sees a message, it either responds or ignores it. [PR #60018](https://github.com/openclaw/openclaw/pull/60018) changes that with a new passive ingestion mode for Telegram and Signal groups.

## The New `ingest` Flag

Contributor `@obviyus` added an `ingest?: boolean` option to Telegram and Signal group and topic config objects. When enabled, messages that are skipped because they don't mention the bot still trigger the `message:received` passive hook — just without generating a reply.

This looks like this in config:

```json
{
  "channels": {
    "telegram": {
      "groups": {
        "*": {
          "requireMention": true,
          "ingest": true
        }
      }
    }
  }
}
```

With `ingest: true`, every group message is passed to plugin hooks, even when `requireMention` filters out a reply. The agent stays quiet, but plugins see everything.

## Why This Matters

Passive ingestion unlocks a category of workflows that weren't previously possible without disabling mention requirements:

- **Group analytics** — Track message patterns, active hours, or topic frequency without the bot participating in the conversation.
- **Keyword triggers** — A plugin can watch for specific phrases and take action (fire a webhook, log to a database) without OpenClaw ever replying.
- **Context building** — Feed group message history into a RAG pipeline so the agent has context when it *is* eventually mentioned.
- **Monitoring bots** — Run OpenClaw in an ops or alerts channel to silently track activity and only surface anomalies.

## Per-Group Granularity

The config is hierarchical. You can enable ingestion globally via the wildcard `"*"` group key and then opt specific groups out. Telegram's implementation uses proper nullish coalescing — topic-level config takes priority over group-level config, which takes priority over the wildcard — matching the existing `requireMention` resolution behavior.

Note: the Signal implementation shipped with a logic inconsistency that may prevent group-specific `ingest: false` from overriding a wildcard `ingest: true`. If you're using Signal and need per-group opt-outs, keep an eye on a follow-up fix.

## No Breaking Changes

This is a purely additive change. Groups without `ingest` in their config behave exactly as before. The `message:received` hook was already defined — `ingest` just determines whether it fires for mention-skipped messages.

If you're building OpenClaw plugins that consume group activity, this is the flag you've been waiting for.

- [PR #60018 on GitHub](https://github.com/openclaw/openclaw/pull/60018)
- [Telegram channel docs](https://docs.openclaw.ai/channels/telegram)
- [OpenClaw Plugin SDK](https://docs.openclaw.ai)
