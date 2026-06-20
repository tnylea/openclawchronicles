---
title: "OpenClaw Doctor Repairs Legacy Codex Routes"
excerpt: "OpenClaw's doctor command now repairs stale openai-codex routes into canonical OpenAI model config while preserving Codex runtime policy."
coverImage: '/assets/images/posts/openclaw-codex-route-doctor-fix.png'
date: '2026-06-20T08:10:00.000Z'
dateFormatted: June 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-codex-route-doctor-fix.png'
---

OpenClaw merged another P1 maintenance fix shortly after the nightly scan cutoff: [PR #94478, "fix(doctor): repair legacy Codex route persistence"](https://github.com/openclaw/openclaw/pull/94478). It closes issue #94184 and tightens how `openclaw doctor --fix` repairs older Codex model routing config.

The fix keeps `openai-codex/*` as a migration-only route. After repair, stale upgraded Codex model-map config is persisted under canonical `openai/*` model keys, while the repaired model remains pinned to Codex runtime policy.

That distinction matters for users who upgraded through older Codex routing conventions. The old route should not continue acting like a live provider or catalog path, but users also should not lose authored model parameters during repair.

## What Doctor Repairs Now

The PR says Doctor now proves several behaviors in the upgrade path:

- Stale `openai-codex/*` defaults are rewritten as canonical `openai/*`
- Authored model parameters are preserved
- The stale `openai-codex/*` model-map key is removed on write
- The repaired model is pinned to `agentRuntime.id = "codex"`

In the test proof, a temporary config started with `agents.defaults.model = "openai-codex/gpt-5.5"` and a model-map entry carrying `reasoning_effort = "high"`. After `pnpm openclaw doctor --fix --non-interactive --yes`, the persisted config used `openai/gpt-5.5`, preserved `reasoning_effort`, removed the stale model-map key, and kept Codex enabled.

## Why This Is User-Facing

Config migrations often look boring until they break someone who has been upgrading a real installation for months. OpenClaw's Codex integration has moved quickly, and stale provider-style route names can become confusing if they survive as writable configuration.

The important part of this fix is that it avoids two bad outcomes at once. It does not keep `openai-codex/*` alive as a normal model route, and it does not flatten the user's intended Codex model parameters during cleanup.

For operators, that means `doctor --fix` should be safer to run on older homes. It can normalize the route while preserving the settings that were actually meaningful.

## The Proof Path

The PR includes a concrete behavior proof from a local OpenClaw checkout on the branch, using OpenClaw 2026.6.8 on macOS arm64 with isolated temporary `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR`, and `OPENCLAW_CONFIG_PATH`.

The reported result includes:

- `doctorCompleted: true`
- A route repair message observed
- `defaultModel: "openai/gpt-5.5"`
- No stale model-map key
- Preserved `reasoning_effort: "high"`
- `agentRuntime.id: "codex"`

The PR explicitly notes that it does not test live Codex OAuth or app-server network inference. The proof is scoped to the doctor upgrade-persistence path, which is the right boundary for this change.

## Bottom Line

[PR #94478](https://github.com/openclaw/openclaw/pull/94478) is a good example of OpenClaw hardening the upgrade experience, not just the happy path for fresh installs. If your OpenClaw home has older Codex model config, this is the kind of doctor repair that should make future releases feel less surprising.
