---
title: "OpenClaw v2026.3.25: Teams SDK, Skills UX, and Security"
excerpt: "OpenClaw v2026.3.25 ships today with a full Microsoft Teams SDK migration, one-click skill installs, a sandboxed media security fix, and Docker setup repair."
coverImage: '/assets/images/posts/openclaw-2026-3-25-release-deepdive.png'
date: '2026-03-25T16:35:00.000Z'
dateFormatted: March 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-25-release-deepdive.png'
url: '/posts/openclaw-2026-3-25-release-deepdive/'
---

OpenClaw dropped a substantial stable release today — **v2026.3.25** — touching Microsoft Teams, skills management, OpenAI compatibility, the Control UI, and several security-critical fixes. Here's what landed.

## Microsoft Teams Gets a Full SDK Overhaul

The biggest surface-area change in this release is the Microsoft Teams channel, which has migrated to the **official Teams SDK** ([PR #51808](https://github.com/openclaw/openclaw/pull/51808)). The practical impact is significant:

- **Streaming 1:1 replies** — responses now stream into Teams conversations rather than appearing all at once
- **Welcome cards with prompt starters** — new users see suggested prompts when they first open a chat with the bot
- **Typing indicators** — Teams now shows the agent is "typing" during longer responses
- **Native AI labeling** — messages are labeled as AI-generated, following Microsoft's Teams AI UX guidelines
- **Feedback and reflection** — built-in feedback mechanisms for agent responses

A second Teams PR ([#49925](https://github.com/openclaw/openclaw/pull/49925)) adds message edit and delete support for sent messages, with in-thread fallbacks when no explicit target is provided. If you've been running a Teams-connected OpenClaw bot and noticed the UX felt flat compared to Slack or Discord, this release changes that significantly.

## Skills: One-Click Install and a Smarter Control UI

Bundled skills now ship with **one-click install recipes** ([PR #53411](https://github.com/openclaw/openclaw/pull/53411), thanks [@BunsDev](https://github.com/BunsDev)). Skills affected include `coding-agent`, `gh-issues`, `openai-whisper-api`, `session-logs`, `tmux`, `trello`, and `weather`.

When a skill has unmet requirements, the CLI and Control UI can now offer to install them for you — no manual `pip install` hunting required.

The Control UI skills page also gets a redesign:

- **Status-filter tabs** — filter skills by All / Ready / Needs Setup / Disabled with counts
- **Click-to-detail dialog** — replaces inline cards with a full dialog showing requirements, a toggle switch, install action, API key entry, source metadata, and a homepage link
- **API key guidance** — both CLI (`openclaw skills info`) and the macOS app now surface where to get a key, the save command, and the storage path

The label for missing requirements softens from "missing" to **"needs setup"** — a small UX detail, but the kind of friction that matters for new users.

## OpenAI Compatibility: `/v1/models` and `/v1/embeddings`

The Gateway now exposes `/v1/models` and `/v1/embeddings` endpoints, making OpenClaw's gateway a more complete drop-in for OpenAI API clients and RAG pipelines (thanks [@vincentkoc](https://github.com/vincentkoc)). Explicit model overrides also forward correctly through `/v1/chat/completions` and `/v1/responses`.

## Container CLI: `--container` Flag

A new `--container` flag and `OPENCLAW_CONTAINER` env var let you run `openclaw` commands **inside a running Docker or Podman container** ([PR #52651](https://github.com/openclaw/openclaw/pull/52651), thanks [@sallyom](https://github.com/sallyom)). This is useful for CI workflows or setups where OpenClaw runs containerized but you need to manage it from the host.

## Security Fix: Sandbox Media Bypass Closed

A notable security fix closes a media sandbox bypass: the `mediaUrl`/`fileUrl` alias path could previously be used to escape media-root restrictions from outbound tool and message actions ([PR #54034](https://github.com/openclaw/openclaw/pull/54034)). If you're running OpenClaw with strict workspace sandboxing, this fix is worth upgrading for.

The separate outbound media policy fix also aligns local file sends with the configured `fs` policy — host-local files and inbound-media paths keep sending when `workspaceOnly` is off, while strict workspace-only agents stay sandboxed.

## Docker Setup Fix

Fresh Docker installs were failing before the gateway came up, due to a shared-network namespace loop during setup ([PR #53385](https://github.com/openclaw/openclaw/pull/53385), thanks [@amsminn](https://github.com/amsminn)). The fix routes setup-time writes through `openclaw-gateway` instead of the CLI, breaking the loop.

## Channel Boot Isolation

One broken channel can no longer block others from starting. Boot failures are now isolated per-channel while keeping startup sequential ([PR #54215](https://github.com/openclaw/openclaw/pull/54215), thanks [@JonathanJing](https://github.com/JonathanJing)).

## Node 22 Floor Adjustment

The supported Node 22 floor drops to **22.14+** (previously higher), with Node 24 remaining the recommendation. The CLI's `update` command also now preflights the target package's `engines.node` before installing, giving a clear upgrade message instead of a failed install on outdated runtimes.

## Discord: AI-Generated Thread Names

Discord auto-threads gain an optional `autoThreadName: "generated"` mode ([PR #43366](https://github.com/openclaw/openclaw/pull/43366), thanks [@davidguttman](https://github.com/davidguttman)). When set, newly created threads are renamed asynchronously with LLM-generated titles — a nice alternative to the timestamp-based default naming.

---

**Update:** `npm install -g openclaw@latest` or `openclaw update` to get v2026.3.25. Full changelog at [github.com/openclaw/openclaw/releases](https://github.com/openclaw/openclaw/releases).
