---
title: "OpenClaw Fixes Realtime Voice Barge-In"
excerpt: "OpenClaw now has a provider-neutral voice interruption contract so callers can stop assistant audio cleanly during realtime calls."
coverImage: '/assets/images/posts/openclaw-2026-7-6-realtime-voice-barge-in.png'
date: '2026-07-06T23:07:00.000Z'
dateFormatted: July 6th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-6-realtime-voice-barge-in.png'
---

OpenClaw merged [PR #90749, "Fix realtime voice-call barge-in cancellation"](https://github.com/openclaw/openclaw/pull/90749), a P1 voice-call fix that makes assistant audio interruption behave consistently across realtime providers.

The problem was subtle but user-visible. During realtime voice calls, a caller could start speaking while assistant audio was still playing, yet the assistant's previous audio could continue. OpenClaw had local MuLaw interruption detection, provider-side speech detection, Twilio playback buffers, and Talk-turn cancellation all touching the same moment from different angles.

The fix gives those pieces one clearer contract.

## What Changed

Realtime providers can now report an accepted interruption through `onClearAudio("barge-in")`. The voice-call audio sink owns the transport response: clear the Twilio pacer and cancel the canonical Talk turn once.

OpenAI and Google map into that contract differently. OpenAI emits the signal after its configured speech-start policy accepts server VAD. Google emits it for `serverContent.interrupted`. Providers that do not advertise input-audio barge-in support keep the local MuLaw fallback path.

The important part is that OpenClaw no longer treats barge-in as an OpenAI-only websocket special case. It becomes a provider-neutral voice runtime behavior.

## Why It Matters

Barge-in is one of the details that decides whether voice feels natural or broken. If a human interrupts an assistant, the assistant needs to stop quickly and predictably. Continuing to play stale audio after the caller has started talking makes the call feel laggy, and it can cause the next turn to start from the wrong conversational state.

For OpenClaw, this matters beyond voice polish. Realtime voice calls sit at the edge of multiple systems: provider streaming, local audio detection, phone transport, and agent turn state. A clean interruption boundary reduces the chance that one layer clears audio while another layer keeps the old Talk turn alive.

## Validation

The PR labels this as a compatibility and message-delivery risk, and reports sufficient proof across OpenAI and Google realtime behavior. The implementation keeps the gateway protocol and model catalog surface unchanged.

That is a practical choice. Users should see cleaner interruption behavior without needing new configuration or a provider-specific setup change.

## Bottom Line

OpenClaw's realtime voice barge-in path now has a single provider-neutral contract. When a caller interrupts, the system can clear playback and cancel the active Talk turn in one place instead of relying on provider-specific audio events leaking through the transport layer.

