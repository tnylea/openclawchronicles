---
title: "OpenClaw Adds Plugin-Owned Agent Executors"
excerpt: "OpenClaw merged a new Agents API executor contract so self-hosted sessions can run on operator-chosen plugin infrastructure safely."
coverImage: '/assets/images/posts/openclaw-2026-10-4-self-hosted-agent-executors.png'
date: '2026-10-04T23:05:00.000Z'
dateFormatted: October 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-4-self-hosted-agent-executors.png'
---

OpenClaw merged a substantial Agents API feature tonight: [PR #161609, "feat(agentsapi): select plugin-owned self-hosted executors"](https://github.com/openclaw/openclaw/pull/161609). The change introduces an opt-in controller contract that lets a plugin provide the workspace and executor lifecycle for self-hosted native sessions.

That matters for operators who want the Gateway to own the conversation while execution happens on infrastructure they choose: a persistent VM, remote host, container, workspace, or some other environment managed by a controller plugin.

## What Changed

The PR adds `api.registerAgentExecutorController({ workspaceDirectory, ensure, retire })`, then lets operators select the controller through `plugins.entries.agentsapi.config.executorController`. Each native session gets a persisted binding between the session, environment, and controller.

The key design point is continuity. The executor can stay attached across turns and interruptions, so a healthy turn does not need another connection check or remote setup round trip. If OpenClaw receives an `environment_connection` action while input is pending, it can process the action without replaying the user's original message.

The feature also preserves externally managed executors. OpenClaw is not trying to turn every deployment into the same SSH launcher. Instead, the selected plugin owns the details of how the workspace is created, connected, verified, and retired.

## Why It Matters

Self-hosted agent deployments often live in messy real infrastructure. Some teams want persistent workspaces for faster iteration. Others need stronger isolation per session. Some already have a scheduler, container pool, or remote build host they trust.

This contract gives those operators a supported way to integrate that environment without making Gateway session ownership vague. The PR says reset and deletion require confirmed native settlement before OpenClaw discards the executor binding. Failed status reads, cancellation, or authentication failures preserve ownership for retry.

That is the important safety detail. The system avoids losing track of who owns a live executor just because cleanup could not be acknowledged.

## Operator Notes

The public setup guide now covers:

- Controller-plugin registration
- Session ownership and recovery behavior
- Reset and deletion settlement
- Verification expectations
- Compatibility with externally managed executors

The PR carries a compatibility-risk label because experimental executor SDK users must match the new contract. For ordinary OpenClaw users, the value is simpler: self-hosted Agents API sessions now have a cleaner path to durable, plugin-owned execution infrastructure.

## Verification

The merged PR reports generated harnesses for five executor kinds, including static, dynamic, TypeScript, JavaScript, and foreign executor controllers. It also documents two manual demo passes using a shared `/tmp/openclaw-agentsapi-demo` workspace across worker subscriptions and repeated streaming runs.

For teams building serious self-hosted OpenClaw deployments, this is one of the more important infrastructure features in the October 4 nightly window.
