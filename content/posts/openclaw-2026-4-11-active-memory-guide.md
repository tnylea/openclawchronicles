---
title: "OpenClaw Active Memory: Make Your Agent Remember Automatically"
excerpt: "Active Memory is OpenClaw's new plugin that searches your memory store before every reply, so your agent recalls preferences and context without being asked."
coverImage: '/assets/images/posts/openclaw-2026-4-11-active-memory-guide.png'
date: '2026-04-11T08:05:00.000Z'
dateFormatted: April 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-11-active-memory-guide.png'
---

If you have used OpenClaw's memory tools, you know the pattern: you ask something, the agent gives a generic reply, and you realize it forgot the preference you mentioned two weeks ago. You either have to say "remember, I prefer X" every time or issue an explicit `/memory search` command yourself. This friction is what the new **Active Memory** plugin in v2026.4.10 is designed to eliminate.

Here is a practical guide to setting it up and tuning it for your deployment.

## What Active Memory Does

Active Memory inserts a lightweight blocking sub-agent into the reply pipeline. Before the main agent generates its response, the sub-agent runs a memory search and injects the result as hidden system context. The main model sees the recalled facts as part of its system prompt — without any visible prompt injection in the conversation thread.

If nothing relevant is found, the sub-agent returns `NONE` and the reply proceeds normally with zero additional latency beyond the sub-agent call itself.

The runtime flow looks like this:

```
User Message
  → Build Memory Query
  → Active Memory Sub-Agent (memory_search / memory_get only)
  → NONE → Main Reply (no change)
  → Relevant Summary → Inject Hidden System Context → Main Reply
```

## Getting Started

Add this to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "active-memory": {
        "enabled": true,
        "config": {
          "agents": ["main"],
          "allowedChatTypes": ["direct"],
          "queryMode": "recent",
          "promptStyle": "balanced",
          "timeoutMs": 15000,
          "maxSummaryChars": 220,
          "logging": true
        }
      }
    }
  }
}
```

Then restart:

```bash
openclaw gateway restart
```

The `logging: true` setting is important during setup — it surfaces what Active Memory is doing in the gateway logs. Turn it off once you are satisfied with the behavior.

## Choosing a Query Mode

The `queryMode` setting controls how much conversation context the memory sub-agent receives:

- **`message`** — Only the latest user message. Fastest. Best for stable preference recall where conversational context is irrelevant. Recommended timeout: 3,000–5,000 ms.
- **`recent`** — Latest message plus a small recent tail of prior turns. Good balance of speed and context-awareness. Recommended timeout: ~15,000 ms.
- **`full`** — The entire conversation history. Highest recall quality, highest latency. Increase timeout substantially.

Start with `recent`. Move to `message` if latency is too high; move to `full` only if you find important context is being missed.

## Choosing a Prompt Style

The `promptStyle` field controls how eager the memory sub-agent is about returning results:

| Style | Use when |
|---|---|
| `balanced` | Default for `recent` mode; general-purpose |
| `strict` | You want minimal bleed from nearby context |
| `contextual` | Conversation history should matter more |
| `recall-heavy` | Softer matches are acceptable |
| `precision-heavy` | Only return obvious matches |
| `preference-only` | Habits, favorites, routines, recurring facts |

For most personal assistant setups, `preference-only` is worth trying. It is tuned specifically for the kind of stable, recurring context that makes a personal assistant feel like it knows you.

## Inspecting Active Memory Live

Use `/verbose on` in any session to see Active Memory status lines in real time:

```
🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

The status line shows the query mode and how many characters were recalled. The debug line shows the actual summary passed to the main model (formatted for humans, not the raw prompt markup).

You can also toggle it per-session without changing global config:

```
/active-memory status
/active-memory off
/active-memory on
```

Use `--global` to write the change back to config:

```
/active-memory off --global
```

## When It Runs — and When It Does Not

Active Memory only runs for **interactive persistent chat sessions**. It will not fire in:

- Headless one-shot runs
- Heartbeat or background runs
- Sub-agent or internal helper executions
- Cron-triggered agent turns

This is by design. Active Memory is a conversational enrichment feature, not a background inference feature. You can extend it to group and channel sessions by adding those types to `allowedChatTypes`:

```json
"allowedChatTypes": ["direct", "group"]
```

## Model Selection

By default, Active Memory inherits the current session model. The `modelFallbackPolicy` field controls what happens when no model is available through inheritance:

- **`default-remote`** — Use the built-in remote fallback (default)
- **`resolved-only`** — Skip recall rather than fall back

For low-latency setups, you can also pin a specific lightweight model to the sub-agent:

```json
"config": {
  "model": "openai/gpt-4o-mini"
}
```

This keeps the memory sub-agent fast while your main agent uses a heavier model.

## Debugging Checklist

If Active Memory is not firing where you expect:

1. Confirm `plugins.entries.active-memory.enabled: true`
2. Confirm the current agent ID appears in `config.agents`
3. Confirm you are in an interactive persistent chat session (not a one-shot run)
4. Turn on `logging: true` and check gateway logs
5. Run `openclaw memory status --deep` to verify memory search is working

If results are noisy, lower `maxSummaryChars`. If it is too slow, drop `queryMode` from `full` to `recent` or lower `timeoutMs`.

Full documentation: [docs.openclaw.ai/concepts/active-memory](https://docs.openclaw.ai/concepts/active-memory).
