---
title: "OpenClaw ACPX Now Supports 13 Built-In Coding Agents"
excerpt: "OpenClaw's ACPX harness just expanded its built-in agent registry from 5 to 13, adding Copilot, Cursor, Kiro, Kilocode, and more with zero-config npx commands."
coverImage: '/assets/images/posts/openclaw-2026-3-27-acpx-agent-registry.png'
date: '2026-03-27T08:00:00.000Z'
dateFormatted: March 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-27-acpx-agent-registry.png'
---

OpenClaw's ACPX coding-agent harness just gained a significant upgrade: the built-in agent registry has grown from 5 entries to 13, and every new agent ships with a pinned, zero-config `npx` command so you can launch any of them without hunting through documentation.

Merged [PR #55476](https://github.com/openclaw/openclaw/pull/55476) by [@vincentkoc](https://github.com/vincentkoc) aligns OpenClaw's local registry with the upstream `openclaw/acpx` source, closing a drift that had kept several popular agents invisible to the harness's intent detection.

## What's New in the Registry

Eight agents join the existing five (`codex`, `claude`, `gemini`, `pi`, and one other):

- **copilot** — GitHub Copilot agent adapter
- **cursor** — Cursor IDE agent via ACP
- **droid** — Android-native coding assistant
- **iflow** — workflow-focused coding agent
- **kilocode** — open-source VS Code extension agent
- **kiro** — Amazon's new vibe-coding agent
- **openclaw** — OpenClaw's own self-referential ACP agent
- **qwen** — Alibaba's Qwen coding model via ACP

Alongside the new entries, existing agents received tighter version pins:

| Agent | Command |
|-------|---------|
| codex | `npx @zed-industries/codex-acp@^0.9.5` |
| claude | `npx -y @zed-industries/claude-agent-acp@^0.21.0` |
| pi | `npx pi-acp@^0.0.22` |
| gemini | `gemini --acp` |

Version-pinned commands mean `openclaw update` can't accidentally drop you onto an incompatible agent release between runs.

## Intent Detection Gets Smarter

Because the system prompt and config help text are updated in the same PR, OpenClaw can now correctly detect intent when you say "use cursor" or "run with copilot" — even if you haven't explicitly configured those harness IDs. The harness hints now list `cursor`, `gemini`, and `openclaw` as representative examples alongside the classic `codex`/`claude` pair.

## How to Use the New Agents

If you're running OpenClaw with an ACPX-compatible session, pick any agent by setting `runtime: "acp"` and the `agentId`:

```yaml
agents:
  - name: cursor-agent
    runtime:
      type: acp
      acp:
        agent: cursor
```

No additional install step needed — ACPX resolves the `npx` command from the built-in registry and launches it on demand.

For Cursor specifically, the updated skill docs add an explicit override guidance section, since Cursor's ACP adapter ships separately from the IDE itself.

## Why This Matters

The previous 5-agent registry meant anyone using Kiro, Copilot, or Kilocode had to manually specify raw `npx` commands in their config — a friction point that made ACPX feel less polished than it actually is. With 13 first-class entries and pinned versions, the harness now covers the majority of actively maintained ACP-compatible coding agents in a single zero-config registry.

The full change is already in `main` and will ship in the next numbered OpenClaw release. Track it at [openclaw/openclaw#55476](https://github.com/openclaw/openclaw/pull/55476).
