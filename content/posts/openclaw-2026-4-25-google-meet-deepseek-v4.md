---
title: "OpenClaw 2026.4.24: Google Meet Plugin, DeepSeek V4, and Live Voice"
excerpt: "OpenClaw 2026.4.24 ships a full Google Meet plugin, DeepSeek V4 Flash as the new onboarding default, and realtime voice loops across calls and meetings."
coverImage: '/assets/images/posts/openclaw-2026-4-25-google-meet-deepseek-v4.webp'
date: '2026-04-25T23:00:00.000Z'
dateFormatted: April 25th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-25-google-meet-deepseek-v4.webp'
---

OpenClaw tagged **v2026.4.24** today, and it's one of the bigger drops in recent memory. Three headline features land in this release: a full bundled Google Meet participant plugin, DeepSeek V4 Flash and V4 Pro joining the model catalog (with V4 Flash now the onboarding default), and realtime voice loops that let Talk, Voice Call, and Google Meet sessions consult the full OpenClaw agent mid-conversation. Here's what's actually shipping.

## Google Meet Is Now a First-Class Channel

The headline addition is a bundled Google Meet participant plugin ([#70765](https://github.com/openclaw/openclaw/pull/70765)). This isn't a thin webhook wrapper — it's a full-stack integration with personal Google OAuth, explicit meeting URL joins, and support for both Chrome and Twilio as realtime transports.

What that means in practice:

- **Paired-node Chrome support** — for setups running Chrome on a separate machine (Parallels-style with BlackHole/SoX), the plugin handles cross-node audio routing automatically.
- **Artifact and attendance exports** — conference records, recordings, transcripts, smart notes, and participant sessions can all be output as markdown files. `--all-conference-records` scans full history.
- **Recovery tooling** — `googlemeet doctor --oauth` and `recover_current_tab` let your agent inspect or rejoin an already-open Meet tab without duplicating it.

If you've been running Google Meet automations through shell scripts and browser automation hacks, this is the replacement.

## DeepSeek V4 Flash Is the New Default

DeepSeek V4 Flash and V4 Pro land in the bundled model catalog, and V4 Flash immediately becomes the onboarding default — displacing whatever was there before. The release also fixes DeepSeek thinking/replay behavior on follow-up tool-call turns, which was a subtle but annoying edge case for multi-step agent workflows.

The Pi packages bump to 0.70.2 alongside this, picking up upstream gpt-5.5 and the new DeepSeek V4 catalog metadata.

## Realtime Voice Loops Everywhere

OpenAI Realtime-backed voice sessions are now available across Talk (browser WebRTC), Voice Call, and Google Meet. The shared `openclaw_agent_consult` tool exposes the full OpenClaw agent inside live conversations — so a phone call or Meet session can reach back to your agent for tool-backed answers without breaking the voice flow.

On the infrastructure side, a new Gateway WebSocket endpoint (`/VoiceClaw`, [#70938](https://github.com/openclaw/openclaw/pull/70938)) backs the Gemini Live audio bridge with owner-auth gating. There's also a new Gemini Live realtime voice provider for backend Voice Call and Google Meet, with bidirectional audio and function-call support.

Gemini TTS gains `audioProfile` and `speakerName` prompt prepending for reusable speech style control — a small but welcome addition for anyone running consistent voice personas.

## Browser Automation Gets More Precise

Two solid browser improvements land here:

- **Coordinate clicks** ([#54452](https://github.com/openclaw/openclaw/pull/54452)) — `openclaw browser click-coords` adds viewport coordinate clicks for managed and existing-session automation. Useful for UI targets that can't be reliably addressed by selector.
- **Longer action budgets** ([#62589](https://github.com/openclaw/openclaw/pull/62589)) — `browser.actionTimeoutMs` defaults to 60 seconds now, stopping valid long-running page operations from failing at the transport boundary.

Per-profile `browser.profiles.<name>.headless` overrides also land, so you can run one profile headless without forcing all profiles into headless mode.

## Infrastructure and Breaking Changes

Model listing gets meaningfully faster with static catalogs for bundled providers and less broad registry enumeration ([#70632](https://github.com/openclaw/openclaw/pull/70632) and related). The `node-llama-cpp` dependency stops installing by default — local embeddings only load it if you've explicitly installed the optional runtime package.

**Breaking change to note:** The `api.registerEmbeddedExtensionFactory()` compatibility path is gone. Plugin tool-result rewrites now require `api.registerAgentToolResultMiddleware()` with `contracts.agentToolResultMiddleware` declaring the targeted harnesses. This aligns Pi and Codex app-server dynamic tools behavior. If you maintain a plugin that used the old factory path, this is your migration target.

The `/models add` command is also deprecated — chat attempts now return a deprecation message rather than writing model configuration.

## Other Notable Additions

- **Matrix self-verification** ([#70401](https://github.com/openclaw/openclaw/pull/70401)) — `openclaw matrix verify self` establishes full cross-signing identity trust from the CLI.
- **Gradium TTS provider** ([#64958](https://github.com/openclaw/openclaw/pull/64958)) — bundled text-to-speech with voice-note and telephony output.
- **Memory hybrid search improvements** ([#68286](https://github.com/openclaw/openclaw/pull/68286)) — `vectorScore` and `textScore` are now exposed alongside the combined score, so callers can inspect retrieval contribution before temporal decay or MMR reordering.
- **Tool Access panel** ([#71405](https://github.com/openclaw/openclaw/pull/71405)) — compact live-tool chips, collapsible groups, per-tool toggles, and clearer runtime/source provenance in the Control UI.
- **Steer action on queued messages** — inject a browser follow-up into an active run without retyping it.

Full release notes on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.24).
