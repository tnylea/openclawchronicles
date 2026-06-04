---
title: "OpenClaw Now Transcribes WhatsApp Voice Notes Automatically"
excerpt: "OpenClaw now auto-transcribes WhatsApp DM voice notes before routing them to your AI agent, turning spoken messages into agent-readable text automatically."
coverImage: '/assets/images/posts/openclaw-2026-4-25-whatsapp-voice-note-transcription.webp'
date: '2026-04-25T08:00:00.000Z'
dateFormatted: April 25th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-25-whatsapp-voice-note-transcription.webp'
---

WhatsApp voice notes are the one message type that used to stop OpenClaw cold. You could send a text, an image, a document — but the moment someone dropped a voice note into the chat, the agent would see an unprocessable audio attachment and leave it at that. That changes today.

A new pull request from community contributor [@rogerdigital](https://github.com/rogerdigital) — [PR #64120](https://github.com/openclaw/openclaw/pull/64120) — landed in the main branch on April 25, 2026, adding **preflight audio transcription for WhatsApp DM voice notes**.

## How It Works

The feature hooks into OpenClaw's WhatsApp auto-reply monitor at the message-processing stage. When an inbound DM contains audio, the system now:

1. **Transcribes the audio first** — before the message ever reaches your configured agent — using the speech-to-text provider wired into your OpenClaw installation.
2. **Replaces the audio body** with the resulting transcript, so the agent receives clean text as its input.
3. **Emits a `message:transcribed` hook** internally, allowing plugins and downstream pipelines to react to or log the transcription event.

The change is scoped to five files inside `extensions/whatsapp/src/auto-reply/monitor/`, keeping the blast radius small and platform-specific.

## Why This Matters

Voice notes are the default communication style in many WhatsApp-heavy regions and workflows. If your agent handles customer support, personal tasks, or family coordination over WhatsApp, a significant chunk of inbound messages were previously invisible to it. This PR closes that gap.

It also pairs with [PR #61008](https://github.com/openclaw/openclaw/pull/61008) — which landed Telegram voice-note transcription in DMs earlier this month — bringing OpenClaw's two most popular messaging channels to feature parity on audio handling.

## Security Considerations Worth Knowing

OpenClaw's automated Aisle security scanner flagged two medium-severity concerns before this PR merged. They don't block the feature, but they're worth understanding if you run a shared or production instance.

**Unbounded transcript length (CWE-400)**

The audio transcript is injected into the agent context without a size cap. An adversarially long audio clip or an unusually verbose STT provider could generate an oversized transcript, causing prompt-bloat, elevated token costs, or slow processing. The reviewer notes recommend enforcing `maxMediaTextChunkLimit` before injection — a fix likely to land in a follow-up PR.

**Transcript flows into session history by default (CWE-359)**

Voice transcripts now flow into `finalizeInboundContext` and persist in session history like any other message body. If your users send sensitive content — financial details, medical information — the transcript will appear in your agent's session log. The recommended mitigation is a config flag such as `messages.whatsapp.storeTranscripts` to make transcript persistence opt-in rather than on by default.

## What to Expect Next

This feature is queued for the upcoming release (currently staging as `2026.4.24 Unreleased` in the changelog). No configuration changes are required — once your OpenClaw installation updates, inbound WhatsApp voice notes in DMs will be transcribed automatically.

If you use OpenClaw for WhatsApp automation, this is the quality-of-life upgrade you have been waiting for. Send a voice note, get a real reply.

**Source:** [PR #64120 on GitHub](https://github.com/openclaw/openclaw/pull/64120)
