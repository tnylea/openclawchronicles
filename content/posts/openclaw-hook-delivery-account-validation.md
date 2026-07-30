---
title: "OpenClaw Hooks Now Reject Bad Delivery Accounts"
excerpt: "OpenClaw Gateway hooks now fail invalid delivery account selections before an agent run starts, preventing silent fallback delivery."
coverImage: '/assets/images/posts/openclaw-hook-delivery-account-validation.png'
date: '2026-07-30T08:03:00.000Z'
dateFormatted: July 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-hook-delivery-account-validation.png'
---

OpenClaw merged a Gateway delivery-safety fix just before the morning cutoff. [PR #116264](https://github.com/openclaw/openclaw/pull/116264), titled `fix: hooks reject invalid delivery accounts before agent runs`, changes how direct `/hooks/agent` requests validate explicit delivery account selections.

The issue was subtle but important. A hook request that selected an unknown, disabled, or malformed delivery account could be admitted instead of being rejected before the agent run began. In delivery systems, that creates a dangerous gray area: the request looks accepted, the agent may start work, but the destination is not the account the operator intended.

## What Changed

OpenClaw now resolves and validates complete direct-hook delivery accounts at admission time. The selected account is frozen onto the scheduled delivery, then revalidated against fresh configuration immediately before runner entry.

Invalid account selections return an immediate `400` response with the request `runId`. The agent run does not start, and OpenClaw does not fall back to a different account.

Omitted account IDs keep their existing behavior: they bind to the configured channel default. Mapped hooks also retain their deferred routing behavior. The compatibility decision in the PR is explicit that there is no fallback-account compatibility for invalid explicit selections on complete direct `/hooks/agent` delivery requests.

## Why It Matters

Hooks are often used where speed and automation meet external systems: support queues, chat bridges, CRM updates, incident workflows, and internal tooling. When a hook includes a delivery destination, account selection is part of the operator's intent.

Failing early is much safer than admitting work with a bad destination. It gives callers a clear error, preserves the `runId` for debugging, and avoids sending or attempting delivery through a surprising account.

The labels on the PR reflect the risk profile: `gateway`, `P2`, `merge-risk: compatibility`, and `merge-risk: message-delivery`.

## Documentation Update

The merge commit updates the hook documentation to include `400` in the response contract for direct and mapped agent actions. The Gateway configuration reference now states that pre-run failures can return `400` for invalid delivery coordinates or account selection, alongside `409`, `502`, and `503` for other admission outcomes.

That documentation change matters because operators and webhook callers can now build against a clearer contract: invalid delivery data is not a transient Gateway conflict; it is a caller-correctable request problem.

## Verification

The PR reports exact-HEAD live Feishu proof. Valid explicit-account and omitted-default deliveries completed exactly once. Nonexistent, disabled, and malformed account IDs returned `400` with a `runId` before provider I/O, with no fallback-account delivery.

It also reports 31 focused Gateway, requester-context, and real-Gateway QA tests, plus private QA, formatting, type checks, lint, boundary checks, runtime guards, CodeQL scope, changed tests, and real-behavior proof.

For operators, this is a clean reliability and safety win: explicit hook delivery accounts are now validated before OpenClaw starts the work.
