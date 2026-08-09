---
title: "OpenClaw Makes Codex Automation Login Actionable"
excerpt: "OpenClaw automation failures from expired Codex OAuth sessions now include a portable login action for faster owner recovery."
coverImage: '/assets/images/posts/openclaw-2026-8-9-codex-automation-login.png'
date: '2026-08-09T23:02:00.000Z'
dateFormatted: August 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-9-codex-automation-login.png'
---

OpenClaw automations that fail because a Codex OAuth session expired now have a clearer recovery path. [PR #121067](https://github.com/openclaw/openclaw/pull/121067) adds a portable presentation action so failure delivery can show **Log in to Codex** instead of leaving the operator with an `auth_permanent` status and no next step.

This is one of those fixes that improves the product at the exact moment users are already annoyed. A scheduled job fails, the reason is permanent authentication, and the useful question is not just what happened. It is what the owner can safely do from the alert.

## From failure status to recovery action

The merged change preserves presentation actions in cron failure delivery. When the failure is a Codex OAuth problem, OpenClaw can attach a typed login action. On Telegram, that callback routes through the existing non-blocking `/login codex` command authorization before the generic direct-message callback gate.

The source proof confirms the intended behavior in a paired DM: clicking **Log in to Codex** returned a callback answer and produced a Codex device URL and code, with no model request occurring.

That distinction is important. The recovery button does not silently retry the failed automation, bypass owner checks, or start model work. It routes the owner into the login flow.

## Why automation UX needs this

Automations tend to run away from the operator's immediate attention. When they fail, the notification needs to compress diagnosis and next action into as little friction as possible.

Before this PR, an expired Codex OAuth session could be classified as permanent auth failure while still making the owner figure out the recovery command manually. After the change, OpenClaw carries the action with the failure delivery itself.

The implementation also keeps channel security in the loop:

- Cron failure delivery preserves portable actions.
- Codex OAuth failures add a login-specific action.
- Telegram owner-only paired DMs route the callback through command authorization.
- Rejected clicks keep the button available instead of consuming the recovery path.

## Evidence behind the merge

The PR includes focused Telegram callback and login tests, plugin SDK contract generation, exact-head CI, and a live Telegram burner-user proof under pairing policy. It also cites the upstream Codex device-code and failed-refresh behavior checked directly in Codex source.

For OpenClaw operators, the end result is simple: when a Codex-backed automation stops because authentication has expired, the alert can carry the recovery door with it. That should reduce dead nightly jobs, missed cron work, and the little support loop where the system knows the problem but does not yet help the owner fix it.
