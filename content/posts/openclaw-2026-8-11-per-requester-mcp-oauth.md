---
title: "OpenClaw Adds Per-Requester OAuth for MCP"
excerpt: "OpenClaw now supports per-requester OAuth for MCP servers, so trusted shared-channel users can connect their own accounts with safer authority boundaries."
coverImage: '/assets/images/posts/openclaw-2026-8-11-per-requester-mcp-oauth.png'
date: '2026-08-11T23:00:00.000Z'
dateFormatted: August 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-11-per-requester-mcp-oauth.png'
---

OpenClaw's MCP story took a meaningful step toward shared-channel deployments today with merged PR [#122166](https://github.com/openclaw/openclaw/pull/122166), which adds per-requester OAuth support for MCP servers. The short version: an operator can now configure an MCP server so each trusted sender authenticates as themselves instead of borrowing the operator's OAuth connection.

That matters for Slack, Discord, Telegram, and other shared surfaces where one OpenClaw agent may answer several people. Before this change, every MCP tool call in that room was tied to the operator's stored credentials or a plugin resolver connection. That was convenient for single-user use, but weak for teams that need identity boundaries.

## What changed

The new configuration knob is `mcp.servers.<name>.oauth.identity`, with two modes:

- `shared`, the default, keeps current operator-owned behavior.
- `per-requester` partitions OAuth state by trusted channel sender.

The PR keeps the existing OAuth store format and creates requester-specific rows using a derived key. Each sender gets an independent dynamic client registration, lease, pending authorization state, and token store. The implementation avoids a schema migration, which is important for production gateways that already have MCP credentials on disk.

OpenClaw also adds a gateway callback route for MCP OAuth and a new `gateway.publicOrigin` setting so the redirect URL can be built from a validated public origin. If a per-requester server is configured without that origin, `openclaw doctor` now warns about the missing setup.

## Why it matters

This is mostly a security-boundary and product-readiness feature. In a shared channel, different users often have different permissions in the downstream system. A calendar MCP server, ticketing MCP server, or internal executor should not silently collapse those users into one operator identity.

With per-requester OAuth, an unauthenticated sender gets a connect result with an authorization URL and a portable connect button. Once they complete the flow, their later tool calls use their own tokens. Another sender must connect separately.

The PR also fails closed where OpenClaw cannot prove the requester identity. Static and scheduled runtimes do not get per-requester transports because there is no trusted sender principal to bind.

## Proof before merge

The implementation shipped with a two-user Executor E2E against a real isolated OpenClaw Gateway callback. The test connected two separate requesters, verified each could see only their own Executor marker, checked replay handling on the callback, and confirmed an unconnected third sender received a new authorization path without leaking tokens.

The PR notes a conscious v1 tradeoff: authorization links are visible in the trusted shared channel. The maintainer decision accepts that for now because OpenClaw's shared-channel model already assumes an operator-curated trusted roster, while a private sign-in handoff is tracked for follow-up work.

## What to watch next

The immediate impact is clearer account separation for MCP-powered team agents. The likely follow-ups are Control UI visibility, requester login/logout commands, private handoff for sign-in links, and broader resolver-plugin support.

For teams wiring OpenClaw into standard MCP OAuth servers, this is the difference between "the bot can use a tool" and "each person can use the tool with their own authority."
