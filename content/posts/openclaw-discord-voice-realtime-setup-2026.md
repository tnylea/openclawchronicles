---
title: "How to Set Up OpenClaw Discord Voice Realtime Mode (2026.5.10)"
excerpt: "A practical guide to configuring OpenClaw's new Discord voice realtime modes: agent-proxy, STT/TTS, and bidi realtime with barge-in control."
coverImage: '/assets/images/posts/openclaw-discord-voice-realtime-setup-2026.png'
date: '2026-05-10T23:05:00.000Z'
dateFormatted: May 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-discord-voice-realtime-setup-2026.png'
---

OpenClaw 2026.5.10 ships a complete rework of Discord voice. If you have an OpenClaw bot in a Discord voice channel, your setup just got a lot more capable — and a lot more configurable. Here is a practical walkthrough of the three new voice modes, when to use each, and how to tune barge-in for your room.

## Prerequisites

- OpenClaw gateway at **v2026.5.10** or newer
- Node.js **22.16 or higher** (required by this release)
- A Discord bot with **Connect**, **Speak**, and **Read Message History** permissions in your target voice channel
- An OpenAI API key with Realtime API access (for `realtime-talk-buffer` and `bidi-realtime` modes)

Before you start, run a channel capability audit to catch permission issues early:

```bash
openclaw channels capabilities --probe discord
```

Any missing voice-channel permissions will surface here before you try to join.

## Understanding the Three Voice Modes

OpenClaw 2026.5.10 introduces three distinct `/vc` modes. **Agent-proxy is now the default.** Pick based on your use case:

| Mode | Best for | Latency | Requires |
|------|----------|---------|----------|
| `stt-tts` | Simple Q&A bots, server bots | Low | Any TTS/STT provider |
| `realtime-talk-buffer` | Conversational agents with memory | Medium | OpenAI Realtime API |
| `bidi-realtime` | Full agentic sessions, tool use | Higher | OpenAI Realtime API + `openclaw_agent_consult` |

## Configuring Voice in gateway.json

Add a `voice` block to your Discord channel config:

```json
{
  "channels": {
    "discord": {
      "voice": {
        "mode": "agent-proxy",
        "autoJoin": ["YOUR_VOICE_CHANNEL_ID"],
        "captureSilenceGraceMs": 2500,
        "interruptResponseOnInputAudio": true,
        "minBargeInAudioEndMs": 0,
        "realtime": {
          "model": "gpt-4o-realtime-preview",
          "voice": "alloy"
        }
      }
    }
  }
}
```

### Key fields explained

**`captureSilenceGraceMs`** (default: 2500 in 2026.5.10) — how long OpenClaw waits after a speaker goes quiet before treating the utterance as complete. Increase this in noisy rooms or if users are getting cut off mid-sentence.

**`interruptResponseOnInputAudio`** — when `true` (default), any speech-start event from the server VAD will interrupt active playback. Set to `false` in echo-heavy rooms where your speaker output is triggering false barge-in.

**`minBargeInAudioEndMs`** — minimum milliseconds of audio silence before allowing a barge-in interruption. Set to a higher value (e.g. `300`) in rooms with significant echo or reverb.

## Mode 1: STT/TTS (Explicit Fallback)

This is the classic mode: speech in, text processed by your agent, speech back out. It works with any TTS and STT provider you have configured.

```json
{
  "voice": {
    "mode": "stt-tts"
  }
}
```

Use this when you do not have Realtime API access, or when you need the lowest possible latency and do not need the agent to maintain voice-aware state between turns.

## Mode 2: Realtime Talk Buffer (Default Agent-Proxy)

The new default. OpenClaw now acts as the microphone-and-speaker extension of the routed agent session. Your agent's full memory, tools, and skills are available in voice turns — the user is speaking to the same agent they interact with in text.

```json
{
  "voice": {
    "mode": "agent-proxy",
    "realtime": {
      "model": "gpt-4o-realtime-preview",
      "voice": "shimmer",
      "instructions": "Keep responses concise and avoid reading out URLs or code."
    }
  }
}
```

The new `talk.realtime.instructions` config field (added in 2026.5.10) lets you append voice-specific guidance without touching your main agent system prompt. Great for adjusting response style for spoken delivery.

## Mode 3: Bidi Realtime with Agent Consult

The most powerful option, and the most resource-intensive. Full bidirectional realtime session using `openclaw_agent_consult` — the realtime model consults your full OpenClaw agent, which can use any configured tool, before speaking.

```json
{
  "voice": {
    "mode": "bidi-realtime"
  }
}
```

In this mode, the realtime voice model acts as the voice interface and defers tool use, memory lookups, and multi-step reasoning to the agent brain. The voice model stays quiet while the agent is working, and queues answers for playback once the agent finishes.

Note: this mode requires more API credits (two model calls per voice turn) and adds latency. Reserve it for agents where tool use is central to the voice experience.

## Joining a Voice Channel

Once configured, use the `/vc join` command in Discord:

```
/vc join
```

Or configure `autoJoin` in your gateway config (shown above) to have the bot join automatically on gateway startup.

## Auditing Voice Permissions First

The 2026.5.10 release adds voice permission auditing to `channels status --probe`:

```bash
openclaw channels status --probe discord
```

This will surface missing Connect, Speak, or Read Message History permissions for any configured `autoJoin` targets before you try to join live.

## Tuning for Echo-Heavy Rooms

If you are running OpenClaw in a room where the speaker output echoes back into the microphone (common with open speakers), use these settings:

```json
{
  "voice": {
    "interruptResponseOnInputAudio": false,
    "minBargeInAudioEndMs": 500,
    "captureSilenceGraceMs": 3000
  }
}
```

Disabling `interruptResponseOnInputAudio` prevents the echo from triggering a false barge-in. Raising `minBargeInAudioEndMs` adds a gate so only sustained human speech can interrupt playback.

---

The Discord voice rework in 2026.5.10 is one of the most significant feature additions to the platform in recent months. The full changelog is available at [github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.2](https://github.com/openclaw/openclaw/releases/tag/v2026.5.10-beta.2). For feedback and questions, the `#voice` channel on the [OpenClaw Discord](https://discord.com/invite/clawd) is the right place.
