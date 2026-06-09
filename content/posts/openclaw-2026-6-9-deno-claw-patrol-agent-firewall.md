---
title: "Deno Ships Claw Patrol, a TCP-Level Firewall for OpenClaw"
excerpt: "Deno built Claw Patrol after running OpenClaw in production at Deno Deploy — a WireGuard-tunneled TCP proxy that gates agent actions at the protocol layer."
coverImage: '/assets/images/posts/openclaw-2026-6-9-deno-claw-patrol-agent-firewall.png'
date: '2026-06-09T23:00:00.000Z'
dateFormatted: June 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-9-deno-claw-patrol-agent-firewall.png'
---

Deno shipped [Claw Patrol](https://github.com/denoland/clawpatrol) today — an open-source TCP-level security firewall for AI agents that terminates connections over WireGuard or Tailscale, parses application protocols, and applies HCL-configured allow/deny rules before any request reaches your production systems.

The [Show HN thread](https://news.ycombinator.com/item?id=48462928) from Deno's team explains the motivation directly: Deno has been running OpenClaw agents in production at Deno Deploy for automated incident response. When a PagerDuty alert fires, an agent researches the cause and makes fixes — with access to Postgres, Kubernetes, GCP, ClickHouse, GitHub, and SSH. Claw Patrol is what makes that safe.

## Why a TCP Proxy, Not an LLM Gateway

Most agent security tools sit above the protocol layer — MCP proxies, LLM gateways, sandboxes. Deno found those insufficient for their needs, specifically because:

1. They don't handle complex real-world situations like tunneling Postgres through Kubernetes
2. They can't enforce rules at the wire level for low-level protocols like SSH

Claw Patrol terminates TCP connections and parses the actual application protocol, extracting wire-level facts:

- **Postgres / ClickHouse**: SQL verbs and table names
- **Kubernetes**: resource type, verb, namespace
- **HTTP**: method, path, headers, body
- **SSH**: connection metadata

Rules are then evaluated as [CEL expressions](https://cel.dev/) against those facts. Here's a real rule from Deno's production config:

```hcl
rule "k8s-no-secrets" {
  endpoint  = k8s-prod
  condition = "k8s.resource == 'secrets'"
  verdict   = "deny"
  reason    = "Secret values must not leave the cluster via the agent"
}
```

You can block `DROP TABLE` in Postgres, gate `kubectl delete pod` until a human approves, deny any HTTP DELETE to your internal API, or restrict SSH to read-only operations — all without touching the agent's code or prompt.

## Three Deployment Shapes

Claw Patrol offers three ways to deploy:

```bash
clawpatrol gateway config.hcl  # run the proxy itself
clawpatrol join <gateway-url>  # route whole-host traffic via WireGuard
clawpatrol run claude           # wrap one agent's process tree
```

The `run` mode is the lightest touch: it opens a per-process tunnel (via `netns` on Linux, `NetworkExtension` on macOS) that routes only the wrapped command's traffic through the gateway. Your other processes are unaffected.

`join` mode brings up a WireGuard tunnel that routes the whole host — useful for VM-based agent deployments.

`gateway` is the proxy itself: a single Go binary that loads your HCL config and accepts clients tunneling in over WireGuard or Tailscale.

## Install

```bash
curl -fsSL https://clawpatrol.dev/install.sh | sh
```

From source: `make` (requires Go and Node.js). MIT licensed. Full docs at [clawpatrol.dev](https://clawpatrol.dev).

## Why This Matters for OpenClaw

Claw Patrol represents something important: a major, OpenClaw-using production team building and open-sourcing the infrastructure layer they wished existed. Deno's use case — autonomous incident response with access to real production databases and Kubernetes clusters — is exactly the scenario where "just prompt it carefully" isn't enough.

The tool is complementary to OpenClaw's own security features (exec approvals, tool policies, sandboxing) rather than competing with them. Claw Patrol operates at a layer beneath the agent runtime: it doesn't care whether the dangerous SQL came from the LLM or a bug in a skill. It just enforces the rule.

For teams running OpenClaw with production database or infrastructure access, Claw Patrol is worth a serious look. The HN thread has 20 points and several comments from teams exploring similar patterns — the timing, shipping the same day as the 2026.6.5 stable release, feels deliberate.
