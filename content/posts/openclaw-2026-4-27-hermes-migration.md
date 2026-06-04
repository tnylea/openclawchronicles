---
title: "OpenClaw Adds Hermes Migration: Import Your Config in One Step"
excerpt: "OpenClaw's new migrate-hermes plugin lets you import your Hermes config, memories, and MCP servers into OpenClaw with a single command."
coverImage: '/assets/images/posts/openclaw-2026-4-27-hermes-migration.webp'
date: '2026-04-27T08:00:00.000Z'
dateFormatted: April 27th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-27-hermes-migration.webp'
---

## From Hermes to OpenClaw, Without Starting Over

Switching AI assistants used to mean rebuilding everything from scratch — your config, your MCP servers, your memories. Not anymore.

Merged today on the `main` branch, [PR #72646](https://github.com/openclaw/openclaw/pull/72646) introduces a new `migrate-hermes` plugin that does the heavy lifting for you. If you're coming from Hermes (the popular self-hosted AI assistant), OpenClaw can now read your existing setup and import it automatically.

## What Gets Migrated

The new plugin handles several key migration paths:

- **Config**: Your Hermes `config.yaml` provider entries are translated into OpenClaw's `openclaw.json` format, including model selections and provider settings.
- **MCP Servers**: Existing MCP server definitions — including `command`, `args`, transport type, and connection timeouts — are mapped to OpenClaw's `mcp.servers` config block.
- **Memories**: Hermes memory files stored in `~/.hermes/memories/` are appended to the corresponding OpenClaw workspace files, so your agent's long-term context comes along for the ride.

## How It Works

The migration runs through OpenClaw's plugin SDK migration runtime. It performs a detect-plan-apply workflow:

1. **Detect** — The plugin looks for an existing Hermes config at `~/.hermes/config.yaml`.
2. **Plan** — It builds a migration plan listing every config item, memory file, and MCP server to import.
3. **Apply** — Items are written to your OpenClaw workspace with optional backup of existing targets.

A full report — including a human-readable `summary.md` and a structured `report.json` — is written to a timestamped directory after each run so you can audit what changed.

## Running It

Once available in a release, you'll be able to trigger migration with:

```bash
openclaw migrate hermes
```

Use `--dry-run` to preview the plan without writing anything to disk. Add `--include-secrets` to also bring over environment variables and auth headers from your MCP server definitions (omitted by default for safety).

## A Note on Security

The Aisle Security bot flagged several issues during review, including prototype pollution risks in the config merge logic and symlink injection vectors in file copy paths. The OpenClaw maintainers are actively reviewing these before the plugin ships in a stable release. For now, this lives on `main` — watch the PR for follow-up hardening patches before relying on it in production.

## What It Means for the Ecosystem

For users already running Hermes, this dramatically lowers the barrier to trying OpenClaw. You don't have to choose between your existing setup and a fresh start — you can bring both.

The `migrate-hermes` plugin joins OpenClaw's growing plugin SDK migration runtime, which is designed to support multiple source assistants. If you're coming from a different tool and want similar import support, the infrastructure is now in place for community contributors to build it.

**Source:** [PR #72646 on GitHub](https://github.com/openclaw/openclaw/pull/72646)
