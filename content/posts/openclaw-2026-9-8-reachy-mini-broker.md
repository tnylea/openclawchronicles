---
title: "OpenClaw Tutorial Wires Reachy Mini Safely"
excerpt: "A new OpenClaw community tutorial shows how to connect a Reachy Mini robot through a scoped broker, keeping home data behind a safer local boundary layer."
coverImage: '/assets/images/posts/openclaw-2026-9-8-reachy-mini-broker.png'
date: '2026-09-08T23:02:00.000Z'
dateFormatted: September 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-8-reachy-mini-broker.png'
---

A new community tutorial on DEV shows a practical way to connect a Reachy Mini desktop robot to OpenClaw without treating the robot as a trusted machine.

Ben Greenberg's [September 8 tutorial](https://dev.to/bengreenberg/wiring-a-reachy-mini-into-openclaw-without-trusting-the-robot-3lgh), "Wiring a Reachy Mini into OpenClaw without trusting the robot," is a useful home-agent architecture write-up because it focuses less on the novelty of the robot and more on the boundary between a shared-room device and an agent with real personal access.

## The Trust Problem

The setup starts with a Reachy Mini in a living room and an existing OpenClaw home instance. The goal was a family voice touchpoint: local wake phrase, speech, motion, and OpenClaw-backed answers.

The tutorial says the obvious design was to run the agent behind the robot: capture audio on Reachy, send the transcript to the Gateway, and speak the answer. Greenberg got that working, then rejected it.

The reason was security. The article says the robot daemon exposes motors, audio, camera, and app controls over an HTTP API, and that fetching its OpenAPI document showed 100 endpoints with no security schemes. If the robot held an OpenClaw Gateway token, a compromised shared-room device could reach an agent with calendar, home automation, knowledge base, and shell-adjacent capabilities.

## Broker First, Agent Second

The design Greenberg landed on puts a broker between the robot and OpenClaw. The robot runs one app that handles wake-word matching, voice activity detection, motion, and expressions. It holds one scoped bearer token for the broker, not a Gateway token, model credential, or calendar credential.

The broker runs on a Mac mini and becomes the only path to OpenClaw. Audio goes up, policy and reply data come down, and redaction happens at the broker boundary before anything is spoken.

The network boundary is also explicit. The broker binds to the tailnet interface rather than the open LAN, and the robot talks over Tailscale. The tutorial frames remote access the same way: direct WireGuard rather than a vendor WebRTC path.

## Intent Allowlisting

The strongest part of the pattern is the closed intent set. The robot cannot submit arbitrary phrasing to privileged tools. It names an intent and passes typed arguments.

Free text goes only to a low-privilege `general.ask` intent with no house access, calendar access, or files. Routing from transcript to intent is rule-based rather than model-based, avoiding both latency and prompt-injection pressure on an LLM router.

The article also distinguishes reads from writes. Questions stay as reads. Imperatives can actuate only when they name a known intent and enough typed context, such as a room, is present. Ambiguous commands fall back to a safer path.

## Latency Lessons

The tutorial is also a performance story. Greenberg writes that the original full-agent path took about 15 seconds to answer a weather question, partly because the turn carried large workspace context, skills, tool profiles, and session history.

The final design uses a lean OpenClaw agent for general questions: no skills, minimal tools, no workspace context injection, no memory search, and reasoning turned off for ordinary living-room answers. The reported result is roughly 3 to 4 seconds end to end including speech synthesis, with about 5,000 prompt tokens instead of 30,000.

For builders connecting robots, intercoms, tablets, or smart-home devices to OpenClaw, the takeaway is bigger than Reachy Mini. Treat the room device as untrusted, give it a broker, force it through a narrow intent list, and keep the agent with personal data behind the boundary.
