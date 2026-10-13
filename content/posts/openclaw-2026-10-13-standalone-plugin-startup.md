---
title: "OpenClaw Starts Standalone Plugins Correctly"
excerpt: "OpenClaw PR #171330 fixes enabled standalone plugin files so their Gateway hooks register at startup and enforce runtime policy as expected."
coverImage: '/assets/images/posts/openclaw-2026-10-13-standalone-plugin-startup.png'
date: '2026-10-13T23:10:00.000Z'
dateFormatted: October 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-13-standalone-plugin-startup.png'
---

OpenClaw merged [PR #171330](https://github.com/openclaw/openclaw/pull/171330), a P1 plugin fix for a confusing Gateway startup gap: an explicitly enabled standalone plugin file could appear loaded in CLI inspection while never registering its hooks with the running Gateway.

That is a nasty kind of failure. The operator sees a plugin as loaded, but the behavior the plugin is supposed to enforce never runs.

The fix makes standalone policy files behave like users would expect. If a file is enabled through `plugins.load.paths`, its hooks can register during Gateway startup. Disabled standalone files stay excluded, and packaged plugins keep their existing startup behavior.

## What Broke

The PR explains the root of the problem: a standalone file has no manifest where it can declare startup activation. OpenClaw already creates a synthetic manifest for that file, but the missing startup intent meant the Gateway did not activate the hooks even though inspection could show the plugin as loaded.

That split between "loaded" and "enforced" matters most for policy plugins. A maintenance-access policy, approval hook, or local guardrail is useful only if the Gateway actually invokes it at runtime.

PR #171330 updates the synthetic manifest path so enabled standalone files supply the startup metadata they need, while leaving enablement policy authoritative.

## User Impact

The user-facing result is direct: enabled standalone policy files now enforce their hooks in the running Gateway.

The PR's reproduction used an authenticated `POST /tools/invoke` request for `session_status`. On the baseline, a plugin configured to block that call was visible in inspection but the invocation still returned HTTP 200. On the candidate, the same enabled standalone file returned HTTP 403 with `tool_call_blocked`.

The important controls also held:

- A packaged plugin with `activation.onStartup: true` kept enforcing its hook.
- An explicitly disabled standalone file stayed disabled.
- Existing configuration, plugin files, state directories, databases, and user artifacts were preserved across an upgrade from `openclaw@2026.10.3` to the candidate build.

That last point is important because plugin-loading bugs often intersect with startup and migration paths. This fix does not introduce a new configuration format or ask users to reset plugin state.

## Why It Matters

Standalone plugin files are a power-user feature. They are useful for local policy, narrow integrations, development hooks, and quick operational guardrails that do not need a full packaged plugin.

But power-user features still need crisp semantics. If the CLI says a policy is loaded, operators reasonably expect the Gateway to honor it. A mismatch there can produce a false sense of protection, especially when the plugin is meant to block a tool call or enforce a local workflow boundary.

PR #171330 closes that gap by aligning runtime startup with inspection.

## Verification

The PR reports maintainer reproduction in a secretless Linux and Node 24 container, using built Gateway entrypoints and authenticated tool invocations. It also tested an existing-install upgrade from npm `openclaw@2026.10.3` using the same configuration and state.

Focused planner and manifest-registry suites passed with 69 tests. Candidate build, changed-file formatting, and oxlint also passed. The production change is small: the PR reports three production lines added and no production lines removed, with broader test coverage around the behavior.

## Bottom Line

PR #171330 is a small but high-leverage plugin reliability fix. OpenClaw now starts enabled standalone plugin files in a way that matches what inspection reports, so Gateway hooks are not merely visible; they are active.

For operators using standalone policy files, that turns a quiet footgun into a predictable startup contract.
