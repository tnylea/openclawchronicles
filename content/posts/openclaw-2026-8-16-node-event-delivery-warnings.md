---
title: "OpenClaw Surfaces Failed Node Event Delivery"
excerpt: "OpenClaw Gateway now logs bounded warnings when node event delivery cannot be admitted, making silent terminal-state loss easier to diagnose."
coverImage: '/assets/images/posts/openclaw-2026-8-16-node-event-delivery-warnings.png'
date: '2026-08-16T23:01:00.000Z'
dateFormatted: August 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-16-node-event-delivery-warnings.png'
---

OpenClaw landed a Gateway observability fix in [PR #124798](https://github.com/openclaw/openclaw/pull/124798), closing a quiet failure mode where node event fanout could lose an event without leaving operators a usable diagnostic trail.

The bug sat at an awkward boundary. A registered node socket could be closing, slow, or reject a send. If the dropped event was a terminal chat update, the node could keep rendering a run as active even though the authoritative Gateway path had moved on.

## What Changed

The node registry now records failed synchronous send admission at the boundary that owns both ordinary and raw node event delivery. When OpenClaw cannot admit the event, it emits a bounded warning with:

- the affected node ID
- the event name
- lifecycle-scoped rate limiting
- suppression after the node is invalidated or unregistered

The warnings are limited to once per connected node session every 30 seconds. That keeps the signal useful during a real socket problem without turning a broken connection into a log flood.

## What Did Not Change

This is an observability repair, not a wire-protocol redesign. PR #124798 does not add per-node event sequencing or retry semantics.

The author calls out why: targeted node events would need to share a per-connection sequence allocator with general broadcasts to avoid collisions. TypeScript node hosts, Apple node sessions, Android node sessions, and watch HTTP transport clients would also need coordinated gap handling.

That follow-up is larger. This patch focuses on making the current failure visible.

## Why It Matters

OpenClaw's node model depends on distributed surfaces staying aligned with Gateway truth. A terminal event that disappears into a closing socket can be confusing because the source of truth and the visible node state diverge.

The new warning gives operators enough context to identify the affected node and event. That is especially useful for intermittent mobile, desktop, or paired-node issues where a user sees stale UI but the backend has no durable reason recorded.

## Extra Package-Boundary Fix

During exact-head CI, the branch also exposed a current-main Plugin SDK declaration regression. The packaged Codex harness had lost an intended optional operator-authored context cap. PR #124798 makes that field explicit in the facade so plugin package-boundary compilation matches the core contract.

The upstream Codex behavior remains bounded: the optional `model_context_window` override is accepted and clamped to the model maximum.

## Evidence From The PR

The PR reports a pre-fix regression where the node registry test failed with no warning records. The final focused proof ran `src/gateway/node-registry.test.ts` with 116 tests passing.

Additional validation included package-boundary compilation for all 123 plugins, targeted formatting checks, `git diff --check`, a final build-and-changed gate, and a clean autoreview.

For operators, the win is direct: if a live node cannot receive an event, OpenClaw now leaves a clear, bounded breadcrumb.
