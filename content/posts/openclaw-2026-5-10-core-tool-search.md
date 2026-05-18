---
title: "OpenClaw Adds Core Tool Search for Large Agent Catalogs"
excerpt: "PR #79823 lands core tool search in OpenClaw, letting agents dynamically find and call only the tools they need from huge catalogs — no more bloated context windows."
coverImage: '/assets/images/posts/openclaw-2026-5-10-core-tool-search.png'
date: '2026-05-10T08:00:00.000Z'
dateFormatted: May 10th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-10-core-tool-search.png'
---

One of the quiet frustrations of running OpenClaw with a large plugin stack — or any MCP-heavy setup — is that every tool in your catalog gets shoved into the model's context window whether the agent needs it or not. If you have 50 plugins loaded, that's 50 tool schemas consuming tokens before a single word of useful work happens.

[PR #79823](https://github.com/openclaw/openclaw/pull/79823), merged today by steipete, changes that. **Core Tool Search** is now a built-in OpenClaw capability.

## What Core Tool Search Does

Instead of forwarding the full catalog to the model at request time, OpenClaw can now expose a single compact bridge and let the model search, describe, and call only the tools it actually needs:

```js
const hits = await openclaw.tools.search("ticket", { limit: 3 });
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, { title: "Ship it" });
```

This isn't a plugin layered on top — it's **core infrastructure** that intercepts tool catalog construction before the provider request is built. That distinction matters: plugins can still contribute tools to the catalog, but OpenClaw itself now owns cataloging, compaction, and policy preservation.

## Two Modes

The feature ships with two model-facing modes:

- **`code` mode (default):** Exposes a single `tool_search_code` bridge. The model writes JavaScript to search and invoke tools, executed in an isolated subprocess.
- **`tools` mode:** Exposes structured `tool_search`, `tool_describe`, and `tool_call` tools for models that don't do well with code generation.

Enabling it is deliberately minimal:

```json
{
  "tools": {
    "toolSearch": true
  }
}
```

That turns on the default code bridge. Switch to structured mode:

```json
{
  "tools": {
    "toolSearch": {
      "mode": "tools"
    }
  }
}
```

Disable entirely with `false`.

## What Gets Cataloged

Tool Search covers the full OpenClaw tool surface:

- **Built-in OpenClaw tools** — file ops, exec, memory, sessions, etc.
- **Plugin-registered tools** — anything contributed via `plugins.entries`
- **MCP tools** — tools exposed through OpenClaw's MCP proxy
- **Client/app tools** — tools passed in from external PI harness sessions

All of these go through the normal policy, allowlist, and denylist pass first. Tool Search then catalogs what survives and makes it searchable.

## Why This Is Built Into Core

The PR notes explain the design decision clearly: this feature needed access to client tools that arrive inside the PI harness path, and it needed to shape the effective tool surface *before* provider request construction. That's not something a plugin can do cleanly. Making it core also means policy preservation is guaranteed — a plugin wrapper could inadvertently expose tools that should be blocked.

## Security Note

Model-authored JavaScript runs in **parent-enforced isolated subprocesses**. The implementation includes a gateway E2E harness tested against a large fake plugin catalog to verify isolation holds under load.

## What to Expect Next

The public config surface is intentionally small right now — several knobs (source-selection toggles, search-limit and timeout settings, `mode: "both"`) were deliberately removed before ship. The team is being conservative about what gets stabilized first. Expect iteration on the search quality and mode selection as real-world usage patterns emerge.

## Other Merged PRs Today

Alongside the headline feature, two smaller fixes landed on May 10:

- **PR #80134** — `openclaw doctor` no longer emits stale warnings for plugins that were previously installed from `~/.openclaw/extensions/<id>/` but later replaced by npm-managed installs. The persisted registry now invalidates itself when a diagnostic source path no longer exists on disk.
- **PR #80123** — Unknown commands no longer incorrectly suggest adding entries to `plugins.allow`. The CLI now returns a proper unknown-command message when a token isn't a real plugin CLI surface.

Both are quality-of-life fixes that reduce confusion during setup and repair workflows.

---

Core Tool Search is available on `main` today. Check the [OpenClaw GitHub](https://github.com/openclaw/openclaw) for the latest build, or watch the releases page for the next tagged version.
