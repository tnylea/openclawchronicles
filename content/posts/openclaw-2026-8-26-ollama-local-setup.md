---
title: "OpenClaw Keeps Ollama Local Setup Truly Local"
excerpt: "OpenClaw's Ollama setup now keeps Local-only choices local and avoids selecting embedding models as chat defaults."
coverImage: '/assets/images/posts/openclaw-2026-8-26-ollama-local-setup.png'
date: '2026-08-26T23:03:00.000Z'
dateFormatted: August 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-26-ollama-local-setup.png'
---

OpenClaw merged an Ollama setup repair tonight that tightens an important expectation for local AI workflows: when an operator chooses Local only, setup should not drift toward cloud model defaults.

The change landed in [PR #130459](https://github.com/openclaw/openclaw/pull/130459), titled `fix(ollama): keep local setup local and skip embedding chat defaults`. The PR is a follow-up to earlier remote-discovery work in #130240 and focuses on model classification during setup, discovery, and fallback selection.

## What Was Going Wrong

The PR describes multiple related problems around Ollama inventory handling. A Local-only setup could still select a cloud model. A model identified through a `remote_model` alias could appear in local node-inference inventory. Embedding-only rows could also be treated too generously when remote inspection omitted capabilities.

That last detail has a visible consequence. An embedding model can be useful for retrieval and indexing, but it is not a chat model. If setup chooses one as the default chat model, the user gets a broken or misleading first-run experience.

The bug was not just a UI label problem. It involved where OpenClaw decides whether a model is remote, whether it is embedding-only, and whether it belongs in chat selection or fallback paths.

## The New Boundary

OpenClaw now keeps remote identity and embedding-only classification in the Ollama plugin’s metadata owner. Local node discovery, chat defaults, and Local-only setup share that classification instead of each stage making a looser decision.

Setup filters inventory before inspection limits, default selection, and config projection. Capability inference, catalog admission, setup selection, and failed-download fallback also share the embedding-only rule.

The intended result is plain: remote models stay out of Local-only setup, and embedding-only models stay out of chat defaults. The PR says truthful advertised metadata and existing unknown-capability chat fallback behavior are preserved, so the fix does not flatten legitimate model differences.

## Why It Matters

Ollama is one of OpenClaw’s most important local-model paths. It is the route many users choose when they want privacy, offline operation, predictable cost, or control over where inference happens. A Local-only option has to mean exactly that.

This repair also improves first-run quality. Choosing the wrong default model during setup can make OpenClaw look misconfigured even when the local runtime is healthy. Filtering embedding-only entries before selection should make guided setup less surprising and reduce follow-up troubleshooting.

The merged commit, [`c120d093`](https://github.com/openclaw/openclaw/commit/c120d093fc9f155988f8e7c4939c0ec7ca0a3a50), summarizes the change as sharing remote identity across discovery, node inference, and Local-only setup.

The PR reports 742 Ollama tests, isolated real-daemon before-and-after proof, and source-blind public CLI validation. That breadth matters because the behavior spans plugin metadata, model catalog admission, setup prompts, and runtime defaults.

For operators, the takeaway is that OpenClaw’s Ollama path now better matches the promise of local setup: local chat defaults should remain local, and embedding models should no longer quietly become the default conversation model.
