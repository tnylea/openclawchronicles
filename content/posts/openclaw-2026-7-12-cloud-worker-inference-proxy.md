---
title: "OpenClaw Adds Worker Inference Proxying"
excerpt: "OpenClaw cloud workers can now hand model turns back to the Gateway without receiving provider credentials or endpoint control."
coverImage: '/assets/images/posts/openclaw-2026-7-12-cloud-worker-inference-proxy.png'
date: '2026-07-12T23:00:00.000Z'
dateFormatted: July 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-12-cloud-worker-inference-proxy.png'
---

OpenClaw merged a major cloud-workers milestone late Sunday: a Gateway inference proxy for worker model turns. The change gives the cloud-worker design a cleaner trust boundary, where a worker can run the agent loop without holding provider credentials or choosing raw provider endpoints.

The merged pull request, `feat(cloud-workers): gateway inference proxy for worker model turns`, is part of the cloud-workers roadmap and builds on prior worker-role, transcript, and live-event work. Its core idea is simple but important: workers prepare a model turn, then the Gateway executes that turn using the Gateway's own catalog, routing, credentials, and policy.

Source: [OpenClaw PR #105719](https://github.com/openclaw/openclaw/pull/105719)

## What Changed

The new inference proxy introduces a protocol, persistence layer, runtime, and SQLite-backed store for worker-submitted model turns. Instead of handing a worker direct model credentials or broad provider settings, OpenClaw now accepts a narrow request shape with a provider and model reference, prepared context, and a closed set of safe options.

The PR explicitly rejects model objects, custom base URLs, custom headers, and arbitrary provider passthrough. That matters because the worker is intentionally treated as less trusted than the Gateway. The Gateway resolves endpoint, auth, headers, model approval, and routing from server-side state.

The implementation also adds:

- Server-side approval checks against the session agent's policy and catalog.
- Credential, session, and epoch fencing around turn execution.
- One active inference turn per session and run.
- Idempotent cancellation that aborts the provider stream.
- Durable replay so a retried turn can return the cached result without re-executing.
- Crash recovery that closes as a provider error instead of silently billing again.
- Bounded request and output sizes.

## Why It Matters

This is one of those infrastructure changes that looks internal until you follow the credentials. A cloud worker is useful because it can run work away from the user's main Gateway. It is dangerous if that worker can steer provider endpoints, smuggle headers, or ask for models that the session agent was never approved to use.

OpenClaw's approach keeps the worker focused on orchestration while the Gateway remains the authority for model access. That makes cloud execution more plausible for operators who want remote capacity without turning every worker into a credential-bearing model client.

It also sets up the next worker-loop milestone. The PR notes that it does not commit transcripts or fan out live events; earlier and later slices own those pieces. This merge is specifically about executing model turns and returning output safely.

## Verification

The maintainers reported broad focused coverage across worker environments, inference runtime, inference store, worker admission schema, message handling, chat abort authorization, state database checks, and build gates. The PR also says an adversarial review found no path where worker-controlled values reached provider endpoint, headers, or auth.

For OpenClaw operators, the short version is this: cloud workers just gained a model-turn lane, but not a blank check. Gateway policy still owns the keys.
