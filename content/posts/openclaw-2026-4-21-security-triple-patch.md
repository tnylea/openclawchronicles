---
title: "OpenClaw Closes Three Security Gaps: Cron, MCP Stdio, and Media Upload"
excerpt: "OpenClaw merged three security PRs on April 21st, patching a cron message-tool bypass, an MCP stdio env injection flaw, and an SSRF gap in media upload paths."
coverImage: '/assets/images/posts/openclaw-2026-4-21-security-triple-patch.png'
date: '2026-04-21T08:00:00.000Z'
dateFormatted: April 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-21-security-triple-patch.png'
---

Tuesday morning brought a flurry of security-focused merges to the OpenClaw main branch. Three separate PRs — each targeting a distinct attack surface — landed within hours of each other, continuing a pattern of proactive hardening that has picked up pace across recent releases.

Here is what changed and why it matters.

## Fix 1: Cron Isolated-Agent Message Tool Bypass (PR #69587)

**Merged by:** [@obviyus](https://github.com/obviyus)

This is the highest-severity fix of the three. The automated cron system runs isolated agent turns to deliver scheduled outputs. Before this patch, `runCronIsolatedAgentTurn` had a policy function — `resolveCronToolPolicy` — that *force-enabled* the `message` tool for most delivery modes and simultaneously dropped the `requireExplicitMessageTarget` safety rail.

The combined effect was dangerous for unattended workloads:

- Cron jobs running with `delivery.mode: none` (no intended outbound messaging) could still invoke `message` to send content elsewhere
- With `requireExplicitMessageTarget: false`, the agent could resolve a target from ambient session context — including the "last" channel from an unrelated main session
- This created a **cross-session messaging risk**: a cron job triggered in one context could inadvertently (or via a prompt-injected payload) send messages into a completely different user's channel

The fix reintroduces a restrictive default: the `message` tool is no longer force-enabled in cron contexts unless delivery is explicitly requested and a verified target is resolved. The `forceMessageTool: true` flag has been removed in favor of conditional enablement that only activates when `deliveryRequested && deliveryMode !== "webhook"`.

**Who is affected:** Anyone running cron jobs with `delivery.mode: none` or `announce` who processes untrusted input in those jobs. Update recommended.

## Fix 2: MCP Stdio Empty-Env Injection Block (PR #69540)

**Merged by:** [@drobison00](https://github.com/drobison00)

OpenClaw's MCP stdio transport already filtered out known dangerous environment variable overrides like `NODE_OPTIONS`, `LD_PRELOAD`, and similar host-injection vectors. The problem was what happened *after* filtering: when every supplied env key was blocked, `toMcpEnvRecord()` returned an explicit empty object `{}` rather than `undefined`.

In Node.js process spawning, `env: {}` does not mean "inherit parent env with no overrides" — it means "spawn with no environment at all." That strips `PATH`, `HOME`, SSL certificate paths, proxy settings, and anything else the MCP server process would normally inherit. The consequences range from subtle misbehavior (wrong config paths, missing certificates) to hard startup failures (no `PATH` means `node` or `python` cannot be found).

The patch changes `toMcpEnvRecord()` to return `undefined` when all keys are filtered out, allowing the child process to inherit `process.env` naturally. For configs that provide *some* safe env keys, those are now merged on top of parent env rather than replacing it entirely.

**Who is affected:** Users who configure MCP servers with custom `env` blocks that happen to contain only blocked keys (e.g., someone who accidentally included `NODE_OPTIONS` as their only env var). Edge case, but worth knowing.

## Fix 3: SSRF Guard on Media Upload URL Paths (PR #69595)

**Merged by:** [@pgondhi987](https://github.com/pgondhi987)

The ChatGPT/Codex connector's `uploadC2CMedia` and `uploadGroupMedia` functions now run supplied URLs through `assertDirectUploadUrlAllowed` before making any outbound request. This adds two layers of protection:

1. **HTTPS enforcement** — plain HTTP upload URLs are rejected outright
2. **Hostname policy check** — the target hostname is validated via `resolvePinnedHostnameWithPolicy`, blocking requests to internal addresses, loopback ranges, and other SSRF-prone targets

Without this guard, a crafted media URL could have directed the upload function to fetch from internal infrastructure — a classic server-side request forgery vector in apps that accept user-supplied URLs.

This continues a broader SSRF hardening pass that has touched several media and webhook paths in recent releases.

## The Bigger Picture

Three security PRs in a single morning is not coincidental. The OpenClaw team and its security-review tooling (the "Aisle" bot visible in these PRs) appear to be running a systematic sweep of boundary conditions in agent runtime, MCP transport, and connector code. The attack surface for an AI gateway — one that manages multi-session state, spawns child processes, and talks to external services — is large, and these fixes show that attention.

If you are running a publicly-accessible OpenClaw instance or one that processes untrusted agent inputs, tracking the security changelog closely is worthwhile. The [GitHub releases page](https://github.com/openclaw/openclaw/releases) and the [merged PRs](https://github.com/openclaw/openclaw/pulls?q=is%3Amerged&sort=updated) are the fastest signals.
