---
title: "OpenClaw Agents API Adds HTTP MCP Sessions"
excerpt: "OpenClaw Agents API sessions can now forward supported Streamable HTTP MCP servers to the official SDK runtime, widening native tool access for teams today."
coverImage: '/assets/images/posts/openclaw-2026-9-29-agents-api-http-mcp.webp'
date: '2026-09-29T08:02:00.000Z'
dateFormatted: September 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-29-agents-api-http-mcp.webp'
---

OpenClaw merged [PR #160931](https://github.com/openclaw/openclaw/pull/160931) Tuesday morning, adding HTTP MCP server support to Agents API sessions.

Before this change, configured HTTP MCP servers were ignored by the Agents API harness. That meant operators could configure useful MCP services in OpenClaw, but those services would not be available when a conversation ran through the Agents API path. The new implementation forwards supported Streamable HTTP MCP definitions into the official SDK runtime.

## What Is Supported

The first version is deliberately scoped. Enabled Streamable HTTP servers from `mcp.servers` and plugin bundles can be supplied to the native API. The native API owns discovery and execution, and connections originate from the session's execution environment.

The PR says the implementation supports:

- Explicit headers.
- Environment-backed headers.
- Exact tool allowlists.
- Session server overrides.
- Plugin-bundled supported HTTP definitions.

Unsupported definitions are logged and omitted instead of blocking unrelated conversations. Supported servers also use optional initialization by default, so an unavailable MCP service should not prevent a session from continuing when the tool is not needed.

## What Is Not Included Yet

This is not full MCP parity across every transport. Stdio connections, requester-scoped connections, Gateway OAuth profiles, legacy SSE, and custom TLS are outside the first step.

There is also a compatibility detail worth noting: URL-only definitions keep OpenClaw's existing SSE interpretation. To forward a server through this Agents API path, configuration needs an explicit Streamable HTTP transport. That avoids silently changing legacy definitions into a different native transport.

The PR also records an accepted limitation for existing native sessions. Conversations that were already saved may not automatically adopt changed MCP settings. In practical terms, upgrading an existing conversation to use a newly configured HTTP server may require starting a new session with `/new`.

## Why It Matters

MCP is one of OpenClaw's most important integration surfaces. It lets agents reach documentation systems, internal tools, databases, search indexes, and other services through a common protocol.

Bringing Streamable HTTP MCP servers into Agents API sessions narrows the gap between OpenClaw's configured tool ecosystem and the hosted/native runtime path. It means teams experimenting with Agents API sessions can keep using supported HTTP MCP infrastructure instead of maintaining a separate setup.

The optional-initialization behavior is especially useful. In mixed environments, a shared MCP server might be reachable from one execution environment but unavailable from another. Treating supported MCP setup as optional lets the conversation proceed while still surfacing diagnostics for the missing service.

## Verification

The PR includes live evidence from ordinary Slack messages using a native ARM64 Docker environment and an OpenAI-hosted Linux environment. In that test, one unavailable MCP initialization failed while a documentation MCP still worked and delivered its reply.

The merged head also adds regression coverage for explicit HTTP transport taking precedence over a stale legacy type alias while excluding command-bearing server definitions. Current-head CI completed successfully, and the independent review reported no remaining actionable findings.

For users, the most important operational point is configuration clarity. If you want Agents API sessions to receive an MCP server, make the Streamable HTTP transport explicit and expect existing sessions to need a fresh start before they pick up the new binding.
