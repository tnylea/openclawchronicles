---
title: "iClaw Brings OpenClaw-Inspired Agents to Apple Intelligence"
excerpt: "Developer Patrick Barrasso built iClaw, an on-device macOS agent using Apple Intelligence that explores whether OpenClaw concepts can work without the cloud."
coverImage: '/assets/images/posts/openclaw-2026-4-28-iclaw-apple-intelligence-agent.png'
date: '2026-04-28T23:10:00.000Z'
dateFormatted: April 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-28-iclaw-apple-intelligence-agent.png'
---

## The Setup Problem OpenClaw Hasn't Solved

OpenClaw is among the fastest-growing GitHub repositories in history, but it hasn't crossed the chasm into mainstream use. Patrick Barrasso, developer of the newly launched [iClaw](https://geticlaw.com), diagnoses the gap plainly: non-technical users lack the time, knowledge, and risk appetite to purchase dedicated hardware, configure providers, manage API keys, and grant an agent access to their personal accounts.

His answer is iClaw — an experimental on-device AI agent for macOS that uses Apple Intelligence as its inference backend, entirely offline, with no subscriptions or API credits required.

## What Makes iClaw Different

Where a typical OpenClaw setup talks to a cloud model over a configured gateway, iClaw runs Apple's 3B Foundation Model locally on your Mac. Everything stays on-device:

- **No API keys** — Apple Intelligence is pre-installed, no accounts needed
- **App Sandbox** — iClaw lives inside Apple's security sandbox and only accesses files, calendars, email, or contacts after explicit per-tool permission grants
- **Just-in-time permissions** — no blanket access policies; each tool invocation triggers a fresh permission check
- **Browser Bridge** — a web extension enables the agent to read and interact with Safari, Chrome, or Firefox
- **Dynamic Widgets** — a custom DSL renders results as purpose-built UI components rather than walls of text

Barrasso also trained a LoRA adapter on top of the base Apple model to improve instruction following and teach a domain-specific language for widget rendering.

## Honest About the Limits

Barrasso is refreshingly candid about where iClaw falls short today: "iClaw is basically a bad Siri." Small on-device models excel at single narrowly scoped tasks but struggle with multi-step reasoning and tool selection. Weather queries, calendar lookups, email search, and document translation work well. Complex multi-tool plans — the kind of agentic work OpenClaw handles with frontier cloud models — fall apart quickly.

The constraint is the model, not the architecture. A 3B parameter model running on-device hits a hard ceiling well below what GPT-4o or Claude Sonnet can do. The interesting bet iClaw makes is that this ceiling will rise significantly as Apple iterates, and the safety architecture and extensibility model need to be ready when it does.

## What It Points Toward

Apple may be building something in this space itself: leaks reference a project called "Campos," an AI-powered Siri with deep access to Photos, Mail, Messages, and more, expected in iOS 27 and macOS 27. If that ships, the design decisions being made today by projects like iClaw — how to handle permissions, how to surface tool use, how to contain blast radius — will matter retroactively.

Barrasso's [writeup](https://barrasso.me/posts/2026-04-27-iclaw-ai-agent-using-apple-intelligence/) covers the hackathon origins, the technical architecture, and a clear-eyed view of on-device AI's current tradeoffs. The project is live at [geticlaw.com](https://geticlaw.com) with source code on GitHub.
