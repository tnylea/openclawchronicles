---
title: "OpenClaw TUI Fix Honors Agent Model Policies"
excerpt: "OpenClaw PR #117422 prevents the embedded TUI model picker from exposing unauthorized models under restrictive agent policies."
coverImage: '/assets/images/posts/openclaw-2026-8-24-tui-model-policy.png'
date: '2026-08-24T08:03:00.000Z'
dateFormatted: August 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-24-tui-model-policy.png'
---

OpenClaw merged [PR #117422, "fix(tui): honor restrictive agent model policies"](https://github.com/openclaw/openclaw/pull/117422), closing a fail-open behavior in the embedded terminal UI model picker.

The PR says the embedded TUI could advertise models prohibited by the selected agent's model policy. The failure happened when the canonical model-selection owner returned an empty allowed catalog, and the TUI replaced that with the full unrestricted provider catalog.

That is a small code path with a large policy implication. An empty allowed list can be intentional. Treating it as a discovery failure changes the meaning from "no authorized models are available" to "show everything the provider has."

## The Policy Boundary

OpenClaw agents can carry model policies that restrict which providers or model families they may use. Those policies matter for cost control, data routing, compliance, and safety.

The merged PR keeps the canonical model-selection owner authoritative. If the selected agent has a restrictive allowlist and the provider catalog does not contain any authorized match, the TUI now returns an empty model list instead of falling back to unauthorized choices.

The PR explicitly says unrestricted model selection and existing wildcard discovery remain unchanged. In other words, this is not a broad tightening of every model picker. It is a fix for one embedded TUI fallback that conflicted with the already-owned policy decision.

## User Impact

For users, the visible result is simple: the local model picker should no longer show Anthropic or other provider models when the selected agent's policy allows only another provider family, such as `openai/*`.

For operators, the more important result is consistency. A policy that denies every currently discovered model should look empty, not helpful. That empty state is information: it tells the operator to adjust the policy, configure the provider, or switch agents.

The PR notes that this fail-open behavior is present in the shipped `v2026.7.1-2` release, so users running that channel should pay attention when updating.

## Why It Matters

Model policies are only useful when every selection surface respects them. A web UI, CLI, TUI, or channel command that quietly reintroduces unauthorized choices weakens the whole contract.

This fix is focused, which is a good sign. The PR says the previous version mixed several policy and discovery concerns, while the merged rewrite keeps the independently proven repair and leaves separate provider discovery work for follow-up changes.

The production change is tiny: one added line and two removed lines. The regression tests are doing the real work here by pinning the intended behavior.

## Evidence

The PR describes a tests-first reproduction: an agent allowing only `openai/*` receives an Anthropic-only catalog. Before the fix, the picker returned an unauthorized Anthropic model. After the fix, it returns an empty model list.

Focused embedded TUI coverage passed for restrictive empty policy behavior, selected-agent propagation, and replacement-mode provider wildcard discovery. The existing canonical model-selection wildcard-policy regression also passed.

## Bottom Line

PR #117422 closes a policy bypass in OpenClaw's embedded TUI model picker.

It is not a flashy change, but it is exactly the kind of consistency fix agent operators need. If an agent policy says no discovered model is allowed, the interface should respect that answer.

