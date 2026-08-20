---
title: "OpenClaw Stops Stale Tool Menus After Reconnects"
excerpt: "OpenClaw now prevents old capability responses from overwriting current tools and skills after session, model, or Gateway changes."
coverImage: '/assets/images/posts/openclaw-2026-8-20-control-ui-stale-tools.png'
date: '2026-08-20T23:04:00.000Z'
dateFormatted: August 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-20-control-ui-stale-tools.png'
---

OpenClaw's Control UI received an asynchronous state fix today in [PR #126826](https://github.com/openclaw/openclaw/pull/126826), closing a race where stale tool and skill responses could overwrite the current session's capabilities.

The bug showed up around exactly the moments when users most need the interface to be precise: changing agents, switching sessions, selecting models, updating connector configuration, or reconnecting a Gateway with the same browser client.

## The Failure Mode

The PR describes an older tools response overwriting current tools in the Agents page or chat composer. On reconnect, a browser client could also retain obsolete tools or skills, allow a retired request to overwrite a new connection, or leave a newer request's loading state stuck.

That kind of bug is subtle because nothing necessarily crashes. The UI simply becomes untrustworthy. A capability menu might reflect the previous agent, stale connector state, or a retired Gateway request rather than the live context the user is actually working in.

## The Ownership Fix

The shared effective-tools loader now binds every publication, error, and cleanup to its exact dispatch and captured Gateway client. Its reset path retires that owner, and the Agents page uses the same reset behavior when the Gateway connection changes.

The chat composer needed a separate claim because each request creates an ephemeral shared-loader state. Its tools and skills now track the logical connection epoch, preventing an A -> B -> A sequence or same-client reconnect from reviving retired requests or cached capabilities.

The intended user-facing behavior is straightforward:

- Agent capability menus match the current session, model, connector configuration, and Gateway.
- Chat composer tools and skills cannot be overwritten by obsolete responses.
- Retired failures cannot clear or poison newer loading states.
- Same-client reconnects behave like real connection changes where ownership matters.

## Why This Matters

OpenClaw leans heavily on dynamic capabilities. Tools, skills, connectors, sessions, and model choices are not decorative UI state; they define what an agent can actually do. If an older request can repaint those capabilities after a newer selection, users may make choices based on the wrong tool list.

The fix is especially relevant as Control UI grows into a multi-agent, multi-connector workspace. The more dynamic the environment becomes, the more important exact request ownership gets.

## Proof Included

The PR reports regression-first proof across stale visible-session success and error paths, same-key reset ownership, composer A -> B -> A publication and loading, reconnect tools and skills, plus a mounted Agents page using the actual GatewayPageController disconnect/reconnect behavior.

Final focused suites covered Agents, the shared loader, skills, composer, Gateway lifecycle, and provider siblings, with 138 tests passing. The PR also notes that browser proof was attempted, but the Chromium/Vite run hit an unrelated dependency-resolution issue before scenarios ran; the mounted Agents-page and public composer regressions were used as the concrete evidence instead.

For users, the takeaway is refreshingly practical: after changing context or recovering from a Gateway reconnect, OpenClaw's visible capabilities should describe the thing you are using now, not the thing a slower request remembered from a few seconds ago.
