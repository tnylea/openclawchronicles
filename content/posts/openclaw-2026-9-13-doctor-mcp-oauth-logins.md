---
title: "OpenClaw Doctor Stops OAuth Token Drift"
excerpt: "OpenClaw Doctor now skips rotating-token MCP OAuth probes in read-only diagnostics, preserving working server logins."
coverImage: '/assets/images/posts/openclaw-2026-9-13-doctor-mcp-oauth-logins.png'
date: '2026-09-13T23:01:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-doctor-mcp-oauth-logins.png'
---

OpenClaw's Doctor diagnostics gained an important auth-safety repair tonight. [PR #147454](https://github.com/openclaw/openclaw/pull/147454), `fix(doctor): preserve MCP OAuth logins during read-only checks`, fixes a case where read-only Doctor or triage diagnostics could accidentally invalidate a working MCP OAuth login.

The problem was subtle: diagnostics copied SQLite state before probing, but external OAuth token rotation is not contained by that copy. If a read-only probe refreshed a rotating token into disposable state, the real server login could be left behind.

## The User Impact

After this change, Doctor's read-only MCP schema probes no longer refresh OAuth tokens into a disposable snapshot. OAuth-backed servers are reported as skipped, with guidance to run the authenticated check instead.

Normal MCP use is unchanged. Explicit probing still refreshes and persists credentials when the operator asks for it, and non-OAuth inspection continues through the diagnostic path. The PR also states that already invalidated logins still require reauthorization; this is a forward fix, not a retroactive repair.

The practical result is easier to understand:

- Read-only diagnostics should not rotate OAuth tokens.
- Working MCP OAuth logins should survive Doctor and update-failure triage.
- Authenticated checks remain available through the configured server path.
- Plugin-provided or agent-local MCP servers should be validated through their serving agent.
- No configuration or database migration is introduced.

That is the right split. A read-only health check should be safe to run precisely because it does not take ownership of live credentials.

## Why It Matters

MCP servers often sit at the boundary between OpenClaw and external systems. OAuth-backed servers may protect calendars, documents, code hosts, internal tools, or other sensitive capabilities. Accidentally refreshing a token in the wrong state snapshot is not just noisy; it can break the user's working setup and force a reauthorization cycle.

This is also a good example of why "copy the database" is not the same as "isolate the side effects." Local SQLite writes can be contained, but an OAuth server's token rotation happens outside the copied file. The fix accounts for that by excluding refresh-capable OAuth profiles before constructing the diagnostic MCP runtime.

## Verification

The PR reports 98 passing tests across Doctor runtime checks, lint, state isolation, update-warning handling, and the new OAuth regression. The regression was checked both ways: with the production runtime file reverted, lint and triage each observed an external refresh; with the fix restored, both passed with zero diagnostic network calls and unchanged canonical SQLite bytes.

The synthetic fixture covers expired access tokens and challenged stored bearer tokens through the actual `runDoctorLintCli` and `collectDoctorFindings` entry points. The contributor also reported checking an equivalent deployed fix against a real rotating-token MCP service, while the PR is careful to say that private runtime output was not independently verified.

For operators, the headline is straightforward: OpenClaw Doctor should be less likely to disturb the very credentials it is trying to diagnose.
