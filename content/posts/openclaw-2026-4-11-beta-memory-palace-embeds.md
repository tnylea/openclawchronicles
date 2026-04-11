---
title: "OpenClaw v2026.4.11-beta.1 Adds Memory Palace and Embeds"
excerpt: "OpenClaw v2026.4.11-beta.1 adds Memory Palace views for imported chats, structured web embeds, plugin setup descriptors, and key Codex OAuth fixes." 
coverImage: '/assets/images/posts/openclaw-2026-4-11-beta-memory-palace-embeds.png'
date: '2026-04-11T23:00:00.000Z'
dateFormatted: April 11th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-11-beta-memory-palace-embeds.png'
---

OpenClaw shipped **v2026.4.11-beta.1** on April 11, less than a day after the stable v2026.4.10 release. This beta looks like a classic fast-moving OpenClaw train: new Dreaming and Control UI surfaces, better plugin metadata, richer video generation plumbing, and a couple of fixes that matter immediately if you are testing the new Codex path.

The headline story is not a single giant feature. It is that several unfinished but important surfaces just got a lot more usable.

## Dreaming Gets a Real Memory Palace View

The most interesting addition in this beta is the Dreaming and memory-wiki work from [#64505](https://github.com/openclaw/openclaw/pull/64505).

OpenClaw now adds two new diary subtabs:

- **Imported Insights**, which clusters imported ChatGPT chats into synthesized topic views
- **Memory Palace**, which surfaces compiled wiki pages that actually contain claims, contradictions, questions, or synthesis worth inspecting

That matters because earlier import flows mostly exposed raw metadata and source titles. The new view makes Dreaming feel more like an observability tool for long-term memory, not just a log browser. You can inspect imported source chats, compiled wiki pages, and full source pages directly from the UI instead of bouncing through dead-end sidebar paths.

It is still an intermediate step. The PR explicitly notes that automatic promotion from imported chats into synthesis and concept pages is not implemented yet. But as a visibility upgrade, this is a strong move.

## The Control UI Finally Cleans Up Assistant Directives

Another practical win is [#64104](https://github.com/openclaw/openclaw/pull/64104), which teaches the web chat UI to render assistant media, reply, and voice directives as structured bubbles instead of leaking raw control text into the conversation.

The same change also standardizes the new **`[embed ...]`** tag for rich web output and puts external embed URLs behind config. In plain English, OpenClaw web sessions are getting closer to feeling like a real chat app instead of a debug console that occasionally shows its internals.

For anyone running OpenClaw through the browser dashboard, this is one of those polish features that tends to have outsized impact. Better rendering makes tool output, audio replies, and mixed media sessions easier to trust and easier to follow.

## Plugin Authors Get Better Setup Metadata

Plugin manifests can now declare **activation** and **setup** descriptors via [#64780](https://github.com/openclaw/openclaw/pull/64780).

This does not change runtime activation behavior yet, but it gives the control plane a cleaner way to inspect what a plugin needs for auth, pairing, and configuration. That is a small but important architectural change. OpenClaw keeps pushing more setup logic into declarative metadata, which usually means less hardcoded special-case glue later.

If ClawHub is meant to mature into a real skill and plugin ecosystem, this kind of descriptor work is foundational.

## Beta Fixes Worth Watching

A few fixes in this beta are more than cleanup:

- [#64713](https://github.com/openclaw/openclaw/pull/64713) stops OpenClaw from forcing unsupported Codex OAuth scopes, fixing `invalid_scope` failures for new sign-ins
- [#64766](https://github.com/openclaw/openclaw/pull/64766) restores audio transcription for OpenAI-compatible multipart requests while also tightening hostname validation in the no-pinned-DNS path
- [#64753](https://github.com/openclaw/openclaw/pull/64753) caches Ollama model metadata so repeated model-picker refreshes stop hammering `/api/show`
- [#64895](https://github.com/openclaw/openclaw/pull/64895) adds a proxy capture stack and QA Lab inspector, which looks useful for debugging transport-level behavior across providers and channels

The transcription fix stands out. Breaking audio transcription across OpenAI-compatible providers like OpenAI, Groq, and Mistral is the kind of bug users feel fast, especially now that voice and media flows are becoming central to OpenClaw's product story.

## What This Beta Signals

This is a strong beta if you care about three things: memory observability, better web UX, and control-plane maturity.

The stable v2026.4.10 release already pushed hard on Active Memory, Codex, and local MLX speech. This beta builds around that release by making those adjacent surfaces cleaner and more debuggable. That is usually a good sign. It suggests the maintainers are not just shipping features, they are closing the usability gaps around them.

If you are a cautious operator, wait for stable. If you actively test OpenClaw betas, this one looks worth a spin, especially if you are using Dreaming, Codex auth, or browser-heavy workflows.

Full release notes are on [GitHub](https://github.com/openclaw/openclaw/releases/tag/v2026.4.11-beta.1).
