---
title: "OpenClaw Keeps Claude CLI OAuth Alive in Control UI"
excerpt: "OpenClaw now keeps Claude CLI OAuth routes selectable after Gateway restarts by repairing legacy metadata and removing contradictory auth status."
coverImage: '/assets/images/posts/openclaw-2026-8-20-claude-cli-oauth-control-ui.png'
date: '2026-08-20T08:01:00.000Z'
dateFormatted: August 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-20-claude-cli-oauth-control-ui.png'
---

OpenClaw merged a provider-auth recovery fix this morning that should matter to anyone using Claude CLI OAuth through Control UI. [PR #125471](https://github.com/openclaw/openclaw/pull/125471), titled "fix(models): keep Claude CLI OAuth available in Control UI," addresses a restart path where a valid Claude CLI subscription could look unavailable after Gateway came back up.

The issue was not that the credential disappeared. The PR describes a legacy profile entry for `anthropic:claude-cli` that still identified itself as `provider: anthropic, mode: token`. After a restart, that stale metadata could prevent OpenClaw from rebuilding the refresh-ownership path for the CLI OAuth credential. Once the short-lived access token expired, configured Anthropic and Claude routes could show as needing sign-in even though the underlying Claude CLI auth was still valid.

## What Changed

The fix moves the durable compatibility work into Doctor and adds a bounded runtime recovery path for installs that have not run Doctor yet. In practical terms, OpenClaw now canonicalizes legacy Claude CLI metadata only when credential persistence is safe, while the runtime can still keep older valid installs usable before that migration runs.

The PR also fixes the Gateway projection that Control UI consumes. Before this change, Gateway could publish two incompatible facts at the same time: an empty `anthropic: missing` row and an `ok` Claude CLI profile covering the same route. Control UI then had to infer which fact should win.

After the patch, Gateway publishes one coherent credential-bearing provider for the CLI-owned route. Independently configured Anthropic providers can still correctly show missing credentials, but the Claude CLI OAuth path no longer has to compete with a synthetic missing row.

## Why It Matters

Model availability bugs are especially frustrating because they can look like an account or provider outage when the real problem is local state. This fix targets a narrow but high-impact case:

- Claude CLI OAuth remains selectable across the access-token rotation cycle.
- Gateway restart no longer strands legacy profile metadata in a misleading state.
- Control UI receives a cleaner signed-in provider projection.
- Doctor owns the durable migration instead of forcing every UI caller to rank aliases.

The implementation is careful about another boundary too: MiniMax keeps its separate persisted-profile ownership contract. This is a Claude CLI compatibility repair, not a broad rewrite of provider auth semantics.

## Verification Notes

The PR includes focused coverage for external OAuth lifecycle recovery, model availability, Gateway auth status, Doctor migration, and Control UI provider data. It also includes deployed proof from August 19 showing the migrated metadata changing from an Anthropic token-shaped profile to a Claude CLI OAuth-shaped profile, with configured Claude routes available after restart.

The residual caveat is explicit in the PR: one exact-head host could not repeat a positive OAuth replay because it lacked an identity-complete Claude CLI credential. The maintainers accepted that proof gap while preserving fail-closed behavior for incomplete credentials.

For OpenClaw users, the headline is simpler: valid Claude CLI OAuth should be far less likely to vanish from the model picker after Gateway restarts.
