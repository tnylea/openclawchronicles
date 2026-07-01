---
title: "OpenClaw Attach Brings Claude Code Into Sessions"
excerpt: "OpenClaw added an attach command that launches Claude Code with scoped Gateway MCP access and revokes the temporary grant on exit."
coverImage: '/assets/images/posts/openclaw-2026-7-1-attach-claude-code.png'
date: '2026-07-01T23:00:00.000Z'
dateFormatted: July 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-1-attach-claude-code.png'
---

OpenClaw merged [PR #96454, "feat(cli): openclaw attach - launch an external harness bound to a gateway session"](https://github.com/openclaw/openclaw/pull/96454) late on July 1st, turning the lower-level attach grant work into a user-facing CLI command.

The new command is designed for a specific operator need: let Claude Code reach OpenClaw Gateway MCP tools for one Gateway session without handing it a durable, process-global credential.

That matters because external harnesses are useful, but they are also a boundary. If operators have to mint a token by hand, write an MCP config by hand, and remember to revoke the grant later, the path is easy to get wrong.

## What Changed

The new surface is `openclaw attach`. According to the PR, it mints a per-session attach grant through the Gateway, writes a temporary `.mcp.json` for Claude Code, launches Claude with `--strict-mcp-config --mcp-config <path>`, and revokes the grant when the child process exits.

The command includes options for the common cases:

- `--session <key>` binds the grant to a specific Gateway session
- `--ttl <ms>` requests a bounded grant lifetime
- `--bin <path>` chooses the Claude Code binary
- `--print-config` writes the config and prints launch details without spawning Claude

The PR also adds docs at `docs/cli/attach.md` and registers the command in the CLI catalog, so it is not just a hidden gateway primitive.

## Why It Matters

This is a meaningful OpenClaw integration story because it narrows the gap between a personal agent gateway and a dedicated coding harness.

Before this command, a user who wanted Claude Code to use OpenClaw Gateway tools would have needed to assemble the grant, environment, headers, and config manually. PR #96454 makes that flow explicit and repeatable.

The security design is the important part. The bearer token rides through environment variables, not argv. The temporary config is scoped to the attach flow. The Gateway grant is session-bound, TTL-bounded, and revoked on normal exit.

That gives operators a clean way to let Claude Code act inside an OpenClaw session without permanently broadening every MCP server or every OpenClaw tool path around it.

## Boundary Fixes Included

The PR body calls out a live-gateway proof that caught a real auth bug. The command originally used a backend-style gateway mode that dropped the operator device identity, causing `attach.grant` to fail with a missing `operator.admin` scope.

The final version calls the Gateway in CLI mode so the operator identity is resolved correctly. Tests now guard that behavior.

The patch also switches attach configs to token-only headers. That keeps the attach MCP config from depending on session-context placeholders that Claude Code would not supply.

## Validation

The PR reports both unit and live behavior proof. Tests cover config writing and cleanup, `--print-config`, TTL validation, malformed grant responses, spawn exit handling, error handling, revoke-once behavior, and signal listener cleanup.

The live proof built OpenClaw in an isolated Linux container, ran a headless Gateway, minted a real attach grant, emitted a real `.mcp.json`, launched a harness with the grant, and revoked it on exit.

## Bottom Line

`openclaw attach` is an operator-quality bridge between OpenClaw sessions and Claude Code.

It gives external harnesses a narrow door into Gateway tools: session-bound, temporary, documented, and revoked. That is the right shape for integrations that need real power without turning every coding tool into a standing all-access client.
