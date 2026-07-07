---
title: "OpenClaw Doctor Can Repair Denied Gateway Endpoints"
excerpt: "OpenClaw Policy doctor can now auto-disable denied Gateway HTTP endpoints while preserving nested URL-fetch options."
coverImage: '/assets/images/posts/openclaw-2026-7-7-policy-doctor-endpoint-repair.png'
date: '2026-07-07T23:30:00.000Z'
dateFormatted: July 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-7-policy-doctor-endpoint-repair.png'
---

OpenClaw merged [PR #99731, "policy: repair denied gateway http endpoints"](https://github.com/openclaw/openclaw/pull/99731), extending `doctor --fix` so Policy can automatically repair one class of Gateway HTTP endpoint findings.

The new repair is intentionally narrow: when Policy reports denied Gateway HTTP endpoints that are still enabled, `doctor --fix` can set the exact reported `enabled` paths to `false`.

## What Changed

The Policy doctor check `policy/gateway-http-endpoint-enabled` is now classified as an automatic narrowing repair. When workspace repairs are enabled, OpenClaw can disable the denied endpoint leaves named by the finding.

The PR's proof case uses two Gateway endpoints:

- `gateway.http.endpoints.chatCompletions.enabled`
- `gateway.http.endpoints.responses.enabled`

With both endpoints denied by policy, `doctor --fix` disables those two `enabled` values and validates that the findings are gone.

## What It Does Not Change

The repair does not rewrite the entire endpoint object. That matters because endpoint config can contain nested options such as URL-fetch settings.

In the PR proof, nested values like `images.allowUrl`, `files.allowUrl`, and `images.urlAllowlist` survive the repair. OpenClaw turns the endpoint off, but it does not discard the operator's detailed configuration.

The PR also keeps URL-fetch allowlist findings manual. This change only disables denied endpoints; it does not try to infer safe allowlists.

## Why It Matters

Gateway HTTP endpoints are powerful surfaces. If an operator's Policy configuration says an endpoint is denied, leaving that endpoint enabled is a security-boundary mismatch.

Before this change, Doctor could identify the problem but still require manual editing. That is fine for careful operators, but it creates extra toil and leaves room for partial or incorrect fixes.

This PR makes the safe repair path available directly through `doctor --fix`: disable the endpoint that Policy says should not be exposed, then validate that the finding cleared.

## Safety Shape

The repair is a narrowing action, not an expansion. It turns access off. It does not loosen allowlists, create new endpoints, or enable alternate behavior.

That makes it a good candidate for automatic workspace repair. The action aligns the OpenClaw config with the stricter Policy requirement and leaves more ambiguous policy work in the operator's hands.

## Validation

The PR reports a real proof against an isolated temp workspace using the actual Policy doctor registration plus `runDoctorHealthRepairs`. The proof ran one check, repaired two findings, validated one check, and ended with zero remaining endpoint findings.

Supporting validation included a focused Vitest shard with 2 files and 299 tests passing, `pnpm docs:map:check`, formatting checks for touched docs and policy files, and clean `git diff --check` output.

No live Gateway server, provider call, network URL-fetch, or LLM call was involved in the proof, which is appropriate for a config repair path.

## Bottom Line

OpenClaw Doctor can now close a concrete Policy gap for Gateway HTTP endpoints. When an endpoint is denied, `doctor --fix` can disable it precisely while keeping the rest of the endpoint configuration intact.
